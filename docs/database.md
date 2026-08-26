# FurnitureOS — Database Documentation

## Models Overview

- **User**: Represents platform users. Holds `name`, `email`, `passwordHash`, `phone`, `status`, `lastLoginAt`.
- **Company**: Represents an onboarded furniture business tenant. Holds `name`, `slug`, `gstNumber`, `status`, address details.
- **CompanyMember**: Junction model linking `User` to `Company`. Defines tenant role (`COMPANY_OWNER`, `MANAGER`, `SALES_STAFF`, `INVENTORY_STAFF`, `WORKER`) and membership status (`ACTIVE`, `INACTIVE`, `INVITED`).
- **AccessRequest**: Tracks user onboarding requests (`PENDING`, `APPROVED`, `REJECTED`) reviewed by Platform Admins.
- **AuditLog**: Stores audit entries recording tenant actions, entity IDs, metadata JSON, IP address, and user agent.

## Database Indexes & Constraints
- `User.email`: Unique index for instant lookup & login security.
- `Company.slug`: Unique index for clean tenant URLs.
- `CompanyMember`: Unique composite key `[userId, companyId]` and separate index on `userId` and `companyId`.
- `AccessRequest.status`: Indexed for admin request filtering.
- `AuditLog`: Indexed on `companyId` and `createdAt` for audit queries.
