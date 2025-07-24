import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mobile_number, otp_code, user_id } = await req.json();

    // Validate input
    if (!mobile_number || !otp_code || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Mobile number, OTP code, and user ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the latest OTP for this user and mobile number
    const { data: otpRecord, error: fetchError } = await supabase
      .from('mobile_verifications')
      .select('*')
      .eq('user_id', user_id)
      .eq('mobile_number', mobile_number)
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.error('OTP fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'No valid OTP found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if OTP has expired
    const now = new Date();
    const expiryTime = new Date(otpRecord.expires_at);
    
    if (now > expiryTime) {
      return new Response(
        JSON.stringify({ error: 'OTP has expired' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify OTP code
    if (otpRecord.otp_code !== otp_code) {
      return new Response(
        JSON.stringify({ error: 'Invalid OTP code' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark OTP as verified
    const { error: updateOtpError } = await supabase
      .from('mobile_verifications')
      .update({ 
        is_verified: true, 
        verified_at: new Date().toISOString() 
      })
      .eq('id', otpRecord.id);

    if (updateOtpError) {
      console.error('OTP update error:', updateOtpError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user profile to mark mobile as verified
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_mobile_verified: true,
        mobile_number: mobile_number
      })
      .eq('id', user_id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Mobile ${mobile_number} verified for user ${user_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mobile number verified successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});