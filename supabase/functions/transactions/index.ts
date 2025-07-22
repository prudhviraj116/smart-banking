import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const accountId = pathParts[pathParts.length - 1]

    if (req.method === 'GET' && accountId && accountId !== 'transactions') {
      // Get transactions for a specific account
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          from_account:from_account_id(account_number),
          to_account:to_account_id(account_number)
        `)
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(transactions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { 
        from_account_id, 
        to_account_id, 
        to_account_number,
        amount, 
        transaction_type, 
        description 
      } = await req.json()

      // Validate required fields
      if (!amount || amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!transaction_type || !['deposit', 'withdrawal', 'transfer'].includes(transaction_type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid transaction type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let finalToAccountId = to_account_id

      // If transfer by account number, look up the account ID
      if (transaction_type === 'transfer' && to_account_number && !to_account_id) {
        const { data: targetAccount, error: lookupError } = await supabase
          .from('accounts')
          .select('id')
          .eq('account_number', to_account_number)
          .single()

        if (lookupError || !targetAccount) {
          return new Response(
            JSON.stringify({ error: 'Target account not found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        finalToAccountId = targetAccount.id
      }

      // Validate account ownership for from_account
      if (from_account_id) {
        const { data: fromAccount, error: fromError } = await supabase
          .from('accounts')
          .select('user_id')
          .eq('id', from_account_id)
          .single()

        if (fromError || fromAccount.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Invalid source account' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Process the transaction using the database function
      const { data: result, error: processError } = await supabase
        .rpc('process_transaction', {
          p_from_account_id: from_account_id,
          p_to_account_id: finalToAccountId,
          p_amount: amount,
          p_transaction_type: transaction_type,
          p_description: description
        })

      if (processError) {
        return new Response(
          JSON.stringify({ error: processError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, transaction_id: result.transaction_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})