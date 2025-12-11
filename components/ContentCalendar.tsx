import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle, Clock, Video, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarItems, addCalendarItem, updateCalendarItem, deleteCalendarItem, CalendarItem } from '../services/storageService';
import { useToast } from './ToastContext';

interface ContentCalendarProps {
    onCreateVideo?: (topic: string) => void;
}

const ContentCalendar: React.FC<ContentCalendarProps> = ({ onCreateVideo }) => {
    const { addToast } = useToast();
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [newTopic, setNewTopic] = useState('');

    useEffect(() => {
        setItems(getCalendarItems());
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty slots for days before the first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getItemsForDate = (date: Date) => {
        const dateStr = formatDate(date);
        return items.filter(item => item.date === dateStr);
    };

    const handleAddItem = () => {
        if (!newTopic.trim() || !selectedDate) {
            addToast('warning', 'กรุณากรอกข้อมูลให้ครบ');
            return;
        }

        addCalendarItem(selectedDate, newTopic.trim());
        setItems(getCalendarItems());
        setNewTopic('');
        setShowAddModal(false);
        addToast('success', 'เพิ่มแผนเรียบร้อย');
    };

    const handleDeleteItem = (id: string) => {
        deleteCalendarItem(id);
        setItems(getCalendarItems());
    };

    const handleMarkStatus = (id: string, status: 'created' | 'published') => {
        updateCalendarItem(id, { status });
        setItems(getCalendarItems());
        addToast('success', status === 'created' ? 'สร้างวิดีโอแล้ว' : 'เผยแพร่แล้ว');
    };

    const openAddModal = (date: Date) => {
        setSelectedDate(formatDate(date));
        setShowAddModal(true);
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const today = formatDate(new Date());
    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-500';
            case 'created': return 'bg-blue-500';
            default: return 'bg-yellow-500';
        }
    };

    // Summary stats
    const plannedCount = items.filter(i => i.status === 'planned').length;
    const createdCount = items.filter(i => i.status === 'created').length;
    const publishedCount = items.filter(i => i.status === 'published').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <CalendarIcon className="text-purple-400" /> Content Calendar
                </h2>
                <p className="text-slate-400 text-sm">
                    วางแผนการสร้าง Content ล่วงหน้า - ไม่มีวันไหนตกหล่น
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{plannedCount}</p>
                    <p className="text-slate-400 text-sm">วางแผนไว้</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{createdCount}</p>
                    <p className="text-slate-400 text-sm">สร้างแล้ว</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{publishedCount}</p>
                    <p className="text-slate-400 text-sm">เผยแพร่แล้ว</p>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {/* Month Navigation */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition">
                        <ChevronLeft size={20} />
                    </button>
                    <h3 className="font-bold text-white">{monthName}</h3>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-slate-700">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            className={`min-h-24 border-b border-r border-slate-700/50 p-1 ${day && formatDate(day) === today ? 'bg-purple-500/10' : ''
                                }`}
                        >
                            {day && (
                                <>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm ${formatDate(day) === today ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                                            {day.getDate()}
                                        </span>
                                        <button
                                            onClick={() => openAddModal(day)}
                                            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-purple-400 hover:bg-purple-500/20 rounded transition"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {getItemsForDate(day).slice(0, 2).map(item => (
                                            <div
                                                key={item.id}
                                                className="group relative"
                                            >
                                                <div className={`text-xs p-1 rounded truncate ${getStatusColor(item.status)} bg-opacity-20 text-white`}>
                                                    {item.topic.slice(0, 15)}...
                                                </div>
                                                {/* Hover Actions */}
                                                <div className="absolute right-0 top-0 hidden group-hover:flex gap-1 bg-slate-900 rounded p-1 z-10">
                                                    {item.status === 'planned' && (
                                                        <button
                                                            onClick={() => handleMarkStatus(item.id, 'created')}
                                                            className="text-blue-400 hover:text-blue-300"
                                                            title="Mark as Created"
                                                        >
                                                            <Video size={12} />
                                                        </button>
                                                    )}
                                                    {item.status === 'created' && (
                                                        <button
                                                            onClick={() => handleMarkStatus(item.id, 'published')}
                                                            className="text-green-400 hover:text-green-300"
                                                            title="Mark as Published"
                                                        >
                                                            <CheckCircle size={12} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {getItemsForDate(day).length > 2 && (
                                            <div className="text-xs text-slate-500">+{getItemsForDate(day).length - 2} more</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-white">เพิ่มแผน Content</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">วันที่</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">หัวข้อ</label>
                                <input
                                    type="text"
                                    value={newTopic}
                                    onChange={(e) => setNewTopic(e.target.value)}
                                    placeholder="เช่น: 5 ความลับของพีระมิด"
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500"
                                />
                            </div>
                            <button
                                onClick={handleAddItem}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition"
                            >
                                เพิ่มแผน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentCalendar;
