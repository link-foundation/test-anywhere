import { test, it, describe, assert } from '../src/index.js';

describe('portable test options', () => {
  test('async body with a deadline', { timeout: 1000 }, async () => {
    const result = await Promise.resolve(42);
    assert.equal(result, 42);
  });

  it.skip('optional integration', { skip: 'service is offline' }, () => {
    throw new Error('A skipped test body must never run');
  });
});

describe.skip(
  'unavailable platform',
  { skip: 'requires optional hardware' },
  () => {
    it('uses the hardware', () => {});
  }
);
