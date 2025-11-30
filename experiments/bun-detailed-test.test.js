/**
 * Detailed test to investigate Bun test discovery
 * This script will help us understand how Bun discovers tests
 */

import { test as testAnywhere } from '../src/index.js';
import { test as testBun } from 'bun:test';

console.log('=== Investigating Bun Test Discovery ===');
console.log('testAnywhere:', typeof testAnywhere, testAnywhere);
console.log('testBun:', typeof testBun, testBun);
console.log('Are they the same?', testAnywhere === testBun);
console.log('testAnywhere.name:', testAnywhere.name);
console.log('testBun.name:', testBun.name);

// Try calling them to see if they behave the same
const result1 = testAnywhere('test via test-anywhere', () => {
  console.log('✓ Running via test-anywhere');
});

const result2 = testBun('test via bun:test', () => {
  console.log('✓ Running via bun:test');
});

console.log('testAnywhere result:', result1);
console.log('testBun result:', result2);
