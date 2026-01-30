import React, { useEffect, useState } from 'react';
import {
  Video, Smartphone, Mic, Plus, Search, Grid, Filter, Clock, Trash2, Play, Eye
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { DraftService } from '../services/draftService';
import { Draft } from '../types';
import CreateProjectModal from './CreateProjectModal';

interface HubProps {
  onNavigate: (tab: 'create' | 'long' | 'podcast') => void;
  onResume: (draft: Draft) => void;
}

type FilterType = 'all' | 'shorts' | 'long' | 'podcast';

const Hub: React.FC<HubProps> = ({ onNavigate, onResume }) => {
  const { userId } = useApp();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(DraftService.getAll(userId));
  }, [userId]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    DraftService.delete(id);
    setDrafts(DraftService.getAll(userId));
  };

  const getPreviewImage = (draft: Draft) => {
    if (draft.previewImageUrl) return draft.previewImageUrl;
    if (draft.type === 'podcast') {
      const scenes = draft.data.scenes || [];
      if (scenes.length > 0 && scenes[0].imageUrl) return scenes[0].imageUrl;
    } else {
      const scenes = draft.data.script?.scenes || [];
      const validScene = scenes.find((s: any) => s.imageUrl || s.videoUrl);
      if (validScene) return validScene.imageUrl || validScene.videoUrl;
    }
    return null;
  };

  const handleCreate = (type: 'shorts' | 'long' | 'podcast', topic: string, language: 'Thai' | 'English') => {
    // Navigate to the appropriate creator
    if (type === 'shorts') onNavigate('create');
    else if (type === 'long') onNavigate('long');
    else if (type === 'podcast') onNavigate('podcast');
    // TODO: Pass topic and language to the creator
  };

  // Filter and search logic
  const filteredDrafts = drafts.filter(draft => {
    const matchesFilter = filter === 'all' || draft.type === filter;
    const matchesSearch = searchQuery === '' ||
      (draft.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (draft.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const filterOptions: { id: FilterType; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All', icon: Grid },
    { id: 'shorts', label: 'Shorts', icon: Smartphone },
    { id: 'long', label: 'Cinema', icon: Video },
    { id: 'podcast', label: 'Podcast', icon: Mic },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shorts': return Smartphone;
      case 'long': return Video;
      case 'podcast': return Mic;
      default: return Video;
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'shorts': return 'from-pink-500 to-rose-600';
      case 'long': return 'from-blue-500 to-indigo-600';
      case 'podcast': return 'from-emerald-500 to-teal-600';
      default: return 'from-neutral-500 to-neutral-600';
    }
  };

  return (
    <div className="min-h-[80vh] bg-transparent text-white font-kanit">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              Gallery<span className="text-[#C5A059]">.</span>
            </h1>
            <p className="text-sm text-neutral-500 font-medium uppercase tracking-[0.3em]">
              Your Creative Projects
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-3 bg-[#C5A059] text-black px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#d4af37] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(197,160,89,0.3)]"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="hidden md:inline">New Project</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-[#0A0A0A] rounded-2xl border border-white/5">
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${filter === option.id
                    ? 'bg-[#C5A059] text-black'
                    : 'bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10'
                  }`}
              >
                <option.icon size={14} />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredDrafts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDrafts.map((draft, index) => {
              const previewImg = getPreviewImage(draft);
              const TypeIcon = getTypeIcon(draft.type);
              const isHovered = hoveredId === draft.id;

              // Varying heights for masonry effect
              const heights = ['h-64', 'h-80', 'h-72', 'h-96'];
              const height = heights[index % heights.length];

              return (
                <div
                  key={draft.id}
                  onClick={() => onResume(draft)}
                  onMouseEnter={() => setHoveredId(draft.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative ${height} rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(197,160,89,0.15)]`}
                >
                  {/* Background Image */}
                  {previewImg ? (
                    <img
                      src={previewImg}
                      alt={draft.title || 'Project'}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(draft.type)} opacity-30`} />
                  )}

                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-90' : 'opacity-60'}`} />

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeGradient(draft.type)} flex items-center justify-center shadow-lg`}>
                      <TypeIcon size={20} className="text-white" />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, draft.id)}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 text-neutral-400 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        <Clock size={10} />
                        <span>{new Date(draft.lastModified).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-[#C5A059] transition-colors">
                        {draft.title || 'Untitled Project'}
                      </h3>
                      {draft.subtitle && (
                        <p className="text-neutral-400 text-xs line-clamp-1">
                          {draft.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className={`flex items-center gap-3 mt-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <button className="flex-1 flex items-center justify-center gap-2 bg-[#C5A059] text-black py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#d4af37] transition-colors">
                        <Play size={14} fill="currentColor" /> Open
                      </button>
                      <button className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors">
                        <Eye size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Grid size={40} className="text-neutral-700" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              {filter === 'all' ? 'No Projects Yet' : `No ${filter} Projects`}
            </h3>
            <p className="text-neutral-500 text-sm mb-8 max-w-md">
              {filter === 'all'
                ? 'Create your first AI-powered video project and see it appear here.'
                : `You haven't created any ${filter} projects yet. Start one now!`
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 bg-[#C5A059] text-black px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#d4af37] transition-all"
            >
              <Plus size={20} strokeWidth={3} />
              Create First Project
            </button>
          </div>
        )}

        {/* Quick Create Buttons (Mobile/Always visible) */}
        {drafts.length > 0 && (
          <div className="fixed bottom-8 right-8 z-50">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-16 h-16 rounded-full bg-[#C5A059] text-black flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:scale-110 transition-all duration-300"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default Hub;
