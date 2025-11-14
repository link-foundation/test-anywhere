---
'test-anywhere': minor
---

Fix critical bugs and add new assertion methods. This release includes major improvements to the assertion library:

**Critical Bug Fixes:**
- Fixed `deepEqual()` implementation - replaced flawed JSON.stringify approach with proper deep equality algorithm that correctly handles property order, NaN, undefined, Date objects, circular references, and nested structures
- Fixed `throws()` to detect async functions and provide helpful error messages directing users to use `throwsAsync()` instead
- Fixed error message construction to use lazy evaluation, preventing unnecessary template literal evaluation and providing better error messages with JSON.stringify for objects

**New Features:**
- Added `throwsAsync()` method for properly testing async functions that throw errors
- Added `notEqual()` assertion for strict inequality checks
- Added `notDeepEqual()` assertion for deep inequality checks
- Added `match()` assertion for regex pattern matching
- Added `includes()` assertion for array/string inclusion checks
- Added TypeScript definitions (.d.ts) for full type safety and autocomplete support

**Improvements:**
- Fixed example files to use relative imports for better local development experience
- Added 23 comprehensive edge case tests covering property order, NaN, undefined, dates, circular references, and all new assertion methods
- Improved error handling in build scripts with DEBUG mode support
- Updated package.json with proper TypeScript exports configuration

All tests pass and the code meets linting standards. This release significantly improves the reliability and usability of the testing framework.
