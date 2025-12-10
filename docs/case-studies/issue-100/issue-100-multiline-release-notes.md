# Case Study: Multiline Changes Description Flattened in GitHub Release Notes

## Issue Reference

- **Issue:** [#100](https://github.com/link-foundation/test-anywhere/issues/100)
- **Title:** Multiline changes description was flattened into single line in GitHub release description
- **Status:** Bug
- **Reported:** 2025-12-10

## Executive Summary

The multiline description from changeset files was being converted to a single line in GitHub release descriptions. The changeset file contained properly formatted multiline content with bullet points, but the final GitHub release description displayed this content as a single continuous line, removing all line breaks and formatting.

## Timeline of Events

### 1. Original Changeset Creation (commit 2e9cd90)

A changeset file was created at `.changeset/fix-npm-trusted-publishing.md` with the following multiline content:

```markdown
---
'test-anywhere': patch
---

Fix npm trusted publishing by adding repository field to package.json

The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token.

Changes:

- Add repository field to package.json with correct GitHub URL
- Update .gitignore to allow ci-logs/\*.log files
- Update case study documentation with E422 error analysis
```

### 2. CHANGELOG.md Generation (v0.8.19)

The changesets tool processed this file and correctly generated a multiline entry in `CHANGELOG.md`:

```markdown
## 0.8.19

### Patch Changes

- 9b8b39f: Fix npm trusted publishing by adding repository field to package.json

  The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token.

  Changes:
  - Add repository field to package.json with correct GitHub URL
  - Update .gitignore to allow ci-logs/\*.log files
  - Update case study documentation with E422 error analysis
```

### 3. GitHub Release Creation (2025-12-10T00:11:57Z)

The GitHub Actions workflow created a release using `gh release create` command:

```bash
gh release create "v0.8.19" \
  --title "0.8.19" \
  --notes "$RELEASE_NOTES" \
  --repo link-foundation/test-anywhere
```

At this point, the release notes were still in multiline format.

### 4. Release Notes Formatting (2025-12-10T00:12:00Z)

The `scripts/format-release-notes.mjs` script was executed to enhance the release notes with:

- NPM version badge
- Related PR link
- Proper markdown formatting

However, during this step, the multiline content was flattened to a single line.

### 5. Final Result

The GitHub release for v0.8.19 displayed:

```
## What's Changed

Fix npm trusted publishing by adding repository field to package.json The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token. Changes: - Add repository field to package.json with correct GitHub URL - Update .gitignore to allow ci-logs/\*.log files - Update case study documentation with E422 error analysis

**Related Pull Request:** #99
```

## Root Cause Analysis

### Primary Root Cause

The root cause is located in `scripts/format-release-notes.mjs` at **lines 69-74**:

```javascript
const cleanDescription = rawDescription
  .replace(/\\n/g, ' ') // Remove literal \n characters
  .replace(/📦.*$/s, '') // Remove any existing npm package info
  .replace(/---.*$/s, '') // Remove any existing separators and everything after
  .trim()
  .replace(/\s+/g, ' '); // Normalize all whitespace to single spaces
```

**Specifically:**

1. **Line 70:** `.replace(/\\n/g, ' ')` - This replaces escaped newline characters (`\n`) with spaces, which is intended to fix a specific issue with GitHub API returning escaped newlines.

2. **Line 74:** `.replace(/\s+/g, ' ')` - This is the critical problem. It replaces **ALL whitespace** (including actual newlines, tabs, and multiple spaces) with single spaces. This line collapses all multiline formatting into a single line.

### Why This Happens

The regex `/\s+/g` matches:

- `\s` - Any whitespace character (spaces, tabs, newlines, carriage returns)
- `+` - One or more occurrences
- `g` - Global flag (all matches)

This means that all newlines, indentation, and formatting in the changeset description are being replaced with single spaces, effectively flattening the multiline content into a single line.

### Secondary Contributing Factors

1. **Extraction Method (lines 44-63):** The script uses regex to extract the description from the CHANGELOG.md content, matching from "### Patch Changes" to the end of the string. This captures the multiline content correctly.

2. **No Preservation of Markdown Formatting:** The script doesn't have any logic to preserve markdown list items, paragraphs, or other formatting structures.

3. **GitHub API Escaping:** While the script correctly handles escaped `\n` characters from the GitHub API, it doesn't distinguish between escaped newlines (which should become spaces) and actual markdown line breaks (which should be preserved).

## Technical Analysis

### Data Flow

1. **Changeset File** → Multiline markdown with proper formatting
2. **`changeset version`** → CHANGELOG.md with preserved formatting
3. **`gh release create`** → Initial release with CHANGELOG content (formatting preserved)
4. **`format-release-notes.mjs`** → **Formatting is lost here**
5. **Final Release** → Single-line description

### The Problematic Regex Pattern

```javascript
.replace(/\s+/g, ' ')  // This is the problem
```

This should be replaced with something that:

- Preserves actual newlines in the markdown
- Only normalizes excessive spaces on the same line
- Maintains list formatting
- Preserves paragraph breaks

### Evidence from API Data

From `docs/case-studies/release-0.8.19-data.json`:

```json
{
  "tag_name": "v0.8.19",
  "name": "0.8.19",
  "body": "## What's Changed\n\nFix npm trusted publishing by adding repository field to package.json The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token. Changes: - Add repository field to package.json with correct GitHub URL - Update .gitignore to allow ci-logs/\\*.log files - Update case study documentation with E422 error analysis\n\n**Related Pull Request:** #99\n\n---\n\n[![npm version](https://img.shields.io/badge/npm-0.8.19-blue.svg)](https://www.npmjs.com/package/test-anywhere/v/0.8.19)\n\n📦 **View on npm:** https://www.npmjs.com/package/test-anywhere/v/0.8.19",
  "created_at": "2025-12-10T00:11:44Z",
  "published_at": "2025-12-10T00:11:59Z"
}
```

Notice that in the `body` field, the main description paragraph is all on one line (no `\n` characters between sentences), while the header, PR link, and footer all have proper `\n` characters.

## External Research

### Changesets Tool Background

From research on the [Changesets GitHub repository](https://github.com/changesets/changesets):

- Changesets is a tool for managing versioning and changelogs with a focus on monorepos
- It processes changeset files and generates CHANGELOG.md entries
- The default changelog formatter preserves multiline formatting
- There's a known issue ([#748](https://github.com/changesets/changesets/issues/748)) about excessive newlines in release lines
- Custom changelog formatters can be created to modify the output format

### Best Practices

1. **Preserve Markdown Formatting:** GitHub release descriptions support full markdown, so formatting should be preserved
2. **Use `@changesets/changelog-github`:** This official plugin adds links to PRs and authors
3. **Custom Formatting:** When custom formatting is needed, it should be additive, not destructive of existing formatting

## Proposed Solutions

### Solution 1: Fix the Whitespace Normalization (Recommended)

Replace the aggressive whitespace normalization with a more targeted approach:

```javascript
const cleanDescription = rawDescription
  .replace(/\\n/g, '\n') // Convert escaped \n to actual newlines
  .replace(/📦.*$/s, '') // Remove any existing npm package info
  .replace(/---.*$/s, '') // Remove any existing separators and everything after
  .trim()
  .split('\n') // Split by lines
  .map((line) => line.trim()) // Trim each line
  .join('\n') // Rejoin with newlines
  .replace(/\n{3,}/g, '\n\n'); // Normalize excessive newlines (3+ becomes 2)
```

This approach:

- Converts escaped newlines to actual newlines instead of spaces
- Preserves line breaks and paragraphs
- Maintains list formatting
- Only removes excessive blank lines

### Solution 2: Extract from Original Changeset

Instead of extracting from CHANGELOG.md, read the original changeset file directly, which has the cleanest formatting.

### Solution 3: Use Changesets' Built-in GitHub Integration

Switch to using `@changesets/changelog-github` package in `.changeset/config.json`:

```json
{
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "link-foundation/test-anywhere" }
  ]
}
```

This would provide better default formatting with PR links.

## Impact Assessment

### User Impact

- **Severity:** Medium
- **Visibility:** High (affects all GitHub releases)
- **User Experience:** Release notes are harder to read without proper formatting
- **Workaround:** Users can still read the CHANGELOG.md file in the repository

### Technical Impact

- **Scope:** Single file (`scripts/format-release-notes.mjs`)
- **Complexity:** Low (simple regex fix)
- **Risk:** Low (only affects release note formatting)
- **Testing Required:** Verify with example changeset files

## References

### Files Analyzed

1. `.changeset/fix-npm-trusted-publishing.md` (commit 2e9cd90)
2. `CHANGELOG.md` (lines 1-50)
3. `scripts/format-release-notes.mjs` (all)
4. `.github/workflows/common.yml` (lines 165-208)
5. `.github/workflows/main.yml` (lines 116-134)

### Data Collected

1. `docs/case-studies/release-0.8.19-data.json` - GitHub API release data
2. `docs/case-studies/workflow-run-20082679202.log` - Full workflow execution logs
3. `docs/case-studies/recent-workflow-runs.json` - Recent workflow run history
4. `issue-100-screenshot.png` - Visual evidence of the issue

### External Resources

- [Changesets GitHub Repository](https://github.com/changesets/changesets)
- [Changesets Issue #748 - Release lines newlines](https://github.com/changesets/changesets/issues/748)
- [Changesets Documentation - Modifying Changelog Format](https://github.com/changesets/changesets/blob/main/docs/modifying-changelog-format.md)

## Recommendations

1. **Immediate Action:** Implement Solution 1 to fix the whitespace normalization
2. **Testing:** Create test changesets with various formatting styles
3. **Documentation:** Update release process documentation
4. **Future Consideration:** Evaluate switching to `@changesets/changelog-github` for better GitHub integration

## Conclusion

The issue is a straightforward bug in the release notes formatting script where an overly aggressive regex pattern (`/\s+/g`) is replacing all whitespace, including newlines, with single spaces. This collapses multiline descriptions into single lines. The fix is to be more selective about whitespace normalization, preserving newlines while only normalizing excessive spaces and blank lines.
