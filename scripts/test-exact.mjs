#!/usr/bin/env node

/**
 * Test the EXACT condition from line 161
 */

try {
  const prAuthor = 'app/github-actions';

  // This is the EXACT condition from line 161
  const condition = !prAuthor.startsWith('github-actions') && prAuthor !== 'app/github-actions';

  if (condition) {
    console.log('RESULT: Skipping (this means there\'s a BUG)');
    process.exit(1);
  } else {
    console.log('RESULT: Not skipping (this is correct)');
    process.exit(0);
  }
} catch (error) {
  console.error('Error during exact condition test:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
