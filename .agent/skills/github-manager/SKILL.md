---
name: GitHub Manager
description: Safely manages git operations and GitHub syncs using the `gh` CLI.
version: 1.0.0
---

# GitHub Manager: The Safe Sync

> **Role**: Git operations and GitHub synchronization.
> **Tools**: `scripts/github-sync.ts` (Wrapper around `gh` and `git`).
> **Risk**: High (Modifies remote history).

## 1. Capabilities
-   **sync**: Pulls latest changes, stages files, commits, and pushes.
-   **push**: Pushes local commits to remote.
-   **pr**: Creates a Pull Request from current branch.
-   **status**: Checks git status and remote connection.

## 2. Activation Triggers
-   "Sync with GitHub"
-   "Push these changes"
-   "Deploy to repo"
-   "Commit and push"

## 3. Tech Stack
-   **Git**: Core version control.
-   **GitHub CLI (`gh`)**: Authentication and PR management.

## 4. Rules & Constraints
1.  **Zero-Token Policy**: NEVER ask for or store passwords/PATs. Use `gh auth status` to verify login.
2.  **Risk Gate**: Blocking `git push --force` is MANDATORY.
3.  **Audit First**: Verify `git status` allows a clean commit (no conflict markers).
4.  **Conventional Commits**: Commit messages must follow `type(scope): description`.
    -   Example: `feat(auth): add login page`
    -   Example: `fix(style): adjust mobile padding`
