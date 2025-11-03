# test-anywhere

## 0.1.4

### Patch Changes

- b5741a5: Fix changeset handling to enforce proper workflow: require exactly one changeset per PR with valid type (major/minor/patch) and description, ensure CHANGELOG.md updates on version bumps, create GitHub releases with npm package links, and automatically clean up consumed changesets after release.
