/**
 * Comprehensive tests for all assertion APIs
 * Tests expect() (Bun/Jest), assert (Node), and assertEquals (Deno) styles
 */

import {
  describe,
  it,
  assert,
  expect,
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
  assertNotStrictEquals,
  assertExists,
  assertMatch,
  assertArrayIncludes,
  assertThrows,
  assertRejects,
} from '../src/index.js';

describe('Bun/Jest-style expect() API', () => {
  it('expect().toBe() works for strict equality', () => {
    expect(1).toBe(1);
    expect('hello').toBe('hello');
    expect(true).toBe(true);

    // Should throw for non-equal values
    assert.throws(() => {
      expect(1).toBe(2);
    });
  });

  it('expect().toEqual() works for deep equality', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
    expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });

    // Should throw for non-equal values
    assert.throws(() => {
      expect([1, 2]).toEqual([1, 3]);
    });
  });

  it('expect().not.toBe() works', () => {
    expect(1).not.toBe(2);
    expect('hello').not.toBe('world');

    assert.throws(() => {
      expect(1).not.toBe(1);
    });
  });

  it('expect().not.toEqual() works', () => {
    expect([1, 2]).not.toEqual([1, 3]);
    expect({ a: 1 }).not.toEqual({ a: 2 });

    assert.throws(() => {
      expect([1, 2]).not.toEqual([1, 2]);
    });
  });

  it('expect().toBeNull() works', () => {
    expect(null).toBeNull();

    assert.throws(() => {
      expect(undefined).toBeNull();
    });
  });

  it('expect().toBeUndefined() works', () => {
    expect(undefined).toBeUndefined();

    assert.throws(() => {
      expect(null).toBeUndefined();
    });
  });

  it('expect().toBeTruthy() works', () => {
    expect(true).toBeTruthy();
    expect(1).toBeTruthy();
    expect('hello').toBeTruthy();
    expect([]).toBeTruthy();
    expect({}).toBeTruthy();

    assert.throws(() => {
      expect(false).toBeTruthy();
    });
  });

  it('expect().toBeFalsy() works', () => {
    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();

    assert.throws(() => {
      expect(true).toBeFalsy();
    });
  });

  it('expect().toContain() works for arrays', () => {
    expect([1, 2, 3]).toContain(2);
    expect(['a', 'b', 'c']).toContain('b');

    assert.throws(() => {
      expect([1, 2, 3]).toContain(4);
    });
  });

  it('expect().toContain() works for strings', () => {
    expect('hello world').toContain('world');
    expect('test').toContain('es');

    assert.throws(() => {
      expect('hello').toContain('xyz');
    });
  });

  it('expect().toMatch() works', () => {
    expect('hello world').toMatch(/world/);
    expect('test123').toMatch(/\d+/);

    assert.throws(() => {
      expect('hello').toMatch(/\d+/);
    });
  });

  it('expect().toThrow() works', () => {
    expect(() => {
      throw new Error('test');
    }).toThrow();

    assert.throws(() => {
      expect(() => {
        // Does not throw
      }).toThrow();
    });
  });

  it('expect().not.toContain() works', () => {
    expect([1, 2, 3]).not.toContain(4);

    assert.throws(() => {
      expect([1, 2, 3]).not.toContain(2);
    });
  });

  it('expect().not.toMatch() works', () => {
    expect('hello').not.toMatch(/\d+/);

    assert.throws(() => {
      expect('test123').not.toMatch(/\d+/);
    });
  });

  it('expect().not.toThrow() works', () => {
    expect(() => {
      // Does not throw
    }).not.toThrow();

    expect(() => 42).not.toThrow();

    assert.throws(() => {
      expect(() => {
        throw new Error('test');
      }).not.toThrow();
    });
  });

  it('expect().toBeGreaterThan() works', () => {
    expect(5).toBeGreaterThan(3);
    expect(10).toBeGreaterThan(0);
    expect(-1).toBeGreaterThan(-5);

    assert.throws(() => {
      expect(3).toBeGreaterThan(5);
    });

    assert.throws(() => {
      expect(5).toBeGreaterThan(5);
    });
  });

  it('expect().toBeGreaterThanOrEqual() works', () => {
    expect(5).toBeGreaterThanOrEqual(3);
    expect(5).toBeGreaterThanOrEqual(5);
    expect(10).toBeGreaterThanOrEqual(0);

    assert.throws(() => {
      expect(3).toBeGreaterThanOrEqual(5);
    });
  });

  it('expect().toBeLessThan() works', () => {
    expect(3).toBeLessThan(5);
    expect(0).toBeLessThan(10);
    expect(-5).toBeLessThan(-1);

    assert.throws(() => {
      expect(5).toBeLessThan(3);
    });

    assert.throws(() => {
      expect(5).toBeLessThan(5);
    });
  });

  it('expect().toBeLessThanOrEqual() works', () => {
    expect(3).toBeLessThanOrEqual(5);
    expect(5).toBeLessThanOrEqual(5);
    expect(0).toBeLessThanOrEqual(10);

    assert.throws(() => {
      expect(5).toBeLessThanOrEqual(3);
    });
  });

  it('expect().not.toBeGreaterThan() works', () => {
    expect(3).not.toBeGreaterThan(5);
    expect(5).not.toBeGreaterThan(5);

    assert.throws(() => {
      expect(5).not.toBeGreaterThan(3);
    });
  });

  it('expect().not.toBeGreaterThanOrEqual() works', () => {
    expect(3).not.toBeGreaterThanOrEqual(5);

    assert.throws(() => {
      expect(5).not.toBeGreaterThanOrEqual(3);
    });

    assert.throws(() => {
      expect(5).not.toBeGreaterThanOrEqual(5);
    });
  });

  it('expect().not.toBeLessThan() works', () => {
    expect(5).not.toBeLessThan(3);
    expect(5).not.toBeLessThan(5);

    assert.throws(() => {
      expect(3).not.toBeLessThan(5);
    });
  });

  it('expect().not.toBeLessThanOrEqual() works', () => {
    expect(5).not.toBeLessThanOrEqual(3);

    assert.throws(() => {
      expect(3).not.toBeLessThanOrEqual(5);
    });

    assert.throws(() => {
      expect(5).not.toBeLessThanOrEqual(5);
    });
  });
});

describe('Deno-style assertion API', () => {
  it('assertEquals() works', () => {
    assertEquals(1, 1);
    assertEquals('hello', 'hello');
    assertEquals([1, 2], [1, 2]);
    assertEquals({ a: 1 }, { a: 1 });

    assert.throws(() => {
      assertEquals(1, 2);
    });
  });

  it('assertNotEquals() works', () => {
    assertNotEquals(1, 2);
    assertNotEquals([1, 2], [1, 3]);

    assert.throws(() => {
      assertNotEquals(1, 1);
    });
  });

  it('assertStrictEquals() works', () => {
    assertStrictEquals(1, 1);
    assertStrictEquals('hello', 'hello');

    assert.throws(() => {
      assertStrictEquals(1, '1');
    });
  });

  it('assertNotStrictEquals() works', () => {
    assertNotStrictEquals(1, 2);
    assertNotStrictEquals(1, '1');

    assert.throws(() => {
      assertNotStrictEquals(1, 1);
    });
  });

  it('assertExists() works', () => {
    assertExists(0);
    assertExists('');
    assertExists(false);
    assertExists([]);

    assert.throws(() => {
      assertExists(null);
    });

    assert.throws(() => {
      assertExists(undefined);
    });
  });

  it('assertMatch() works', () => {
    assertMatch('hello world', /world/);
    assertMatch('test123', /\d+/);

    assert.throws(() => {
      assertMatch('hello', /\d+/);
    });
  });

  it('assertArrayIncludes() works', () => {
    assertArrayIncludes([1, 2, 3], [2]);
    assertArrayIncludes([1, 2, 3], [1, 3]);
    assertArrayIncludes(['a', 'b', 'c'], ['b', 'c']);

    assert.throws(() => {
      assertArrayIncludes([1, 2, 3], [4]);
    });
  });

  it('assertThrows() works', () => {
    assertThrows(() => {
      throw new Error('test');
    });

    assert.throws(() => {
      assertThrows(() => {
        // Does not throw
      });
    });
  });

  it('assertRejects() works', async () => {
    await assertRejects(async () => {
      throw new Error('async error');
    });

    // Should throw if async function doesn't reject
    let caught = false;
    try {
      await assertRejects(async () => {
        // Does not throw
      });
    } catch (_error) {
      caught = true;
    }
    assert.ok(caught, 'assertRejects should throw if function does not reject');
  });
});

describe('Node-style assert API (existing)', () => {
  it('assert.ok() works', () => {
    assert.ok(true);
    assert.ok(1);
    assert.ok('hello');

    assert.throws(() => {
      assert.ok(false);
    });
  });

  it('assert.equal() works', () => {
    assert.equal(1, 1);
    assert.equal('hello', 'hello');

    assert.throws(() => {
      assert.equal(1, 2);
    });
  });

  it('assert.notEqual() works', () => {
    assert.notEqual(1, 2);

    assert.throws(() => {
      assert.notEqual(1, 1);
    });
  });

  it('assert.deepEqual() works', () => {
    assert.deepEqual([1, 2], [1, 2]);
    assert.deepEqual({ a: 1 }, { a: 1 });

    assert.throws(() => {
      assert.deepEqual([1, 2], [1, 3]);
    });
  });

  it('assert.notDeepEqual() works', () => {
    assert.notDeepEqual([1, 2], [1, 3]);

    assert.throws(() => {
      assert.notDeepEqual([1, 2], [1, 2]);
    });
  });

  it('assert.throws() works', () => {
    assert.throws(() => {
      throw new Error('test');
    });

    assert.throws(() => {
      assert.throws(() => {
        // Does not throw
      });
    });
  });

  it('assert.throwsAsync() works', async () => {
    await assert.throwsAsync(async () => {
      throw new Error('async error');
    });
  });

  it('assert.match() works', () => {
    assert.match('hello world', /world/);

    assert.throws(() => {
      assert.match('hello', /\d+/);
    });
  });

  it('assert.includes() works', () => {
    assert.includes([1, 2, 3], 2);
    assert.includes('hello', 'ell');

    assert.throws(() => {
      assert.includes([1, 2, 3], 4);
    });
  });
});

describe('Cross-API compatibility', () => {
  it('all three styles can be used together', () => {
    const value = 42;

    // Node style
    assert.equal(value, 42);

    // Bun/Jest style
    expect(value).toBe(42);

    // Deno style
    assertEquals(value, 42);
  });

  it('all assertion styles work with arrays', () => {
    const arr = [1, 2, 3];

    // Node style
    assert.deepEqual(arr, [1, 2, 3]);
    assert.includes(arr, 2);

    // Bun/Jest style
    expect(arr).toEqual([1, 2, 3]);
    expect(arr).toContain(2);

    // Deno style
    assertEquals(arr, [1, 2, 3]);
    assertArrayIncludes(arr, [2]);
  });

  it('all assertion styles work with strings', () => {
    const str = 'hello world';

    // Node style
    assert.match(str, /world/);
    assert.includes(str, 'world');

    // Bun/Jest style
    expect(str).toMatch(/world/);
    expect(str).toContain('world');

    // Deno style
    assertMatch(str, /world/);
  });
});
