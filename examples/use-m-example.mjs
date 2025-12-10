#!/usr/bin/env node

/**
 * Example usage of use-m for dynamic package loading in .mjs scripts
 *
 * use-m allows importing any npm package at runtime without needing package.json.
 * This makes scripts self-contained and portable.
 *
 * Run this example with:
 *   node examples/use-m-example.mjs
 *
 * @see https://github.com/link-foundation/use-m
 */

// Download use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import npm packages dynamically using use-m
// Note: First run may take a moment as packages are downloaded
const lodash = await use('lodash@4.17.21');

// Demonstrate lodash functionality
const numbers = [1, 2, 3, 4, 5];
const sum = lodash.sum(numbers);
const doubled = lodash.map(numbers, (n) => n * 2);

console.log('=== use-m Example ===');
console.log(`Sum of [${numbers}]: ${sum}`);
console.log(`Doubled: [${doubled}]`);

// Example with multiple versions (use-m's unique capability)
console.log('\n=== Multiple Versions Example ===');
const [lodash3, lodash4] = await use.all('lodash@3', 'lodash@4');
console.log(`Lodash 3 version: ${lodash3.VERSION}`);
console.log(`Lodash 4 version: ${lodash4.VERSION}`);

console.log('\n✅ use-m example completed successfully!');
