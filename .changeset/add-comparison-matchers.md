---
'test-anywhere': minor
---

Add missing comparison matchers and fix toThrow negation

This release adds comprehensive comparison matchers to the expect() API:

- `expect().toBeGreaterThan()` - Assert that a value is greater than another value
- `expect().toBeGreaterThanOrEqual()` - Assert that a value is greater than or equal to another value
- `expect().toBeLessThan()` - Assert that a value is less than another value
- `expect().toBeLessThanOrEqual()` - Assert that a value is less than or equal to another value
- `expect().not.toThrow()` - Assert that a function does not throw an error

All matchers include both positive and negated forms (via `.not`) and work consistently across all runtimes (Node.js, Bun, and Deno). Comprehensive tests have been added to ensure compatibility.

These additions address issues reported in the deduplino test suite where these matchers were missing.
