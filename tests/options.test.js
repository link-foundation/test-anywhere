import {
  test,
  it,
  describe,
  beforeEach,
  afterEach,
  afterAll,
  assert,
  getRuntime,
} from '../src/index.js';
import { isLegacyDeno } from '../src/deno-legacy.js';

const legacyDeno = getRuntime() === 'deno' && isLegacyDeno(Deno.version.deno);
const deadline = legacyDeno ? {} : { timeout: 1000 };

describe('validated test options', () => {
  let calls = 0;
  let setups = 0;
  let cleanups = 0;
  beforeEach(() => setups++);
  afterEach(() => cleanups++);

  test('two argument control', () => calls++);
  test('options callback executes', deadline, () => calls++);
  it('it options callback executes', deadline, async () => {
    await Promise.resolve();
    calls++;
  });
  describe('nested', () => {
    it('nested options callback executes', {}, () => calls++);
  });
  it.skip('skip with reason', { skip: 'fixture unavailable' }, () => {
    throw new Error('skipped body executed');
  });
  test.todo('pending with options', { todo: 'future feature' });

  afterAll(() => {
    assert.equal(calls, 4, 'all supplied runnable bodies must execute once');
    // Node executes a TODO's implicit no-op body and lifecycle hooks.
    const expectedHooks = getRuntime() === 'node' ? 5 : 4;
    assert.equal(setups, expectedHooks, 'native setup count');
    assert.equal(cleanups, expectedHooks, 'native cleanup count');
  });
});

test('invalid registrations throw before reaching the native runner', () => {
  const invalid = [
    () => test('missing body'),
    () => it('missing body', {}),
    () => test('null options', null, () => {}),
    () => test('array options', [], () => {}),
    () => test('callback type', {}, 'body'),
    () =>
      test(
        'extra argument',
        () => {},
        () => {}
      ),
    () => test(42, () => {}),
    () => test('unknown option', { timeuot: 100 }, () => {}),
    () => test('negative timeout', { timeout: -1 }, () => {}),
    () => test('infinite timeout', { timeout: Infinity }, () => {}),
    () => test('string timeout', { timeout: '100' }, () => {}),
    () => test('invalid skip', { skip: 1 }, () => {}),
    () => test('invalid todo', { todo: {} }, () => {}),
    () => test('invalid signal', { signal: {} }, () => {}),
    () => test('invalid only', { only: 'yes' }, () => {}),
    () => test('NaN timeout', { timeout: NaN }, () => {}),
    () => test('overflow timeout', { timeout: 2147483648 }, () => {}),
    () => test('nonplain options', new Date(), () => {}),
    () => test('undefined options', undefined, () => {}),
    () => test.todo('invalid todo body', {}, 7),
    () => test.only('missing only body', {}),
    () => test.skip('invalid skip body', {}, 7),
    () => describe('missing suite body'),
    () => describe.skip('invalid suite options', { reason: 7 }, () => {}),
  ];
  for (const register of invalid) {
    assert.throws(register);
  }
  if (getRuntime() === 'bun' || legacyDeno) {
    assert.throws(() =>
      test(
        'unsupported signal',
        { signal: globalThis.AbortSignal.abort() },
        () => {}
      )
    );
    assert.throws(() => test('unsupported context', (context) => context));
  }
  if (legacyDeno) {
    assert.throws(() =>
      test('unsupported deadline', { timeout: 50 }, () => {})
    );
    assert.throws(() => describe('unsupported async suite', async () => {}));
  }
});

describe.skip('suite skip reason', { skip: 'offline' }, () => {
  it('never executes', () => {
    throw new Error('skipped suite body executed');
  });
});

describe.skip('empty skipped suite', () => {});

let scopedHooks = 0;
describe('suite hook scope', () => {
  beforeEach(() => scopedHooks++);
  it('runs local hook', {}, () => assert.equal(scopedHooks, 1));
});
describe('sibling suite hook scope', () => {
  it('does not inherit sibling hooks', {}, () => assert.equal(scopedHooks, 1));
});
