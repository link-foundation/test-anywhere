import { test, describe, before, afterEach, after } from 'node:test';
import { setTimeout } from 'node:timers/promises';
describe('outer', () => {
  before(() => console.log('BEFORE'));
  afterEach(() => console.log('AFTER_EACH'));
  after(() => console.log('AFTER_ALL'));
  test('context', { timeout: 100 }, (t) =>
    console.log('CONTEXT', t.name, typeof t.signal?.addEventListener)
  );
  describe.skip('skipped suite', { skip: 'suite reason' }, () => {
    test('never', () => {
      throw new Error('SKIPPED BODY');
    });
  });
  test('skipped', { skip: 'test reason' }, () => {
    throw new Error('SKIPPED BODY');
  });
  test('todo', { todo: 'pending reason' });
  test('timeout', { timeout: 30 }, async (t) => {
    try {
      await setTimeout(150, null, { signal: t.signal });
    } finally {
      console.log('BODY_CLEANUP');
    }
  });
});
