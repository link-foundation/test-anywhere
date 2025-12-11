#!/usr/bin/env node

/**
 * Test to demonstrate the --version conflict in lino-arguments
 *
 * This test shows that yargs built-in --version flag conflicts with
 * custom --version options when using makeConfig
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import lino-arguments
const { makeConfig } = await use('lino-arguments');

console.log('=== Testing --version conflict ===\n');

// Test 1: Using --version flag
console.log('Test 1: --version flag');
console.log('Command: node test.mjs --version "1.0.0"');
const config1 = makeConfig({
  argv: ['node', 'test.mjs', '--version', '1.0.0'],
  yargs: ({ yargs, getenv }) =>
    yargs.option('version', {
      type: 'string',
      default: getenv('VERSION', ''),
      describe: 'Version number',
    }),
});
console.log('Result:', config1);
console.log('config1.version:', config1.version);
console.log('Expected: "1.0.0"');
console.log('Status:', config1.version === '1.0.0' ? '✅ PASS' : '❌ FAIL');
console.log();

// Test 2: Using --ver flag (no conflict)
console.log('Test 2: --ver flag (no conflict with yargs built-ins)');
console.log('Command: node test.mjs --ver "1.0.0"');
const config2 = makeConfig({
  argv: ['node', 'test.mjs', '--ver', '1.0.0'],
  yargs: ({ yargs, getenv }) =>
    yargs.option('ver', {
      type: 'string',
      default: getenv('VER', ''),
      describe: 'Version number',
    }),
});
console.log('Result:', config2);
console.log('config2.ver:', config2.ver);
console.log('Expected: "1.0.0"');
console.log('Status:', config2.ver === '1.0.0' ? '✅ PASS' : '❌ FAIL');
console.log();

// Test 3: Using --help flag (another built-in)
console.log('Test 3: --help flag (another potential conflict)');
console.log('Command: node test.mjs --help "true"');
const config3 = makeConfig({
  argv: ['node', 'test.mjs', '--help', 'true'],
  yargs: ({ yargs, getenv }) =>
    yargs.option('help', {
      type: 'string',
      default: getenv('HELP', ''),
      describe: 'Help text',
    }),
});
console.log('Result:', config3);
console.log('config3.help:', config3.help);
console.log();

console.log('=== Summary ===');
console.log(
  'The --version flag is a built-in yargs flag that conflicts with custom options.'
);
console.log(
  'Solution: Disable built-in version handling in makeConfig when user defines custom version option.'
);
