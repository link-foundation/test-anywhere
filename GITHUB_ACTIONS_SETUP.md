# GitHub Actions Setup Guide

## Manual Release Workflow Configuration

This guide explains how to enable the manual release workflow for this repository.

## Problem

When running the Manual Release workflow, you may encounter permission errors:

```
remote: Permission to link-foundation/test-anywhere.git denied to github-actions[bot].
```

or

```
GitHub Actions is not permitted to create or approve pull requests.
```

## Solution

The workflow requires **two separate configurations** to function properly:

### 1. Workflow Permissions ✅ (Already Configured)

The workflow file `.github/workflows/manual-release.yml` already includes:

```yaml
permissions:
  contents: write
  pull-requests: write
```

This grants the workflow job permission to write to the repository and create pull requests.

### 2. Repository Settings ⚠️ (Requires Manual Action)

**Repository administrators must enable GitHub Actions to create pull requests:**

#### Steps:

1. Navigate to your repository on GitHub
2. Click **Settings** (top navigation)
3. Click **Actions** → **General** (left sidebar)
4. Scroll down to **Workflow permissions** section
5. Select: ☑️ **"Read and write permissions"**
6. Check the box: ☑️ **"Allow GitHub Actions to create and approve pull requests"**
7. Click **Save**

#### Visual Guide:

```
Settings
  └── Actions
      └── General
          └── Workflow permissions
              ├── ○ Read repository contents and packages permissions
              └── ● Read and write permissions  ← SELECT THIS
                  └── ☑️ Allow GitHub Actions to create and approve pull requests  ← CHECK THIS
```

## Why Both Are Required

| Configuration        | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| Workflow permissions | Grants the specific workflow job write access to the repository        |
| Repository setting   | Allows the `github-actions[bot]` account to create PRs repository-wide |

For repositories created after **February 2, 2023**, GitHub Actions has read-only permissions by default for security reasons.

## Testing the Fix

Once the repository setting is enabled:

1. Go to **Actions** tab
2. Select **Manual Release** workflow
3. Click **Run workflow** button
4. Fill in the form:
   - **Release type**: patch/minor/major
   - **Description**: (optional) Description of changes
5. Click **Run workflow**

**Expected Result:**

- Workflow creates a new branch named `changeset-manual-release-{run_id}`
- A changeset file is added to `.changeset/` directory
- A pull request is automatically created with release details

## Troubleshooting

### Still Getting 403 Errors?

1. **Verify workflow permissions** in `.github/workflows/manual-release.yml`:

   ```yaml
   jobs:
     create-changeset:
       permissions:
         contents: write
         pull-requests: write
   ```

2. **Verify repository settings**:
   - Settings → Actions → General → Workflow permissions
   - Both "Read and write" and "Allow PR creation" must be enabled

3. **Check organization settings** (if applicable):
   - Organization settings can override repository settings
   - Contact your organization administrator if needed

### Workflow Runs But PR Not Created?

- Check the workflow logs in the Actions tab
- Verify the `peter-evans/create-pull-request` step completed successfully
- Ensure you have the latest version of the action (v7)

## Related Documentation

- [GitHub Actions Token Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [peter-evans/create-pull-request Action](https://github.com/peter-evans/create-pull-request)
- [Managing GitHub Actions Settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)

## Support

If you continue to experience issues after following this guide, please:

1. Check the [issue tracker](../../issues)
2. Review the [workflow logs](../../actions)
3. Create a new issue with detailed error messages
