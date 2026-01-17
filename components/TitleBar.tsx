import React from 'react';
import { Minus, Square, X } from 'lucide-react';


const TitleBar: React.FC = () => {
    // Only render if running in Electron
    if (!window.electron) return null;

    return (
        <div className="h-[30px] bg-[#0a0a0a] flex justify-between items-center select-none fixed top-0 left-0 right-0 z-[9999] border-b border-white/5" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C5A059]"></div>
                LazyAutoCreator <span className="opacity-50">Desktop</span>
            </div>

            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={() => window.electron?.window.minimize()}
                    className="h-full px-4 hover:bg-white/5 text-neutral-400 hover:text-white transition-colors flex items-center justify-center"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={() => window.electron?.window.maximize()}
                    className="h-full px-4 hover:bg-white/5 text-neutral-400 hover:text-white transition-colors flex items-center justify-center"
                >
                    <Square size={12} />
                </button>
                <button
                    onClick={() => window.electron?.window.close()}
                    className="h-full px-4 hover:bg-red-500 text-neutral-400 hover:text-white transition-colors flex items-center justify-center"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
