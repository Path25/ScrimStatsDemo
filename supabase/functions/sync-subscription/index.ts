
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ error: "No Stripe customer found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all subscriptions for this customer (not just active ones)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10, // Get multiple to find the most relevant one
    });

    logStep("Found subscriptions", { 
      total: subscriptions.data.length,
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_end: sub.current_period_end
      }))
    });

    let subscriptionTier = 'free';
    let subscribed = false;
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    // Find the most relevant subscription (prioritize active/trialing, then past_due, then most recent)
    const relevantSubscription = subscriptions.data.find(sub => 
      ['active', 'trialing'].includes(sub.status)
    ) || subscriptions.data.find(sub => 
      sub.status === 'past_due'
    ) || subscriptions.data[0]; // Fallback to most recent

    if (relevantSubscription) {
      stripeSubscriptionId = relevantSubscription.id;
      
      logStep("Found subscription", { 
        subscriptionId: relevantSubscription.id,
        status: relevantSubscription.status 
      });

      // Handle different subscription statuses (same logic as webhook)
      if (['active', 'trialing'].includes(relevantSubscription.status)) {
        subscribed = true;
        subscriptionEnd = new Date(relevantSubscription.current_period_end * 1000).toISOString();
        logStep("Subscription is active or trialing", { status: relevantSubscription.status });
      } else if (relevantSubscription.status === 'past_due') {
        // Keep subscription active during grace period for past_due
        subscribed = true;
        subscriptionEnd = new Date(relevantSubscription.current_period_end * 1000).toISOString();
        logStep("Subscription is past due - keeping active with warning", { status: relevantSubscription.status });
      } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(relevantSubscription.status)) {
        subscribed = false;
        subscriptionEnd = relevantSubscription.canceled_at ? 
          new Date(relevantSubscription.canceled_at * 1000).toISOString() : 
          new Date().toISOString();
        logStep("Subscription is inactive", { 
          status: relevantSubscription.status,
          canceledAt: relevantSubscription.canceled_at 
        });
      } else {
        // Handle other statuses as inactive
        subscribed = false;
        logStep("Subscription status not recognized - setting to inactive", { status: relevantSubscription.status });
      }

      // Only determine tier if subscription is active/valid
      if (subscribed) {
        // Determine tier from product/price metadata instead of amount
        const priceId = relevantSubscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
        
        logStep("Price and product details", { 
          priceId, 
          amount: price.unit_amount,
          currency: price.currency,
          productName: price.product?.name,
          productMetadata: price.product?.metadata,
          priceMetadata: price.metadata
        });
        
        // Determine subscription tier based on product name or metadata
        const productName = (price.product as any)?.name?.toLowerCase() || '';
        const productMetadata = (price.product as any)?.metadata || {};
        const priceMetadata = price.metadata || {};
        
        // Check metadata first, then fallback to product name
        const tierFromMetadata = productMetadata.tier || priceMetadata.tier;
        
        if (tierFromMetadata) {
          subscriptionTier = tierFromMetadata.toLowerCase();
          logStep("Tier determined from metadata", { tier: subscriptionTier });
        } else if (productName.includes('pro')) {
          subscriptionTier = "pro";
          logStep("Tier determined from product name (pro)", { productName });
        } else if (productName.includes('elite') || productName.includes('premium') || productName.includes('enterprise')) {
          subscriptionTier = "elite";
          logStep("Tier determined from product name (elite)", { productName });
        } else {
          // Fallback to amount-based logic for products without proper naming
          const amount = price.unit_amount || 0;
          if (amount === 0) {
            subscriptionTier = "free";
          } else if (amount <= 1499) { // Up to $14.99
            subscriptionTier = "pro";
          } else {
            subscriptionTier = "elite";
          }
          logStep("Tier determined from fallback amount logic", { amount, tier: subscriptionTier });
        }
        
        logStep("Subscription tier determined", { 
          subscriptionId: relevantSubscription.id, 
          tier: subscriptionTier,
          endDate: subscriptionEnd,
          priceAmount: price.unit_amount
        });
      } else {
        logStep("Subscription inactive - setting tier to free");
      }
    } else {
      logStep("No subscription found, setting to free tier");
    }

    // Update subscribers table
    const { error: subscriberError } = await supabaseClient
      .from("subscribers")
      .upsert({
        email: user.email,
        user_id: user.id,
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
      .eq('user_id', user.id)
      .single();

    if (tenantUserError || !tenantUser) {
      logStep("No tenant found for user", tenantUserError);
      return new Response(JSON.stringify({ 
        message: "Subscriber updated but no tenant found to update",
        subscribed,
        subscription_tier: subscriptionTier 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update tenant table
    const tenantSubscriptionStatus = relevantSubscription?.status === 'trialing' ? 'trial' : (subscribed ? 'active' : 'inactive');
    
    const { error: tenantError } = await supabaseClient
      .from("tenants")
      .update({
        subscription_tier: subscriptionTier,
        subscription_status: tenantSubscriptionStatus,
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantUser.tenant_id);
    
    logStep("Updating tenant with status", { 
      subscriptionTier, 
      tenantSubscriptionStatus, 
      stripeSubscriptionId 
    });

    if (tenantError) {
      logStep("Error updating tenant table", tenantError);
      throw tenantError;
    }

    logStep("Successfully synced subscription data", { 
      subscribed, 
      subscriptionTier,
      tenantId: tenantUser.tenant_id 
    });

    return new Response(JSON.stringify({
      message: "Subscription synced successfully",
      subscribed: subscribed,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
