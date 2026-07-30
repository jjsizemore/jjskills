#!/usr/bin/env node
/**
 * Create a Linear issue via GraphQL.
 *
 * Auth (first match wins):
 *   1. LINEAR_API_KEY env
 *   2. op item "Linear" field "kilo-code api key" (or LINEAR_OP_ITEM / LINEAR_OP_FIELD)
 *
 * Usage:
 *   node create-linear-issue.mjs --title "..." --team SV \
 *     --description-file body.md [--label bug] [--priority 2]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function parseArgs(argv) {
  const args = { _: [], labels: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--label') {
      args.labels.push(argv[++i]);
    } else if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[k] = v;
    } else args._.push(a);
  }
  return args;
}

function die(msg, code = 1) {
  process.stderr.write(`${msg}\n`);
  process.exit(code);
}

function resolveApiKey() {
  if (process.env.LINEAR_API_KEY && !process.env.LINEAR_API_KEY.startsWith('test_')) {
    return process.env.LINEAR_API_KEY.trim();
  }
  const item = process.env.LINEAR_OP_ITEM || 'Linear';
  const field = process.env.LINEAR_OP_FIELD || 'kilo-code api key';
  const r = spawnSync('op', ['item', 'get', item, '--fields', field, '--reveal'], {
    encoding: 'utf8',
  });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  return null;
}

async function gql(apiKey, query, variables) {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join('; ');
    throw new Error(`Linear GraphQL: ${msg}`);
  }
  return json.data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    process.stdout.write(`Usage: create-linear-issue.mjs --title T --team KEY|ID [--description D|--description-file F]\n`);
    process.exit(0);
  }
  if (!args.title) die('required: --title');
  if (!args.team) die('required: --team (team key e.g. SV or team UUID)');

  let description = args.description || '';
  if (args['description-file']) {
    description = fs.readFileSync(args['description-file'], 'utf8');
  }
  if (!description.trim()) die('required: --description or --description-file');

  const apiKey = resolveApiKey();
  if (!apiKey) {
    die(
      'No LINEAR_API_KEY. Set env or store a valid key in 1Password item "Linear".\n' +
        'Personal keys: https://linear.app/settings/account/security → API keys',
    );
  }

  const teamsData = await gql(
    apiKey,
    `query { teams { nodes { id key name } } }`,
  );
  const teams = teamsData.teams.nodes;
  let teamId = args.team;
  if (!teamId.includes('-')) {
    const t = teams.find((x) => x.key.toLowerCase() === String(args.team).toLowerCase());
    if (!t) die(`Team not found for key ${args.team}. Known: ${teams.map((t) => t.key).join(', ')}`);
    teamId = t.id;
  }

  const labelIds = [];
  if (args.labels.length) {
    const lab = await gql(
      apiKey,
      `query($teamId: String!) { team(id: $teamId) { labels { nodes { id name } } } }`,
      { teamId },
    );
    const nodes = lab.team?.labels?.nodes || [];
    for (const name of args.labels) {
      const hit = nodes.find((n) => n.name.toLowerCase() === name.toLowerCase());
      if (hit) labelIds.push(hit.id);
      else process.stderr.write(`warn: label not found: ${name}\n`);
    }
  }

  const input = {
    teamId,
    title: args.title,
    description,
  };
  if (labelIds.length) input.labelIds = labelIds;
  if (args.priority) input.priority = Number(args.priority);

  const created = await gql(
    apiKey,
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url title }
      }
    }`,
    { input },
  );

  if (!created.issueCreate?.success) die('issueCreate failed');
  process.stdout.write(JSON.stringify(created.issueCreate.issue, null, 2) + '\n');
}

main().catch((e) => die(e.message || String(e)));
