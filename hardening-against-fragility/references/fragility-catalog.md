# Fragility Pattern Catalog

Full reference for each fragility class: detection signals, diagnosis steps, fix patterns, and prevention.

---

## Race Conditions

**What it is:** Two or more concurrent operations observe or mutate shared state without adequate synchronization, producing results that depend on execution order.

**Detection signals:**
- Passes locally, fails under load or in CI parallel runs
- `jest.fakeTimers` or `--maxConcurrency=1` makes failures disappear
- Different outcomes each run with identical inputs
- Log lines arrive out of expected order

**Diagnosis:** Add explicit logging before and after every `await` inside the suspected critical section. Identify which operation reads stale state.

**Fix patterns:**
```typescript
// FRAGILE — non-atomic check-then-act
if (!(await cache.has(key))) {
  await cache.set(key, await computeExpensive(key));
}

// DURABLE — atomic get-or-set
const value = await cache.getOrSet(key, () => computeExpensive(key));

// FRAGILE — unsynchronized counter
let count = 0;
await Promise.all(items.map(async item => { count++; await process(item); }));

// DURABLE — collect results, count after
const results = await Promise.all(items.map(item => process(item)));
const count = results.length;
```

**Prevention:**
- Prefer immutable data; localize all mutations.
- Use DB transactions for DB-level atomicity; use a mutex for in-process critical sections.
- Avoid async side effects inside `Promise.all` fan-out without explicit ordering guarantees.

---

## Timing Dependencies

**What it is:** Code or tests that use wall-clock delays as synchronization, or that assert intermediate rather than final state.

**Detection signals:**
- `await sleep(N)` or `waitForTimeout(N)` in tests
- Failures correlate with slow CI runners
- Test passes on a fast developer machine, fails on resource-constrained runner
- Timeout-based assertions (`expect.eventually` with short timeout)

**Diagnosis:** Log timestamps at every state transition. Compare expected duration vs. actual on a slow runner.

**Fix patterns:**
```typescript
// FRAGILE — arbitrary sleep as synchronization
await new Promise(r => setTimeout(r, 1000));
expect(result).toBe('ready');

// DURABLE — event-driven or polling assertion
await waitFor(() => expect(result).toBe('ready'), { timeout: 10_000 });

// FRAGILE — clock-dependent logic
const isExpired = Date.now() > token.expiresAt;

// DURABLE — injected clock
interface Clock { now(): number; }
const isExpired = (clock: Clock) => clock.now() > token.expiresAt;
// Test: pass a FakeClock that you control
```

**Prevention:**
- Zero `setTimeout` calls used as synchronization in tests; lint rule enforced.
- All code with `Date.now()` / `new Date()` takes a `Clock` dependency.
- Design async APIs to signal completion via resolved promises or events, never by timing.

---

## Shared Test State

**What it is:** Test A leaves mutations that affect Test B's outcome. The failure is ordering-dependent, not reproducible in isolation.

**Detection signals:**
- `--sequence.shuffle.tests` changes which tests fail
- Test passes when run alone (`pnpm vitest run --testNamePattern "MyTest"`) but fails in the full suite
- `beforeAll` data modified by a test without restoration

**Diagnosis:** Run the failing test immediately after each other test in the suite until you find the contaminator. Bisect the ordering.

**Fix patterns:**
```typescript
// FRAGILE — shared DB rows persist between tests
beforeAll(async () => db.insert(seedData));
afterAll(async () => db.delete(seedData));

// DURABLE — transaction rollback per test
let tx: Transaction;
beforeEach(async () => { tx = await db.beginTransaction(); });
afterEach(async () => tx.rollback());

// FRAGILE — module-level mutable singleton
let activeUser: User | null = null;

// DURABLE — pass state explicitly or scope to test
const createContext = () => ({ activeUser: null as User | null });
```

**Prevention:**
- Zero module-level mutable state in test files; ESLint rule for `let` at module scope in `*.test.ts`.
- All DB interactions in integration tests use transaction rollback.
- All in-memory caches, event emitters, or singletons reset in `beforeEach`.

---

## Environmental Dependencies

**What it is:** Behavior differs based on filesystem case sensitivity, locale, timezone, OS syscall differences, or missing environment variables.

**Detection signals:**
- CI (Linux) fails; local macOS passes — often case-sensitivity
- Tests that involve dates fail depending on the runner's timezone
- Missing env var causes a hard crash instead of a clear error
- Path separator bugs (`/` vs `\` on Windows)

**Diagnosis:** Reproduce in a Linux Docker container matching CI. Log all env vars at test startup.

**Fix patterns:**
```typescript
// FRAGILE — timezone-sensitive parsing
const expiry = new Date('2024-12-31');  // midnight in local timezone

// DURABLE — explicit UTC
const expiry = new Date('2024-12-31T00:00:00Z');

// FRAGILE — hardcoded path separator
const filePath = baseDir + '/' + filename;

// DURABLE — platform-aware join
const filePath = path.join(baseDir, filename);
```

**CI fix:**
```yaml
env:
  TZ: UTC  # Pin timezone in all test jobs
```

**Prevention:**
- Run CI in a container that mirrors production OS.
- Validate all required env vars at application startup with explicit error messages.
- `TZ=UTC` in all test scripts; no implicit timezone conversions in logic.

---

## Non-Deterministic Ordering

**What it is:** Results depend on iteration order of objects, sets, or unordered DB queries. Order is not guaranteed, so each run may differ.

**Detection signals:**
- Array comparison assertions fail intermittently
- DB result assertions without `ORDER BY` fail inconsistently
- Different test outcomes after a DB vacuum or index rebuild

**Diagnosis:** Log the actual values in both passing and failing runs. Identify which container is unordered.

**Fix patterns:**
```typescript
// FRAGILE — unordered comparison
expect(results).toEqual(['alice', 'bob', 'carol']);

// DURABLE — normalize order before comparing
expect(results.slice().sort()).toEqual(['alice', 'bob', 'carol'].sort());
// or use set equality for unordered collections:
expect(new Set(results)).toEqual(new Set(['alice', 'bob', 'carol']));

// FRAGILE — DB query without ORDER BY
const users = await db.select().from(usersTable);

// DURABLE — explicit ordering
const users = await db.select().from(usersTable).orderBy(asc(usersTable.createdAt));
```

**Prevention:**
- Linter rule: flag `toEqual` on arrays returned by DB queries or `Object.values()`.
- Code review: every DB query that feeds a test assertion must have `ORDER BY`.
- Prefer sorted data structures (`SortedSet`, sorted array) when order is semantically meaningful.

---

## Uncleaned Async Side Effects

**What it is:** Timers, intervals, open connections, or event listeners outlive the test, causing interference with subsequent tests or hang-on-exit warnings.

**Detection signals:**
- `open handles detected after all tests ran` (Vitest / Jest)
- Test suite hangs after all tests pass
- Memory usage grows monotonically across test runs
- `MaxListenersExceededWarning`

**Diagnosis:** Use `--detectOpenHandles` (Jest) or `--reporter=verbose` to identify the hanging resource. Add `console.log` before and after every connection open/close.

**Fix patterns:**
```typescript
// FRAGILE — timer not cleaned up
it('polls correctly', () => {
  setInterval(() => poll(), 100);
});

// DURABLE — use fake timers or explicit cleanup
it('polls correctly', () => {
  vi.useFakeTimers();
  const id = setInterval(() => poll(), 100);
  afterEach(() => { clearInterval(id); vi.useRealTimers(); });
});

// FRAGILE — server not closed
const server = app.listen(0);
// (no cleanup)

// DURABLE — close in afterAll
let server: Server;
beforeAll(() => { server = app.listen(0); });
afterAll(() => new Promise(r => server.close(r)));
```

**Prevention:**
- Every `beforeAll` that opens a resource has a corresponding `afterAll` that closes it.
- Use `vi.useFakeTimers()` / `vi.useRealTimers()` as a pair; enforce in ESLint.
- Maintain a resource registry in global test setup; assert it's empty in global teardown.

---

## Flaky Assertions

**What it is:** Assertions that target intermediate state, include dynamic values (UUIDs, timestamps), or use overly-precise numeric comparisons.

**Detection signals:**
- Snapshot mismatches containing auto-generated IDs or timestamps
- `toBeCloseTo` failures on fast/slow machines
- `getByText('Loading...')` that sometimes already shows the loaded state
- Animation/transition state assertions

**Diagnosis:** Log the actual value in failing runs. Determine if the assertion targets a stable or transitional state.

**Fix patterns:**
```typescript
// FRAGILE — asserts intermediate loading state
render(<UserProfile userId="123" />);
expect(screen.getByText('Loading...')).toBeInTheDocument();

// DURABLE — await final state
render(<UserProfile userId="123" />);
await waitFor(() =>
  expect(screen.getByText('Alice')).toBeInTheDocument()
);

// FRAGILE — snapshot includes dynamic values
expect(result).toMatchSnapshot();
// snapshot: { id: "abc-123", createdAt: "2024-01-01T00:00:00Z" }

// DURABLE — mask dynamic fields
expect(result).toMatchObject({
  id: expect.any(String),
  name: 'Alice',
  createdAt: expect.any(Date),
});
```

**Prevention:**
- Never snapshot objects with auto-generated IDs or timestamps unless masked.
- Use `findBy*` queries (which await) over `getBy*` for anything that loads asynchronously.
- Prefer `toMatchObject` with `expect.any()` matchers over full snapshot for objects with dynamic fields.

---

## Unstable External Dependencies

**What it is:** Integration tests call live third-party APIs or services that are unreliable, rate-limited, or slow, causing non-reproducible failures.

**Detection signals:**
- Failures correlate with third-party status page incidents
- Errors contain HTTP `429`, `502`, `503`, or `ECONNRESET`
- Test passes on retry without any code change
- Test duration varies wildly

**Diagnosis:** Enable request logging. Identify which external endpoint is involved and its failure pattern.

**Fix patterns:**
```typescript
// FRAGILE — live API in test
const result = await stripeClient.charges.create({ amount: 100, currency: 'usd' });

// DURABLE — mock at transport boundary (MSW example)
server.use(
  http.post('https://api.stripe.com/v1/charges', () =>
    HttpResponse.json({ id: 'ch_test', status: 'succeeded' })
  )
);
const result = await stripeClient.charges.create({ amount: 100, currency: 'usd' });
expect(result.status).toBe('succeeded');
```

**Production code retry pattern:**
```typescript
async function callWithRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 500 }: RetryOptions = {}
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts || !isTransient(err)) throw err;
      await sleep(baseDelayMs * 2 ** (attempt - 1) + jitter());
    }
  }
  throw new Error('unreachable');
}
```

**Prevention:**
- All external HTTP calls in tests intercepted at transport level (MSW, nock, WireMock).
- Production external calls always have: explicit timeout, bounded retry with backoff + jitter, circuit breaker.
- Document each external dependency's SLA; build your timeout budget around it (your timeout < their P99 × 2).

---

## Port / Resource Conflicts

**What it is:** Multiple tests or CI shards attempt to bind to the same port, use the same temp file name, or share a singleton global, causing `EADDRINUSE` or data corruption.

**Detection signals:**
- `EADDRINUSE` in CI but not locally
- Passes with `--maxConcurrency=1`, fails with higher concurrency
- Different shard failures on different runs with identical test code

**Diagnosis:** Add logging for every port bind and resource open. Check if the failing shard overlaps with another.

**Fix patterns:**
```typescript
// FRAGILE — hardcoded port
const server = app.listen(3000);

// DURABLE — OS-assigned port
const server = app.listen(0);
const { port } = server.address() as AddressInfo;

// FRAGILE — fixed temp file name
const tmpFile = '/tmp/test-output.json';

// DURABLE — unique temp file per test
const tmpFile = path.join(os.tmpdir(), `test-${crypto.randomUUID()}.json`);
```

**Prevention:**
- Lint rule: no hardcoded port numbers in test files.
- CI: set `--maxConcurrency` to match available CPU cores; isolate shards by DB namespace.
- All test-created files placed under a per-test-run temp directory, cleaned up in `afterAll`.
