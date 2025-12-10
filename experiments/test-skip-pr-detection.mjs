#!/usr/bin/env node

/**
 * Test script for PR detection in format-release-notes.mjs
 * This verifies the fix for issue #104 - proper PR detection via commit lookup
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptPath = join(__dirname, '../scripts/format-release-notes.mjs');
const workflowPath = join(__dirname, '../.github/workflows/common.yml');

console.log('Testing PR detection fix (Issue #104)...\n');

let passed = 0;
let failed = 0;

// Test 1: Check script recognizes --commit-sha in usage message
console.log('Test 1: Usage message includes --commit-sha flag');
try {
  execSync(`node ${scriptPath} 2>&1`, { encoding: 'utf8' });
} catch (error) {
  const stderr = error.stderr || error.stdout || error.message;
  if (stderr.includes('--commit-sha')) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL: Usage message does not include --commit-sha');
    console.log('   Got:', stderr.trim());
    failed++;
  }
}

// Test 2: Check script parses --commit-sha argument
console.log('\nTest 2: Script parses --commit-sha argument');
const scriptContent = readFileSync(scriptPath, 'utf8');
if (scriptContent.includes("arg.startsWith('--commit-sha=')")) {
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

// Test 4: Check script uses GitHub API to look up PRs by commit
console.log('\nTest 4: Script uses GitHub API to look up PRs by commit');
if (scriptContent.includes('commits/${commitShaToLookup}/pulls')) {
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

// Test 6: Check script does NOT have --skip-pr-detection (old workaround)
console.log('\nTest 6: Script removed old --skip-pr-detection workaround');
if (!scriptContent.includes('skip-pr-detection')) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL: Old workaround still present');
  failed++;
}

// Test 7: Check workflow passes --commit-sha
console.log('\nTest 7: Workflow passes --commit-sha with github.sha');
const workflowContent = readFileSync(workflowPath, 'utf8');
if (workflowContent.includes('--commit-sha=${{ github.sha }}')) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL');
  failed++;
}

// Test 8: Check workflow does NOT use --skip-pr-detection
console.log('\nTest 8: Workflow removed old --skip-pr-detection flag');
if (!workflowContent.includes('--skip-pr-detection')) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL: Old workaround still in workflow');
  failed++;
}

// Test 9: Check script uses fallback logic (changelog commit → passed commit)
console.log('\nTest 9: Script prioritizes changelog commit over passed commit');
if (scriptContent.includes('commitHash || passedCommitSha')) {
  console.log('✅ PASS');
  passed++;
} else {
  console.log('❌ FAIL');
  failed++;
}

// Test 10: Check script logs source of commit SHA
console.log('\nTest 10: Script logs the source of commit SHA being used');
if (
  scriptContent.includes("commitHash ? 'changelog' : 'workflow'") &&
  scriptContent.includes('(from ${source})')
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
