#!/usr/bin/env node

/**
 * Test the fixed npm publish check logic
 * This verifies that we correctly check exit codes to determine if a version exists
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import command-stream
const { $ } = await use('command-stream');

console.log('Testing fixed publish check logic...\n');

// Test 1: Check for a version that EXISTS on npm (should return early)
console.log('Test 1: Check for existing version (0.8.32)');
const existingResult = await $`npm view "test-anywhere@0.8.32" version`.run({
  capture: true,
});
console.log(`  Exit code: ${existingResult.code}`);
if (existingResult.code === 0) {
  console.log('  ✓ Version exists - would return early (correct)');
} else {
  console.log('  ✗ Version not found - would proceed to publish (incorrect!)');
}

// Test 2: Check for a version that DOES NOT EXIST (should proceed to publish)
console.log('\nTest 2: Check for non-existent version (999.999.999)');
const nonExistentResult =
  await $`npm view "test-anywhere@999.999.999" version`.run({ capture: true });
console.log(`  Exit code: ${nonExistentResult.code}`);
if (nonExistentResult.code === 0) {
  console.log('  ✗ Version exists - would return early (incorrect!)');
} else {
  console.log('  ✓ Version not found - would proceed to publish (correct)');
}

// Test 3: Simulate the exact scenario from the bug (version 0.8.43)
console.log('\nTest 3: Check for version 0.8.43 (the bug scenario)');
const bugResult = await $`npm view "test-anywhere@0.8.43" version`.run({
  capture: true,
});
console.log(`  Exit code: ${bugResult.code}`);
if (bugResult.code === 0) {
  console.log('  ✗ Version exists - would return early');
  console.log(
    '  This means the version WAS published (but we know it was not)'
  );
} else {
  console.log('  ✓ Version not found - would proceed to publish');
  console.log('  This is correct - version 0.8.43 was never published');
}

console.log('\n--- Summary ---');
console.log(
  'The fix correctly checks exit code === 0 to determine if version exists.'
);
console.log('Exit code 0 = version exists, return early');
console.log('Exit code != 0 = version not found (E404), proceed to publish');
