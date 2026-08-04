import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const planPath = path.join(root, '.agents/plans/portable-user-scope-p1-p2-skills-plan.md');
const progressPath = path.join(root, '.agents/plans/progress.md');
const pressurePath = path.join(root, 'references/portable-user-scope-p1-p2-pressure-scenarios.md');
const plan = fs.readFileSync(planPath, 'utf8');
const progress = fs.readFileSync(progressPath, 'utf8');
const pressure = fs.readFileSync(pressurePath, 'utf8');

const targets = {
  uat: {
    skill: 'adding-user-acceptance-tests/SKILL.md',
    metadata: 'adding-user-acceptance-tests/agents/openai.yaml',
    patterns: [
      /Activation Boundary/i,
      /boundary matrix/i,
      /failure/i,
      /recovery/i,
      /persist/i,
      /external provider/i,
      /mock/i,
    ],
  },
  context: {
    skill: 'using-headroom-context-efficiency/SKILL.md',
    metadata: 'using-headroom-context-efficiency/agents/openai.yaml',
    patterns: [
      /RTK/i,
      /compress/i,
      /retrieve/i,
      /stale/i,
      /subscription-first/i,
      /BYOK/i,
      /explicit consent/i,
    ],
  },
  ownership: {
    skill: 'ci-runner-ownership/SKILL.md',
    metadata: 'ci-runner-ownership/agents/openai.yaml',
    patterns: [/label/i, /host truth/i, /adapter/i, /approval/i, /workflow/i],
  },
  healing: {
    skill: 'healing-github-actions-runner-fleets/SKILL.md',
    metadata: 'healing-github-actions-runner-fleets/agents/openai.yaml',
    patterns: [/four-layer/i, /canary/i, /25.?50%/i, /quarantine/i, /rollback/i],
  },
};

const gateLine = [...progress.matchAll(
  /^P2_SHARED_FLEET_GATE=(PASS|NOT_APPLICABLE|BLOCKED)(?:\s+reason=[a-z0-9-]+)?$/gm,
)].at(-1)?.[0] ?? null;
const gate = gateLine?.match(/^P2_SHARED_FLEET_GATE=(PASS|NOT_APPLICABLE|BLOCKED)/)?.[1] ?? null;

function readIfPresent(relativePath) {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function addSkillProblems(problems, key) {
  const target = targets[key];
  const skill = readIfPresent(target.skill);
  const metadata = readIfPresent(target.metadata);
  if (skill === null) {
    problems.push(`MISSING_TARGET ${target.skill}`);
    return;
  }
  const skillName = target.skill.split('/')[0];
  if (!/^---\n[\s\S]*^name:\s*[a-z0-9-]+\s*$/m.test(skill)) {
    problems.push(`INVALID_FRONTMATTER ${target.skill}`);
  } else if (!new RegExp(`^name:\\s*${skillName}\\s*$`, 'm').test(skill)) {
    problems.push(`NAME_DIRECTORY_MISMATCH ${target.skill}`);
  }
  if (metadata === null) {
    problems.push(`MISSING_METADATA ${target.metadata}`);
  } else {
    for (const field of ['interface:', 'display_name:', 'short_description:', 'default_prompt:']) {
      if (!metadata.includes(field)) problems.push(`MISSING_METADATA_FIELD ${target.metadata} ${field}`);
    }
    if (!metadata.includes(`$${skillName}`)) problems.push(`MISSING_METADATA_TRIGGER ${target.metadata}`);
  }
  for (const pattern of target.patterns) {
    if (!pattern.test(skill)) problems.push(`MISSING_PORTABLE_ASSERTION ${target.skill} ${pattern}`);
  }
  if (/syncvia|ssh mini|\/Users\/|\/home\//i.test(skill)) {
    problems.push(`SYNCVIA_OR_MACHINE_LEAK ${target.skill}`);
  }
}

test('promotion pressure reference and plan boundaries are explicit', () => {
  for (const phrase of [
    'mocked renderer',
    'persisted record',
    'live provider',
    'Compression is used before discovery',
    'compressed result is stale',
    'provider key',
    'runner label',
    'wrong repository',
    'broad fleet rollout',
    'P2_SHARED_FLEET_GATE=PASS',
    'P2_SHARED_FLEET_GATE=NOT_APPLICABLE',
    'P2_SHARED_FLEET_GATE=BLOCKED',
  ]) {
    assert.match(pressure, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  for (const phrase of [
    'Portable versus adapter boundary',
    'P2 shared-fleet consumer gate',
    'Contract-test RED/GREEN protocol',
    'US-001',
    'US-006',
  ]) assert.match(plan, new RegExp(phrase, 'i'));
});

test('promoted targets satisfy portable boundaries or explicit P2 gate', () => {
  const problems = [];
  addSkillProblems(problems, 'uat');
  addSkillProblems(problems, 'context');

  const p2Present = ['ownership', 'healing'].some((key) => (
    fs.existsSync(path.join(root, targets[key].skill)) ||
    fs.existsSync(path.join(root, targets[key].metadata))
  ));
  if (gate === 'PASS') {
    addSkillProblems(problems, 'ownership');
    addSkillProblems(problems, 'healing');
  } else if (gate === 'NOT_APPLICABLE' || gate === 'BLOCKED') {
    if (p2Present) problems.push(`P2_TARGET_PRESENT_WITH_GATE_${gate}`);
  } else {
    problems.push('MISSING_P2_GATE_DECISION in .agents/plans/progress.md');
  }

  assert.deepEqual(problems, [], problems.join('\n'));
});
