import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

// Global shortcuts registry
const shortcuts: ShortcutConfig[] = [];

export const useKeyboardShortcuts = (newShortcuts: ShortcutConfig[]) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement
        ) {
            return;
        }

        for (const shortcut of newShortcuts) {
            const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
            const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
            const altMatch = shortcut.alt ? e.altKey : !e.altKey;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                e.preventDefault();
                shortcut.action();
                break;
            }
        }
    }, [newShortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

// Predefined shortcuts for the app
export const getAppShortcuts = (actions: {
    generate?: () => void;
    save?: () => void;
    openSettings?: () => void;
    toggleTheme?: () => void;
    goToCreate?: () => void;
    goToBatch?: () => void;
    goToDashboard?: () => void;
}): ShortcutConfig[] => [
        { key: 'g', ctrl: true, action: actions.generate || (() => { }), description: 'Generate Content' },
        { key: 's', ctrl: true, action: actions.save || (() => { }), description: 'Save Project' },
        { key: ',', ctrl: true, action: actions.openSettings || (() => { }), description: 'Open Settings' },
        { key: 'd', ctrl: true, shift: true, action: actions.toggleTheme || (() => { }), description: 'Toggle Dark Mode' },
        { key: '1', alt: true, action: actions.goToCreate || (() => { }), description: 'Go to Video Generator' },
        { key: '2', alt: true, action: actions.goToBatch || (() => { }), description: 'Go to Batch Queue' },
        { key: '3', alt: true, action: actions.goToDashboard || (() => { }), description: 'Go to Dashboard' },
    ];

// Component to show shortcuts help
export const KeyboardShortcutsHelp: React.FC = () => {
    const shortcuts = [
        { keys: 'Ctrl + G', desc: 'Generate Content' },
        { keys: 'Ctrl + S', desc: 'Save Project' },
        { keys: 'Ctrl + ,', desc: 'Open Settings' },
        { keys: 'Ctrl + Shift + D', desc: 'Toggle Dark Mode' },
        { keys: 'Alt + 1', desc: 'Video Generator' },
        { keys: 'Alt + 2', desc: 'Batch Queue' },
        { keys: 'Alt + 3', desc: 'Dashboard' },
    ];

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h4 className="text-sm font-bold text-white mb-3">⌨️ Keyboard Shortcuts</h4>
            <div className="space-y-2">
                {shortcuts.map(s => (
                    <div key={s.keys} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{s.desc}</span>
                        <kbd className="px-2 py-1 bg-slate-900 text-slate-300 rounded text-xs font-mono">{s.keys}</kbd>
                    </div>
                ))}
            </div>
        </div>
    );
};

import React from 'react';
export default useKeyboardShortcuts;
