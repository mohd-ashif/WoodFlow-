# Platform Administrator Operational Guide

This document provides simple instructions for Platform Super Administrators operating the **FurnitureOS SaaS Platform Admin Panel**.

---

## 1. Accessing the Platform Admin Console

1. Navigate to `/admin/dashboard` or log in with a user account possessing `systemRole: PLATFORM_ADMIN`.
2. The Platform Admin header badge confirms your elevated access level.

---

## 2. Managing Access Requests

When a new business owner submits a registration request for their furniture company:

1. Open **Platform Admin** -> **Access Requests**.
2. Review the company name, user name, phone number, and requested domain/slug.
3. Click **Approve Request**:
   - Automatically creates the new `Company` record.
   - Assigns the requesting user as `CompanyRole: OWNER`.
   - Sends confirmation notification to the user.
4. Or click **Reject Request** if the request is invalid or spam.

---

## 3. Managing Companies

- **View All Companies**: Open **Admin** -> **Companies**. View active tenant count, total users, created date, and operational status.
- **Suspend Company**: Click **Suspend** on any company to temporarily block access for all members of that company if subscription billing fails.
- **Activate Company**: Click **Activate** to restore immediate access.

---

## 4. System Audit Logs & Diagnostics

1. Open **Admin** -> **Audit Logs**.
2. Filter logs by `Company ID`, `User ID`, `Action`, or `Date Range`.
3. Track security events, login attempts, bulk imports, and system configuration updates.
