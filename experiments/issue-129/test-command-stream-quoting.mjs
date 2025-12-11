#!/usr/bin/env node

/**
 * Experiment: Test command-stream quoting behavior
 *
 * This script tests how command-stream handles arguments with and without quotes
 * to understand the auto-quoting behavior mentioned by the user.
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import command-stream
const { $ } = await use('command-stream');

console.log('=== Testing command-stream quoting behavior ===\n');

// Test 1: Direct interpolation (what user suggests)
console.log('Test 1: Direct interpolation without quotes');
const description1 = 'Test patch release (instant)';
console.log(`Input: "${description1}"`);

// Simulate what would happen with: --description ${description}
// We'll use a simple echo command to see what actually gets passed
const result1 =
  await $`node -e "console.log(process.argv.slice(2))" --description ${description1}`.run(
    { capture: true }
  );
console.log('Output:', result1.stdout.trim());
console.log('');

// Test 2: Double-quoted interpolation (current workflow)
console.log('Test 2: Double-quoted interpolation');
const description2 = 'Test patch release (instant)';
console.log(`Input: "${description2}"`);

// Simulate what would happen with: --description "${description}"
const result2 =
  await $`node -e "console.log(process.argv.slice(2))" --description "${description2}"`.run(
    { capture: true }
  );
console.log('Output:', result2.stdout.trim());
console.log('');

// Test 3: Test with special characters
console.log('Test 3: Description with special characters');
const description3 = "Fix: handle user's input";
console.log(`Input: "${description3}"`);

const result3a =
  await $`node -e "console.log(process.argv.slice(2))" --description ${description3}`.run(
    { capture: true }
  );
console.log('Without quotes:', result3a.stdout.trim());

const result3b =
  await $`node -e "console.log(process.argv.slice(2))" --description "${description3}"`.run(
    { capture: true }
  );
console.log('With quotes:', result3b.stdout.trim());
console.log('');

// Test 4: Test with the actual instant-version-bump script argument parsing
console.log('Test 4: Testing with lino-arguments (actual use case)');

// Create a test script that uses lino-arguments like instant-version-bump.mjs
const testScript = `
import { readFileSync } from 'fs';

const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

const { makeConfig } = await use('lino-arguments');

const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('description', {
        type: 'string',
        default: getenv('DESCRIPTION', ''),
        describe: 'Description for the version bump',
      }),
});

console.log('Received description:', JSON.stringify(config.description));
console.log('First char code:', config.description ? config.description.charCodeAt(0) : 'N/A');
console.log('Last char code:', config.description ? config.description.charCodeAt(config.description.length - 1) : 'N/A');
`;

// Write test script
import { writeFileSync } from 'fs';
writeFileSync('/tmp/test-lino-args.mjs', testScript);

// Test without quotes
console.log('Test 4a: Without quotes in template literal');
const desc4a = 'Test patch release (instant)';
const result4a =
  await $`node /tmp/test-lino-args.mjs --description ${desc4a}`.run({
    capture: true,
  });
console.log(result4a.stdout.trim());
console.log('');

// Test with quotes
console.log('Test 4b: With quotes in template literal');
const desc4b = 'Test patch release (instant)';
const result4b =
  await $`node /tmp/test-lino-args.mjs --description "${desc4b}"`.run({
    capture: true,
  });
console.log(result4b.stdout.trim());
console.log('');

console.log('=== Summary ===');
console.log(
  'This experiment shows how command-stream handles quoting in template literals.'
);
console.log(
  'The user suggests that command-stream has auto-quoting, so we should rely on that'
);
console.log(
  'instead of adding our own quotes which might cause double-quoting issues.'
);
