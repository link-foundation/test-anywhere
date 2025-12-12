# Case Study: Issue #135 - Triple Quotes in GitHub Release Notes

## Executive Summary

GitHub release notes display `'''` (three single quotes) instead of `'` (single apostrophe) in contractions like "didn't" and "wasn't". This issue occurs when release notes containing apostrophes are passed through the `gh release create` command via command-stream's shell escaping mechanism.

**Impact**: Release notes appear unprofessional and confusing to users.

**Root Cause**: Shell escaping by command-stream library when passing text arguments in double-quoted template literals.

**Solution**: Use GitHub API with JSON input instead of `gh` CLI with shell arguments to avoid shell escaping entirely.

---

## Timeline of Events

### December 11, 2025

| Time (UTC) | Event                                           | Evidence                             |
| ---------- | ----------------------------------------------- | ------------------------------------ |
| 21:31:56   | PR #134 opened to fix NPM publish check         | Commit a3c5495                       |
| 21:55:16   | PR #134 merged to main                          | Merge commit f6f7d7d                 |
| 21:56:17   | Release v0.8.45 created with triple quote issue | GitHub release created               |
| Later      | Issue #135 reported by user                     | Issue describes `'''` instead of `'` |

### Related Historical Issues

**Issue #129** (Earlier): Release notes had excessive quotes around entire text (e.g., `''Text'''`)

- **Fix**: Removed manual quoting, relied on command-stream auto-quoting
- **PR**: #130
- **Lesson**: Demonstrated the complexity of quote handling with command-stream

**Issue #124** (Earlier): Trailing single quote at end of release notes

- **Fix**: Improved quote stripping regex in format-release-notes.mjs
- **Impact**: Established pattern of fixing quotes in post-processing

---

## Problem Analysis

### The Manifestation

In release v0.8.45, the text appeared as:

```
when they didn'''t exist on npm
```

```
how command-stream'''s .run({ capture: true }) handles
```

Instead of:

```
when they didn't exist on npm
```

```
how command-stream's .run({ capture: true }) handles
```

### The Data Trail

**1. Source (CHANGELOG.md)**

```
didn't exist
command-stream's .run()
```

**2. After create-github-release.mjs processing**

Script escapes double quotes for shell:

```javascript
const escapedNotes = releaseNotes.replace(/"/g, '\\"');
await $`gh release create "${tag}" --title "${version}" --notes "${escapedNotes}" --repo "${repository}"`;
```

**3. What command-stream sends to shell**

Command-stream adds shell escaping for apostrophes within the double-quoted argument:

```bash
gh release create "v0.8.45" --notes "...when they didn'\''t exist..."
```

**4. What GitHub API receives and stores**

GitHub stores the literal text as received from the shell:

```
didn'\''t
```

**5. What users see (rendered)**

The escape sequence `'\''` is rendered as three visible single quotes:

```
didn'''t
```

### The Root Cause

The issue stems from **Bash shell quoting rules** and **command-stream's automatic escaping**:

1. **Command-stream behavior**: When you use `$\`command "${variable}"\`` with a template literal, command-stream escapes the content for safe shell execution.

2. **Apostrophe escaping**: When text contains an apostrophe (`'`), and it's placed in a double-quoted string, command-stream uses the Bash pattern `'\''` to escape it:
   - End the current quotes: `'`
   - Add an escaped apostrophe: `\'`
   - Start new quotes: `'`
   - Result: `'\''`

3. **GitHub's literal storage**: The `gh` CLI passes this escaped text to GitHub's API, which stores it literally without interpreting the escape sequences.

4. **Display problem**: When GitHub renders the text, the escape sequence `'\''` appears as three visible characters: `'''`

### Why This Happens

From [Bash quoting documentation](https://ss64.com/bash/syntax-quoting.html):

> A single quote cannot occur between single quotes, even when preceded by a backslash.

> Single quotes preserve the literal value of every character within the quotes.

The common technique to include an apostrophe in a single-quoted string is: `'It'\''s a website'`

This is exactly what command-stream does, but GitHub receives this as literal text rather than a shell command to be interpreted.

---

## Evidence

### Raw GitHub Release Data

File: `release-v0.8.45.json`

```json
{
  "body": "Fix NPM publish check to properly detect unpublished versions. The script was incorrectly reporting versions as \"already published\" when they didn'\\''t exist on npm, causing the publish step to be skipped. This was caused by misunderstanding how command-stream'\\''s .run({ capture: true }) handles command failures..."
}
```

Note the `'\\''` sequences in the JSON (escaped backslash-apostrophe-apostrophe).

### Experiment Results

File: `experiment-output.txt`

The experiment demonstrates that when passing text through command-stream with double quotes:

**Input**: `didn't`
**Shell receives**: `didn'\''t`
**GitHub stores**: `didn'\''t`
**Users see**: `didn'''`

### Code Path Analysis

**File**: `scripts/create-github-release.mjs:77`

```javascript
const escapedNotes = releaseNotes.replace(/"/g, '\\"');
await $`gh release create "${tag}" --title "${version}" --notes "${escapedNotes}" --repo "${repository}"`;
```

This is where the double-quoted template literal causes command-stream to apply shell escaping.

---

## Online Research Findings

### Shell Escaping Resources

1. **[How-To: Use Escape Characters in Bash](https://ss64.com/bash/syntax-quoting.html)**
   - Explains that single quotes cannot be escaped within single quotes
   - Documents the `'\''` pattern for including apostrophes

2. **[Escaping Single Quotes in Bash](https://linuxsimply.com/bash-scripting-tutorial/quotes/escape-quotes/single/)**
   - Confirms the `'\''` technique: end quotes, add escaped quote, restart quotes

3. **[npm run-script shell escaping issues](https://github.com/npm/run-script/issues/14)**
   - Documents how JSON.stringify doesn't match shell quoting rules
   - Similar category of problem: mismatched escaping expectations

### Key Insights

- Shell escaping is fundamentally incompatible with passing text that should be displayed literally
- JSON is the standard way to pass arbitrary text to APIs without escaping issues
- GitHub's API accepts JSON via `--input` flag with `gh` CLI

---

## Root Cause Summary

**The fundamental issue**: Using shell command-line arguments to pass user-facing text content that should be displayed literally.

**The specific mechanism**:

1. `create-github-release.mjs` uses command-stream template literal with double quotes
2. command-stream applies Bash shell escaping to protect special characters
3. Apostrophes are escaped using `'\''` pattern
4. GitHub API receives and stores this literally (doesn't interpret shell escaping)
5. Users see the escape sequences rendered as `'''`

**Why previous fixes didn't catch this**:

- Issue #129 fixed excessive quoting (wrapping entire text in quotes)
- Issue #124 fixed trailing quotes
- Issue #135 is a different manifestation: **embedded apostrophes within the text**

---

## Proposed Solutions

### Solution 1: Use GitHub API with JSON Input (RECOMMENDED)

**Approach**: Replace `gh release create` CLI with `gh api` using JSON input.

**Advantages**:

- ✅ Completely avoids shell escaping
- ✅ JSON properly handles all special characters (quotes, apostrophes, newlines, etc.)
- ✅ More robust and future-proof
- ✅ Matches how format-release-notes.mjs already updates releases (line 197)

**Implementation**:

```javascript
// Instead of:
await $`gh release create "${tag}" --title "${version}" --notes "${escapedNotes}" --repo "${repository}"`;

// Use:
const payload = JSON.stringify({
  tag_name: tag,
  name: version,
  body: releaseNotes, // No escaping needed!
});

await $`gh api repos/${repository}/releases -X POST --input -`.run({
  stdin: payload,
});
```

**Why this works**: JSON is passed via stdin, command-stream doesn't escape stdin data.

### Solution 2: Use Heredoc

**Approach**: Use Bash heredoc to pass literal text.

**Advantages**:

- ✅ Preserves literal text
- ✅ Familiar Bash pattern

**Disadvantages**:

- ❌ More complex syntax
- ❌ Still vulnerable to edge cases
- ❌ Requires careful escaping of heredoc marker

**Implementation**:

```javascript
const heredocCommand = `gh release create "${tag}" --title "${version}" --notes "$(cat <<'RELEASE_NOTES_EOF'
${releaseNotes}
RELEASE_NOTES_EOF
)" --repo "${repository}"`;

await $`sh -c ${heredocCommand}`;
```

### Solution 3: Improve format-release-notes.mjs Cleanup (NOT RECOMMENDED)

**Approach**: Add more aggressive quote stripping in format-release-notes.mjs.

**Disadvantages**:

- ❌ Doesn't fix the root cause
- ❌ Creates dependency on post-processing
- ❌ Risk of incorrectly stripping legitimate quotes
- ❌ The regex on line 122 already tries this and has edge cases

**Why this is insufficient**: You can't reliably "un-escape" shell escape sequences in post-processing because you can't distinguish between:

- `'\''` that should become `'`
- Literal text `'\''` that should stay as-is

---

## Recommended Solution

**Implement Solution 1**: Use GitHub API with JSON input.

**Rationale**:

1. Fixes the root cause (shell escaping)
2. Already used successfully in format-release-notes.mjs (line 197)
3. Future-proof against other special character issues
4. Cleaner code (no manual escaping needed)
5. Consistent with modern API best practices

---

## Implementation Plan

### Changes Required

**File**: `scripts/create-github-release.mjs`

1. Replace the `gh release create` call with `gh api` call
2. Pass release data as JSON via stdin
3. Remove manual double-quote escaping (line 77)

### Testing Strategy

1. **Unit test**: Run experiment script to verify JSON approach works
2. **Integration test**: Create test release with apostrophes in description
3. **Regression test**: Verify existing releases without apostrophes still work
4. **Edge cases**: Test with:
   - Multiple apostrophes: `it's user's input`
   - Double quotes: `"quoted text"`
   - Newlines: Multi-line descriptions
   - Backticks: `` `code` ``
   - Mixed: `it's "quoted" text`

---

## Lessons Learned

### 1. Shell Escaping is Incompatible with Display Text

When text is meant to be displayed to users (not interpreted as shell commands), passing it through shell arguments creates escaping issues.

**Principle**: Use JSON/stdin for data, shell arguments for commands only.

### 2. Pattern Established by format-release-notes.mjs

The format script (line 197) already uses the correct pattern:

```javascript
await $`gh api repos/${repository}/releases/${releaseId} -X PATCH --input -`.run(
  { stdin: updatePayload }
);
```

We should use this same pattern in create-github-release.mjs.

### 3. Post-Processing Cannot Fix Pre-Processing Errors

Trying to "clean up" shell escaping in format-release-notes.mjs is fighting the symptom, not the cause. The regex on line 122 shows the complexity and fragility of this approach.

### 4. Testing with Special Characters is Essential

Previous testing likely used simple text without apostrophes. Adding test cases with contractions would have caught this earlier.

### 5. Consistency Across Scripts

When we have two scripts doing similar things (create vs. update releases), they should use the same approach. The discrepancy (CLI vs. API) led to this bug.

---

## References

### Internal Documentation

- Issue #135: Current issue
- Issue #129: Previous quote escaping issue
- Issue #124: Trailing quote issue
- PR #134: The PR that triggered this release
- PR #130: Previous quote fix

### External Resources

1. [Bash Quoting Documentation](https://ss64.com/bash/syntax-quoting.html) - SS64
2. [Escaping Single Quotes in Bash](https://linuxsimply.com/bash-scripting-tutorial/quotes/escape-quotes/single/) - LinuxSimply
3. [Advanced Quoting in Shell Scripts](https://scriptingosx.com/2020/04/advanced-quoting-in-shell-scripts/) - Scripting OS X
4. [npm shell-quote Library](https://www.npmjs.com/package/shell-quote) - NPM
5. [GitHub CLI Manual](https://cli.github.com/manual/) - GitHub

### Experiment Files

- `experiments/test-triple-quote-issue.mjs` - Reproduces and demonstrates the issue
- `experiments/issue-129/test-command-stream-quoting.mjs` - Previous quoting experiments

---

## Files Included in This Case Study

```
docs/case-studies/issue-135/
├── README.md                    # This comprehensive analysis
├── release-v0.8.45.json         # Raw GitHub release data
├── release-body-raw.txt         # Raw release body showing '\'' sequences
├── pr-134.json                  # PR that triggered the release
├── issue-129.json               # Related previous issue
├── issue-124.json               # Related previous issue
├── pr-130.json                  # Related previous fix
├── experiment-output.txt        # Output from reproduction experiment
└── trace.log                    # Investigation trace notes
```

---

## Status

**Analysis**: ✅ Complete
**Root Cause**: ✅ Identified
**Solution**: ✅ Proposed
**Implementation**: ⏳ Pending
**Testing**: ⏳ Pending

---

_This case study was created following the same methodology used in issue #133, providing comprehensive analysis, evidence, and actionable solutions._
