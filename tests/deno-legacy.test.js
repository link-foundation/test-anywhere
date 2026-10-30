import { test, assert } from '../src/index.js';
import { createLegacyDenoRunner, isLegacyDeno } from '../src/deno-legacy.js';

function fixture() {
  const entries = [];
  const runner = createLegacyDenoRunner({
    test: (entry) => entries.push(entry),
  });
  return { runner, entries };
}

test('legacy Deno detection preserves older releases', () => {
  for (const version of ['1.0.0', '1.46.3', '2.0.0', '2.8.9']) {
    assert.ok(isLegacyDeno(version));
  }
  for (const version of ['2.9.0', '2.10.1', '3.0.0']) {
    assert.ok(!isLegacyDeno(version));
  }
});

test('legacy Deno scopes hooks, ignored entries and cleanup after rejection', async () => {
  const { runner: r, entries } = fixture();
  const events = [];
  r.before(() => events.push('root before'));
  r.after(() => events.push('root after'));
  r.describe('outer', {}, () => {
    r.before(() => events.push('outer before'));
    r.beforeEach(() => events.push('setup'));
    r.afterEach(() => events.push('cleanup'));
    r.after(() => events.push('outer after'));
    r.test('pass', {}, () => events.push('body'));
    r.test('skip', { skip: true }, () => assert.ok(false, 'ignored body ran'));
    r.describe('inner', {}, () => {
      r.test('reject', {}, async () => {
        throw Error('expected rejection');
      });
    });
  });
  r.describe('sibling', {}, () => r.test('pass', {}, () => {}));
  r.describe('skipped suite', { skip: true }, () =>
    assert.ok(false, 'suite ran')
  );
  r.test('todo', { todo: true });
  const active = entries.filter((entry) => !entry.ignore);
  await active[0].fn();
  await assert.throwsAsync(active[1].fn);
  await active[2].fn();
  assert.deepEqual(events, [
    'root before',
    'outer before',
    'setup',
    'body',
    'cleanup',
    'setup',
    'cleanup',
    'outer after',
    'root after',
  ]);
  assert.equal(entries.filter((entry) => entry.ignore).length, 3);
  assert.equal(active[1].name, 'outer > inner > reject');
});

test('legacy Deno runs enclosing cleanup when setup and cleanup fail', async () => {
  const { runner: r, entries } = fixture();
  const events = [];
  r.afterEach(() => events.push('root cleanup'));
  r.after(() => events.push('root after'));
  r.describe('broken', {}, () => {
    r.before(() => {
      throw Error('setup failed');
    });
    r.afterEach(() => {
      throw Error('cleanup failed');
    });
    r.after(() => {
      throw Error('after failed');
    });
    r.test('body', {}, () => assert.ok(false, 'body ran'));
  });
  let failure;
  try {
    await entries[0].fn();
  } catch (error) {
    failure = error;
  }
  assert.ok(failure instanceof AggregateError);
  assert.equal(failure.errors.length, 3);
  assert.deepEqual(events, ['root cleanup', 'root after']);
});

test('legacy Deno keeps native focus and excludes filtered work from cleanup counts', async () => {
  const { runner: r, entries } = fixture();
  let cleanups = 0;
  r.after(() => cleanups++);
  r.test('unfocused', {}, () => assert.ok(false, 'unfocused body ran'));
  r.describe('focused', { only: true }, () => r.test('child', {}, () => {}));
  assert.equal(entries[1].only, true);
  await entries[1].fn();
  assert.equal(cleanups, 1);
});
