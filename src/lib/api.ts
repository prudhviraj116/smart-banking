import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  username?: string;
}

interface Account {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  from_account_id?: string;
  to_account_id?: string;
  amount: number;
  transaction_type: string;
  description?: string;
  created_at: string;
  status: string;
}

class ApiClient {
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string, username?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: username,
          },
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    await supabase.auth.signOut();
  }

  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createAccount(accountType: string): Promise<Account> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate account number
    const { data: accountNumber, error: rpcError } = await supabase
      .rpc('generate_account_number');

    if (rpcError) throw rpcError;

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        account_number: accountNumber,
        account_type: accountType,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTransactions(accountId?: string): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        from_account:accounts!from_account_id(account_number),
        to_account:accounts!to_account_id(account_number)
      `)
      .order('created_at', { ascending: false });

    if (accountId) {
      query = query.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async createTransaction(transaction: {
    fromAccountId?: string;
    toAccountNumber?: string;
    amount: number;
    type: string;
    description?: string;
  }): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let toAccountId = null;

    // If transferring to another account, find the target account by number
    if (transaction.toAccountNumber && transaction.type === 'transfer') {
      const { data: targetAccount, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('account_number', transaction.toAccountNumber)
        .single();

      if (accountError || !targetAccount) {
        throw new Error('Target account not found');
      }
      toAccountId = targetAccount.id;
    }

    // Use the process_transaction function for proper balance updates
    const { data, error } = await supabase.rpc('process_transaction', {
      p_from_account_id: transaction.fromAccountId || null,
      p_to_account_id: toAccountId,
      p_amount: transaction.amount,
      p_transaction_type: transaction.type,
      p_description: transaction.description || null,
    });

    if (error) throw error;

    const result = data as { success: boolean; error?: string; transaction_id?: string };

    if (!result.success) {
      throw new Error(result.error || 'Transaction failed');
    }

    // Fetch the created transaction
    const { data: transactionData, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', result.transaction_id)
      .single();

    if (fetchError) throw fetchError;
    return transactionData;
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.full_name,
    };
  }
}

export const apiClient = new ApiClient();