import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface CustomDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, placeholder = "Select...", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const selectedOption = options.find(opt => opt.value === value);

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Also check if click is on the portal dropdown
                const portal = document.getElementById('dropdown-portal');
                if (portal && portal.contains(event.target as Node)) return;
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dropdownContent = isOpen && (
        <div
            id="dropdown-portal"
            className="fixed bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-white/5"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
            }}
        >
            <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar p-1 space-y-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                        className={`
                            w-full px-4 py-3 rounded-xl text-left flex items-center justify-between 
                            text-[10px] font-bold uppercase tracking-wider 
                            transition-all duration-200 
                            hover:bg-white/5 hover:translate-x-1
                            ${option.value === value ? 'text-[#C5A059] bg-[#C5A059]/10 shadow-inner' : 'text-neutral-400 hover:text-white'}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            {option.icon && <span className={`transition-all duration-300 ${option.value === value ? 'text-[#C5A059] scale-110' : 'text-neutral-600'}`}>{option.icon}</span>}
                            <span>{option.label}</span>
                        </div>
                        {option.value === value && <Check size={14} className="animate-in zoom-in spin-in-90 duration-300" />}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full bg-black/40 border border-white/10 hover:border-[#C5A059] 
                    rounded-2xl px-5 py-3 
                    flex items-center justify-between 
                    transition-all duration-300 ease-out 
                    active:scale-95 group 
                    ${isOpen ? 'ring-2 ring-[#C5A059]/20 border-[#C5A059] shadow-[0_0_20px_rgba(197,160,89,0.1)]' : 'shadow-lg hover:shadow-xl'}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedOption?.icon && <span className="text-[#C5A059] transition-transform group-hover:scale-110 duration-300">{selectedOption.icon}</span>}
                    <span className={`text-[11px] font-black uppercase tracking-widest truncate transition-colors duration-300 ${selectedOption ? 'text-white group-hover:text-[#C5A059]' : 'text-neutral-500'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:bg-[#C5A059]/10 ${isOpen ? 'rotate-180 bg-[#C5A059]/20 text-[#C5A059]' : 'text-neutral-500'}`}>
                    <ChevronDown size={14} />
                </div>
            </button>

            {/* Render dropdown using Portal to escape parent overflow */}
            {createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default CustomDropdown;
