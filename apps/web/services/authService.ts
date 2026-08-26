import { fetchApi } from '../lib/api';
import { RegisterInput, LoginInput, AuthUserContext } from '@furniture-os/shared';

export const authService = {
  async register(data: RegisterInput) {
    return fetchApi<{ user: AuthUserContext }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginInput) {
    return fetchApi<{ user: AuthUserContext }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout() {
    return fetchApi<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },

  async me() {
    return fetchApi<{ user: AuthUserContext }>('/auth/me');
  },
};
