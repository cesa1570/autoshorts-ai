import React, { useState } from 'react';
import { Film, Play, Plus, Trash2, Upload, Download, Clock, Sparkles } from 'lucide-react';
import { useToast } from './ToastContext';

interface IntroOutroConfig {
    id: string;
    name: string;
    type: 'intro' | 'outro';
    duration: number; // seconds
    content: {
        text?: string;
        imageUrl?: string;
        style: 'fade' | 'zoom' | 'slide';
        bgColor: string;
        textColor: string;
    };
}

const DEFAULT_TEMPLATES: IntroOutroConfig[] = [
    {
        id: 'intro-1',
        name: 'Classic Fade In',
        type: 'intro',
        duration: 3,
        content: { text: 'AutoShorts AI', style: 'fade', bgColor: '#0f172a', textColor: '#a855f7' }
    },
    {
        id: 'intro-2',
        name: 'Zoom Burst',
        type: 'intro',
        duration: 2,
        content: { text: '🔥 HOT CONTENT', style: 'zoom', bgColor: '#1e1b4b', textColor: '#f97316' }
    },
    {
        id: 'outro-1',
        name: 'Subscribe CTA',
        type: 'outro',
        duration: 4,
        content: { text: 'Subscribe for more!', style: 'slide', bgColor: '#0f172a', textColor: '#22c55e' }
    },
    {
        id: 'outro-2',
        name: 'Follow Me',
        type: 'outro',
        duration: 3,
        content: { text: 'Follow @YourChannel', style: 'fade', bgColor: '#0c0a09', textColor: '#f472b6' }
    },
];

interface IntroOutroEditorProps {
    onSelect: (intro: IntroOutroConfig | null, outro: IntroOutroConfig | null) => void;
}

const IntroOutroEditor: React.FC<IntroOutroEditorProps> = ({ onSelect }) => {
    const { addToast } = useToast();
    const [templates, setTemplates] = useState<IntroOutroConfig[]>(DEFAULT_TEMPLATES);
    const [selectedIntro, setSelectedIntro] = useState<string | null>(null);
    const [selectedOutro, setSelectedOutro] = useState<string | null>(null);
    const [showCustom, setShowCustom] = useState(false);

    // Custom template form
    const [customType, setCustomType] = useState<'intro' | 'outro'>('intro');
    const [customName, setCustomName] = useState('');
    const [customText, setCustomText] = useState('');
    const [customDuration, setCustomDuration] = useState(3);
    const [customBgColor, setCustomBgColor] = useState('#0f172a');
    const [customTextColor, setCustomTextColor] = useState('#a855f7');
    const [customStyle, setCustomStyle] = useState<'fade' | 'zoom' | 'slide'>('fade');

    const handleSelect = (template: IntroOutroConfig) => {
        if (template.type === 'intro') {
            setSelectedIntro(selectedIntro === template.id ? null : template.id);
        } else {
            setSelectedOutro(selectedOutro === template.id ? null : template.id);
        }

        // Update parent
        const intro = templates.find(t => t.id === (template.type === 'intro' ? template.id : selectedIntro)) || null;
        const outro = templates.find(t => t.id === (template.type === 'outro' ? template.id : selectedOutro)) || null;
        onSelect(intro, outro);
    };

    const addCustomTemplate = () => {
        if (!customName || !customText) {
            addToast('warning', 'กรุณากรอกข้อมูลให้ครบ');
            return;
        }

        const newTemplate: IntroOutroConfig = {
            id: `custom-${Date.now()}`,
            name: customName,
            type: customType,
            duration: customDuration,
            content: {
                text: customText,
                style: customStyle,
                bgColor: customBgColor,
                textColor: customTextColor
            }
        };

        setTemplates([...templates, newTemplate]);
        setShowCustom(false);
        setCustomName('');
        setCustomText('');
        addToast('success', 'เพิ่ม template เรียบร้อย!');
    };

    const intros = templates.filter(t => t.type === 'intro');
    const outros = templates.filter(t => t.type === 'outro');

    return (
        <div className="space-y-4">
            {/* Intros */}
            <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Play size={14} /> Intro Templates
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {intros.map(template => (
                        <button
                            key={template.id}
                            onClick={() => handleSelect(template)}
                            className={`p-3 rounded-lg border text-left transition ${selectedIntro === template.id
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                                }`}
                        >
                            <div
                                className="w-full h-12 rounded mb-2 flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: template.content.bgColor, color: template.content.textColor }}
                            >
                                {template.content.text?.slice(0, 15)}
                            </div>
                            <p className="text-xs text-white">{template.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock size={10} /> {template.duration}s
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Outros */}
            <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Film size={14} /> Outro Templates
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {outros.map(template => (
                        <button
                            key={template.id}
                            onClick={() => handleSelect(template)}
                            className={`p-3 rounded-lg border text-left transition ${selectedOutro === template.id
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                                }`}
                        >
                            <div
                                className="w-full h-12 rounded mb-2 flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: template.content.bgColor, color: template.content.textColor }}
                            >
                                {template.content.text?.slice(0, 15)}
                            </div>
                            <p className="text-xs text-white">{template.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock size={10} /> {template.duration}s
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Add Custom */}
            {!showCustom ? (
                <button
                    onClick={() => setShowCustom(true)}
                    className="w-full py-2 border border-dashed border-slate-600 hover:border-purple-500 rounded-lg text-sm text-slate-400 hover:text-white transition flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> สร้าง Template ใหม่
                </button>
            ) : (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
                    <div className="flex gap-2">
                        {(['intro', 'outro'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setCustomType(type)}
                                className={`flex-1 py-2 rounded text-sm ${customType === type ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {type === 'intro' ? 'Intro' : 'Outro'}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="ชื่อ Template"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                        type="text"
                        placeholder="ข้อความที่จะแสดง"
                        value={customText}
                        onChange={e => setCustomText(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    />
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-slate-400">Duration</label>
                            <input type="number" min="1" max="10" value={customDuration} onChange={e => setCustomDuration(parseInt(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">BG Color</label>
                            <input type="color" value={customBgColor} onChange={e => setCustomBgColor(e.target.value)}
                                className="w-full h-8 rounded border-0 cursor-pointer" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Text Color</label>
                            <input type="color" value={customTextColor} onChange={e => setCustomTextColor(e.target.value)}
                                className="w-full h-8 rounded border-0 cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addCustomTemplate} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm">
                            บันทึก
                        </button>
                        <button onClick={() => setShowCustom(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded text-sm">
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntroOutroEditor;
