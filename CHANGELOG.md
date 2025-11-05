# test-anywhere

## 0.2.5

### Patch Changes

- f221ec1: Fix release automation by implementing direct version commits to main. The release workflow now automatically detects changesets, bumps versions, commits changes directly to main, and publishes to NPM and GitHub releases in a single workflow run. This eliminates the need for separate version bump PRs and ensures fully automated releases without manual intervention.

## 0.2.4

### Patch Changes

- e288686: Simplify version PR title format to show only version number. Version bump PRs will now have titles like "0.2.4" instead of "chore: version packages (v0.2.4)". Auto-merge workflow updated to match the new simplified title format.

## 0.2.3

### Patch Changes

- 459eabb: Add automatic version PR title updates and package-lock.json synchronization. Version bump PRs will now have titles like "chore: version packages (v0.2.2)" instead of just "chore: version packages", and package-lock.json will be automatically synchronized with package.json version updates.

## 0.2.2

### Patch Changes

- 6df8569: Fix auto-merge workflow by enabling repository-level allow_auto_merge setting

## 0.2.1

### Patch Changes

- 99d78ba: Test patch release

## 0.2.0

### Minor Changes

- e4f897f: Add automatic merging of version bump pull requests created by Changesets. When the Changesets action creates a "chore: version packages" PR and all CI checks pass, it will now be automatically merged, streamlining the release process.

## 0.1.6

### Patch Changes

- a02b3f2: Fix release notes formatting script to properly detect and format GitHub releases. The script now correctly identifies formatted releases (checking for img.shields.io badge), handles literal \n characters, extracts full descriptions, and uses JSON input for proper special character handling.

## 0.1.5

### Patch Changes

- 0670481: Improve GitHub release notes formatting with proper newlines, PR links, and shields.io NPM version badges

## 0.1.4

### Patch Changes

- b5741a5: Fix changeset handling to enforce proper workflow: require exactly one changeset per PR with valid type (major/minor/patch) and description, ensure CHANGELOG.md updates on version bumps, create GitHub releases with npm package links, and automatically clean up consumed changesets after release.
