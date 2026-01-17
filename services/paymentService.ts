import { supabase } from './supabaseClient';

export const paymentService = {
    async createCheckoutSession(priceId: string): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not logged in');

        console.log('[PaymentService] Initiating checkout for:', priceId);

        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    priceId,
                    successUrl: window.location.origin,
                    cancelUrl: window.location.origin,
                })
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('[PaymentService] Server returned non-JSON response:', text);
                throw new Error(`Server Error: ${text.substring(0, 100) || 'Unknown server error'}`);
            }

            if (!response.ok) {
                console.error('[PaymentService] Checkout Failed:', result);
                throw new Error(result.error || result.message || `Checkout Failed: ${response.status} ${response.statusText}`);
            }

            if (!result.url) {
                throw new Error('Server successfully processed request but did not return a checkout URL');
            }

            return result.url;
        } catch (err: any) {
            console.error('[PaymentService] Request Error:', err);
            throw err;
        }
    },

    async createPortalSession(): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not logged in');

        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to create portal session');
            return result.url;
        } catch (err: any) {
            console.error('[PaymentService] Portal Error:', err);
            throw err;
        }
    }
};
