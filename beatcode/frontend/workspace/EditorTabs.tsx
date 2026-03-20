import React from 'react';
import { X, Circle } from 'lucide-react';

export interface EditorTab {
    path: string;
    isDirty: boolean;
}

interface EditorTabsProps {
    tabs: EditorTab[];
    activePath: string | null;
    onSelect: (path: string) => void;
    onClose: (path: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ tabs, activePath, onSelect, onClose }) => {
    return (
        <div className="flex bg-[#0B0F0E] border-b border-[#1F2D28] overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
                const isActive = tab.path === activePath;
                const filename = tab.path.split('/').pop() || tab.path;

                return (
                    <div
                        key={tab.path}
                        onClick={() => onSelect(tab.path)}
                        className={`flex items-center min-w-[120px] max-w-[200px] h-9 px-3 border-r border-[#1F2D28] cursor-pointer cursor-default transition-colors select-none group ${
                            isActive 
                                ? 'bg-[#111917] border-t-2 border-t-[#2EFF7B] text-[#2EFF7B]' 
                                : 'bg-[#0B0F0E] text-[#8FAEA2] hover:bg-[#111917]'
                        }`}
                        title={tab.path}
                    >
                        <span className="flex-1 text-sm truncate mr-2">{filename}</span>
                        
                        <div 
                            className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#1A2420] text-[#5A7268] hover:text-[#E6F1EC]"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(tab.path);
                            }}
                        >
                            {tab.isDirty ? (
                                <Circle className="w-2 h-2 fill-current group-hover:hidden" />
                            ) : null}
                            <X className={`w-3.5 h-3.5 ${tab.isDirty ? 'hidden group-hover:block' : ''}`} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
