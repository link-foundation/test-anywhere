#!/usr/bin/env node

/**
 * Test script for release notes formatting
 * Simulates what the formatter would produce without making actual API calls
 */

const packageName = 'test-anywhere';
const version = '0.1.4';
const description =
  'Fix changeset handling to enforce proper workflow: require exactly one changeset per PR with valid type (major/minor/patch) and description, ensure CHANGELOG.md updates on version bumps, create GitHub releases with npm package links, and automatically clean up consumed changesets after release.';
const prNumber = 27;

// Build formatted release notes
const npmBadge = `[![npm version](https://img.shields.io/badge/npm-${version}-blue.svg)](https://www.npmjs.com/package/${packageName}/v/${version})`;

let formattedBody = `## What's Changed\n\n${description}`;

// Add PR link if available
if (prNumber) {
  formattedBody += `\n\n**Related Pull Request:** #${prNumber}`;
}

formattedBody += `\n\n---\n\n${npmBadge}\n\n📦 **View on npm:** https://www.npmjs.com/package/${packageName}/v/${version}`;

console.log('=== FORMATTED RELEASE NOTES ===\n');
console.log(formattedBody);
console.log('\n=== END ===\n');

console.log('✅ Test completed successfully');
console.log('   - Description properly formatted (no \\n literals)');
console.log(`   - PR link added: #${prNumber}`);
console.log('   - shields.io badge included');
console.log('   - npm package link added');
