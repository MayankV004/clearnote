# GitHub Actions Workflow Overview

This folder contains the repository's GitHub Actions automation.

## Workflow: CI

File: `ci.yml`

### When it runs
The CI workflow runs automatically on:
- pushes to the `main` branch
- pull requests targeting the `main` branch

### What it does
The workflow is split into two independent jobs:

#### 1. Frontend CI
This job validates the Next.js frontend by:
- checking out the repository
- setting up Node.js 20 with npm caching
- installing frontend dependencies with `npm ci`
- running ESLint
- running the TypeScript type checker
- auditing npm dependencies for high-severity vulnerabilities

#### 2. Backend CI
This job validates the Python backend by:
- checking out the repository
- setting up Python 3.12 with pip caching
- installing `uv`
- exporting locked dependencies from `uv.lock` to a temporary `requirements.txt`
- installing backend dependencies with `pip`
- installing and running `pip-audit` to scan for dependency vulnerabilities
- compiling all Python files to catch syntax errors

### Purpose
The CI workflow helps ensure that:
- frontend code stays lint-clean and type-safe
- backend code remains syntactically valid
- dependency issues are caught early
- pull requests and merges to `main` are tested consistently

### Notes
- Dependency audits are marked with `continue-on-error: true`, so security warnings do not fail the entire workflow.
- The frontend and backend jobs run separately, so one can complete even if the other fails.
