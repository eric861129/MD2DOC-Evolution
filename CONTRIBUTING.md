# Contributing Guide

## Branching Strategy & Workflow

This project follows a strict branching strategy to ensure stability and code quality.

### Branches

- **`main`**: 
  - The stable production branch.
  - Deployed to GitHub Pages.
  - Direct commits are prohibited (except for critical hotfixes if absolutely necessary).
  - Only accepts changes via **Squash Merge** from `dev`.

- **`dev`**:
  - The main development branch.
  - All feature branches merge into here first.
  - Used for integration testing before releasing to `main`.

### Development Workflow

1.  **Start a Feature**:
    - Always branch off from `dev`.
    - Naming convention: `dev_feature_yyyyMMdd_XXXX`
      - `yyyyMMdd`: Today's date (e.g., 20251231).
      - `XXXX`: Short description of the feature.
    - Example: `git checkout -b dev_feature_20251231_AddUserLogin`

2.  **Develop & Commit**:
    - Make your changes and commit them to your feature branch.

3.  **Merge to `dev`**:
    - Create a Pull Request (PR) or merge your feature branch into `dev`.
    - Ensure CI/tests pass.

4.  **Release to `main`**:
    - Once `dev` is stable and ready for release.
    - **Squash Merge** `dev` into `main` to maintain a clean history on the production branch.
