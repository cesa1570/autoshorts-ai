/**
 * YouTube OAuth Service
 * 
 * This service handles Google OAuth authentication for YouTube API access.
 * Configure GOOGLE_CLIENT_ID to enable real OAuth flow.
 */

// Configuration - Replace with your actual Google Client ID
// Get one at: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = localStorage.getItem('google_client_id') || '';

const TOKEN_KEY = 'youtube_access_token';
const TOKEN_EXPIRY_KEY = 'youtube_token_expiry';
const USER_INFO_KEY = 'youtube_user_info';

export interface YouTubeUser {
    name: string;
    email: string;
    picture: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: YouTubeUser | null;
    accessToken: string | null;
}

// Check if OAuth is configured
export const isOAuthConfigured = (): boolean => {
    return !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 10;
};

// Get current auth state
export const getAuthState = (): AuthState => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const userInfo = localStorage.getItem(USER_INFO_KEY);

    // Check if token is expired
    if (token && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() > expiryTime) {
            // Token expired, clear it
            signOut();
            return { isAuthenticated: false, user: null, accessToken: null };
        }
    }

    const user = userInfo ? JSON.parse(userInfo) as YouTubeUser : null;

    return {
        isAuthenticated: !!token,
        user,
        accessToken: token
    };
};

// Get access token
export const getAccessToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

// Save Client ID for OAuth
export const setGoogleClientId = (clientId: string): void => {
    localStorage.setItem('google_client_id', clientId);
    // Reload to reinitialize
    window.location.reload();
};

// Initialize Google Identity Services
export const initializeGoogleAuth = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!isOAuthConfigured()) {
            console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID to enable.');
            resolve();
            return;
        }

        // Check if script already loaded
        if ((window as any).google?.accounts) {
            resolve();
            return;
        }

        // The script should be loaded from index.html
        // Just wait for it to be ready
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if ((window as any).google?.accounts) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts > 50) { // 5 seconds timeout
                clearInterval(checkInterval);
                reject(new Error('Google Identity Services failed to load'));
            }
        }, 100);
    });
};

// Sign in with Google
export const signIn = (): Promise<AuthState> => {
    return new Promise((resolve, reject) => {
        if (!isOAuthConfigured()) {
            reject(new Error('YouTube OAuth is not configured. Please add your Google Client ID in Settings.'));
            return;
        }

        const google = (window as any).google;
        if (!google?.accounts?.oauth2) {
            reject(new Error('Google Identity Services not loaded'));
            return;
        }

        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: async (response: any) => {
                if (response.error) {
                    reject(new Error(response.error_description || 'OAuth failed'));
                    return;
                }

                const accessToken = response.access_token;
                const expiresIn = response.expires_in || 3600; // Default 1 hour
                const expiryTime = Date.now() + (expiresIn * 1000);

                // Store token
                localStorage.setItem(TOKEN_KEY, accessToken);
                localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

                // Fetch user info
                try {
                    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    const userInfo = await userResponse.json();

                    const user: YouTubeUser = {
                        name: userInfo.name || 'YouTube User',
                        email: userInfo.email || '',
                        picture: userInfo.picture || ''
                    };

                    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));

                    resolve({ isAuthenticated: true, user, accessToken });
                } catch (e) {
                    // Still authenticated even if user info fails
                    resolve({ isAuthenticated: true, user: null, accessToken });
                }
            },
        });

        // Request token
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

// Sign out
export const signOut = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_INFO_KEY);

    // Revoke token if Google SDK is available
    const google = (window as any).google;
    const token = localStorage.getItem(TOKEN_KEY);
    if (google?.accounts?.oauth2?.revoke && token) {
        google.accounts.oauth2.revoke(token, () => { });
    }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return getAuthState().isAuthenticated;
};
