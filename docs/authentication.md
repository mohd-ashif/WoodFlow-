# FurnitureOS — Authentication & Authorization

## Security Principles
1. **Password Hashing**: Passwords are never stored in plain text. Hashed using `bcryptjs` with salt rounds = 10. Password policy enforced via Zod (minimum 8 chars, uppercase, lowercase, number, special symbol).
2. **Session Security**: Uses JWTs signed with `JWT_SECRET` issued via HTTP-Only, SameSite `lax` cookies (`accessToken` valid 24h, `refreshToken` valid 7d). Supports fallback `Authorization: Bearer <token>` for standalone API calls.
3. **Route Guards**:
   - `Public`: Login, Register, Health Check.
   - `Authenticated`: `/api/v1/auth/me`, Access Requests.
   - `Tenant Member`: Requires valid active membership (`req.tenantId`).
   - `Platform Admin`: Locked strictly to `Role.PLATFORM_ADMIN` users under `/api/v1/admin/*`.

## Auth API Endpoints
- `POST /api/v1/auth/register`: Create user account.
- `POST /api/v1/auth/login`: Authenticate credentials & issue session cookies.
- `POST /api/v1/auth/logout`: Clear cookies.
- `GET /api/v1/auth/me`: Return current user context & active company membership.
- `POST /api/v1/auth/refresh`: Refresh access token via valid refresh token.
