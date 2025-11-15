#!/usr/bin/env node

/**
 * Simulate the exact scenario from the log
 */

try {
  // Simulate the exact scenario from the log
  const prNumber = 39;
  const prTitle = 'chore: version packages';
  const prAuthor = 'app/github-actions';
  const prDraft = 'false';

  console.log(`Found PR #${prNumber}: ${prTitle} (author: ${prAuthor}, draft: ${prDraft})\n`);

  // Line 161-164: Skip if not from github-actions bot
  const condition = !prAuthor.startsWith('github-actions') && prAuthor !== 'app/github-actions';

  if (condition) {
    console.log('  Skipping: not from github-actions bot');
    console.log('  >>> This branch was taken in the actual workflow!');
    console.log('  >>> BUT IT SHOULDN\'T HAVE BEEN!');
  } else {
    console.log('  >>> Not skipping - author IS from github-actions bot');
  }

  console.log('\nLet me check each part of the condition:');
  console.log(`  PR_AUTHOR = '${prAuthor}'\n`);

  const condition1 = !prAuthor.startsWith('github-actions');
  if (condition1) {
    console.log('  ✓ PR_AUTHOR != "github-actions"* is TRUE');
    console.log('    (because \'app/github-actions\' doesn\'t match \'github-actions*\')');
  } else {
    console.log('  ✗ PR_AUTHOR != "github-actions"* is FALSE');
  }

  const condition2 = prAuthor !== 'app/github-actions';
  if (condition2) {
    console.log('  ✓ PR_AUTHOR != "app/github-actions" is TRUE');
  } else {
    console.log('  ✗ PR_AUTHOR != "app/github-actions" is FALSE');
    console.log('    (because they are exactly equal)');
  }

  console.log('\nCombined with AND: TRUE && FALSE = FALSE');
  console.log('So the if condition should be FALSE, meaning it should NOT skip!\n');

  console.log('BUT THE LOG SHOWS IT DID SKIP!');
  console.log('This suggests there\'s something wrong with my understanding...');
} catch (error) {
  console.error('Error during workflow simulation:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
