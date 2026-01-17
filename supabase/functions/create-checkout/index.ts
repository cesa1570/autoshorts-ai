import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log(`[Request] ${req.method} ${new URL(req.url).pathname}`);

    try {
        // 2. Load and Validate Stripe Key
        const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!secretKey) {
            console.error('CRITICAL: STRIPE_SECRET_KEY is missing from secrets.');
            return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY is not set in Supabase Secrets. Please run: npx supabase secrets set STRIPE_SECRET_KEY=sk_...' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const stripe = new Stripe(secretKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 3. Authenticate User
        const authHeader = req.headers.get('Authorization');
        console.log(`[Auth] Header present: ${!!authHeader}`);

        if (!authHeader) {
            console.error('Missing Authorization header');
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            console.error('Supabase Auth Error:', authError?.message || 'No user found');
            return new Response(JSON.stringify({
                error: `Authentication failed: ${authError?.message || 'Invalid or expired session'}`,
                details: authError
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Parse Request Body
        let body;
        try {
            body = await req.json();
            console.log(`[Checkout Request] User: ${user.email}, PriceID: ${body.priceId}`);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { priceId, successUrl, cancelUrl } = body;
        if (!priceId) {
            return new Response(JSON.stringify({ error: 'Price ID is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. Create Stripe Checkout Session
        try {
            console.log(`[Stripe] Contacting Stripe API for price: ${priceId}`);
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                client_reference_id: user.id,
                customer_email: user.email,
                metadata: {
                    userId: user.id,
                    planType: priceId === 'price_1SqCAaChLIAUz0sEi5uzftfQ' ? 'enterprise' : 'pro',
                    billingCycle: 'yearly'
                }
            })

            console.log(`[Success] Session Created: ${session.id}`);
            return new Response(JSON.stringify({ url: session.url }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            })

        } catch (stripeErr: any) {
            console.error(`[Stripe API Error] ${stripeErr.message}`);
            return new Response(JSON.stringify({ error: `Stripe API Error: ${stripeErr.message}` }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            })
        }

    } catch (err: any) {
        console.error('[Critical Error]', err.message);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${err.message}` }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    }
})
