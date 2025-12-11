#!/usr/bin/env node

/**
 * Workaround for lino-arguments parsing failure - manual argument parsing.
 *
 * This demonstrates a reliable alternative that works in all environments
 * including GitHub Actions CI.
 */

// Manual argument parser - supports both --arg=value and --arg value formats
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        args[k] = v;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args[key] = argv[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const version = args.version || process.env.VERSION || '';
const repository = args.repository || process.env.REPOSITORY || '';

console.log(`Version: ${version}`);
console.log(`Repository: ${repository}`);

if (!version || !repository) {
  console.error('Error: Missing required arguments');
  console.error('Usage: node test-manual-parsing-workaround.mjs --version <version> --repository <repository>');
  process.exit(1);
}

console.log('✅ Arguments parsed successfully!');
