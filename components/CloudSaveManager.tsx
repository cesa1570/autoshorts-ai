
import React, { useState, useEffect } from 'react';
import { Cloud, Save, Download, Loader2, Database, Trash2, CheckCircle2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { supabase, isSupabaseConfigured, saveProjectToCloud, getMyProjects, CloudProject } from '../services/supabaseService';
import { ProjectData } from '../types';

interface CloudSaveManagerProps {
    currentProject: ProjectData | null;
    onLoadProject: (project: ProjectData) => void;
}

const CloudSaveManager: React.FC<CloudSaveManagerProps> = ({ currentProject, onLoadProject }) => {
    const { user } = useUser();
    const [projects, setProjects] = useState<CloudProject[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isConfigured = isSupabaseConfigured();

    useEffect(() => {
        if (user && isConfigured) {
            loadProjects();
        }
    }, [user, isConfigured]);

    const loadProjects = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await getMyProjects(user.id);
            setProjects(data);
        } catch (err) {
            console.error("Failed to load projects", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !currentProject) return;
        setIsSaving(true);
        try {
            await saveProjectToCloud(user.id, currentProject);
            await loadProjects(); // Refresh list
        } catch (err) {
            alert("Failed to save to cloud: " + err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isConfigured) {
        return (
            <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 text-amber-500 text-xs font-bold text-center">
                <Database size={16} className="inline mb-1 mr-1" />
                Supabase Missing. Configure keys to enable Cloud Save.
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Cloud size={16} className="text-blue-400" /> Cloud Projects
                </h3>
                {currentProject && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save current
                    </button>
                )}
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : projects.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center italic py-4">No cloud saves found.</p>
                ) : (
                    projects.map((p) => (
                        <div key={p.id} className="group flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-600 transition-all">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white truncate max-w-[150px]">{p.name || "Untitled"}</span>
                                <span className="text-[9px] text-slate-500">{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                            <button
                                onClick={() => onLoadProject(p.data)}
                                className="p-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 rounded-lg transition-colors"
                                title="Load Project"
                            >
                                <Download size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CloudSaveManager;
