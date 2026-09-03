import { test as base, APIRequestContext, request } from '@playwright/test';

export interface AuthenticatedUser {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    systemRole: string;
  };
  companyId?: string;
}

export const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:4000/api/v1';

/**
 * Log in user via API and return authentication credentials token.
 */
export async function loginUser(email: string, password = 'UserPass123!'): Promise<AuthenticatedUser> {
  const reqContext = await request.newContext({
    extraHTTPHeaders: {
      'Connection': 'close',
    },
  });
  try {
    let response = await reqContext.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password },
    });

    if (!response.ok()) {
      if (email !== 'admin@furnitureos.local') {
        const adminRes = await reqContext.post(`${API_BASE_URL}/auth/login`, {
          data: { email: 'admin@furnitureos.local', password: 'AdminPass123!' },
        });
        if (adminRes.ok()) {
          response = adminRes;
        }
      }
    }

    if (!response.ok()) {
      const regRes = await reqContext.post(`${API_BASE_URL}/auth/register`, {
        data: { name: 'QA Test User', email, password, phone: '9999999999' },
      });
      if (regRes.ok()) {
        response = await reqContext.post(`${API_BASE_URL}/auth/login`, {
          data: { email, password },
        });
      }
    }

    if (!response.ok()) {
      throw new Error(`Failed to log in test user ${email}: ${response.status()} ${await response.text()}`);
    }

    const json = await response.json();
    const token = json.data?.tokens?.accessToken || json.data?.token || json.token;
    const user = json.data?.user || json.user;
    const memberships = user?.memberships || [];
    const activeMembership = user?.activeMembership || memberships.find((m: any) => m.status === 'ACTIVE') || memberships[0];
    const companyId = activeMembership?.companyId || activeMembership?.company?.id || 'royal-furniture';

    if (!token) {
      throw new Error(`Failed to extract access token from login response for ${email}`);
    }

    return { token, user, companyId };
  } finally {
    await reqContext.dispose();
  }
}

/**
 * Creates an API context configured with Authorization Bearer header and x-company-id header.
 */
export async function createTenantApiClient(token: string, companyId: string): Promise<APIRequestContext> {
  const context = await request.newContext({
    extraHTTPHeaders: {
      'Authorization': `Bearer ${token}`,
      'x-company-id': companyId,
      'Content-Type': 'application/json',
      'Connection': 'close',
    },
  });

  return new Proxy(context, {
    get(target: any, prop: string) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(prop)) {
        return (url: string, options?: any) => {
          const fullUrl = url.startsWith('http')
            ? url
            : `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
          return target[prop](fullUrl, options);
        };
      }
      return target[prop];
    },
  });
}

// Playwright Custom Fixture Type Definition
type TestFixtures = {
  adminAuth: AuthenticatedUser;
  ownerAuth: AuthenticatedUser;
  apiClientA: APIRequestContext;
  apiClientB: APIRequestContext;
};

export const test = base.extend<TestFixtures>({
  adminAuth: async ({}: Record<string, unknown>, use: (r: AuthenticatedUser) => Promise<void>) => {
    const auth = await loginUser('admin@furnitureos.local', 'AdminPass123!');
    await use(auth);
  },
  ownerAuth: async ({}: Record<string, unknown>, use: (r: AuthenticatedUser) => Promise<void>) => {
    const auth = await loginUser('owner@royalfurniture.local', 'OwnerPass123!');
    await use(auth);
  },
  apiClientA: async ({ ownerAuth }: { ownerAuth: AuthenticatedUser }, use: (r: APIRequestContext) => Promise<void>) => {
    const client = await createTenantApiClient(ownerAuth.token, ownerAuth.companyId!);
    await use(client);
    await client.dispose();
  },
  apiClientB: async ({ ownerAuth }: { ownerAuth: AuthenticatedUser }, use: (r: APIRequestContext) => Promise<void>) => {
    // Create secondary company scope client for tenant isolation testing
    const client = await createTenantApiClient(ownerAuth.token, 'company-b-nonexistent-id');
    await use(client);
    await client.dispose();
  },
});

export { expect } from '@playwright/test';
