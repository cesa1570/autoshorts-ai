// Follow this setup guide: https://supabase.com/docs/guides/functions/quickstart

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    try {
        const body = await req.text()
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

        // Verify signature
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret!, undefined, cryptoProvider);
        } catch (err) {
            return new Response(`Webhook Error: ${err.message}`, { status: 400 })
        }

        // Handle Event: Checkout Completed
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.client_reference_id;
            const customerId = session.customer;
            const subscriptionId = session.subscription;
            const userEmail = session.customer_email || session.customer_details?.email;

            // Determine Tier based on Metadata or Amount
            let newTier = session.metadata?.planType || 'pro';

            // Fallback to amount if metadata is missing (for older sessions)
            if (!session.metadata?.planType) {
                if (session.amount_total >= 9900 || (session.amount_total === 1900 && session.id.includes('yearly'))) {
                    newTier = 'enterprise';
                }
            }

            console.log(`Payment success for user ${userId} (${userEmail}). Upgrading to ${newTier}.`)

            // Initialize Supabase Admin Client
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Calculate Expiration (Check billingCycle metadata first)
            const isYearly = session.metadata?.billingCycle === 'yearly' || session.id.includes('yearly');
            const durationDays = isYearly ? 365 : 30;
            const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

            // Update User Profile
            const { error: dbError } = await supabaseAdmin
                .from('profiles')
                .update({
                    license_tier: newTier,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId,
                    license_expires_at: expiresAt
                })
                .eq('id', userId)

            if (dbError) {
                console.error('Database update failed:', dbError)
                return new Response('Database Update Failed', { status: 500 })
            }

            // Send Confirmation Email via Resend
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey && userEmail) {
                try {
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendApiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: 'LazyAutoCreator <noreply@resend.dev>',
                            to: [userEmail],
                            subject: 'Your License is Active! 🎥 🚀',
                            html: `
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px;">
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <div style="display: inline-block; background: linear-gradient(135deg, #C5A059 0%, #8a6d3b 100%); width: 60px; height: 60px; border-radius: 15px; line-height: 60px; font-size: 30px;">🎬</div>
                                        <h1 style="color: #C5A059; margin-top: 20px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase;">License Activated</h1>
                                    </div>
                                    
                                    <p style="font-size: 16px; line-height: 1.6; color: #a0a0a0;">Welcome to the next generation of AI Video production. Your account has been successfully upgraded.</p>
                                    
                                    <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(197,160,89,0.2); padding: 25px; border-radius: 15px; margin: 30px 0;">
                                        <h2 style="margin-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #C5A059;">License Protocol</h2>
                                        <div style="font-size: 24px; font-weight: 900; margin-bottom: 15px;">${newTier.toUpperCase()} TIER</div>
                                        
                                        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; font-size: 14px;">
                                            <div style="margin-bottom: 8px;">✅ Unlimited AI Short Generation</div>
                                            <div style="margin-bottom: 8px;">✅ Long-form Cinema Engine (Q2)</div>
                                            <div style="margin-bottom: 8px;">✅ 4K Neural Rendering</div>
                                            <div>✅ Priority API Throughput</div>
                                        </div>
                                    </div>

                                    <div style="margin-bottom: 30px;">
                                        <p style="font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">Valid Until</p>
                                        <p style="font-size: 16px; margin-top: 0;">${new Date(expiresAt).toLocaleDateString()}</p>
                                    </div>

                                    <div style="text-align: center;">
                                        <a href="https://lazyautocreator.xyz" style="display: inline-block; background-color: #C5A059; color: #000000; padding: 18px 40px; border-radius: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em;">Enter Studio</a>
                                    </div>

                                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; color: #444; font-size: 10px;">
                                        ORDER ID: ${session.id}<br>
                                        LazyAutoCreator © 2026
                                    </div>
                                </div>
                            `,
                        }),
                    });

                    if (!res.ok) {
                        console.error('Resend Error:', await res.text());
                    } else {
                        console.log(`Email sent successfully to ${userEmail}`);
                    }
                } catch (emailErr) {
                    console.error('Email sending failed:', emailErr);
                }
            } else {
                console.warn('RESEND_API_KEY or User Email missing. Email skipped.');
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
        })

    } catch (err) {
        console.error('Webhook Runtime Error:', err.message);
        return new Response(err.message, { status: 500 })
    }
})
