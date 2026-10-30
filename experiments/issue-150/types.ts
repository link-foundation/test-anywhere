// @deno-types="../../src/index.d.ts"
import api, {
  test,
  it,
  describe,
  setDefaultTimeout,
  type TestContext,
  type TestOptions,
} from '../../src/index.js';

const options: TestOptions = { timeout: 100, skip: false };
test('control', () => {});
it('options', options, async () => {});
test('context', {}, async (context: TestContext) => {
  await context.test('child', () => {});
  context.signal.throwIfAborted();
  // @ts-expect-error Native context.test has no modifier properties.
  context.test.skip('invalid native modifier');
});
test.skip('skip reason', { skip: 'offline' }, () => {});
it.todo('pending reason', { todo: 'not implemented' });
test.only('focus', {}, () => {});
describe('suite', {}, () => {});
describe.skip('suite reason', { skip: 'offline' });
describe.only('suite focus', {}, () => {});
setDefaultTimeout(1000);
api.setDefaultTimeout(1000);
// @ts-expect-error Options must precede the callback.
test('wrong order', () => {}, { timeout: 100 });
// @ts-expect-error Runnable tests require a body.
test('missing callback', { timeout: 100 });
// @ts-expect-error Unknown options must not silently pass.
it('typo', { timeuot: 100 }, () => {});
