# Environment Variable Configuration & Audit Guide

This document defines the strict classification, usage, and security rules for environment variables in **Development**, **Staging**, and **Production** environments.

---

## Security Principles

> [!CAUTION]
> 1. **Never Commit Secrets**: Never commit `.env` or any environment file containing real API keys or DB credentials to source control (`git`).
> 2. **Never Expose Secrets to Frontend**: Frontend variables MUST be prefixed with `NEXT_PUBLIC_`. Variables without this prefix will NOT be bundled into client JavaScript.
> 3. **Startup Fail-Fast Assertion**: The backend API validates all environment variables on startup via Zod (`apps/api/src/config/env.ts`). If critical keys are missing or contain default strings in `production`, the server will fail to start immediately with an error log.

---

## Environment Matrix

### 1. Backend API (`apps/api`)

| Variable Name | Required | Default / Format | Description & Security Guidelines |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Set to `production` in live deployment, `development` locally. |
| `PORT` | Yes | `4000` | HTTP port for the Node.js API server. |
| `DATABASE_URL` | Yes | `postgresql://...neon.tech/neondb?sslmode=require` | Connection pooled Neon PostgreSQL connection string. Must enforce `sslmode=require`. |
| `JWT_SECRET` | Yes | `min 32 random characters` | Secret key used to sign JWT access tokens. Must be generated using high entropy (e.g. `openssl rand -hex 32`). |
| `JWT_REFRESH_SECRET` | Yes | `min 32 random characters` | Secret key used to sign JWT refresh tokens. |
| `JWT_EXPIRES_IN` | No | `1d` | Token validity window for short-lived access tokens. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token validity window. |
| `CORS_ORIGIN` | Yes | `https://app.furnitureos.com` | Comma-separated list of permitted web origins. Wildcards (`*`) forbidden in production. |
| `CLOUDINARY_CLOUD_NAME` | Optional | `smuzxkzu` | Cloudinary tenant account name. |
| `CLOUDINARY_API_KEY` | Optional | `numeric key` | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET` | Optional | `secret key` | Cloudinary API Secret. Confidential. |
| `LOG_LEVEL` | No | `info` | Pino log verbosity (`debug`, `info`, `warn`, `error`). |
| `VERSION` | No | `1.0.0` | Application release version string. |

---

### 2. Web Frontend (`apps/web`)

| Variable Name | Required | Example | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.furnitureos.com/api/v1` | Public REST API base URL accessed by browser React components. |
| `NODE_ENV` | Yes | `production` | Build time environment flag. |

---

## Generation Commands for Secrets

Use these commands to generate secure cryptographically safe secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`:

```bash
# Generate 64-byte hex secret string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
