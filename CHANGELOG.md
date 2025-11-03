# test-anywhere

## 0.1.6

### Patch Changes

- a02b3f2: Fix release notes formatting script to properly detect and format GitHub releases. The script now correctly identifies formatted releases (checking for img.shields.io badge), handles literal \n characters, extracts full descriptions, and uses JSON input for proper special character handling.

## 0.1.5

### Patch Changes

- 0670481: Improve GitHub release notes formatting with proper newlines, PR links, and shields.io NPM version badges

## 0.1.4

### Patch Changes

- b5741a5: Fix changeset handling to enforce proper workflow: require exactly one changeset per PR with valid type (major/minor/patch) and description, ensure CHANGELOG.md updates on version bumps, create GitHub releases with npm package links, and automatically clean up consumed changesets after release.
