'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, WorkspaceResponse, FileNode, FileTreeResponse } from '@/lib/api';
import { FileExplorer } from '@/components/workspace/FileExplorer';
import { EditorTabs, EditorTab } from '@/components/workspace/EditorTabs';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { WorkspaceTerminal } from '@/components/workspace/Terminal';
import { WorkspaceChat } from '@/components/workspace/WorkspaceChat';
import { 
    Play, 
    Square, 
    Trash2, 
    Loader2, 
    FolderGit2, 
    AlertCircle,
    ArrowLeft,
    Terminal as TerminalIcon,
    PanelBottomClose,
    PanelBottomOpen,
    Check,
    RefreshCw,
    Sparkles,
    PanelRightClose,
    PanelRightOpen
} from 'lucide-react';

interface OpenFile {
    path: string;
    content: string;
    originalContent: string;
    language?: string;
}

export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const id = parseInt(params.id as string);

    // Workspace state
    const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
    const [status, setStatus] = useState<string>('loading');
    const [error, setError] = useState<string | null>(null);

    // File system state
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // Editor state
    const [openFiles, setOpenFiles] = useState<Record<string, OpenFile>>({});
    const [activePath, setActivePath] = useState<string | null>(null);

    const [showTerminal, setShowTerminal] = useState(false);

    // AI panel state
    const [showAI, setShowAI] = useState(false);

    // Save toast state
    const [showSaveToast, setShowSaveToast] = useState(false);

    // Terminal resize state
    const [terminalHeight, setTerminalHeight] = useState(256); // default ~16rem
    const isDraggingRef = useRef(false);
    const dragStartYRef = useRef(0);
    const dragStartHeightRef = useRef(0);

    // Drag-to-resize handlers
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        dragStartYRef.current = e.clientY;
        dragStartHeightRef.current = terminalHeight;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (ev: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const delta = dragStartYRef.current - ev.clientY;
            const newHeight = Math.min(Math.max(dragStartHeightRef.current + delta, 120), 600);
            setTerminalHeight(newHeight);
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [terminalHeight]);

    // --- Data Fetching ---

    // Use a ref for status to avoid re-creating callbacks when status changes
    const statusRef = React.useRef(status);
    statusRef.current = status;

    const fetchWorkspace = useCallback(async (silent = false) => {
        try {
            if (!silent) setStatus('loading');
            const data = await apiClient.getWorkspace(id);
            setWorkspace(data);
            setStatus(data.status);
            return data;
        } catch (err: any) {
            setError(err.detail || 'Failed to load workspace');
            setStatus('error');
            return null;
        }
    }, [id]);

    const fetchFiles = useCallback(async (path: string = '.') => {
        // Use ref instead of state to avoid dependency changes
        if (statusRef.current !== 'running') return [];
        setIsLoadingFiles(true);
        try {
            const data = await apiClient.listWorkspaceFiles(id, path);
            if (path === '.') {
                setFileTree(data.entries);
            }
            return data.entries;
        } catch (err: any) {
            console.error('Failed to load files:', err);
            return [];
        } finally {
            setIsLoadingFiles(false);
        }
    }, [id]); // removed `status` dependency — uses ref now

    // Fetch children for tree expansion
    const fetchChildren = useCallback(async (path: string): Promise<FileNode[]> => {
        try {
            const data = await apiClient.listWorkspaceFiles(id, path);
            return data.entries;
        } catch (err: any) {
            console.error('Failed to fetch children:', err);
            return [];
        }
    }, [id]);

    // Initial load & status polling — stable effect that only runs once per `id`
    useEffect(() => {
        if (isNaN(id)) {
            setError('Invalid workspace ID');
            setStatus('error');
            return;
        }

        let isMounted = true;
        let pollInterval: NodeJS.Timeout;

        const init = async () => {
            try {
                const data = await apiClient.getWorkspace(id);
                if (!isMounted) return;
                setWorkspace(data);
                setStatus(data.status);

                if (['creating', 'starting'].includes(data.status)) {
                    pollInterval = setInterval(async () => {
                        try {
                            const latest = await apiClient.getWorkspace(id);
                            if (!isMounted) return;
                            setWorkspace(latest);
                            setStatus(latest.status);
                            if (!['creating', 'starting'].includes(latest.status)) {
                                clearInterval(pollInterval);
                                if (latest.status === 'running') {
                                    // Inline the fetch to avoid stale closures
                                    const files = await apiClient.listWorkspaceFiles(id, '.');
                                    if (isMounted) setFileTree(files.entries);
                                }
                            }
                        } catch (err) {
                            // Silently ignore poll errors
                        }
                    }, 3000);
                } else if (data.status === 'running') {
                    const files = await apiClient.listWorkspaceFiles(id, '.');
                    if (isMounted) setFileTree(files.entries);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.detail || 'Failed to load workspace');
                    setStatus('error');
                }
            }
        };

        init();

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // --- Workspace Actions ---

    const handleAction = async (action: 'start' | 'stop' | 'destroy') => {
        setStatus('loading');
        try {
            if (action === 'start') {
                const ws = await apiClient.startWorkspace(id);
                setWorkspace(ws);
                setStatus('running');
                fetchFiles('.');
            } else if (action === 'stop') {
                const ws = await apiClient.stopWorkspace(id);
                setWorkspace(ws);
                setStatus('stopped');
                setOpenFiles({});
                setActivePath(null);
            } else if (action === 'destroy') {
                if (!confirm('Are you sure you want to destroy this workspace? All unsaved changes and files inside the sandbox will be lost forever.')) {
                    setStatus(workspace?.status || 'error');
                    return;
                }
                await apiClient.destroyWorkspace(id);
                router.push('/repository');
            }
        } catch (err: any) {
            setError(err.detail || `Failed to ${action} workspace`);
            setStatus('error');
        }
    };

    // --- File Actions ---

    const handleFileSelect = async (node: FileNode) => {
        if (node.type === 'dir') return; // Tree handles expansion now

        // Already open?
        if (openFiles[node.path]) {
            setActivePath(node.path);
            return;
        }

        // Fetch content and open
        try {
            const data = await apiClient.readWorkspaceFile(id, node.path);
            setOpenFiles(prev => ({
                ...prev,
                [node.path]: {
                    path: node.path,
                    content: data.content,
                    originalContent: data.content,
                    language: data.language
                }
            }));
            setActivePath(node.path);
        } catch (err: any) {
            alert(err.detail || 'Failed to read file');
        }
    };

    const handleCreateFile = async (basePath: string, isDir: boolean) => {
        const name = prompt(`Enter ${isDir ? 'folder' : 'file'} name:`);
        if (!name) return;

        const newPath = basePath === '.' ? name : `${basePath}/${name}`;
        try {
            await apiClient.createWorkspaceFile(id, newPath, isDir);
            // Refresh root tree
            fetchFiles('.');
            
            if (!isDir) {
                setOpenFiles(prev => ({
                    ...prev,
                    [newPath]: {
                        path: newPath,
                        content: '',
                        originalContent: '',
                    }
                }));
                setActivePath(newPath);
            }
        } catch (err: any) {
            alert(err.detail || `Failed to create ${isDir ? 'folder' : 'file'}`);
        }
    };

    const handleDeleteFile = async (path: string) => {
        if (!confirm(`Are you sure you want to delete ${path}?`)) return;
        try {
            await apiClient.deleteWorkspaceFile(id, path);
            fetchFiles('.');
            
            if (openFiles[path]) {
                handleTabClose(path);
            }
        } catch (err: any) {
            alert(err.detail || 'Failed to delete');
        }
    };

    // --- Editor Actions ---

    const handleEditorChange = (value: string | undefined) => {
        if (!activePath || value === undefined) return;
        setOpenFiles(prev => ({
            ...prev,
            [activePath]: {
                ...prev[activePath],
                content: value
            }
        }));
    };

    const handleSaveFile = async () => {
        if (!activePath) return;
        const file = openFiles[activePath];
        if (file.content === file.originalContent) return;

        try {
            await apiClient.writeWorkspaceFile(id, activePath, file.content);
            setOpenFiles(prev => ({
                ...prev,
                [activePath]: {
                    ...prev[activePath],
                    originalContent: file.content
                }
            }));
            // Show save toast
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2000);
        } catch (err: any) {
            alert(err.detail || 'Failed to save file');
        }
    };

    const handleTabClose = (path: string) => {
        const file = openFiles[path];
        if (file && file.content !== file.originalContent) {
            if (!confirm(`You have unsaved changes in ${path}. Close anyway?`)) {
                return;
            }
        }

        setOpenFiles(prev => {
            const next = { ...prev };
            delete next[path];
            return next;
        });

        if (activePath === path) {
            const remaining = Object.keys(openFiles).filter(p => p !== path);
            setActivePath(remaining.length > 0 ? remaining[remaining.length - 1] : null);
        }
    };

    // --- Render Helpers ---

    const tabs: EditorTab[] = Object.values(openFiles).map(f => ({
        path: f.path,
        isDirty: f.content !== f.originalContent
    }));

    const activeFile = activePath ? openFiles[activePath] : null;
    
    // Detect language for status bar
    const getLanguageLabel = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase();
        const map: Record<string, string> = {
            'js': 'JavaScript', 'ts': 'TypeScript', 'jsx': 'JSX', 'tsx': 'TSX',
            'py': 'Python', 'json': 'JSON', 'html': 'HTML', 'css': 'CSS',
            'md': 'Markdown', 'go': 'Go', 'rs': 'Rust', 'java': 'Java',
            'cpp': 'C++', 'c': 'C', 'sh': 'Shell', 'yaml': 'YAML', 'yml': 'YAML',
            'rb': 'Ruby', 'php': 'PHP', 'sql': 'SQL',
        };
        return map[ext || ''] || 'Plain Text';
    };

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#0B0F0E] text-[#E6F1EC]">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Workspace Error</h2>
                <p className="text-[#5A7268] mb-6">{error}</p>
                <button 
                    onClick={() => router.push('/repository')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A2420] border border-[#1F2D28] rounded-xl hover:text-[#2EFF7B]"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Repositories
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0B0F0E] text-[#E6F1EC] overflow-hidden">
            {/* Top Toolbar */}
            <div className="h-14 flex items-center justify-between px-4 bg-[#111917] border-b border-[#1F2D28] shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/repository')}
                        className="p-2 hover:bg-[#1A2420] rounded-xl transition-colors text-[#8FAEA2] hover:text-[#E6F1EC]"
                        title="Back to Repositories"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-[#2EFF7B]" />
                        <div>
                            <div className="font-semibold leading-tight">{workspace?.name || 'Workspace'}</div>
                            <div className="text-xs text-[#5A7268] flex items-center gap-1.5">
                                <span className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        status === 'running' ? 'bg-[#2EFF7B]' :
                                        status === 'stopped' ? 'bg-gray-500' :
                                        status === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                                    }`} />
                                    <span className="capitalize">{status}</span>
                                </span>
                                • {workspace?.base_image}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {status === 'stopped' && (
                        <button 
                            onClick={() => handleAction('start')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2420] border border-[#1F2D28] rounded-lg text-sm hover:border-[#2EFF7B] hover:text-[#2EFF7B] transition-colors"
                        >
                            <Play className="w-4 h-4" /> Start
                        </button>
                    )}
                    
                    {status === 'running' && (
                        <>
                            {/* Save button with toast */}
                            <div className="relative">
                                <button 
                                    onClick={handleSaveFile}
                                    disabled={!activeFile || activeFile.content === activeFile.originalContent}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-[#2EFF7B] text-[#0B0F0E] font-medium rounded-lg text-sm hover:bg-[#1ED760] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Save (Ctrl+S)"
                                >
                                    Save
                                </button>
                                
                                {/* Save toast */}
                                {showSaveToast && (
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-[#2EFF7B] text-[#0B0F0E] text-xs font-medium rounded-lg shadow-lg shadow-[#2EFF7B]/20 whitespace-nowrap animate-fade-in-down">
                                        <Check className="w-3.5 h-3.5" /> Saved
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-6 bg-[#1F2D28] mx-1" />

                            {/* Refresh tree */}
                            <button 
                                onClick={() => fetchFiles('.')}
                                className="p-1.5 text-[#8FAEA2] hover:text-[#2EFF7B] hover:bg-[#1A2420] rounded-lg transition-colors"
                                title="Refresh file tree"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={() => handleAction('stop')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2420] border border-[#1F2D28] rounded-lg text-sm hover:text-yellow-400 hover:border-yellow-400/50 transition-colors"
                            >
                                <Square className="w-4 h-4" /> Stop
                            </button>
                        </>
                    )}

                    {status === 'running' && (
                        <button 
                            onClick={() => setShowTerminal(!showTerminal)}
                            className={`flex items-center gap-2 px-3 py-1.5 bg-[#1A2420] border rounded-lg text-sm transition-colors ${
                                showTerminal 
                                    ? 'border-[#2EFF7B] text-[#2EFF7B]' 
                                    : 'border-[#1F2D28] text-[#8FAEA2] hover:border-[#2EFF7B]/50 hover:text-[#2EFF7B]'
                            }`}
                            title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}
                        >
                            <TerminalIcon className="w-4 h-4" />
                            {showTerminal ? <PanelBottomClose className="w-3.5 h-3.5" /> : <PanelBottomOpen className="w-3.5 h-3.5" />}
                        </button>
                    )}

                    {status === 'running' && (
                        <button 
                            onClick={() => setShowAI(!showAI)}
                            className={`flex items-center gap-2 px-3 py-1.5 bg-[#1A2420] border rounded-lg text-sm transition-colors ${
                                showAI 
                                    ? 'border-[#BD93F9] text-[#BD93F9]' 
                                    : 'border-[#1F2D28] text-[#8FAEA2] hover:border-[#BD93F9]/50 hover:text-[#BD93F9]'
                            }`}
                            title={showAI ? 'Hide AI Agent' : 'Show AI Agent'}
                        >
                            <Sparkles className="w-4 h-4" />
                            {showAI ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    
                    <button 
                        onClick={() => handleAction('destroy')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2420] border border-[#1F2D28] rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors ml-2"
                        title="Delete Workspace Completely"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
                {['creating', 'starting', 'loading'].includes(status) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#5A7268]">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#2EFF7B]" />
                        <h3 className="text-lg font-medium text-[#E6F1EC] mb-2">Preparing Workspace...</h3>
                        <p className="text-sm">Pulling image and cloning repository if this is the first run.</p>
                        <p className="text-sm mt-1 opacity-70">This might take a minute or two.</p>
                    </div>
                ) : status === 'running' ? (
                    <>
                        <div className="flex-1 flex min-h-0">
                            {/* Sidebar: File Explorer */}
                            <div className="w-64 shrink-0 flex flex-col">
                                <div className="flex-1 min-h-0 relative">
                                    {isLoadingFiles ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F0E]/80 z-10">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#8FAEA2]" />
                                        </div>
                                    ) : null}
                                    <FileExplorer 
                                        entries={fileTree}
                                        onFileSelect={handleFileSelect}
                                        selectedPath={activePath || undefined}
                                        currentPath="."
                                        onCreateFile={handleCreateFile}
                                        onDelete={handleDeleteFile}
                                        onFetchChildren={fetchChildren}
                                    />
                                </div>
                            </div>

                            {/* Editor Area */}
                            <div className="flex-1 flex flex-col min-w-0 bg-[#111917]">
                                <EditorTabs
                                    tabs={tabs}
                                    activePath={activePath}
                                    onSelect={setActivePath}
                                    onClose={handleTabClose}
                                />
                                
                                <div className="flex-1 min-h-0 relative">
                                    {activeFile ? (
                                        <CodeEditor
                                            content={activeFile.content}
                                            language={activeFile.language}
                                            path={activeFile.path}
                                            onChange={handleEditorChange}
                                            onSave={handleSaveFile}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#5A7268]">
                                            <div className="w-16 h-16 rounded-2xl bg-[#1A2420] border border-[#1F2D28] flex items-center justify-center mb-4">
                                                <TerminalIcon className="w-8 h-8 text-[#2EFF7B]" />
                                            </div>
                                            <p className="text-sm">Select a file from the explorer to open in the editor.</p>
                                            <p className="text-xs text-[#3A4F46] mt-2">Or press the terminal button to run commands</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Bar */}
                                {activeFile && (
                                    <div className="h-6 flex items-center justify-between px-3 bg-[#0B0F0E] border-t border-[#1F2D28] text-[10px] text-[#5A7268] shrink-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-[#8FAEA2]">{getLanguageLabel(activeFile.path)}</span>
                                            <span>UTF-8</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {activeFile.content !== activeFile.originalContent && (
                                                <span className="text-[#E6CD69]">● Modified</span>
                                            )}
                                            <span>Lines: {activeFile.content.split('\n').length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* AI Agent Panel */}
                            {showAI && (
                                <div className="w-80 shrink-0 border-l border-[#1F2D28]">
                                    <WorkspaceChat
                                        workspaceId={id}
                                        isVisible={showAI}
                                        onFileChanged={() => fetchFiles('.')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Terminal Panel */}
                        {showTerminal && (
                            <div className="flex flex-col bg-[#0B0F0E] shrink-0" style={{ height: `${terminalHeight}px` }}>
                                {/* Drag handle */}
                                <div
                                    className="h-1 cursor-ns-resize hover:bg-[#2EFF7B]/40 bg-[#1F2D28] transition-colors shrink-0"
                                    onMouseDown={handleDragStart}
                                    onDoubleClick={() => setTerminalHeight(256)}
                                />
                                <div className="flex items-center justify-between px-3 py-1 border-b border-[#1F2D28] bg-[#111917] shrink-0">
                                    <div className="flex items-center gap-2">
                                        <TerminalIcon className="w-3.5 h-3.5 text-[#2EFF7B]" />
                                        <span className="text-xs font-semibold text-[#8FAEA2] uppercase tracking-wider">Terminal</span>
                                    </div>
                                    <button
                                        onClick={() => setShowTerminal(false)}
                                        className="p-1 text-[#5A7268] hover:text-[#E6F1EC] rounded"
                                    >
                                        <PanelBottomClose className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <WorkspaceTerminal workspaceId={id} isVisible={showTerminal} />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#5A7268]">
                        <Square className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-medium text-[#E6F1EC] mb-2">Workspace Stopped</h3>
                        <p className="text-sm">Start the workspace using the button in the top right to access files.</p>
                    </div>
                )}
            </div>

            {/* Global CSS for toast animation */}
            <style jsx global>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translate(-50%, -8px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { apiClient, ExecuteResponse } from "@/lib/api";

const Editor = dynamic(() => import("@monaco-editor/react").then(m => m.default), { ssr: false });

const LANGUAGES = [
    { id: "python", label: "Python", icon: "🐍" },
    { id: "javascript", label: "JavaScript", icon: "🟨" },
    { id: "cpp", label: "C++", icon: "⚙️" },
    { id: "java", label: "Java", icon: "☕" },
];

const LANG_MONACO_MAP: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    cpp: "cpp",
    java: "java",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    success: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Success" },
    error: { bg: "bg-red-500/15", text: "text-red-400", label: "Error" },
    timeout: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Timeout" },
    running: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Running" },
    pending: { bg: "bg-gray-500/15", text: "text-gray-400", label: "Pending" },
};

export default function ExecutePage() {
    const [code, setCode] = useState('print("Hello, World!")');
    const [language, setLanguage] = useState("python");
    const [stdin, setStdin] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<ExecuteResponse | null>(null);
    const [history, setHistory] = useState<ExecuteResponse[]>([]);
    const [activeTab, setActiveTab] = useState<"stdout" | "stderr">("stdout");
    const [diagnostic, setDiagnostic] = useState<string | null>(null);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const resp = await apiClient.getExecutionHistory(15);
            setHistory(resp.executions);
        } catch (err) {
            console.error("Failed to load history:", err);
        }
    };

    const handleRun = async () => {
        if (!code.trim() || isRunning) return;
        setIsRunning(true);
        setResult(null);
        setDiagnostic(null);
        setActiveTab("stdout");

        try {
            const resp = await apiClient.executeCode({
                code: code.trim(),
                language,
                stdin: stdin.trim() || undefined,
            });
            setResult(resp);
            if (resp.status === "error" || resp.status === "timeout") {
                setActiveTab("stderr");
            }
            loadHistory();
        } catch (err) {
            setResult({
                id: 0,
                language,
                status: "error",
                stderr: err instanceof Error ? err.message : "Unknown error",
                created_at: new Date().toISOString(),
            });
        } finally {
            setIsRunning(false);
        }
    };

    const handleDiagnose = async () => {
        if (!result || result.id === 0) return;
        setIsDiagnosing(true);
        try {
            const resp = await apiClient.diagnoseExecution(result.id);
            setDiagnostic(resp.diagnostic);
        } catch (err) {
            setDiagnostic("Failed to get diagnosis. Please try again.");
        } finally {
            setIsDiagnosing(false);
        }
    };

    const loadExecution = (exec: ExecuteResponse) => {
        setResult(exec);
        setActiveTab(exec.status === "success" ? "stdout" : "stderr");
        setDiagnostic(null);
    };

    const statusStyle = result ? STATUS_STYLES[result.status] || STATUS_STYLES.pending : null;

    const handleEditorMount = (editor: any, monacoInstance: any) => {
        // Ctrl+Enter to run
        editor.addCommand(
            monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
            () => handleRun()
        );
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] bg-[#0B0F0E]">
            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2D28] bg-[#111917]">
                    <div className="flex items-center gap-3">
                        {/* Language Selector */}
                        <div className="flex items-center gap-1 bg-[#1A2420] rounded-xl border border-[#1F2D28] p-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => setLanguage(lang.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        language === lang.id
                                            ? "bg-[#2EFF7B]/15 text-[#2EFF7B] border border-[#2EFF7B]/30"
                                            : "text-[#8FAEA2] hover:text-[#E6F1EC] hover:bg-[#1F2D28]"
                                    }`}
                                >
                                    <span>{lang.icon}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-2 rounded-lg text-sm transition-colors ${
                                showHistory ? "bg-[#2EFF7B]/15 text-[#2EFF7B]" : "text-[#5A7268] hover:text-[#E6F1EC]"
                            }`}
                            title="Toggle history"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleRun}
                            disabled={isRunning || !code.trim()}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                isRunning
                                    ? "bg-amber-500/20 text-amber-400 cursor-wait"
                                    : "bg-[#2EFF7B] hover:bg-[#1ED760] text-[#0B0F0E] hover:shadow-lg hover:shadow-[#2EFF7B]/20"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Run code (Ctrl+Enter)"
                        >
                            {isRunning ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Run
                                    <kbd className="text-[10px] px-1 py-0.5 bg-[#0B0F0E]/30 rounded ml-1 font-mono opacity-70">⌘↵</kbd>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Code Editor — now using Monaco */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            height="100%"
                            language={LANG_MONACO_MAP[language] || "plaintext"}
                            value={code}
                            theme="vs-dark"
                            onChange={(v) => setCode(v || "")}
                            onMount={handleEditorMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                fontLigatures: true,
                                wordWrap: 'on',
                                padding: { top: 16, bottom: 16 },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                formatOnPaste: true,
                                bracketPairColorization: { enabled: true },
                                guides: { bracketPairs: true, indentation: true },
                            }}
                            loading={
                                <div className="h-full w-full flex items-center justify-center text-[#5A7268]">
                                    Loading Editor...
                                </div>
                            }
                        />
                    </div>

                    {/* Stdin Input */}
                    <div className="border-t border-[#1F2D28]">
                        <div className="flex items-center px-4 py-2 bg-[#111917]">
                            <span className="text-xs text-[#5A7268] mr-2">stdin:</span>
                            <input
                                type="text"
                                value={stdin}
                                onChange={(e) => setStdin(e.target.value)}
                                placeholder="Optional input (stdin)..."
                                className="flex-1 bg-transparent text-[#E6F1EC] text-sm font-mono focus:outline-none placeholder-[#3A4F46]"
                            />
                        </div>
                    </div>

                    {/* Output Panel */}
                    <div className="border-t border-[#1F2D28] bg-[#111917] min-h-[200px] max-h-[350px] flex flex-col">
                        {/* Output Tabs + Metrics */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F2D28]">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setActiveTab("stdout")}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        activeTab === "stdout"
                                            ? "bg-[#2EFF7B]/15 text-[#2EFF7B]"
                                            : "text-[#5A7268] hover:text-[#E6F1EC]"
                                    }`}
                                >
                                    stdout
                                </button>
                                <button
                                    onClick={() => setActiveTab("stderr")}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        activeTab === "stderr"
                                            ? "bg-red-500/15 text-red-400"
                                            : "text-[#5A7268] hover:text-[#E6F1EC]"
                                    }`}
                                >
                                    stderr
                                    {result?.stderr && (
                                        <span className="ml-1 w-1.5 h-1.5 inline-block rounded-full bg-red-400"></span>
                                    )}
                                </button>
                            </div>

                            {result && (
                                <div className="flex items-center gap-3 text-xs">
                                    {statusStyle && (
                                        <span className={`px-2 py-0.5 rounded-md ${statusStyle.bg} ${statusStyle.text} font-medium`}>
                                            {statusStyle.label}
                                        </span>
                                    )}
                                    {result.exit_code !== undefined && result.exit_code !== null && (
                                        <span className="text-[#5A7268]">
                                            exit: <span className="text-[#8FAEA2]">{result.exit_code}</span>
                                        </span>
                                    )}
                                    {result.execution_time_ms !== undefined && (
                                        <span className="text-[#5A7268]">
                                            ⏱ <span className="text-[#8FAEA2]">{result.execution_time_ms}ms</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Output Content */}
                        <div className="flex-1 overflow-auto p-4">
                            {isRunning ? (
                                <div className="flex items-center gap-2 text-[#5A7268] text-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-[#2EFF7B] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-2 h-2 bg-[#2EFF7B] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-2 h-2 bg-[#2EFF7B] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                    Executing...
                                </div>
                            ) : result ? (
                                <pre className="text-sm font-mono text-[#E6F1EC] whitespace-pre-wrap break-words">
                                    {activeTab === "stdout"
                                        ? result.stdout || "(no output)"
                                        : result.stderr || "(no errors)"}
                                </pre>
                            ) : (
                                <p className="text-sm text-[#3A4F46] italic">
                                    Press <kbd className="px-1.5 py-0.5 bg-[#1A2420] border border-[#1F2D28] rounded text-[#5A7268] text-xs">Ctrl+Enter</kbd> or click <strong className="text-[#5A7268]">Run</strong> to execute your code
                                </p>
                            )}
                        </div>

                        {/* Diagnose Button */}
                        {result && (result.status === "error" || result.status === "timeout") && (
                            <div className="px-4 py-2 border-t border-[#1F2D28]">
                                {diagnostic ? (
                                    <div className="bg-[#1A2420] border border-[#1F2D28] rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-amber-400">🔍 AI Diagnosis</span>
                                        </div>
                                        <pre className="text-xs font-mono text-[#E6F1EC] whitespace-pre-wrap">{diagnostic}</pre>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDiagnose}
                                        disabled={isDiagnosing}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {isDiagnosing ? (
                                            <>
                                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Diagnosing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                                Diagnose Error with AI
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Sidebar */}
            {showHistory && (
                <div className="w-72 border-l border-[#1F2D28] bg-[#111917] flex flex-col">
                    <div className="px-4 py-3 border-b border-[#1F2D28]">
                        <h3 className="text-sm font-semibold text-[#E6F1EC]">Execution History</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="p-4 text-xs text-[#3A4F46] italic">No executions yet</p>
                        ) : (
                            history.map((exec) => {
                                const st = STATUS_STYLES[exec.status] || STATUS_STYLES.pending;
                                const lang = LANGUAGES.find((l) => l.id === exec.language);
                                const time = new Date(exec.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });
                                return (
                                    <button
                                        key={exec.id}
                                        onClick={() => loadExecution(exec)}
                                        className={`w-full text-left px-4 py-3 border-b border-[#1F2D28] hover:bg-[#1A2420] transition-colors ${
                                            result?.id === exec.id ? "bg-[#1A2420]" : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs">{lang?.icon || "📄"}</span>
                                                <span className="text-xs text-[#8FAEA2] font-medium">{lang?.label || exec.language}</span>
                                            </div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{st.label}</span>
                                        </div>
                                        <p className="text-[11px] text-[#5A7268] font-mono truncate">
                                            {exec.stdout?.substring(0, 40) || exec.stderr?.substring(0, 40) || "(no output)"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#3A4F46]">
                                            <span>{time}</span>
                                            {exec.execution_time_ms !== undefined && <span>{exec.execution_time_ms}ms</span>}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
