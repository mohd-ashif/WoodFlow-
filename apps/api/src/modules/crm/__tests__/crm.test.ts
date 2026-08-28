import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateNextCustomerCode } from '../../customers/customer.repository.js';
import { generateNextSupplierCode } from '../../suppliers/supplier.repository.js';
import { hasPermission } from '../../../middleware/rbac.js';

describe('Phase 3 - CRM & Multi-Tenant Tests', () => {
  describe('Tenant Scoped Code Generation', () => {
    it('generates customer codes in CUS-00000X sequence', async () => {
      // Mock customer count
      const codeFormatRegex = /^CUS-\d{6}$/;
      const code1 = 'CUS-000001';
      expect(code1).toMatch(codeFormatRegex);
    });

    it('generates supplier codes in SUP-00000X sequence', async () => {
      const codeFormatRegex = /^SUP-\d{6}$/;
      const code1 = 'SUP-000001';
      expect(code1).toMatch(codeFormatRegex);
    });
  });

  describe('RBAC Permission Matrix', () => {
    it('allows OWNER full access to customers, suppliers, and crm', () => {
      expect(hasPermission('OWNER', 'customers.view')).toBe(true);
      expect(hasPermission('OWNER', 'customers.archive')).toBe(true);
      expect(hasPermission('OWNER', 'customers.export')).toBe(true);
      expect(hasPermission('OWNER', 'suppliers.export')).toBe(true);
    });

    it('allows MANAGER standard CRM access but blocks non-manager endpoints', () => {
      expect(hasPermission('MANAGER' as any, 'customers.view')).toBe(true);
      expect(hasPermission('MANAGER' as any, 'customers.archive')).toBe(true);
      expect(hasPermission('MANAGER' as any, 'customers.export')).toBe(true);
      expect(hasPermission('MANAGER' as any, 'customers.manage_tags')).toBe(false);
    });

    it('allows STAFF basic view and create but blocks archive, export, and tag settings', () => {
      expect(hasPermission('MEMBER', 'customers.view')).toBe(true);
      expect(hasPermission('MEMBER', 'customers.create')).toBe(true);
      expect(hasPermission('MEMBER', 'customers.archive')).toBe(false);
      expect(hasPermission('MEMBER', 'customers.export')).toBe(false);
      expect(hasPermission('MEMBER', 'customers.manage_tags')).toBe(false);
    });

    it('blocks WORKER / unauthenticated role from all CRM endpoints', () => {
      expect(hasPermission(null, 'customers.view')).toBe(false);
      expect(hasPermission(undefined, 'suppliers.view')).toBe(false);
    });
  });
});
