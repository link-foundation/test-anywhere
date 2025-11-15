#!/usr/bin/env node

/**
 * Test the current condition for PR author pattern matching
 */

try {
  // Test the current condition
  const prAuthor = 'app/github-actions';

  console.log(`Testing with PR_AUTHOR=${prAuthor}\n`);

  // Current condition (line 48)
  // Note: JavaScript doesn't have bash-style pattern matching, so we use startsWith and exact match
  const currentCondition = !prAuthor.startsWith('github-actions') && prAuthor !== 'app/github-actions';
  console.log('Current condition (line 48): [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]');
  if (currentCondition) {
    console.log('Current condition (line 48): Would skip (WRONG)');
  } else {
    console.log('Current condition (line 48): Would NOT skip (correct)');
  }
  console.log();

  // Fixed condition (unquoted pattern)
  // Same as above in JavaScript
  console.log('Fixed condition (unquoted pattern): [[ "$PR_AUTHOR" != github-actions* && "$PR_AUTHOR" != "app/github-actions" ]]');
  if (currentCondition) {
    console.log('Fixed condition (unquoted pattern): Would skip (WRONG)');
  } else {
    console.log('Fixed condition (unquoted pattern): Would NOT skip (correct)');
  }
  console.log();

  // Better approach using OR logic
  const orCondition = prAuthor === 'app/github-actions' || prAuthor.startsWith('github-actions');
  console.log('OR logic: [[ "$PR_AUTHOR" == "app/github-actions" || "$PR_AUTHOR" == github-actions* ]]');
  if (orCondition) {
    console.log('OR logic: Is github-actions bot (correct)');
  } else {
    console.log('OR logic: Not github-actions bot (WRONG)');
  }
} catch (error) {
  console.error('Error during pattern test:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
