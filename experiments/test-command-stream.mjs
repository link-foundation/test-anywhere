#!/usr/bin/env node

/**
 * Test command-stream error handling behavior with npm view
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import command-stream
const { $ } = await use('command-stream');

console.log('Testing command-stream error handling with npm view...\n');

// Test 1: npm view with a version that definitely doesn't exist
console.log('Test 1: npm view for non-existent version');
try {
  const result = await $`npm view "test-anywhere@999.999.999" version`.run({
    capture: true,
  });
  console.log('  ✗ UNEXPECTED: No error thrown');
  console.log('  Result:', result);
} catch (error) {
  console.log('  ✓ Expected error caught');
  console.log('  Error message:', error.message);
}

console.log('\nTest 2: Simple command that fails (exit code 1)');
try {
  const result = await $`bash -c "exit 1"`.run({ capture: true });
  console.log('  ✗ UNEXPECTED: No error thrown');
  console.log('  Result:', result);
} catch (error) {
  console.log('  ✓ Expected error caught');
  console.log('  Error message:', error.message);
}

console.log('\nTest 3: Command that succeeds');
try {
  const result = await $`echo "success"`.run({ capture: true });
  console.log('  ✓ No error (as expected)');
  console.log('  Result:', result);
} catch (error) {
  console.log('  ✗ UNEXPECTED: Error thrown');
  console.log('  Error:', error.message);
}
