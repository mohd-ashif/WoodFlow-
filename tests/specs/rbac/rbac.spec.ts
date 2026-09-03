import { test, expect, API_BASE_URL, AuthenticatedUser } from '../../fixtures/auth.fixture';
import { APIRequestContext } from '@playwright/test';

test.describe('Role-Based Access Control (RBAC) Matrix Suite @rbac @security', () => {

  test('Owner has unrestricted access to company profile & financial accounts', async ({ apiClientA }: { apiClientA: APIRequestContext }) => {
    const companyRes = await apiClientA.get('/company');
    expect(companyRes.status()).toBe(200);

    const accountsRes = await apiClientA.get('/finance/accounts');
    expect(accountsRes.status()).toBe(200);
  });

  test('Unauthenticated token cannot create products', async ({ request }: { request: APIRequestContext }) => {
    const response = await request.post(`${API_BASE_URL}/products`, {
      headers: {
        'x-company-id': 'royal-furniture',
      },
      data: {
        name: 'Unauthorized Product',
        sku: 'SKU-UNAUTH-01',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('Non-admin user cannot access admin access-requests endpoint', async ({ ownerAuth, request }: { ownerAuth: AuthenticatedUser; request: APIRequestContext }) => {
    const response = await request.get(`${API_BASE_URL}/admin/access-requests`, {
      headers: {
        'Authorization': `Bearer ${ownerAuth.token}`,
      },
    });

    expect([403, 401]).toContain(response.status());
  });

  test('Platform Admin can access platform admin access-requests list', async ({ adminAuth, request }: { adminAuth: AuthenticatedUser; request: APIRequestContext }) => {
    const response = await request.get(`${API_BASE_URL}/admin/access-requests`, {
      headers: {
        'Authorization': `Bearer ${adminAuth.token}`,
      },
    });

    expect(response.status()).toBe(200);
  });
});
