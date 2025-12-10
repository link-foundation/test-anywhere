#!/usr/bin/env node

/**
 * Test script for the --skip-pr-detection flag in format-release-notes.mjs
 * This verifies the fix for issue #104
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptPath = join(__dirname, '../scripts/format-release-notes.mjs');
const workflowPath = join(__dirname, '../.github/workflows/common.yml');

console.log('Testing --skip-pr-detection flag (Issue #104 fix)...\n');

let passed = 0;
let failed = 0;

// Test 1: Check script recognizes --skip-pr-detection in usage message
console.log('Test 1: Usage message includes --skip-pr-detection flag');
try {
  execSync(`node ${scriptPath} 2>&1`, { encoding: 'utf8' });
} catch (error) {
  const stderr = error.stderr || error.stdout || error.message;
  if (stderr.includes('--skip-pr-detection')) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL: Usage message does not include --skip-pr-detection');
    failed++;
  }
}

// Test 2: Check script source has correct flag handling
console.log('\nTest 2: Script checks for --skip-pr-detection in args');
const scriptContent = readFileSync(scriptPath, 'utf8');
if (scriptContent.includes("args.includes('--skip-pr-detection')")) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL');
  failed++;
}

// Test 3: Check script filters out flags from positional args
console.log('\nTest 3: Script filters out flags from positional args');
if (scriptContent.includes("filter((arg) => !arg.startsWith('--'))")) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL');
  failed++;
}

// Test 4: Check script has instant release mode message
console.log('\nTest 4: Script logs message for skipped PR detection');
if (scriptContent.includes('Skipping PR detection (instant release mode)')) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL');
  failed++;
}

// Test 5: Check script removed old greedy fallback logic
console.log('\nTest 5: Script removed old greedy fallback PR search');
if (!scriptContent.includes("pr.title.includes('manual')")) {
  console.log('✅ PASS: Old greedy fallback removed');
  passed++;
} else {
  console.log('❌ FAIL: Old greedy fallback still present');
  failed++;
}

// Test 6: Check workflow passes flag for instant releases
console.log(
  '\nTest 6: Workflow passes --skip-pr-detection for instant releases'
);
const workflowContent = readFileSync(workflowPath, 'utf8');
if (workflowContent.includes('--skip-pr-detection')) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL');
  failed++;
}

// Test 7: Check workflow has conditional for instant mode
console.log('\nTest 7: Workflow checks for instant release mode');
if (
  workflowContent.includes('inputs.release_mode') &&
  workflowContent.includes('"instant"')
) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL');
  failed++;
}

// Summary
console.log('\n---');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
console.log('\n✅ All tests passed!');
