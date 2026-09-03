import { test, expect, API_BASE_URL, AuthenticatedUser } from '../../fixtures/auth.fixture';
import { APIRequestContext } from '@playwright/test';

test.describe('Authentication & Session API Test Suite @smoke @security', () => {
  test('User Login with valid credentials returns JWT token & user profile', async ({ request }: { request: APIRequestContext }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'admin@furnitureos.local',
        password: 'AdminPass123!',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data?.tokens?.accessToken || body.data?.token || body.token).toBeTruthy();
    expect(body.data?.user?.email || body.user?.email).toBe('admin@furnitureos.local');
  });

  test('User Login with invalid password returns 401 Unauthorized', async ({ request }: { request: APIRequestContext }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'admin@furnitureos.local',
        password: 'WrongPassword123!',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error || body.message).toContain('Invalid');
  });

  test('User Login with SQL Injection attempt is safely handled', async ({ request }: { request: APIRequestContext }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: "' OR 1=1 --",
        password: "' OR 1=1 --",
      },
    });

    expect([400, 401, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('Unauthenticated request to protected /auth/me returns 401', async ({ request }: { request: APIRequestContext }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('Authenticated user can fetch profile session info via /auth/me', async ({ ownerAuth, request }: { ownerAuth: AuthenticatedUser; request: APIRequestContext }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${ownerAuth.token}`,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data?.user?.email || body.user?.email).toBe('owner@royalfurniture.local');
  });
});
