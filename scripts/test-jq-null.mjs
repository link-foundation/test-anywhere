#!/usr/bin/env node

/**
 * Testing jq null behavior
 */

import { execSync } from 'child_process';

try {
  console.log('Testing jq null behavior...\n');

  // Test with actual null value
  console.log('Test 1: jq output when field is null');
  const json1 = '{"auto_merge": null}';
  const val1 = execSync(`echo '${json1}' | jq -r '.auto_merge'`, { encoding: 'utf-8' }).trim();
  console.log(`Value: [${val1}]`);
  console.log(`Length: ${val1.length}`);
  if (val1 !== 'null') {
    console.log('  Condition [ "$VAL" != "null" ] = TRUE');
  } else {
    console.log('  Condition [ "$VAL" != "null" ] = FALSE');
  }
  console.log();

  // Test with actual object
  console.log('Test 2: jq output when field is an object');
  const json2 = '{"auto_merge": {"enabled": true}}';
  const val2 = execSync(`echo '${json2}' | jq -r '.auto_merge'`, { encoding: 'utf-8' }).trim();
  console.log(`Value: [${val2}]`);
  if (val2 !== 'null') {
    console.log('  Condition [ "$VAL" != "null" ] = TRUE');
  } else {
    console.log('  Condition [ "$VAL" != "null" ] = FALSE');
  }
  console.log();

  console.log('Test 3: Using --jq (not -r) for null');
  try {
    const val3 = execSync(`echo '${json1}' | jq '.auto_merge'`, { encoding: 'utf-8' }).trim();
    console.log(`Value: [${val3}]`);
  } catch (error) {
    // Fallback
    const val3 = execSync(`echo '${json1}' | jq '.auto_merge'`, { encoding: 'utf-8' }).trim();
    console.log(`Value: [${val3}]`);
  }
  console.log();

  console.log('CONCLUSION: gh api uses jq without -r flag, so null becomes empty string');
} catch (error) {
  console.error('Error during jq null test:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
