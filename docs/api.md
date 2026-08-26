# FurnitureOS — API Reference

Base URL: `/api/v1`

## Auth Routes
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account | Public |
| `POST` | `/auth/login` | Authenticate user & issue session cookies | Public |
| `POST` | `/auth/logout` | Clear authentication session cookies | Authenticated |
| `GET` | `/auth/me` | Fetch active user profile & memberships | Authenticated |
| `POST` | `/auth/refresh` | Refresh access token | Authenticated |

## Access Request Routes
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/access-requests` | Submit company access request | Authenticated |
| `GET` | `/access-requests/me` | Get user's active request status | Authenticated |

## Tenant Company Routes
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/company` | Get active tenant company profile | Tenant User |
| `PATCH` | `/company` | Update tenant company profile | Company Owner |
| `GET` | `/company/members` | List company members | Tenant User |
| `PATCH` | `/company/members/:id/role` | Update member role | Company Owner |
| `PATCH` | `/company/members/:id/status` | Update member status | Company Owner |

## Platform Admin Routes
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | Platform metric totals | Platform Admin |
| `GET` | `/admin/companies` | List all companies | Platform Admin |
| `POST` | `/admin/companies` | Create new company & assign owner | Platform Admin |
| `GET` | `/admin/companies/:id` | Get company by ID | Platform Admin |
| `PATCH` | `/admin/companies/:id` | Update company profile | Platform Admin |
| `POST` | `/admin/companies/:id/suspend` | Suspend company | Platform Admin |
| `POST` | `/admin/companies/:id/activate` | Activate company | Platform Admin |
| `GET` | `/admin/access-requests` | List access requests | Platform Admin |
| `POST` | `/admin/access-requests/:id/approve` | Approve access request | Platform Admin |
| `POST` | `/admin/access-requests/:id/reject` | Reject access request | Platform Admin |
| `GET` | `/admin/users` | List platform users | Platform Admin |
