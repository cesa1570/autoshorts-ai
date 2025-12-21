
import { createClient } from '@supabase/supabase-js';
import { ProjectData } from '../types';

const connectionString = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (connectionString && anonKey)
    ? createClient(connectionString, anonKey)
    : null;

export const isSupabaseConfigured = () => !!supabase;

export interface CloudProject {
    id: string;
    user_id: string;
    name: string;
    data: ProjectData;
    created_at: string;
}

export const saveProjectToCloud = async (userId: string, project: ProjectData) => {
    if (!supabase) throw new Error("Supabase is not configured");

    const { data, error } = await supabase
        .from('projects')
        .upsert({
            user_id: userId,
            name: project.topic,
            data: project,
            updated_at: new Date()
        }, { onConflict: 'user_id, name' }) // For simplicity, unique by name per user? Or just insert.
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getMyProjects = async (userId: string) => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CloudProject[];
};
