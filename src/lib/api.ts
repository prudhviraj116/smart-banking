const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('supabase_token');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Try parse JSON error first, fallback to text
      try {
        const error = await response.json();
        throw new Error(error.error || 'An error occurred');
      } catch {
        const text = await response.text();
        throw new Error(text || 'An error occurred');
      }
    }

    // Parse JSON on success
    return response.json();
  }

  // Auth methods (using Supabase Auth directly)
  async login(email: string, password: string) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error_description || 'Login failed');
      } catch {
        const text = await response.text();
        throw new Error(text || 'Login failed');
      }
    }

    const data = await response.json();
    localStorage.setItem('supabase_token', data.access_token);
    localStorage.setItem('supabase_user', JSON.stringify(data.user));
    return data;
  }

  async register(email: string, password: string, username?: string) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
        options: {
          data: { username },
        },
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      throw new Error(`Unexpected error: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Registration failed');
    }

    // Save token and user to localStorage if available
    if (data.access_token) {
      localStorage.setItem('supabase_token', data.access_token);
    }
    if (data.user) {
      localStorage.setItem('supabase_user', JSON.stringify(data.user));
    }

    return data;
  }

  logout() {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_user');
  }

  // Account methods
  async getAccounts() {
    return this.request('/accounts');
  }

  async createAccount(accountType: string = 'checking') {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify({ account_type: accountType }),
    });
  }

  // Transaction methods
  async getTransactions(accountId: string) {
    return this.request(`/transactions/${accountId}`);
  }

  async createTransaction(transaction: {
    from_account_id?: string;
    to_account_id?: string;
    to_account_number?: string;
    amount: number;
    transaction_type: 'deposit' | 'withdrawal' | 'transfer';
    description?: string;
  }) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Helper methods
  isAuthenticated() {
    return !!localStorage.getItem('supabase_token');
  }

  getCurrentUser() {
    const user = localStorage.getItem('supabase_user');
    return user ? JSON.parse(user) : null;
  }
}

export const apiClient = new ApiClient();
