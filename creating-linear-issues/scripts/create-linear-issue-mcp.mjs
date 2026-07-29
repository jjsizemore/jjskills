#!/usr/bin/env node
/**
 * Create Linear issue via authenticated Linear MCP (Grok OAuth store).
 * Uses ~/.grok/mcp_credentials.json token for https://mcp.linear.app/mcp
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[k] = v;
    } else args._.push(a);
  }
  return args;
}

function die(m, c = 1) {
  process.stderr.write(m + '\n');
  process.exit(c);
}

function loadToken() {
  const p = path.join(os.homedir(), '.grok', 'mcp_credentials.json');
  if (!fs.existsSync(p)) die('Missing ~/.grok/mcp_credentials.json — auth Linear MCP in Grok first (/mcps)');
  const cred = JSON.parse(fs.readFileSync(p, 'utf8'));
  const entry = cred['linear:https://mcp.linear.app/mcp'];
  const token = entry?.token_response?.access_token;
  if (!token) die('No Linear MCP access_token — re-auth via /mcps → linear');
  return token;
}

async function mcp(token, method, params, { notify = false } = {}) {
  const body = { jsonrpc: '2.0', method };
  if (!notify) body.id = randomUUID();
  if (params !== undefined) body.params = params;
  const res = await fetch('https://mcp.linear.app/mcp', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  });
  if (notify) return null;
  const raw = await res.text();
  const dataLines = raw
    .split('\n')
    .filter((l) => l.startsWith('data: '))
    .map((l) => l.slice(6));
  const payload = dataLines.length ? JSON.parse(dataLines.at(-1)) : JSON.parse(raw);
  if (payload.error) die(`MCP error: ${JSON.stringify(payload.error)}`);
  return payload;
}

function textContent(payload) {
  const content = payload?.result?.content || [];
  return content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.title) die('required: --title');
  if (!args.team) die('required: --team (e.g. SV or SyncVia)');
  let description = args.description || '';
  if (args['description-file']) description = fs.readFileSync(args['description-file'], 'utf8');
  if (!description.trim()) die('required: --description or --description-file');

  const token = loadToken();
  await mcp(token, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'create-linear-issue-mcp', version: '1.0' },
  });
  await mcp(token, 'notifications/initialized', undefined, { notify: true });

  const toolArgs = {
    title: args.title,
    team: args.team,
    description,
  };
  if (args.priority) toolArgs.priority = Number(args.priority);

  const res = await mcp(token, 'tools/call', { name: 'save_issue', arguments: toolArgs });
  const text = textContent(res);
  let issue;
  try {
    issue = JSON.parse(text);
  } catch {
    process.stdout.write(text + '\n');
    return;
  }
  process.stdout.write(JSON.stringify({ id: issue.id, url: issue.url, title: issue.title, gitBranchName: issue.gitBranchName }, null, 2) + '\n');
}

main().catch((e) => die(e.stack || String(e)));
