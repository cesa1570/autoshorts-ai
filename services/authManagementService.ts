import { supabase } from './supabaseClient';

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    licenseTier: 'free' | 'pro' | 'enterprise';
    licenseExpiresAt: number | null;
}

export const authManagementService = {
    async getProfile(): Promise<UserProfile | null> {
        try {
            // Mock Mode Bypass - Check FIRST to override any stale session
            if (typeof window !== 'undefined' && localStorage.getItem('dev_mock_mode') === 'true') {
                return {
                    id: 'mock-user-123',
                    email: 'developer@cinema.studio',
                    full_name: 'Developer Mode',
                    licenseTier: 'enterprise',
                    licenseExpiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000)
                };
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Try to get existing profile
            let { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle(); // Use maybeSingle to avoid errors if not found

            // If no profile exists, CREATE one automatically
            if (!profile || fetchError) {
                console.log("No profile found, creating for:", user.email);
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        license_tier: 'free',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (!insertError) profile = newProfile;
                else console.error("Profile creation failed:", insertError);
            }

            return {
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || '',
                licenseTier: (profile?.license_tier?.toLowerCase() as any) || 'free',
                licenseExpiresAt: profile?.license_expires_at ? new Date(profile.license_expires_at).getTime() : null
            };
        } catch (err) {
            console.error("Critical error in getProfile:", err);
            return null;
        }
    },

    async signOut() {
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('dev_mock_mode');
    },

    isLicenseValid(profile: UserProfile | null): boolean {
        if (!profile) return false;

        // Free tier is never a 'valid' license for paid features
        if (profile.licenseTier === 'free') return false;

        // Pro or Enterprise with NULL expiration = Lifetime Access
        if ((profile.licenseTier === 'pro' || profile.licenseTier === 'enterprise') && !profile.licenseExpiresAt) {
            return true;
        }

        if (!profile.licenseExpiresAt) return false;
        return profile.licenseExpiresAt > Date.now();
    },

    async updateProfile(updates: { full_name?: string }) {
        const { error } = await supabase.auth.updateUser({
            data: { full_name: updates.full_name }
        });
        if (error) throw error;
    },

    async updatePassword(password: string) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    },

    async getSubscriberCount(): Promise<number> {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('license_tier', ['pro', 'enterprise']);

        if (error) {
            console.error('Error fetching subscriber count:', error);
            return 0;
        }
        return count || 0;
    },

    async getProUserCount(): Promise<number> {
        // Alias for getSubscriberCount - used by PricingModal for Early Bird slot counter
        return this.getSubscriberCount();
    }
};
