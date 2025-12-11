import React, { useState, useEffect } from 'react';
import { TrendingUp, FolderOpen, Plus, Trash2, Clock, CheckCircle, Upload, Loader2, Calendar, Target, Flame, BarChart3 } from 'lucide-react';
import { getProjectStats, getRecentProjects, deleteProject } from '../services/storageService';
import { SavedProject } from '../types';

interface DashboardProps {
   onLoadProject?: (project: SavedProject) => void;
   onCreateNew?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLoadProject, onCreateNew }) => {
   const [stats, setStats] = useState<any>({ totalProjects: 0, completedProjects: 0, uploadedProjects: 0, videosThisWeek: 0, videosThisMonth: 0, topTopics: [] });
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

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Main Stats Grid */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
               <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-400/10 text-blue-400 mb-2">
                  <FolderOpen size={20} />
               </div>
               <p className="text-slate-400 text-sm font-medium">Total Videos</p>
               <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
               <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-400/10 text-green-400 mb-2">
                  <Upload size={20} />
               </div>
               <p className="text-slate-400 text-sm font-medium">Uploaded</p>
               <p className="text-2xl font-bold text-white">{stats.uploadedProjects}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
               <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-400/10 text-purple-400 mb-2">
                  <Calendar size={20} />
               </div>
               <p className="text-slate-400 text-sm font-medium">This Week</p>
               <p className="text-2xl font-bold text-white">{stats.videosThisWeek}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
               <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-400/10 text-orange-400 mb-2">
                  <BarChart3 size={20} />
               </div>
               <p className="text-slate-400 text-sm font-medium">This Month</p>
               <p className="text-2xl font-bold text-white">{stats.videosThisMonth}</p>
            </div>
         </div>

         {/* Productivity & Top Topics Row */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productivity Goals */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="text-purple-400" size={20} /> Productivity Goals
               </h3>
               <div className="space-y-4">
                  <div>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Weekly Goal (7 videos)</span>
                        <span className="text-white font-medium">{stats.videosThisWeek}/7</span>
                     </div>
                     <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                           className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                           style={{ width: `${Math.min((stats.videosThisWeek / 7) * 100, 100)}%` }}
                        ></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Monthly Goal (30 videos)</span>
                        <span className="text-white font-medium">{stats.videosThisMonth}/30</span>
                     </div>
                     <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                           className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                           style={{ width: `${Math.min((stats.videosThisMonth / 30) * 100, 100)}%` }}
                        ></div>
                     </div>
                  </div>
                  <div className="pt-2 border-t border-slate-700">
                     <p className="text-xs text-slate-500">
                        {stats.videosThisWeek >= 7 ? '🎉 Weekly goal achieved!' : `${7 - stats.videosThisWeek} more videos to reach weekly goal`}
                     </p>
                  </div>
               </div>
            </div>

            {/* Top Topics */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Flame className="text-orange-400" size={20} /> Popular Topics
               </h3>
               {stats.topTopics?.length > 0 ? (
                  <div className="space-y-2">
                     {stats.topTopics.map((topic: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                           <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                           </span>
                           <span className="text-slate-300 text-sm truncate flex-1">{topic}</span>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-slate-500 text-sm">Create more videos to see your top topics!</p>
               )}
            </div>
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
            <h3 className="text-lg font-bold text-white mb-3">💡 Passive Income Tips</h3>
            <ul className="space-y-2 text-sm text-slate-300">
               <li>• สร้างวิดีโอ <span className="text-purple-400">7 ตัว/สัปดาห์</span> เพื่อเติบโตอย่างต่อเนื่อง</li>
               <li>• ใช้ <span className="text-purple-400">Trending News</span> หาหัวข้อ viral</li>
               <li>• อัพโหลดช่วง <span className="text-purple-400">18:00-21:00</span> เพื่อ engagement สูงสุด</li>
               <li>• สร้าง Content หลายๆ niche เพื่อกระจายความเสี่ยง</li>
            </ul>
         </div>
      </div>
   );
};

export default Dashboard;