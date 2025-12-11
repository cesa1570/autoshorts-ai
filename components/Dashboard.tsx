import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Video, Eye, FolderOpen, Plus, Trash2, Clock, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { getProjectStats, getRecentProjects, deleteProject } from '../services/storageService';
import { SavedProject, ProjectStats } from '../types';

interface DashboardProps {
   onLoadProject?: (project: SavedProject) => void;
   onCreateNew?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLoadProject, onCreateNew }) => {
   const [stats, setStats] = useState<ProjectStats>({ totalProjects: 0, completedProjects: 0, uploadedProjects: 0 });
   const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);
   const [loading, setLoading] = useState(true);

   const loadData = () => {
      setStats(getProjectStats());
      setRecentProjects(getRecentProjects(10));
      setLoading(false);
   };

   useEffect(() => {
      loadData();
   }, []);

   const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Delete this project?')) {
         deleteProject(id);
         loadData();
      }
   };

   const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
   };

   const getStatusBadge = (status: string) => {
      switch (status) {
         case 'uploaded':
            return <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs flex items-center gap-1"><Upload size={10} /> Uploaded</span>;
         case 'completed':
            return <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs flex items-center gap-1"><CheckCircle size={10} /> Completed</span>;
         default:
            return <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs flex items-center gap-1"><Clock size={10} /> Draft</span>;
      }
   };

   const statCards = [
      { label: "Total Projects", value: stats.totalProjects.toString(), icon: <FolderOpen size={20} />, color: "text-blue-400", bg: "bg-blue-400/10" },
      { label: "Completed", value: stats.completedProjects.toString(), icon: <CheckCircle size={20} />, color: "text-green-400", bg: "bg-green-400/10" },
      { label: "Uploaded", value: stats.uploadedProjects.toString(), icon: <Upload size={20} />, color: "text-purple-400", bg: "bg-purple-400/10" },
      { label: "Success Rate", value: stats.totalProjects > 0 ? `${Math.round((stats.completedProjects / stats.totalProjects) * 100)}%` : '0%', icon: <TrendingUp size={20} />, color: "text-orange-400", bg: "bg-orange-400/10" },
   ];

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Stats Grid */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, idx) => (
               <div key={idx} className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-2 hover:border-slate-600 transition">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color} mb-2`}>
                     {stat.icon}
                  </div>
                  <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
               </div>
            ))}
         </div>

         {/* Recent Projects */}
         <div className="bg-slate-800 border border-slate-700 rounded-xl">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
               <h3 className="text-lg font-bold text-white">Recent Projects</h3>
               {onCreateNew && (
                  <button
                     onClick={onCreateNew}
                     className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
                  >
                     <Plus size={16} /> New Project
                  </button>
               )}
            </div>

            {recentProjects.length === 0 ? (
               <div className="p-12 text-center">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No projects yet</p>
                  <p className="text-slate-500 text-sm">Create your first video project to get started!</p>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                     <thead>
                        <tr className="border-b border-slate-700 text-slate-200">
                           <th className="py-3 px-4">Project</th>
                           <th className="py-3 px-4 hidden md:table-cell">Topic</th>
                           <th className="py-3 px-4 hidden sm:table-cell">Status</th>
                           <th className="py-3 px-4 hidden lg:table-cell">Updated</th>
                           <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody>
                        {recentProjects.map((project) => (
                           <tr
                              key={project.id}
                              className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition"
                              onClick={() => onLoadProject?.(project)}
                           >
                              <td className="py-3 px-4">
                                 <div>
                                    <p className="font-medium text-white truncate max-w-[200px]">{project.name}</p>
                                    <p className="text-xs text-slate-500">{project.mode}</p>
                                 </div>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell">
                                 <p className="truncate max-w-[200px]">{project.topic}</p>
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                 {getStatusBadge(project.status)}
                              </td>
                              <td className="py-3 px-4 hidden lg:table-cell text-slate-500">
                                 {formatDate(project.updatedAt)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                 <button
                                    onClick={(e) => handleDelete(project.id, e)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>

         {/* Quick Tips */}
         <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">💡 Quick Tips</h3>
            <ul className="space-y-2 text-sm text-slate-300">
               <li>• Use <span className="text-purple-400">Trending News</span> to find viral topics</li>
               <li>• Save projects to continue editing later</li>
               <li>• Connect YouTube to upload directly from the app</li>
               <li>• Generate multiple videos per topic for better reach</li>
            </ul>
         </div>
      </div>
   );
};

export default Dashboard;