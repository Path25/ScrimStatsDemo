
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook verified", { type: event.type });

    // Handle relevant subscription events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      logStep("Processing subscription event", { 
        subscriptionId: subscription.id, 
        customerId, 
        status: subscription.status 
      });

      // Get customer email
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || customer.deleted || !customer.email) {
        logStep("Customer not found or deleted");
        return new Response("Customer not found", { status: 400 });
      }

      const customerEmail = customer.email;
      logStep("Found customer", { email: customerEmail });

      // Determine subscription tier and status based on Stripe subscription status
      let subscriptionTier = 'free';
      let subscribed = false;
      let subscriptionEnd = null;
      let subscriptionStatus = 'inactive';

      logStep("Processing subscription status", { 
        stripeStatus: subscription.status,
        subscriptionId: subscription.id 
      });

      // Handle different subscription statuses
      if (['active', 'trialing'].includes(subscription.status)) {
        subscribed = true;
        subscriptionStatus = subscription.status === 'trialing' ? 'trial' : 'active';
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        logStep("Subscription is active or trialing", { status: subscription.status });
      } else if (subscription.status === 'past_due') {
        // Keep subscription active during grace period for past_due
        subscribed = true;
        subscriptionStatus = 'past_due';
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        logStep("Subscription is past due - keeping active with warning", { status: subscription.status });
      } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
        subscribed = false;
        subscriptionStatus = 'inactive';
        subscriptionEnd = subscription.canceled_at ? 
          new Date(subscription.canceled_at * 1000).toISOString() : 
          new Date().toISOString();
        
        logStep("Subscription is inactive", { 
          status: subscription.status,
          canceledAt: subscription.canceled_at 
        });
      } else {
        // Handle other statuses (incomplete, etc.) as inactive
        subscribed = false;
        subscriptionStatus = 'inactive';
        
        logStep("Subscription status not recognized - setting to inactive", { status: subscription.status });
      }

      // Only determine tier if subscription is active/valid
      if (subscribed) {
        // Determine tier from price
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        if (amount <= 999) {
          subscriptionTier = "free";
        } else if (amount <= 1999) {
          subscriptionTier = "pro";
        } else {
          subscriptionTier = "elite";
        }
        
        logStep("Subscription tier determined", { 
          tier: subscriptionTier,
          priceAmount: amount,
          endDate: subscriptionEnd 
        });
      } else {
        logStep("Subscription inactive - setting tier to free");
      }

      // Find user by email
      const { data: profiles, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (profileError || !profiles) {
        logStep("User profile not found", { email: customerEmail });
        return new Response("User not found", { status: 400 });
      }

      const userId = profiles.id;

      // Update subscribers table
      const { error: subscriberError } = await supabaseClient
        .from("subscribers")
        .upsert({
          email: customerEmail,
          user_id: userId,
          stripe_customer_id: customerId,
          subscribed: subscribed,
          subscription_tier: subscriptionTier,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (subscriberError) {
        logStep("Error updating subscribers table", subscriberError);
        throw subscriberError;
      }

      // Find user's tenant and update it
      const { data: tenantUser, error: tenantUserError } = await supabaseClient
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      if (tenantUserError || !tenantUser) {
        logStep("No tenant found for user", tenantUserError);
      } else {
        // Update tenant table
        const { error: tenantError } = await supabaseClient
          .from("tenants")
          .update({
            subscription_tier: subscriptionTier,
            subscription_status: subscribed ? 'active' : 'inactive',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenantUser.tenant_id);

        if (tenantError) {
          logStep("Error updating tenant table", tenantError);
          throw tenantError;
        }

        logStep("Successfully updated tenant", { 
          tenantId: tenantUser.tenant_id,
          tier: subscriptionTier 
        });
      }

      logStep("Webhook processed successfully");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
