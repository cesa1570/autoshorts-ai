import React, { useState, useEffect, useRef } from 'react';
import { ImagePlus, X, Move, Maximize, Trash2 } from 'lucide-react';
import { useToast } from './ToastContext';

interface WatermarkSettingsProps {
    onWatermarkChange: (settings: WatermarkConfig | null) => void;
}

export interface WatermarkConfig {
    imageUrl: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    size: number; // 0-100 percent
    opacity: number; // 0-100 percent
}

const POSITIONS = [
    { id: 'top-left', name: 'บนซ้าย', class: 'top-2 left-2' },
    { id: 'top-right', name: 'บนขวา', class: 'top-2 right-2' },
    { id: 'bottom-left', name: 'ล่างซ้าย', class: 'bottom-2 left-2' },
    { id: 'bottom-right', name: 'ล่างขวา', class: 'bottom-2 right-2' },
    { id: 'center', name: 'กลาง', class: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
];

const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({ onWatermarkChange }) => {
    const { addToast } = useToast();
    const [enabled, setEnabled] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [position, setPosition] = useState<WatermarkConfig['position']>('bottom-right');
    const [size, setSize] = useState(15);
    const [opacity, setOpacity] = useState(70);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load saved settings
    useEffect(() => {
        const saved = localStorage.getItem('watermark_settings');
        if (saved) {
            const config = JSON.parse(saved);
            setEnabled(true);
            setImageUrl(config.imageUrl || '');
            setPosition(config.position || 'bottom-right');
            setSize(config.size || 15);
            setOpacity(config.opacity || 70);
        }
    }, []);

    // Update parent when settings change
    useEffect(() => {
        if (enabled && imageUrl) {
            const config: WatermarkConfig = { imageUrl, position, size, opacity };
            onWatermarkChange(config);
            localStorage.setItem('watermark_settings', JSON.stringify(config));
        } else {
            onWatermarkChange(null);
        }
    }, [enabled, imageUrl, position, size, opacity]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageUrl(event.target?.result as string);
                setEnabled(true);
                addToast('success', 'Logo uploaded!');
            };
            reader.readAsDataURL(file);
        }
    };

    const removeWatermark = () => {
        setEnabled(false);
        setImageUrl('');
        localStorage.removeItem('watermark_settings');
        onWatermarkChange(null);
        addToast('info', 'Watermark removed');
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <ImagePlus size={16} className="text-purple-400" />
                    Watermark / Logo
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="w-4 h-4 accent-purple-600"
                    />
                    <span className="text-xs text-slate-400">เปิดใช้งาน</span>
                </label>
            </div>

            {enabled && (
                <div className="space-y-3">
                    {/* Upload Button */}
                    {!imageUrl ? (
                        <label className="block cursor-pointer">
                            <div className="border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-lg p-4 text-center transition">
                                <ImagePlus size={24} className="mx-auto text-slate-500 mb-2" />
                                <span className="text-sm text-slate-400">คลิกเพื่ออัพโหลด Logo</span>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    ) : (
                        <div className="relative">
                            <img src={imageUrl} alt="Watermark" className="w-20 h-20 object-contain bg-slate-900 rounded-lg" />
                            <button
                                onClick={removeWatermark}
                                className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-500"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {imageUrl && (
                        <>
                            {/* Position */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                                    <Move size={12} /> ตำแหน่ง
                                </label>
                                <div className="grid grid-cols-5 gap-1">
                                    {POSITIONS.map(pos => (
                                        <button
                                            key={pos.id}
                                            onClick={() => setPosition(pos.id as any)}
                                            className={`text-xs py-1 px-2 rounded transition ${position === pos.id
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                                                }`}
                                        >
                                            {pos.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                                    <Maximize size={12} /> ขนาด: {size}%
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    value={size}
                                    onChange={(e) => setSize(parseInt(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            {/* Opacity */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">ความโปร่งใส: {opacity}%</label>
                                <input
                                    type="range"
                                    min="20"
                                    max="100"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseInt(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default WatermarkSettings;
