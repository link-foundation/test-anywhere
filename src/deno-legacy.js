// Older Deno releases have stubbed node:test suites/hooks and silently ignore
// deadlines/signals. Preserve their existing zero-dependency Deno.test path.
export function isLegacyDeno(version) {
  const [major, minor] = version.split('.').map(Number);
  return major < 2 || (major === 2 && minor < 9);
}

export function createLegacyDenoRunner(deno) {
  const makeScope = (parent, name = '', only = false) => ({
    parent,
    name,
    only,
    before: [],
    beforeEach: [],
    afterEach: [],
    after: [],
    setup: undefined,
    remaining: undefined,
  });
  const root = makeScope(null);
  let current = root;
  const records = [];
  const ancestry = () => {
    const scopes = [];
    for (let scope = current; scope; scope = scope.parent) {
      scopes.unshift(scope);
    }
    return scopes;
  };
  const runHooks = async (hooks) => {
    for (const hook of hooks) {
      await hook();
    }
  };
  const fullName = (scopes, name) =>
    [...scopes.map((scope) => scope.name).filter(Boolean), name].join(' > ');

  function test(name, options, fn) {
    const scopes = ancestry();
    const ignored = Boolean(options.skip || options.todo);
    const only = Boolean(options.only || scopes.some((scope) => scope.only));
    records.push({ scopes, ignored, only });
    deno.test({
      name: fullName(scopes, name),
      ignore: ignored,
      only,
      async fn() {
        const errors = [];
        const focused = records.some((record) => record.only);
        for (const scope of scopes) {
          scope.remaining ??= records.filter(
            (record) =>
              !record.ignored &&
              (!focused || record.only) &&
              record.scopes.includes(scope)
          ).length;
        }
        try {
          for (const scope of scopes) {
            scope.setup ??= runHooks(scope.before);
            await scope.setup;
          }
          for (const scope of scopes) {
            await runHooks(scope.beforeEach);
          }
          await fn();
        } catch (error) {
          errors.push(error);
        } finally {
          // Cleanup all enclosing scopes even when a body or cleanup hook fails.
          for (const scope of [...scopes].reverse()) {
            for (const hook of scope.afterEach) {
              try {
                await hook();
              } catch (error) {
                errors.push(error);
              }
            }
            if (--scope.remaining === 0) {
              for (const hook of scope.after) {
                try {
                  await hook();
                } catch (error) {
                  errors.push(error);
                }
              }
            }
          }
        }
        if (errors.length === 1) {
          throw errors[0];
        }
        if (errors.length > 1) {
          throw new AggregateError(errors, 'Test and cleanup failures');
        }
      },
    });
  }

  function describe(name, options, fn) {
    if (options.skip) {
      deno.test({
        name: fullName(ancestry(), name),
        ignore: true,
        fn() {},
      });
      return;
    }
    const parent = current;
    current = makeScope(parent, name, options.only);
    try {
      return fn();
    } finally {
      current = parent;
    }
  }

  return {
    test,
    describe,
    before: (fn) => current.before.push(fn),
    beforeEach: (fn) => current.beforeEach.push(fn),
    afterEach: (fn) => current.afterEach.push(fn),
    after: (fn) => current.after.push(fn),
  };
}
