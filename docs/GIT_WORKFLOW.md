# Git Branching Strategy & Development Workflow

This document outlines the standard Git workflow, branching convention, and release tagging rules for **FurnitureOS**.

---

## 1. Branch Hierarchy

```text
main (Production Deployments - Tagged Releases v1.0.0)
  ▲
  │ (Staging / Production Release PR)
develop (Staging Environment - Integration & QA)
  ▲
  ├── feature/crm-customer-notes
  ├── feature/sales-invoice-pdf
  ├── fix/inventory-negative-stock
  └── hotfix/v1.0.1-auth-header-fix (Direct branch off main)
```

### Branch Definitions

- **`main`**: Production code line. Every commit to `main` MUST pass all CI tests and be tagged with a semantic version (e.g. `v1.0.0`).
- **`develop`**: Integration branch for upcoming releases. Deployed continuously to the Staging environment.
- **`feature/*`**: Feature branches for new functionality created off `develop`.
- **`fix/*`**: Bug fixes targeted for the next release created off `develop`.
- **`hotfix/*`**: Emergency production patches created directly off `main` and merged back into both `main` and `develop`.

---

## 2. Naming Conventions

- **Features**: `feature/<module>-<short-description>` (e.g. `feature/purchase-supplier-payment`)
- **Fixes**: `fix/<module>-<short-description>` (e.g. `fix/sales-due-amount-calc`)
- **Hotfixes**: `hotfix/v1.0.1-<short-description>` (e.g. `hotfix/v1.0.1-login-cors`)

---

## 3. Pull Request & Commit Guidelines

1. **Pull Request Rules**:
   - Every PR targeting `develop` or `main` requires passing GitHub Actions CI checks (`ci.yml`).
   - Direct pushes to `main` are restricted.
2. **Commit Message Format**:
   - `feat(sales): add discount validation logic`
   - `fix(inventory): prevent stock movement below zero when allowNegativeStock is false`
   - `docs(api): update API documentation for worker module`
   - `chore(deps): update dependencies`
