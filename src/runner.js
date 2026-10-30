import { createLegacyDenoRunner, isLegacyDeno } from './deno-legacy.js';

const runtime =
  typeof Bun !== 'undefined'
    ? 'bun'
    : typeof Deno !== 'undefined'
      ? 'deno'
      : 'node';

// Deno's built-in Node compatibility layer supplies scoped suites, hooks,
// cancellation and ignored suite registrations without an external dependency.
const legacyDeno = runtime === 'deno' && isLegacyDeno(Deno.version.deno);
const native = legacyDeno
  ? createLegacyDenoRunner(Deno)
  : await import(runtime === 'bun' ? 'bun:test' : 'node:test');
const registrations = legacyDeno
  ? { hasSubscribers: false }
  : (await import('node:diagnostics_channel')).channel(
      'test-anywhere:register'
    );
const noop = () => {};
let childRegistrations = 0;

function normalize(kind, args, modifier) {
  const [name, second, third] = args;
  if (typeof name !== 'string' || args.length > 3) {
    throw new TypeError(
      `${kind} requires a string name and at most three arguments`
    );
  }
  let options = {};
  let fn;
  if (typeof second === 'function') {
    if (args.length !== 2) {
      throw new TypeError(
        'Use (name, options, callback), not (name, callback, options)'
      );
    }
    fn = second;
  } else if (second !== undefined) {
    if (
      second === null ||
      typeof second !== 'object' ||
      Array.isArray(second) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(second))
    ) {
      throw new TypeError('Test options must be a plain object');
    }
    options = { ...second };
    fn = third;
  } else if (args.length > 2) {
    throw new TypeError('Use a plain options object before the callback');
  }

  const allowed =
    kind === 'describe'
      ? ['skip', 'only']
      : ['timeout', 'skip', 'todo', 'only', 'signal'];
  for (const key of Reflect.ownKeys(options)) {
    if (!allowed.includes(key)) {
      throw new TypeError(`Unsupported ${kind} option: ${String(key)}`);
    }
  }
  for (const key of ['skip', 'todo']) {
    if (
      options[key] !== undefined &&
      typeof options[key] !== 'boolean' &&
      typeof options[key] !== 'string'
    ) {
      throw new TypeError(`${key} must be a boolean or a reason string`);
    }
  }
  if (options.only !== undefined && typeof options.only !== 'boolean') {
    throw new TypeError('only must be a boolean');
  }
  if (
    options.timeout !== undefined &&
    (!Number.isFinite(options.timeout) ||
      options.timeout < 0 ||
      options.timeout > 2147483647)
  ) {
    throw new TypeError(
      'timeout must be a finite number between 0 and 2147483647 milliseconds'
    );
  }
  if (options.signal !== undefined) {
    if (!(options.signal instanceof globalThis.AbortSignal)) {
      throw new TypeError('signal must be an AbortSignal');
    }
    if (runtime === 'bun' || legacyDeno) {
      throw new TypeError(`signal is not supported by ${runtime} native tests`);
    }
  }
  if (legacyDeno && options.timeout !== undefined && options.timeout !== 0) {
    throw new TypeError('Native test timeouts require Deno 2.9 or newer');
  }
  if (modifier) {
    // Keep a reason supplied through .skip/.todo rather than replacing it.
    options[modifier] = options[modifier] || true;
  }
  const pending = options.skip || options.todo;
  if (fn !== undefined && typeof fn !== 'function') {
    throw new TypeError('Test callback must be a function');
  }
  if (!fn && !pending) {
    throw new TypeError(`${kind} requires a callback unless skipped or todo`);
  }
  // Bun interprets a parameter as a done callback, not a TestContext. Reject
  // that shape explicitly rather than silently changing the callback contract.
  if ((runtime === 'bun' || legacyDeno) && kind === 'test' && fn?.length > 0) {
    throw new TypeError(
      `TestContext callbacks are not supported by ${runtime} native tests; use a zero-argument callback`
    );
  }
  if (
    legacyDeno &&
    kind === 'describe' &&
    fn?.constructor.name === 'AsyncFunction'
  ) {
    throw new TypeError('Async suite callbacks require Deno 2.9 or newer');
  }
  return { name, options, fn };
}

function register(kind, args, modifier) {
  const registration = normalize(kind, args, modifier);
  const { options, fn } = registration;
  let { name } = registration;
  if (runtime !== 'node') {
    if (typeof options.skip === 'string' && options.skip) {
      name += ` [skipped: ${options.skip}]`;
    }
    if (typeof options.todo === 'string' && options.todo) {
      name += ` [todo: ${options.todo}]`;
    }
  }
  if (registrations.hasSubscribers) {
    registrations.publish({ runtime, kind, name, options });
  }
  const registerNative = kind === 'describe' ? native.describe : native.test;
  childRegistrations++;
  if (runtime !== 'bun') {
    // Node interprets zero as an immediate deadline; the shared API uses zero
    // to disable it, matching Bun and Deno's native convention.
    const nativeOptions =
      runtime === 'node' && options.timeout === 0
        ? { ...options, timeout: Infinity }
        : options;
    return registerNative(name, nativeOptions, fn);
  }
  if (options.skip) {
    // Preserve Bun's child-level skip reporting, including nested suites.
    // Add a sentinel only when an empty suite would otherwise disappear.
    if (kind === 'describe') {
      return registerNative.skip(name, () => {
        const previous = childRegistrations;
        (fn || noop)();
        if (childRegistrations === previous) {
          native.test.skip(name, noop);
        }
      });
    }
    return registerNative.skip(name, fn || noop);
  }
  if (options.todo) {
    return registerNative.todo(name, fn || noop);
  }
  const run = options.only ? registerNative.only : registerNative;
  // Bun's native timeout follows the callback, unlike Node's options object.
  return options.timeout === undefined
    ? run(name, fn)
    : run(name, fn, options.timeout === 0 ? Infinity : options.timeout);
}

export function test(...args) {
  return register('test', args);
}

export const it = test;

export function describe(...args) {
  return register('describe', args);
}

for (const modifier of ['skip', 'only', 'todo']) {
  test[modifier] = (...args) => register('test', args, modifier);
}
for (const modifier of ['skip', 'only']) {
  describe[modifier] = (...args) => register('describe', args, modifier);
}

export const beforeAll = native.beforeAll || native.before;
export const beforeEach = native.beforeEach;
export const afterEach = native.afterEach;
export const afterAll = native.afterAll || native.after;
export const before = beforeAll;
export const after = afterAll;

export function getRuntime() {
  return runtime;
}

export function setDefaultTimeout(timeout) {
  if (!Number.isFinite(timeout) || timeout < 0 || timeout > 2147483647) {
    throw new TypeError(
      'timeout must be a finite number between 0 and 2147483647 milliseconds'
    );
  }
  if (runtime === 'bun') {
    native.setDefaultTimeout(timeout === 0 ? Infinity : timeout);
  } else {
    console.warn(
      `setDefaultTimeout is not supported in ${runtime} runtime. Use test(name, { timeout }, callback)${legacyDeno ? ' after upgrading to Deno 2.9 or newer' : ' instead'}.`
    );
  }
}
