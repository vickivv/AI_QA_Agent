// src/components/EditorSettingPanel.tsx
import React from 'react';
import { Settings, Droplet, Minus, Plus, Zap, Type } from 'lucide-react';

// NOTE: These constants need to be defined in a shared utility file or right here for the panel to work.
const FONT_FAMILIES = ['Monospace', 'Courier New', 'Roboto Mono', 'Source Code Pro', 'DejaVu Sans Mono', 'Consolas'];

// Define the structure of the settings object for better type safety
export interface AppSettings {
    theme: 'Light' | 'Dark' | 'System Default';
    fontFamily: string;
    fontSize: number;
}

// Define the props the panel needs to receive from the main IDE component
export interface EditorSettingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onThemeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onFontFamilyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onFontSizeChange: (amount: number) => void;
}

// --- Helper UI Component ---
interface SettingRowProps {
    label: string;
    children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, children }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {children}
    </div>
);


const EditorSettingPanel: React.FC<EditorSettingPanelProps> = ({
    isOpen,
    onClose,
    settings,
    onThemeChange,
    onFontFamilyChange,
    onFontSizeChange
}) => {
    // 1. Conditional Rendering Check
    if (!isOpen) {
        return null;
    }

    return (
        // Overlay backdrop (High Z-index for visibility)
        <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">

            {/* Modal Container */}
            <div className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-4xl max-h-[90vh] rounded-xl overflow-y-auto transform transition-transform duration-300 scale-100 p-6 sm:p-12">

                {/* Header and Close Button */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-300 dark:border-gray-700">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Settings className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
                        Editor Appearance Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition duration-200"
                        aria-label="Close settings panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mt-8 space-y-8">
                    {/* Appearance Section */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400 flex items-center">
                            <Droplet className="w-5 h-5 mr-2" /> Visual Customization
                        </h3>

                        {/* Theme Dropdown */}
                        <SettingRow label="Color Theme">
                            <select
                                value={settings.theme}
                                onChange={onThemeChange} // Handler received via props
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="Light">Light (Daylight Mode)</option>
                                <option value="Dark">Dark (Night Mode)</option>
                                <option value="System Default">System Default</option>
                            </select>
                        </SettingRow>

                        {/* Font Family Dropdown */}
                        <SettingRow label="Code Font Family">
                            <select
                                value={settings.fontFamily}
                                onChange={onFontFamilyChange} // Handler received via props
                                style={{ fontFamily: settings.fontFamily }}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                {FONT_FAMILIES.map(font => (
                                    <option key={font} value={font}>{font}</option>
                                ))}
                            </select>
                        </SettingRow>

                        {/* Font Size Control */}
                        <SettingRow label="Code Font Size">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onFontSizeChange(-1)} // Handler received via props
                                    className="p-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition disabled:opacity-50"
                                    aria-label="Decrease font size"
                                    disabled={settings.fontSize <= 10}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-mono text-base px-2 w-10 text-center text-gray-900 dark:text-gray-100">
                                    {settings.fontSize}px
                                </span>
                                <button
                                    onClick={() => onFontSizeChange(1)} // Handler received via props
                                    className="p-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition disabled:opacity-50"
                                    aria-label="Increase font size"
                                    disabled={settings.fontSize >= 30}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </SettingRow>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-4">
                        <Zap className="w-4 h-4 inline mr-1 text-yellow-500" /> Settings are automatically saved to your browser's local storage for persistence.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorSettingPanel;