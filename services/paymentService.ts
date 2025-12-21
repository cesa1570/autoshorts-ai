
export interface PricingPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
    limit: number; // Daily generation limit
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'free',
        name: 'Starter',
        price: 0,
        currency: 'THB',
        features: ['3 AI Shorts/Day', 'Watermarked', 'Standard Voice', '480p Export'],
        limit: 3
    },
    {
        id: 'pro',
        name: 'Pro Creator',
        price: 299,
        currency: 'THB',
        features: ['Unlimited Shorts', 'No Watermark', 'Premium Voices', '1080p Export', 'Stock Media Access', 'Commercial License'],
        limit: 100
    },
    {
        id: 'studio',
        name: 'Studio Business',
        price: 990,
        currency: 'THB',
        features: ['Everything in Pro', '4K Export', 'Clone Your Voice', 'API Access', 'Priority Support', 'Team Collaboration'],
        limit: 500
    }
];

export const createCheckoutSession = async (planId: string) => {
    // Simulate Stripe Checkout
    await new Promise(r => setTimeout(r, 1500));

    if (planId === 'free') return { success: true, url: null };

    // Return fake payment URL (or handle internally)
    return {
        success: true,
        url: `https://checkout.stripe.mock/${planId}?session_id=cs_test_${Math.random().toString(36)}`
    };
};

export const checkSubscriptionStatus = async (userId: string) => {
    // Mock status
    return { plan: 'free', active: true };
};
