#!/usr/bin/env node

/**
 * Combined example showing how use-m, lino-arguments, and command-stream
 * work together for powerful, self-contained scripts.
 *
 * This example demonstrates:
 * - use-m: Dynamic npm package loading without package.json
 * - lino-arguments: Unified configuration from CLI/env/.lenv
 * - command-stream: Concise CLI command execution
 *
 * Run this example with:
 *   node examples/combined-libraries-example.mjs
 *   node examples/combined-libraries-example.mjs --target /tmp --verbose
 *   TARGET_DIR=/var/log node examples/combined-libraries-example.mjs
 *
 * @see https://github.com/link-foundation/use-m
 * @see https://github.com/link-foundation/lino-arguments
 * @see https://github.com/link-foundation/command-stream
 */

// Step 1: Load use-m for dynamic imports
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Step 2: Import all required libraries using use-m
const [{ makeConfig }, { $ }] = await Promise.all([
  use('lino-arguments'),
  use('command-stream'),
]);

// Step 3: Configure arguments using lino-arguments
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .scriptName('combined-example')
      .usage('$0 [options] - Explore a directory using all three libraries')
      .option('target', {
        alias: 't',
        type: 'string',
        default: getenv('TARGET_DIR', '.'),
        describe: 'Target directory to explore',
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        describe: 'Enable verbose output',
      })
      .option('depth', {
        alias: 'd',
        type: 'number',
        default: getenv('DEPTH', 1),
        describe: 'Directory listing depth',
      })
      .help(),
});

// Step 4: Use command-stream to execute commands
const $silent = $({ mirror: false, capture: true });

console.log('=== Combined Libraries Example ===\n');
console.log(`Configuration: ${JSON.stringify(config, null, 2)}\n`);

// List directory contents
console.log(`--- Contents of ${config.target} ---`);
const lsResult = await $`ls -la ${config.target}`;

if (config.verbose) {
  console.log(`\n[VERBOSE] Exit code: ${lsResult.code}`);
}

// Count files
const countResult = await $silent`ls -1 ${config.target}`;
const fileCount = countResult.stdout.trim().split('\n').filter(Boolean).length;
console.log(`\n--- Summary ---`);
console.log(`Total items: ${fileCount}`);

// Get disk usage
try {
  const duResult = await $silent`du -sh ${config.target}`;
  console.log(`Directory size: ${duResult.stdout.trim().split('\t')[0]}`);
} catch {
  console.log('(Could not determine directory size)');
}

console.log('\n✅ Combined libraries example completed successfully!');
