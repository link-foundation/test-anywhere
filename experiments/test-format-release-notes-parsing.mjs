#!/usr/bin/env node

/**
 * Test that format-release-notes.mjs correctly parses --release-version argument
 * This verifies the fix for lino-arguments issue #13
 */

import { spawn } from 'child_process';

console.log('Testing format-release-notes.mjs argument parsing...\n');

const args = [
  'scripts/format-release-notes.mjs',
  '--release-id',
  '269421006',
  '--release-version',
  'v0.8.36',
  '--repository',
  'link-foundation/test-anywhere',
  '--commit-sha',
  'a9c5aff2bad739c5ac961911851de3011454f507',
];

console.log('Command:', 'node', args.join(' '));
console.log('\nRunning script...\n');

const proc = spawn('node', args, {
  stdio: 'inherit',
  cwd: process.cwd(),
});

proc.on('exit', (code) => {
  console.log('\n---');
  if (code === 0) {
    console.log('✅ Script executed successfully with exit code 0');
    console.log('✅ Arguments parsed correctly with lino-arguments');
  } else {
    console.log(`❌ Script failed with exit code ${code}`);
    console.log('❌ Argument parsing may have failed');
  }
  process.exit(code);
});

proc.on('error', (err) => {
  console.error('❌ Error running script:', err);
  process.exit(1);
});
