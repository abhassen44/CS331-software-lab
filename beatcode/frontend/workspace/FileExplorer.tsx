import React, { useState } from 'react';
import { 
    ChevronRight, 
    ChevronDown, 
    FileIcon, 
    FolderIcon, 
    FileText, 
    FileCode,
    FileJson,
    Image as ImageIcon,
    MoreVertical,
    FilePlus,
    FolderPlus,
    Trash2
} from 'lucide-react';
import { FileNode } from '@/lib/api';

interface FileExplorerProps {
    entries: FileNode[];
    onFileSelect: (file: FileNode) => void;
    selectedPath?: string;
    onCreateFile?: (path: string, isDir: boolean) => void;
    onDelete?: (path: string) => void;
    currentPath: string; // The root path being displayed
}

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
        case 'py':
        case 'html':
        case 'css':
        case 'java':
        case 'cpp':
            return <FileCode className="w-4 h-4 text-[#2EFF7B]" />;
        case 'json':
            return <FileJson className="w-4 h-4 text-[#E6CD69]" />;
        case 'png':
        case 'jpg':
        case 'svg':
            return <ImageIcon className="w-4 h-4 text-[#69E6E6]" />;
        case 'md':
        case 'txt':
            return <FileText className="w-4 h-4 text-[#8FAEA2]" />;
        default:
            return <FileIcon className="w-4 h-4 text-[#8FAEA2]" />;
    }
};

const FileTreeItem: React.FC<{
    node: FileNode;
    level: number;
    onSelect: (node: FileNode) => void;
    selectedPath?: string;
    onExpand: (path: string) => void;
    expandedPaths: Set<string>;
    onCreateClick: (path: string, isDir: boolean) => void;
    onDeleteClick: (path: string) => void;
}> = ({ node, level, onSelect, selectedPath, onExpand, expandedPaths, onCreateClick, onDeleteClick }) => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const [isHovered, setIsHovered] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'dir') {
            onExpand(node.path);
        } else {
            onSelect(node);
        }
    };

    // Note: In a real implementation this would fetch children lazily
    // Since Phase 4A `list_files` currently only lists one level at a time, 
    // we would need parent to supply children or handle state. 
    // To keep it simple, we assume parent passes all entries for now, 
    // OR this component just renders a flat list of current dir, 
    // but a real tree requires deep data.
    // For now we just render the node itself.

    return (
        <div className="select-none">
            <div
                className={`flex items-center group cursor-pointer hover:bg-[#1A2420] transition-colors py-1 px-2 ${isSelected ? 'bg-[#2EFF7B]/10 text-[#2EFF7B]' : 'text-[#E6F1EC]'}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
            >
                {node.type === 'dir' ? (
                    <span className="w-4 h-4 mr-1 text-[#8FAEA2] flex items-center justify-center">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                ) : (
                    <span className="w-4 h-4 mr-1 flex items-center justify-center">
                        {/* Empty space to align with dir chevrons */}
                    </span>
                )}
                
                <span className="w-4 h-4 mr-2 flex items-center justify-center">
                    {node.type === 'dir' ? (
                        <FolderIcon className={`w-4 h-4 ${isExpanded ? 'text-[#2EFF7B]' : 'text-[#8FAEA2]'}`} strokeWidth={1.5} />
                    ) : (
                        getFileIcon(node.name)
                    )}
                </span>
                
                <span className="flex-1 text-sm truncate">{node.name}</span>
                
                {isHovered && (
                    <div className="flex items-center space-x-1 pr-1" onClick={e => e.stopPropagation()}>
                        <button 
                            className="p-1 hover:bg-[#111917] rounded text-[#8FAEA2] hover:text-[#2EFF7B]"
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        >
                            <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-2 mt-6 bg-[#111917] border border-[#1F2D28] rounded-md shadow-xl z-50 overflow-hidden py-1 w-32 border-2">
                                {node.type === 'dir' && (
                                    <>
                                        <button 
                                            className="w-full text-left px-3 py-1.5 text-xs text-[#E6F1EC] hover:bg-[#1A2420] flex items-center"
                                            onClick={() => { setShowMenu(false); onCreateClick(node.path, false); }}
                                        >
                                            <FilePlus className="w-3.5 h-3.5 mr-2" /> New File
                                        </button>
                                        <button 
                                            className="w-full text-left px-3 py-1.5 text-xs text-[#E6F1EC] hover:bg-[#1A2420] flex items-center"
                                            onClick={() => { setShowMenu(false); onCreateClick(node.path, true); }}
                                        >
                                            <FolderPlus className="w-3.5 h-3.5 mr-2" /> New Folder
                                        </button>
                                        <div className="my-1 border-t border-[#1F2D28]"></div>
                                    </>
                                )}
                                <button 
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-[#1A2420] flex items-center"
                                    onClick={() => { setShowMenu(false); onDeleteClick(node.path); }}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* If it's a dir and expanded, we should render children here. 
                For this version, we will handle directory traversal in the parent component 
                by changing `currentPath` and fetching new files, OR keeping a flat local map 
                of all fetched nodes and filtering. 
                We will implement it such that FileExplorer just renders `entries` passed to it. */}
        </div>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
    entries, 
    onFileSelect, 
    selectedPath,
    onCreateFile,
    onDelete,
    currentPath
}) => {
    // In a flat structure where we just list the current directory:
    const handleCreateClick = (path: string, isDir: boolean) => {
        if (onCreateFile) onCreateFile(path, isDir);
    };

    const handleDeleteClick = (path: string) => {
        if (onDelete) onDelete(path);
    };

    // Sort: directories first, then alphabetical
    const sortedEntries = [...entries].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="h-full flex flex-col bg-[#0B0F0E] border-r border-[#1F2D28] overflow-hidden select-none">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#1F2D28]">
                <span className="text-xs font-semibold text-[#8FAEA2] uppercase tracking-wider">Explorer</span>
                <div className="flex space-x-1">
                    <button 
                        className="p-1 hover:bg-[#1A2420] text-[#8FAEA2] hover:text-[#2EFF7B] rounded"
                        title="New File"
                        onClick={() => handleCreateClick(currentPath, false)}
                    >
                        <FilePlus className="w-4 h-4" />
                    </button>
                    <button 
                        className="p-1 hover:bg-[#1A2420] text-[#8FAEA2] hover:text-[#2EFF7B] rounded"
                        title="New Folder"
                        onClick={() => handleCreateClick(currentPath, true)}
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2">
                {sortedEntries.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-[#5A7268] italic">No files found</div>
                ) : (
                    sortedEntries.map((node) => (
                        <FileTreeItem 
                            key={node.path}
                            node={node}
                            level={0}
                            onSelect={onFileSelect}
                            selectedPath={selectedPath}
                            onExpand={(p) => onFileSelect({ ...node, type: 'dir' })} // Treat dir click as select for navigation
                            expandedPaths={new Set()} // Not used in flat view
                            onCreateClick={handleCreateClick}
                            onDeleteClick={handleDeleteClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
