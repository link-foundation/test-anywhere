# Git Hooks

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Available Hooks

### `pre-commit`

Runs before every commit via `lint-staged`.

**What it does:**

- **JavaScript files** (`*.{js,mjs,cjs}`):
  - Runs `eslint --fix --max-warnings 0` (auto-fixes and fails on warnings)
  - Runs `prettier --write` (formats code)
  - Runs `prettier --check` (verifies formatting)
- **Markdown files** (`*.md`):
  - Runs `prettier --write` (formats markdown)
  - Runs `prettier --check` (verifies formatting)

**Result:** Ensures all committed code is properly formatted and passes linting with zero warnings.

### `prepare-commit-msg`

Runs before the commit message editor opens.

**What it does:**

- Checks if you're modifying source files (`src/`) or `package.json`
- If yes, checks if a changeset exists
- If no changeset is found, prompts you to create one or confirm proceeding without one

**Skips automatically:**

- In CI environments (CI, GITHUB_ACTIONS)
- For merge commits, squash commits, and amends

**Bypass:** Use `git commit --no-verify` to skip this check.

**Why:** Ensures we never forget to document changes for version releases.

### `pre-push`

Runs before pushing to remote.

**What it does:**

- Runs `npm run check` (lint + format check + file size check)
- Runs `npm test` (full test suite)

**Result:** Ensures only working, properly formatted code is pushed to the repository.

**Bypass:** Use `git push --no-verify` to skip (not recommended).

## Bypassing Hooks

If you need to bypass these hooks (not recommended):

```bash
# Bypass pre-commit and prepare-commit-msg hooks
git commit --no-verify -m "message"

# Bypass pre-push hook
git push --no-verify
```

## Troubleshooting

### Hooks not running

If hooks aren't running, reinstall them:

```bash
npm run prepare
```

### Hooks failing unexpectedly

1. Check the hook file has execute permissions:

   ```bash
   ls -la .husky/
   ```

2. Ensure dependencies are installed:
   ```bash
   npm install
   ```

## Modifying Hooks

To modify hook behavior:

- Edit the hook file directly in `.husky/`
- For `lint-staged` configuration, edit `package.json` under the `lint-staged` key
