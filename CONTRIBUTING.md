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

## Version Control & Changelog

We follow **Semantic Versioning (SemVer)** guidelines (MAJOR.MINOR.PATCH).

### When to Bump Version
- **Feature Branches**: Should bump the **MINOR** version (e.g., 1.0.0 -> 1.1.0) when introducing new functionality.
- **Bug Fixes**: Should bump the **PATCH** version (e.g., 1.1.0 -> 1.1.1).

### Checklist for Version Bump
When preparing your feature branch for merge, please ensure the following files are updated:

1. **`package.json`**: Update the `version` field.
2. **`README.md` & `README_EN.md`**: Update the version badge image URL.
3. **`CHANGELOG.md`**: Add a new entry describing your changes under the new version number.
4. **`constants/defaultContent.ts`**: Update version numbers in code examples if applicable.
