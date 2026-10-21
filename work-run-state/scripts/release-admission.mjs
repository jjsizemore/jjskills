import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const DEFAULT_MAX_SAFEGUARD_AGE_MS = 3600_000; // 1 hour

function gitRemote(cwd) {
  try {
    return execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function gitHead(cwd) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function normalizeRemote(raw) {
  let str = raw.trim().toLowerCase();
  str = str.replace(/\.git$/i, '');
  str = str.replace(/^(?:https?:\/\/|ssh:\/\/git@|git@)/i, '');
  str = str.replace(/:/g, '/');
  str = str.replace(/^\/+|\/+$/g, '');
  return str;
}

export function normalizeRepoIdentity(raw, cwd = process.cwd()) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('remote:')) {
    return `remote:${normalizeRemote(trimmed.slice(7))}`;
  }
  if (trimmed.startsWith('local:')) {
    const rawPath = trimmed.slice(6);
    try {
      const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(cwd, rawPath);
      return `local:${fs.realpathSync(resolved).toLowerCase()}`;
    } catch {
      const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(cwd, rawPath);
      return `local:${resolved.toLowerCase()}`;
    }
  }

  if (/^(?:https?:\/\/|ssh:\/\/|git@|[a-z0-9_.-]+\.[a-z]{2,}\/)/i.test(trimmed)) {
    return `remote:${normalizeRemote(trimmed)}`;
  }

  try {
    const resolved = path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed);
    return `local:${fs.realpathSync(resolved).toLowerCase()}`;
  } catch {
    const resolved = path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed);
    return `local:${resolved.toLowerCase()}`;
  }
}

export function resolveExpectedRepo(cwd) {
  const remote = gitRemote(cwd);
  if (remote) {
    return `remote:${normalizeRemote(remote)}`;
  }
  try {
    return `local:${fs.realpathSync(cwd).toLowerCase()}`;
  } catch {
    return `local:${path.resolve(cwd).toLowerCase()}`;
  }
}

/**
 * Validates release safeguard prerequisites for repository admission.
 * Table stakes before reducing release/human gates or executing changes justified by reversibility.
 * Requires actual controller-observed evidence bound to exact normalized remote or canonical local realpath,
 * SHA, surface, environment, and freshness window.
 * Each safeguard is modeled as an AND of all its required properties.
 */
export function evaluateReleaseAdmission({
  cwd = process.cwd(),
  evidence,
  evidencePath,
  endpoint,
  expectedEnvironment,
  expectedSurface,
  subjectHead,
  action,
  maxAgeMs = DEFAULT_MAX_SAFEGUARD_AGE_MS,
  now = Date.now(),
}) {
  let ev = evidence;
  if (!ev && evidencePath) {
    try {
      ev = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    } catch {
      return {
        admitted: false,
        status: 'denied',
        reason: `cannot read safeguards evidence: ${evidencePath}`,
        missing: ['safeguards evidence file unreadable or invalid JSON'],
      };
    }
  }

  if (!ev || typeof ev !== 'object') {
    return {
      admitted: false,
      status: 'denied',
      reason: 'release safeguards evidence is missing or not an object',
      missing: ['staging', 'detection', 'rollback'],
    };
  }

  const missing = [];
  const actualHead = subjectHead || gitHead(cwd);

  // 1. Exact normalized repository identity (remote host+namespace+repo or canonical local realpath)
  const rawDeclared = ev.repo || ev.repository;
  if (!rawDeclared || typeof rawDeclared !== 'string' || !rawDeclared.trim()) {
    missing.push('repo binding (missing)');
  } else {
    const declaredRepo = normalizeRepoIdentity(rawDeclared, cwd);
    const expectedRepo = resolveExpectedRepo(cwd);
    if (declaredRepo !== expectedRepo) {
      missing.push(`repo binding mismatch: declared '${declaredRepo}' does not match expected '${expectedRepo}'`);
    }
  }

  // 2. Change identity / subjectHead binding (must bind before any status evaluation)
  const declaredHead = ev.changeIdentity || ev.subjectHead || ev.sha;
  if (!declaredHead || typeof declaredHead !== 'string' || !declaredHead.trim()) {
    missing.push('changeIdentity / subjectHead binding (missing)');
  } else if (actualHead && declaredHead.trim() !== actualHead.trim()) {
    missing.push(`changeIdentity mismatch: declared ${declaredHead.trim()} does not match subject head ${actualHead.trim()}`);
  }
  if (ev.stale === true) {
    missing.push('changeIdentity is marked stale');
  }

  // 3. Environment matching
  let targetEnv = expectedEnvironment;
  if (!targetEnv && endpoint) {
    if (endpoint === 'staging') targetEnv = 'staging';
    if (endpoint === 'deploy') targetEnv = 'production';
  }
  if (targetEnv) {
    if (!ev.environment || typeof ev.environment !== 'string' || !ev.environment.trim()) {
      missing.push(`environment binding (missing; expected '${targetEnv}')`);
    } else if (ev.environment.trim().toLowerCase() !== targetEnv.trim().toLowerCase()) {
      missing.push(`environment mismatch: declared '${ev.environment}' does not match expected '${targetEnv}'`);
    }
  } else if (!ev.environment && endpoint && ['staging', 'deploy'].includes(endpoint)) {
    missing.push('environment binding');
  }

  // 4. Surface matching
  const surface = String(ev.surface || '').trim().toLowerCase();
  if (!surface) {
    missing.push('surface binding (missing)');
  } else if (expectedSurface && surface !== expectedSurface.trim().toLowerCase()) {
    missing.push(`surface mismatch: declared '${surface}' does not match expected '${expectedSurface}'`);
  }

  // 5. Freshness window and timestamp validation
  const timestampStr = ev.evaluatedAt || ev.observedAt || ev.timestamp;
  if (!timestampStr || typeof timestampStr !== 'string' || !timestampStr.trim()) {
    missing.push('freshness evidence (missing evaluatedAt / observedAt timestamp)');
  } else {
    const parsedTs = Date.parse(timestampStr);
    if (Number.isNaN(parsedTs)) {
      missing.push(`freshness evidence invalid timestamp: '${timestampStr}'`);
    } else {
      const age = now - parsedTs;
      if (age < -60_000) {
        missing.push(`freshness evidence has future timestamp: '${timestampStr}'`);
      } else if (age > maxAgeMs) {
        missing.push(`freshness evidence expired: age is ${Math.round(age / 1000)}s (max allowed ${Math.round(maxAgeMs / 1000)}s)`);
      }
    }
  }

  // If bindings failed, reject immediately regardless of claimed status
  if (missing.length > 0) {
    return {
      admitted: false,
      status: 'denied',
      reason: `release safeguards admission denied: ${missing.join('; ')}`,
      missing,
    };
  }

  // Scoped not_applicable handling — only valid after bindings pass
  if (ev.status === 'not_applicable') {
    const isReleaseEndpoint = ['staging', 'deploy'].includes(endpoint);
    const isReleaseEnv = ['staging', 'production', 'prod'].includes(String(ev.environment || '').toLowerCase());
    const isReleaseAction = ['release-deployment', 'release-closeout'].includes(action);
    if (isReleaseEndpoint || isReleaseEnv || isReleaseAction) {
      return {
        admitted: false,
        status: 'denied',
        reason: 'release safeguards admission denied: release endpoints and environments cannot claim not_applicable',
        missing: ['release safeguards (release targets cannot claim not_applicable)'],
      };
    }

    const reason = typeof ev.notApplicableReason === 'string' ? ev.notApplicableReason.trim() : '';
    if (!reason) {
      return {
        admitted: false,
        status: 'denied',
        reason: 'scoped not_applicable requires an explicit justification in notApplicableReason',
        missing: ['notApplicableReason justification'],
      };
    }
    const files = Array.isArray(ev.files) ? ev.files.map((f) => String(f).toLowerCase()) : [];
    const isHighImpact =
      /authority|guidance|installer|install|auto-update|migration|workflow|\.github\/workflows|ci/i.test(surface) ||
      files.some((f) => /authority|guidance|installer|install|auto-update|migration|workflow|\.github\/workflows|ci/i.test(f));

    if (isHighImpact && /markdown|doc|docs|script|extension|text|txt/i.test(reason)) {
      return {
        admitted: false,
        status: 'denied',
        reason: 'high-impact surfaces (installers, authority guidance, auto-update, migrations, CI) cannot bypass release safeguards via file-extension justification',
        missing: ['release safeguards (high-impact surface cannot claim not_applicable)'],
      };
    }

    return {
      admitted: true,
      status: 'not_applicable',
      reason,
      missing: [],
    };
  }

  // 6. Staging: AND of validated, isolatedFromProduction, bounded blastRadius, concrete observation, and promotion criteria
  if (!ev.staging || typeof ev.staging !== 'object') {
    missing.push('staging evidence (missing)');
  } else {
    if (ev.staging.validated !== true) {
      missing.push('staging validation not verified');
    }
    if (ev.staging.isolatedFromProduction !== true) {
      missing.push('staging not isolated from production');
    }
    if (ev.staging.generic200Only === true || ev.staging.flagOnly === true || ev.staging.emptyRunbook === true) {
      missing.push('staging evidence cannot be mere flags, empty runbooks, or generic 200 health');
    }
    const blast = typeof ev.staging.blastRadius === 'string' ? ev.staging.blastRadius.trim() : '';
    if (!blast || /unbounded|production|100%/i.test(blast)) {
      missing.push('staging lacks bounded blast radius');
    }
    const hasConcreteObservation =
      (typeof ev.staging.probeUrl === 'string' && ev.staging.probeUrl.trim().length > 0) ||
      (typeof ev.staging.testRunId === 'string' && ev.staging.testRunId.trim().length > 0) ||
      (typeof ev.staging.observationCommand === 'string' && ev.staging.observationCommand.trim().length > 0);
    if (!hasConcreteObservation) {
      missing.push('staging lacks concrete observation proof (probeUrl, testRunId, or observationCommand)');
    }
    const promotion = typeof ev.staging.promotionCriteria === 'string' ? ev.staging.promotionCriteria.trim() : '';
    if (!promotion) {
      missing.push('staging lacks explicit promotion criteria');
    }
  }

  // 7. Regression Detection: AND of owner, actionable signal, explicit trigger/threshold, and deployed identity binding
  if (!ev.detection || typeof ev.detection !== 'object') {
    missing.push('regression detection evidence (missing)');
  } else {
    if (!ev.detection.owner || typeof ev.detection.owner !== 'string' || !ev.detection.owner.trim()) {
      missing.push('regression detection owner');
    }
    if (!ev.detection.signal || typeof ev.detection.signal !== 'string' || !ev.detection.signal.trim()) {
      missing.push('regression detection actionable signal');
    }
    const hasTriggerOrThreshold =
      (typeof ev.detection.trigger === 'string' && ev.detection.trigger.trim().length > 0) ||
      (typeof ev.detection.threshold === 'string' && ev.detection.threshold.trim().length > 0);
    if (!hasTriggerOrThreshold) {
      missing.push('regression detection trigger/threshold');
    }
    if (ev.detection.deployedIdentityBound !== true) {
      missing.push('regression detection deployed identity binding');
    }
  }

  // 8. Rollback: AND of exercised, immutable target (no 'latest' / 'revert'), explicit measured recovery time, and schema compatibility
  if (!ev.rollback || typeof ev.rollback !== 'object') {
    missing.push('fast rollback evidence (missing)');
  } else {
    if (ev.rollback.exercised !== true) {
      missing.push('rollback mechanism not exercised');
    }
    const target = typeof ev.rollback.immutableTarget === 'string' ? ev.rollback.immutableTarget.trim() : '';
    if (!target || /^(git revert|revert|latest|current|head|main|master)$/i.test(target)) {
      missing.push('rollback immutable target (must be immutable artifact/config, not bare git revert, latest, or branch head)');
    }
    const recTime =
      (typeof ev.rollback.recoveryTime === 'string' ? ev.rollback.recoveryTime.trim() : '') ||
      (typeof ev.rollback.recoveryTarget === 'string' ? ev.rollback.recoveryTarget.trim() : '');
    const hasMeasuredTime = /\d+\s*(s|m|sec|min|seconds|minutes|ms)/i.test(recTime);
    if (!hasMeasuredTime) {
      missing.push('rollback lacks explicit measured recovery time (e.g. 120s or 5m)');
    }
    if (ev.rollback.schemaCompatible !== true || ev.rollback.incompatible === true) {
      missing.push('rollback state/schema compatibility not verified or incompatible');
    }
  }

  if (missing.length > 0) {
    return {
      admitted: false,
      status: 'denied',
      reason: `release safeguards admission denied: ${missing.join('; ')}`,
      missing,
    };
  }

  return {
    admitted: true,
    status: 'admitted',
    reason: 'release safeguards admitted: bounded staging with promotion criteria, actionable detection, and exercised compatible fast rollback verified',
    missing: [],
  };
}
