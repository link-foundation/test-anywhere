// Native reporter acceptance tests. Every failing fixture runs in its own process.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import assert from 'node:assert/strict';
import { stripVTControlCharacters } from 'node:util';
import { isLegacyDeno } from '../../src/deno-legacy.js';

const runtime = process.argv[2] || 'node';
assert.ok(['node', 'bun', 'deno'].includes(runtime));
const denoVersion =
  runtime === 'deno'
    ? spawnSync('deno', ['--version'], { encoding: 'utf8', timeout: 15000 })
    : null;
if (denoVersion) {
  assert.equal(denoVersion.status, 0, denoVersion.stderr);
}
const legacyDeno =
  denoVersion && isLegacyDeno(denoVersion.stdout.match(/deno (\S+)/)[1]);
const supportsContext = runtime !== 'bun' && !legacyDeno;
const moduleUrl =
  process.argv[3] || new URL('../../src/index.js', import.meta.url).href;
const logDir = fileURLToPath(new URL('../../ci-logs/', import.meta.url));
mkdirSync(logDir, { recursive: true });
const tempDir = mkdtempSync(join(tmpdir(), 'test-anywhere-contract-'));
const header = `import {test,it,describe,beforeAll,beforeEach,afterEach,afterAll,assert,getRuntime,setDefaultTimeout} from ${JSON.stringify(moduleUrl)};
import {setTimeout as delay} from 'node:timers/promises';
import {setInterval,clearInterval,setTimeout} from 'node:timers';
`;
const cases = [
  {
    name: 'legacy-suite-skip',
    code: `describe('runs',()=>it('control',()=>{}));
describe.skip('legacy visible suite',()=>{
it('never',()=>{throw Error('BODY RAN');});
});
it.skip('legacy skipped test',()=>{throw Error('BODY RAN');});`,
    checks: [/legacy visible suite/],
    pass: 1,
    skip: runtime === 'node' ? 1 : 2,
  },
  {
    name: 'default-guidance',
    code: `setDefaultTimeout(1000);
test('options override defaults',{timeout:0},async()=>{
await delay(20); console.log('ZERO_TIMEOUT_BODY');
});`,
    checks:
      runtime === 'bun'
        ? [/ZERO_TIMEOUT_BODY/]
        : [/ZERO_TIMEOUT_BODY/, /test\(name, \{ timeout \}, callback\)/],
    pass: 1,
  },
  {
    name: 'execution',
    code: `let control=0, options=0;
test('control',()=>control++);
it('it control',()=>control++);
test('options',{timeout:1000},()=>options++);
it('it options',{timeout:1000},async()=>{await Promise.resolve(); options++;});
afterAll(()=>{assert.equal(control,2); assert.equal(options,2); console.log('CALLS 2 2');});`,
    checks: [/CALLS 2 2/],
    pass: 4,
  },
  {
    name: 'skips',
    code: `test('control',()=>{});
test('option skip',{skip:'test reason'},()=>{throw Error('BODY RAN');});
it.skip('modifier skip',{skip:'modifier reason'},()=>{throw Error('BODY RAN');});
test.todo('pending',{todo:'todo reason'});
describe.skip('visible suite',{skip:'suite reason'},()=>{
 describe('nested',()=>it('never',()=>{throw Error('BODY RAN');}));
});
describe.skip('empty visible suite',()=>{});`,
    checks: [
      /test reason/,
      /modifier reason/,
      /suite reason/,
      /visible suite/,
      /empty visible suite/,
      ...(runtime === 'bun' ? [/\b4 skip\b/] : []),
    ],
    pass: 1,
    skip: 2,
  },
  {
    name: 'rejection',
    fails: true,
    code: `describe('outer',()=>{
let cleanup=0; beforeEach(()=>console.log('SETUP'));
afterEach(()=>{cleanup++;console.log('CLEANUP');});
afterAll(()=>{assert.equal(cleanup,2);console.log('ALL_CLEAN');});
describe('inner',()=>{
test('passing',{timeout:1000},()=>console.log('PASS_BODY'));
it('rejected',{timeout:1000},async()=>{console.log('REJECT_BODY');throw Error('EXPECTED_REJECTION');});
});});`,
    checks: [/PASS_BODY/, /REJECT_BODY/, /EXPECTED_REJECTION/, /ALL_CLEAN/],
    pass: 1,
    fail: 1,
  },
  {
    name: 'timeout',
    fails: true,
    code: `describe('deadline suite',()=>{
let resource;
afterEach(()=>{clearInterval(resource);console.log('TIMEOUT_CLEANUP');});
afterAll(()=>console.log('TIMEOUT_ALL_CLEAN'));
test('deadline',{timeout:50},getRuntime()==='bun' ? async()=>{
console.log('TIMEOUT_BODY'); resource=setInterval(()=>{},10);
await new Promise(()=>{});
} : async(context)=>{
console.log('TIMEOUT_BODY');
try { await delay(1000,null,{signal:context.signal}); }
finally {console.log('BODY_ABORTED');}
});});`,
    checks: [
      /TIMEOUT_BODY/,
      /TIMEOUT_CLEANUP/,
      /TIMEOUT_ALL_CLEAN/,
      /timed? ?out|timeout/i,
    ],
    fail: 1,
  },
  {
    name: 'context',
    code: !supportsContext
      ? `test('explicit unsupported context',()=>{
assert.throws(()=>test('context',(t)=>t));
assert.throws(()=>test('signal',{signal:AbortSignal.abort()},()=>{}));
console.log('UNSUPPORTED_EXPLICIT');});`
      : `test('native context',{timeout:1000},async(t)=>{
assert.equal(t.name,'native context'); assert.ok(t.signal instanceof AbortSignal);
await t.test('native subtest',()=>console.log('CONTEXT_BODY'));
});`,
    checks: [supportsContext ? /CONTEXT_BODY/ : /UNSUPPORTED_EXPLICIT/],
  },
  {
    name: 'focus',
    only: true,
    code: `test.only('focused test',{timeout:1000},()=>console.log('ONLY_TEST_BODY'));
it.only('focused it',{timeout:1000},()=>console.log('ONLY_IT_BODY'));
describe.only('focused suite',{},()=>{
test.only('focused child',{timeout:1000},()=>console.log('ONLY_SUITE_BODY'));
});
test('unfocused',()=>{throw Error('BODY RAN');});`,
    checks: [/ONLY_TEST_BODY/, /ONLY_IT_BODY/, /ONLY_SUITE_BODY/],
  },
  {
    name: 'todo-body',
    code: `test('option todo',{todo:'pending reason'},()=>{
console.log('TODO_OPTION_BODY'); throw Error('EXPECTED_TODO');
});
it.todo('modifier todo',{todo:'modifier reason'},()=>{
console.log('TODO_MODIFIER_BODY'); throw Error('EXPECTED_TODO');
});`,
    checks:
      runtime === 'node'
        ? [/TODO_OPTION_BODY/, /TODO_MODIFIER_BODY/, /# todo 2/]
        : [/pending reason/, /modifier reason/],
  },
  {
    name: 'signal',
    fails: supportsContext,
    code: !supportsContext
      ? `test('signal is rejected',()=>assert.throws(()=>
test('unsupported',{signal:AbortSignal.abort()},()=>{})));`
      : `const controller=new AbortController();
test('cancelled',{signal:controller.signal},async(t)=>{
console.log('SIGNAL_BODY');
const timer=setTimeout(()=>controller.abort(),30);
try {await delay(1000,null,{signal:t.signal});}
finally {clearTimeout(timer);console.log('SIGNAL_CLEANUP');}
});`,
    checks: supportsContext ? [/SIGNAL_BODY/, /SIGNAL_CLEANUP/] : [],
  },
];

if (legacyDeno) {
  for (const fixture of cases) {
    fixture.code = fixture.code.replaceAll('{timeout:1000}', '{}');
    if (fixture.name === 'timeout') {
      fixture.fails = false;
      fixture.fail = undefined;
      fixture.pass = 1;
      fixture.code = `test('explicit unsupported deadline',()=>{
assert.throws(()=>test('deadline',{timeout:50},()=>{}));
console.log('UNSUPPORTED_DEADLINE');});`;
      fixture.checks = [/UNSUPPORTED_DEADLINE/];
    }
    if (fixture.name === 'focus') {
      // Deno.test deliberately exits unsuccessfully when native only is used.
      fixture.fails = true;
    }
  }
}

function checkCount(output, kind, minimum) {
  if (minimum === undefined) {
    return;
  }
  const patterns = {
    node: {
      pass: /# pass (\d+)/,
      fail: /# fail (\d+)/,
      skip: /# skipped (\d+)/,
    },
    bun: { pass: /(\d+) pass/, fail: /(\d+) fail/, skip: /(\d+) skip/ },
    deno: { pass: /(\d+) passed/, fail: /(\d+) failed/, skip: /(\d+) ignored/ },
  };
  const match = output.match(patterns[runtime][kind]);
  let count = Number(match?.[1] || 0);
  if (runtime === 'deno') {
    const word = { pass: 'passed', fail: 'failed', skip: 'ignored' }[kind];
    count += Number(
      output.match(new RegExp(`\\d+ ${word} \\((\\d+) steps?\\)`))?.[1] || 0
    );
  }
  if (runtime === 'node' && kind === 'fail') {
    count += Number(output.match(/# cancelled (\d+)/)?.[1] || 0);
  }
  assert.ok(count >= minimum, `${kind} count ${count} must be >= ${minimum}`);
}

let failures = 0;
try {
  for (const fixture of cases) {
    const path = join(tempDir, `${fixture.name}.test.mjs`);
    writeFileSync(path, header + fixture.code);
    const args =
      runtime === 'node'
        ? [
            '--test',
            '--test-reporter=tap',
            ...(fixture.only ? ['--test-only'] : []),
            path,
          ]
        : runtime === 'deno'
          ? ['test', '--no-config', path]
          : ['test', path];
    const result = spawnSync(runtime, args, {
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 2 * 1024 * 1024,
      env: {
        ...process.env,
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        // Bun blocks .only in CI. This isolated fixture deliberately tests it;
        // keep the safeguard enabled for the full suite and other fixtures.
        ...(runtime === 'bun' && fixture.only ? { CI: 'false' } : {}),
      },
    });
    const output = stripVTControlCharacters(result.stdout + result.stderr);
    writeFileSync(
      join(logDir, `contract-${runtime}-${fixture.name}.log`),
      output
    );
    try {
      assert.ifError(result.error);
      assert.equal(
        result.signal,
        null,
        'fixture must finish without forced termination'
      );
      assert.equal(result.status, fixture.fails ? 1 : 0, output);
      for (const check of fixture.checks) {
        assert.match(output, check);
      }
      checkCount(output, 'pass', fixture.pass);
      checkCount(output, 'fail', fixture.fail);
      checkCount(output, 'skip', fixture.skip);
      assert.doesNotMatch(output, /BODY RAN/);
      if (runtime !== 'node' && fixture.name === 'todo-body') {
        assert.doesNotMatch(output, /TODO_OPTION_BODY|TODO_MODIFIER_BODY/);
      }
      console.log(`PASS ${runtime}: ${fixture.name}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${runtime}: ${fixture.name}: ${error.message}`);
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
process.exitCode = failures ? 1 : 0;
