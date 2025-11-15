#!/usr/bin/env node

/**
 * Test both conditions for PR author pattern matching
 */

try {
  // Test both conditions
  const prAuthor = 'app/github-actions';

  console.log(`Testing with PR_AUTHOR=${prAuthor}\n`);

  // Line 48-49 condition (in auto-merge job)
  const condition = !prAuthor.startsWith('github-actions') && prAuthor !== 'app/github-actions';
  console.log('Line 48-49: [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]');
  if (condition) {
    console.log('Line 48-49: Skipping (WRONG - this is the problem!)');
  } else {
    console.log('Line 48-49: NOT skipping (correct)');
  }
  console.log();

  // Line 161 condition (in auto-merge-on-checks job) - THIS IS THE PROBLEMATIC ONE
  console.log('Line 161: [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]');
  if (condition) {
    console.log('Line 161: Skipping (WRONG - this is what\'s happening!)');
  } else {
    console.log('Line 161: NOT skipping (correct)');
  }
  console.log();

  // But wait, the log shows it's skipping. Let me check if there's a difference
  console.log('Checking individual conditions:');

  const condition1 = !prAuthor.startsWith('github-actions');
  if (condition1) {
    console.log('  PR_AUTHOR != github-actions* : TRUE');
  } else {
    console.log('  PR_AUTHOR != github-actions* : FALSE');
  }

  const condition2 = prAuthor !== 'app/github-actions';
  if (condition2) {
    console.log('  PR_AUTHOR != app/github-actions : TRUE');
  } else {
    console.log('  PR_AUTHOR != app/github-actions : FALSE');
    console.log('    (because they are exactly equal)');
  }

  console.log();
  console.log('Combined with AND:');
  if (condition) {
    console.log('  Result: TRUE (will skip)');
  } else {
    console.log('  Result: FALSE (will not skip)');
  }
} catch (error) {
  console.error('Error during pattern test:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
