import { SocialPlatform } from '../types';

/**
 * COMMERCIAL CONFIGURATION
 * 
 * If you are distributing this app (Option 1 - Verified App),
 * Put your Verified Client IDs here.
 * 
 * These will be used as DEFAULTS if the user does not provide their own keys in Settings.
 */

export const OFFICIAL_APP_CONFIG: Record<string, { clientId: string, clientSecret: string }> = {
    // Google / YouTube (Desktop Client Type recommended for distributed apps)
    youtube: {
        clientId: '1041477740550-r38o16c9sgjpq4lgv84pt8ppnptq28r9.apps.googleusercontent.com', // Replace with your verified ID
        clientSecret: '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'  // Only if using Web App type
    },
    // Facebook / Instagram
    facebook: {
        clientId: 'YOUR_VERIFIED_FB_APP_ID',
        clientSecret: 'YOUR_VERIFIED_FB_APP_SECRET'
    },
    // TikTok
    tiktok: {
        clientId: 'awottvc4n6qhhhoy',
        clientSecret: 'pB7Nz1Abs4hCVCZUli9GR3SWcBxJhLrI'
    }
};
