/* eslint-disable no-undef */
import { test, setDefaultTimeout } from '../src/index.js';

// Set a very short timeout to verify it works
setDefaultTimeout(100);

test('Should complete within default timeout', async () => {
  // This test should pass as it completes quickly
  await new Promise((resolve) => setTimeout(resolve, 50));
});

// Test that timeout can be changed
setDefaultTimeout(5000);

test('Should complete with increased timeout', async () => {
  // This test would fail with 100ms timeout but should pass with 5000ms
  await new Promise((resolve) => setTimeout(resolve, 200));
});
