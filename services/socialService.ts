/**
 * Social Media Management Service
 * Handles account connections, mock auth flows, and post scheduling.
 */
import { SocialAccount, ScheduledPost, SocialPlatform } from '../types';
import { initiateLogin } from './authService';

const ACCOUNTS_KEY = 'social_accounts';
const POSTS_KEY = 'social_scheduled_posts';

// --- Account Management ---

export const getAccounts = (): SocialAccount[] => {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    } catch { return []; }
};

export const addAccount = (account: SocialAccount) => {
    const accounts = getAccounts();
    // basic dedup by platform + username
    const existing = accounts.find(a => a.platform === account.platform && a.username === account.username);
    if (existing) {
        // update existing
        Object.assign(existing, account);
    } else {
        accounts.push(account);
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const removeAccount = (accountId: string) => {
    let accounts = getAccounts();
    accounts = accounts.filter(a => a.id !== accountId);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

/**
 * MOCK Auth Method - In Phase 4.1 we simulate the connection flow
 */
export const connectSocialAccount = async (platform: SocialPlatform): Promise<void> => {
    // Initiate Real OAuth Flow
    initiateLogin(platform);
    return Promise.resolve();
};

export const addManualAccount = (platform: SocialPlatform, username: string): SocialAccount => {
    const newAccount: SocialAccount = {
        id: `${platform}-${Date.now()}`,
        platform,
        username,
        connectedAt: Date.now(),
        status: 'active',
        connectionMode: 'manual',
        tokenSummary: 'Mobile Handoff Only'
    };
    addAccount(newAccount);
    return newAccount;
};

export const uploadVideoToYoutube = async (accountId: string, videoBlob: Blob, metadata: { title: string, description: string, tags?: string[] }) => {
    const accounts = getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account || !account.accessToken) throw new Error("Account not found or not authenticated");

    const meta = {
        snippet: {
            title: metadata.title.substring(0, 100),
            description: metadata.description,
            tags: metadata.tags || [],
            categoryId: "22" // People & Blogs default
        },
        status: {
            privacyStatus: "private" // Default safe
        }
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    formData.append('file', videoBlob);

    const res = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.accessToken}`
        },
        body: formData
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Upload Failed");
    }

    return await res.json();
};



export const uploadVideoToTikTok = async (accountId: string, videoBlob: Blob, metadata: { title: string, privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' }) => {
    const accounts = getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account || !account.accessToken) throw new Error("Account not found");

    // 1. Initialize Upload
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            post_info: {
                title: metadata.title,
                privacy_level: metadata.privacy || 'PUBLIC',
                disable_duet: false,
                disable_comment: false,
                disable_stitch: false,
                video_cover_timestamp_ms: 1000
            },
            source_info: {
                source: 'FILE_UPLOAD',
                video_size: videoBlob.size,
                chunk_size: videoBlob.size,
                total_chunk_count: 1
            }
        })
    });

    if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error?.message || "TikTok Init Failed");
    }

    const initData = await initRes.json();
    const uploadUrl = initData.data.upload_url;

    // 2. Upload Video File (PUT)
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': videoBlob.size.toString()
        },
        body: videoBlob
    });

    if (!uploadRes.ok) throw new Error("TikTok Video Upload Failed during transfer");

    return { success: true, publishId: initData.data.publish_id };
};

// --- Scheduling Management ---

export const getScheduledPosts = (): ScheduledPost[] => {
    if (typeof window === 'undefined') return [];
    try {
        const posts = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
        return posts.sort((a: ScheduledPost, b: ScheduledPost) => a.scheduledTime - b.scheduledTime);
    } catch { return []; }
};

export const schedulePost = (post: ScheduledPost) => {
    const posts = getScheduledPosts();
    posts.push(post);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const deleteScheduledPost = (postId: string) => {
    let posts = getScheduledPosts();
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const updatePostStatus = (postId: string, status: ScheduledPost['status']) => {
    const posts = getScheduledPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.status = status;
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    }
};
