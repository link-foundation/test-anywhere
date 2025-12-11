#!/usr/bin/env node

/**
 * Test script to verify version-and-commit.mjs argument parsing
 * This script simulates the argument parsing without making actual changes
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import lino-arguments
const { makeConfig } = await use('lino-arguments');

// Parse CLI arguments exactly as version-and-commit.mjs does
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('mode', {
        type: 'string',
        default: getenv('MODE', 'changeset'),
        describe: 'Version mode: changeset or instant',
        choices: ['changeset', 'instant'],
      })
      .option('bump-type', {
        type: 'string',
        default: getenv('BUMP_TYPE', ''),
        describe: 'Version bump type for instant mode: major, minor, or patch',
      })
      .option('description', {
        type: 'string',
        default: getenv('DESCRIPTION', ''),
        describe: 'Description for instant version bump',
      }),
});

const { mode, bumpType, description } = config;

console.log('\n=== Argument Parsing Test ===\n');
console.log('Command line arguments:', process.argv.slice(2));
console.log('\nParsed configuration:');
console.log('  mode:', mode);
console.log('  bumpType:', bumpType);
console.log('  description:', description || '(empty)');
console.log('\n=== Test Results ===\n');

// Validate
let passed = true;

// Test 1: Mode should be set correctly
if (mode === 'instant') {
  console.log('✅ Mode correctly parsed as "instant"');
} else {
  console.log(`❌ Mode incorrectly parsed as "${mode}" (expected "instant")`);
  passed = false;
}

// Test 2: Bump type should be provided
if (bumpType) {
  console.log(`✅ Bump type correctly parsed as "${bumpType}"`);
} else {
  console.log('❌ Bump type not provided');
  passed = false;
}

// Test 3: Description should be provided (if given)
if (process.argv.includes('--description') || process.argv.length > 6) {
  if (description) {
    console.log(`✅ Description correctly parsed as "${description}"`);
  } else {
    console.log('❌ Description not parsed correctly');
    passed = false;
  }
} else {
  console.log('ℹ️  Description not provided (optional)');
}

console.log('\n=== Overall Result ===\n');
if (passed) {
  console.log('✅ All tests passed!');
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
