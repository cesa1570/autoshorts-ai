import { SocialAccount, SocialPlatform } from '../types';
import { addAccount } from './socialService';
import { OFFICIAL_APP_CONFIG } from '../config/socialConfig';

const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:5173/auth/callback';

export const getAuthConfig = (platform: SocialPlatform) => {
    // 1. Try Custom User Config (BYOK)
    try {
        const stored = localStorage.getItem('social_app_config');
        if (stored) {
            const config = JSON.parse(stored)[platform];
            // Fallback: If IG config is empty, try using Facebook config (common use case)
            if (platform === 'instagram' && (!config || !config.clientId)) {
                const fbConfig = JSON.parse(stored)['facebook'];
                if (fbConfig && fbConfig.clientId) return fbConfig;
            }
            if (config && config.clientId) return config;
        }
    } catch { }

    // 2. Fallback to Official App Config (Commercial Mode)
    // Map 'instagram' -> 'facebook' keys if needed
    if (platform === 'instagram') return OFFICIAL_APP_CONFIG['facebook'];

    return OFFICIAL_APP_CONFIG[platform] || null;
};

export const initiateLogin = (platform: SocialPlatform) => {
    const config = getAuthConfig(platform);
    if (!config) {
        alert(`Please configure ${platform} API Keys in settings first.`);
        return;
    }

    let authUrl = '';
    const state = btoa(JSON.stringify({ platform, nonce: Date.now() }));

    switch (platform) {
        case 'youtube':
            authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload+https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/youtube.readonly&access_type=offline&prompt=consent&state=${state}`;
            break;
        case 'facebook':
            authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=public_profile,pages_show_list,pages_manage_posts,pages_read_engagement`;
            break;
        case 'instagram':
            // Instagram Business uses Facebook Login with extra scopes
            authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=instagram_basic,instagram_content_publish,pages_show_list`;
            break;
        case 'tiktok':
            authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${config.clientId}&response_type=code&scope=user.info.basic,video.upload&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
            break;
    }

    if (authUrl) {
        console.log("Checking Electron Auth availability:", (window as any).electron);

        // Use Electron Native Auth Window if available (Prevents opening external browser)
        if ((window as any).electron?.auth?.startAuthFlow) {
            console.log("Starting Native Auth Flow...");
            // UX Fix: Inform user about Passkey fallback
            alert("🔑 หากมีหน้าต่าง 'Windows Security' หรือ 'Passkey' เด้งขึ้นมา\n\nให้กด 'ยกเลิก (Cancel)' ได้เลยครับ แล้วระบบจะให้ใส่รหัสผ่านตามปกติ");

            (window as any).electron.auth.startAuthFlow(authUrl).then(async (result: any) => {
                if (result.success && result.code) {
                    // Start Token Exchange immediately
                    const success = await handleAuthCallback(result.code, state);
                    if (success) {
                        window.location.reload(); // Refresh to show new account
                    }
                } else {
                    console.log("Auth Canceled/Failed:", result.error);
                }
            });
            return;
        }

        // Web Fallback (External Browser Popup)
        const width = 600;
        const height = 700;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        window.open(authUrl, `Connect ${platform}`, `width=${width},height=${height},top=${top},left=${left}`);
    }
};

/**
 * Handles the OAuth Callback manually (for Web Mode or Manual redirects)
 */
export const handleAuthCallback = async (code: string, state: string): Promise<boolean> => {
    try {
        const decodedState = JSON.parse(atob(state));
        const platform = decodedState.platform as SocialPlatform;
        const config = getAuthConfig(platform);

        if (!config) throw new Error('Missing Config');

        let accessToken = '';
        let refreshToken = '';
        let userInfo = { name: '', avatar: '', id: '' };
        let channelStats = {};

        // Exchange Code
        if (platform === 'youtube') {
            const tokenParams = new URLSearchParams({
                code,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            });

            let tokenData;

            // 1. Try Electron Native (Best for CORS)
            if ((window as any).electron?.exchangeToken) {
                const res = await (window as any).electron.exchangeToken({
                    url: 'https://oauth2.googleapis.com/token',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: tokenParams.toString()
                });
                if (!res.ok) throw new Error(res.data?.error_description || res.error || 'Native Token Exchange Failed');
                tokenData = res.data;
            }
            // 2. Fallback to Proxy (Dev Mode Web)
            else {
                const tokenRes = await fetch('/api/google-auth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: tokenParams
                });
                tokenData = await tokenRes.json();
                if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token Exchange Failed');
            }

            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token;

            // Get Profile & Stats
            const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userData = await userRes.json();
            userInfo = { name: userData.name, avatar: userData.picture, id: userData.id };

            // Fetch YouTube Channel Stats (Subscribers, Views)
            try {
                console.log("Fetching YouTube Stats...");
                const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const channelData = await channelRes.json();
                console.log("YouTube Stats API Response:", channelData);

                if (channelData.items && channelData.items.length > 0) {
                    channelStats = channelData.items[0].statistics;
                    console.log("Stats found:", channelStats);
                } else {
                    console.warn("No channel items found in response");
                }
            } catch (e) { console.error("Failed to fetch channel stats", e); }

        } else if (platform === 'facebook' || platform === 'instagram') {
            const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${config.clientSecret}&code=${code}`);
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(tokenData.error?.message || 'Token Exchange Failed');

            accessToken = tokenData.access_token;

            // Get Basic User Info
            const meRes = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`);
            const meData = await meRes.json();
            userInfo = { name: meData.name, avatar: meData.picture?.data?.url, id: meData.id };

            // For Instagram, we try to find the linked Business Account immediately or store the User Token
            if (platform === 'instagram') {
                // Find connected IG Page
                const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`);
                const pagesData = await pagesRes.json();
                const igPage = pagesData.data?.find((p: any) => p.instagram_business_account);

                if (igPage && igPage.instagram_business_account) {
                    userInfo.id = igPage.instagram_business_account.id;
                    userInfo.name = igPage.instagram_business_account.username || userInfo.name;
                    userInfo.avatar = igPage.instagram_business_account.profile_picture_url || userInfo.avatar;
                } else {
                    // No IG Business found?
                    alert("Warning: No Instagram Business Account found linked to your Facebook Pages. Connected as basic Facebook user.");
                }
            }

        } else if (platform === 'tiktok') {
            // TikTok requires server-to-server often, but let's try direct
            const params = new URLSearchParams({
                client_key: config.clientId,
                client_secret: config.clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            });
            // TikTok Token Exchange (Native / Proxy)
            let tokenData;

            // 1. Try Electron Native
            if ((window as any).electron?.exchangeToken) {
                const res = await (window as any).electron.exchangeToken({
                    url: 'https://open.tiktokapis.com/v2/oauth/token/',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });
                if (!res.ok) throw new Error(res.data?.error_description || res.error || 'TikTok Token Exchange Failed (Native)');
                tokenData = res.data;
            } else {
                // 2. Fallback (Direct Fetch - Likely to fail CORS without proxy)
                const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params
                });
                tokenData = await tokenRes.json();
                if (!tokenRes.ok) throw new Error(tokenData.message || 'TikTok Token Exchange Failed');
            }

            accessToken = tokenData.access_token; // TikTok v2 response structure uses 'access_token' directly inside root or data? 
            // API V2 response: { data: { access_token: "...", refresh_token: "..." }, error_code: 0 }
            // Let's adjust parsing below

            if (tokenData.data) {
                accessToken = tokenData.data.access_token;
                refreshToken = tokenData.data.refresh_token;
            } else if (tokenData.access_token) {
                accessToken = tokenData.access_token;
                refreshToken = tokenData.refresh_token;
            }

            // Basic Info
            const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=avatar_url,display_name', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userData = await userRes.json();
            userInfo = { name: userData.data.user.display_name, avatar: userData.data.user.avatar_url, id: 'tiktok_user' };
        }

        // Save Account
        addAccount({
            id: `${platform}-${userInfo.id}`,
            platform,
            username: userInfo.name,
            avatarUrl: userInfo.avatar,
            connectedAt: Date.now(),
            status: 'active',
            tokenSummary: `Valid`,
            // In a real app we would encrypt these. For BYOK local app, we store raw.
            accessToken,
            refreshToken,
            stats: (channelStats as any) // Store stats if fetched
        });

        return true;

    } catch (error: any) {
        console.error("Auth Error Details:", error);

        // Detailed Alert
        const isElectron = !!(window as any).electron;
        const mode = isElectron ? 'Electron Native' : 'Web Proxy';

        alert(`Authentication Failed (${mode}):\n${error.message}\n\nCheck Console (F12) for more details.`);
        return false;
    }
};
