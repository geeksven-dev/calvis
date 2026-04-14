import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const TOKEN_KEY = 'calvis_token';
const ROLE_KEY  = 'calvis_role';

type Role = 'admin' | 'doctor';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const role  = ref<Role | null>(localStorage.getItem(ROLE_KEY) as Role | null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin    = computed(() => role.value === 'admin');
  const isDoctor   = computed(() => role.value === 'doctor');

  async function login(username: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    token.value = data.token;
    role.value  = data.role as Role;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ROLE_KEY,  data.role);
  }

  function logout() {
    token.value = null;
    role.value  = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  }

  function authHeader(): Record<string, string> {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {};
  }

  return { token, role, isLoggedIn, isAdmin, isDoctor, login, logout, authHeader };
});
