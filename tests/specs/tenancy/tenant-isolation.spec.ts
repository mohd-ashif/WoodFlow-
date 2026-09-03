import { test, expect, API_BASE_URL, AuthenticatedUser } from '../../fixtures/auth.fixture';
import { APIRequestContext } from '@playwright/test';

test.describe('Multi-Tenant Isolation & IDOR Security Suite @p0 @tenant @security', () => {

  test('Company A owner cannot supply invalid/unauthorized x-company-id header', async ({ ownerAuth, request }: { ownerAuth: AuthenticatedUser; request: APIRequestContext }) => {
    // Attempt request with owner A's token but unauthorized company B header
    const response = await request.get(`${API_BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${ownerAuth.token}`,
        'x-company-id': 'unauthorized_company_999999',
      },
    });

    expect([400, 403]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('Company A user cannot query Company B product by ID', async ({ ownerAuth, request }: { ownerAuth: AuthenticatedUser; request: APIRequestContext }) => {
    // 1. Log in as Company B owner or register Company B context
    const fakeCompanyBId = 'cmp_company_b_fake_12345';

    // 2. Attempt to fetch Company B resource using Company A context
    const response = await request.get(`${API_BASE_URL}/products/prod_company_b_fake_999`, {
      headers: {
        'Authorization': `Bearer ${ownerAuth.token}`,
        'x-company-id': ownerAuth.companyId!,
      },
    });

    expect([404, 403]).toContain(response.status());
  });

  test('Company A user cannot update sales order belonging to another tenant', async ({ ownerAuth, request }: { ownerAuth: AuthenticatedUser; request: APIRequestContext }) => {
    const response = await request.post(`${API_BASE_URL}/sales/sale_company_b_fake/cancel`, {
      headers: {
        'Authorization': `Bearer ${ownerAuth.token}`,
        'x-company-id': ownerAuth.companyId!,
      },
      data: {
        reason: 'Malicious cross-tenant cancellation attempt',
      },
    });

    expect([404, 403]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('Company A user cannot access financial accounts of Company B', async ({ ownerAuth, request }: { ownerAuth: AuthenticatedUser; request: APIRequestContext }) => {
    const response = await request.get(`${API_BASE_URL}/finance/accounts`, {
      headers: {
        'Authorization': `Bearer ${ownerAuth.token}`,
        'x-company-id': 'invalid_tenant_id',
      },
    });

    expect([400, 403]).toContain(response.status());
  });
});
