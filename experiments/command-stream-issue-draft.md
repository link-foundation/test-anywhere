## 🐛 Bug Description

When passing text containing apostrophes through command-stream in double-quoted template literals, apostrophes are escaped using Bash's `'\''` pattern, causing the escape sequences to appear as literal text (`'''`) instead of single apostrophes (`'`) when the text is consumed by APIs or stored literally.

## 🔴 Impact

- Text passed to APIs via CLI tools appears corrupted with triple quotes
- Contractions like "didn't", "wasn't", "it's" display as "didn'''t", "wasn'''t", "it'''s"
- User-facing content (release notes, descriptions, messages) appears unprofessional
- Affects any workflow where text is passed through shell to API endpoints

## 📝 Problem Example

```javascript
import { $ } from 'command-stream';

const releaseNotes = "Fix bug when dependencies didn't exist on npm";

// This gets escaped incorrectly
await $`gh release create v1.0.0 --notes "${releaseNotes}"`;
// GitHub receives: "Fix bug when dependencies didn'\''t exist on npm"
// GitHub displays: "Fix bug when dependencies didn'''t exist on npm"
```

## 🔧 Root Cause

**The mechanism:**

1. User provides text with apostrophes: `didn't`
2. Text is placed in double-quoted template literal: `` $`command "${text}"` ``
3. command-stream applies Bash shell escaping for apostrophes using the `'\''` pattern
4. Shell receives: `command "didn'\''t"`
5. When passed to API (e.g., via `gh` CLI), the API receives and stores literally: `didn'\''t`
6. When rendered/displayed, the escape sequence appears as visible characters: `didn'''t`

**Why this happens:**

In Bash, to include an apostrophe within a single-quoted string, you must:
1. End the current single quotes: `'`
2. Add an escaped apostrophe: `\'`
3. Start new single quotes: `'`
4. Result: `'\''`

This is correct for shell execution, but when the receiving command (like `gh` CLI) passes this text to an API that stores it literally (not interpreting it as shell), the escape sequences become visible.

## 🧪 Reproducible Example

Save this as `test-apostrophe-escaping.mjs`:

```javascript
#!/usr/bin/env node

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

const { $ } = await use('command-stream');

console.log('=== Apostrophe Escaping Issue ===\n');

const sampleText = "This text contains apostrophes: didn't, won't, it's";

console.log('Original text:');
console.log(sampleText);
console.log('\n---\n');

// Test what the shell receives
const result = await $`echo "${sampleText}"`.run({ capture: true });

console.log('What command-stream sends to shell:');
console.log(result.stdout);

console.log('\nExpected:', sampleText);
console.log('Actual contains escape sequences:', result.stdout.includes('\\''));
```

**Run it:**
```bash
chmod +x test-apostrophe-escaping.mjs
./test-apostrophe-escaping.mjs
```

**Expected output:**
```
Original text: didn't
Shell receives: didn't
```

**Actual output:**
```
Original text: didn't
Shell receives: didn'\''t
```

## 💡 Workarounds

### Workaround 1: Use stdin with JSON (RECOMMENDED)

Instead of passing text as command-line arguments, pass it via stdin as JSON:

```javascript
// ❌ BAD: Shell escaping corrupts text
await $`gh release create v1.0.0 --notes "${releaseNotes}"`;

// ✅ GOOD: JSON via stdin preserves text exactly
const payload = JSON.stringify({
  tag_name: 'v1.0.0',
  name: '1.0.0',
  body: releaseNotes,
});

await $`gh api repos/owner/repo/releases -X POST --input -`.run({
  stdin: payload,
});
```

### Workaround 2: Use heredoc

```javascript
// Write text to temp file or use heredoc
const tempFile = '/tmp/release-notes.txt';
await fs.writeFile(tempFile, releaseNotes);
await $`gh release create v1.0.0 --notes-file ${tempFile}`;
```

### Workaround 3: Use raw() function

```javascript
import { $, raw } from 'command-stream';

// ⚠️ WARNING: Only for trusted input!
const trustedText = "Some text with apostrophes";
await $`command ${raw(trustedText)}`;
```

## 🔍 Related Issues

This is related to, but distinct from:
- **#45** - "Automatic quote addition in interpolation causes issues" - about double-quoting
- **#49** - "Complex shell commands with nested quotes and variables fail" - about nested structures
- **This issue** - About apostrophes within text being over-escaped for literal storage

## 🛠️ Suggested Fixes

### Option 1: Add detection for "literal text" context

Provide a way to indicate that interpolated values are literal text, not shell commands:

```javascript
import { $, literal } from 'command-stream';

// Mark text as literal - should not be shell-escaped
await $`gh release create v1.0.0 --notes ${literal(releaseNotes)}`;
```

Implementation would:
- Apply minimal escaping (only what's needed for the argument boundary)
- Not apply Bash-specific patterns like `'\''`

### Option 2: Add stdin convenience for APIs

```javascript
import { $, json } from 'command-stream';

// Helper that automatically uses stdin with JSON
await $`gh api repos/owner/repo/releases -X POST`.json({
  tag_name: 'v1.0.0',
  body: releaseNotes,
});
```

### Option 3: Improve documentation

At minimum, document:
- When shell escaping occurs
- What patterns are used (like `'\''` for apostrophes)
- Best practices for passing literal text to APIs
- Examples of stdin patterns

## 📚 References

**Real-world occurrence:**
- Repository: https://github.com/link-foundation/test-anywhere
- Issue: https://github.com/link-foundation/test-anywhere/issues/135
- Fix PR: https://github.com/link-foundation/test-anywhere/pull/136
- Case study: https://github.com/link-foundation/test-anywhere/blob/issue-135-216d24415677/docs/case-studies/issue-135/README.md

**External resources:**
- [Bash Quoting Documentation](https://ss64.com/bash/syntax-quoting.html)
- [Escaping Single Quotes in Bash](https://linuxsimply.com/bash-scripting-tutorial/quotes/escape-quotes/single/)

## 🎯 Test Cases

A fix should handle:

```javascript
// 1. Basic apostrophe
"didn't" → should stay "didn't"

// 2. Multiple apostrophes
"it's user's choice" → should stay "it's user's choice"

// 3. Double quotes
'text is "quoted"' → should stay 'text is "quoted"'

// 4. Mixed quotes
'it\'s "great"' → should stay 'it\'s "great"'

// 5. Backticks
"use `npm install`" → should stay "use `npm install`"

// 6. Newlines
"Line 1\nLine 2" → should stay "Line 1\nLine 2"
```

## 📊 Frequency

This affects any use case where:
- Text is passed to CLI tools that forward to APIs
- Output is stored/displayed literally (not executed as shell)
- Common scenarios: GitHub releases, Git commit messages, API calls, database inserts

---

**Note:** This issue has been observed in production and has already required workarounds in downstream projects. A proper fix would benefit the entire command-stream ecosystem.
