#!/usr/bin/env node

/**
 * Example usage of lino-arguments for argument and configuration parsing
 *
 * lino-arguments provides unified configuration from CLI args, environment
 * variables, and .lenv files with automatic type conversion and case handling.
 *
 * Run this example with:
 *   node examples/lino-arguments-example.mjs
 *   node examples/lino-arguments-example.mjs --port 8080 --verbose
 *   PORT=9000 node examples/lino-arguments-example.mjs
 *
 * @see https://github.com/link-foundation/lino-arguments
 */

// Download use-m dynamically to load lino-arguments without package.json
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import lino-arguments using use-m
const { makeConfig } = await use('lino-arguments');

// Create unified configuration from multiple sources
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .scriptName('lino-arguments-example')
      .usage('$0 [options]')
      .option('port', {
        type: 'number',
        default: getenv('PORT', 3000),
        describe: 'Server port',
      })
      .option('host', {
        type: 'string',
        default: getenv('HOST', 'localhost'),
        describe: 'Server host',
      })
      .option('verbose', {
        type: 'boolean',
        default: false,
        describe: 'Enable verbose logging',
      })
      .option('api-key', {
        type: 'string',
        default: getenv('API_KEY', ''),
        describe: 'API authentication key',
      })
      .help(),
});

// Display the configuration
console.log('=== lino-arguments Example ===');
console.log('\nConfiguration loaded from CLI args, env vars, and .lenv file:');
console.log(JSON.stringify(config, null, 2));

// Show where values came from
console.log('\n--- Configuration Details ---');
console.log(`Port: ${config.port} (type: ${typeof config.port})`);
console.log(`Host: ${config.host}`);
console.log(`Verbose: ${config.verbose}`);
console.log(`API Key: ${config.apiKey ? '[REDACTED]' : '(not set)'}`);

if (config.verbose) {
  console.log('\n[VERBOSE] Detailed configuration object:', config);
}

console.log('\n✅ lino-arguments example completed successfully!');
