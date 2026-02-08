"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
    { href: "/chat", icon: "💬", label: "Chat" },
    { href: "/repository", icon: "📁", label: "Repositories" },
    { href: "/upload", icon: "📤", label: "Upload Files" },
    { href: "/execution", icon: "▶️", label: "Execution" },
    { href: "/tasks", icon: "⚙️", label: "Tasks" },
    { href: "/history", icon: "🕒", label: "History" },
    { href: "/admin", icon: "👑", label: "Admin", adminOnly: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login state on mount and when pathname changes
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        setIsLoggedIn(!!token);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        setIsLoggedIn(false);
        router.push("/login");
    };

    return (
        <aside
            className={`fixed left-0 top-14 bottom-0 bg-slate-900 border-r border-slate-700 transition-all duration-300 z-40 flex flex-col ${collapsed ? "w-16" : "w-56"
                }`}
        >
            {/* Auth Status */}
            <div className={`p-3 border-b border-slate-700 ${collapsed ? "text-center" : ""}`}>
                {isLoggedIn ? (
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                            ✓
                        </span>
                        {!collapsed && (
                            <span className="text-emerald-400 text-sm font-medium">Logged in</span>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                            🔐
                        </span>
                        {!collapsed && <span className="text-sm">Sign in</span>}
                    </Link>
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {!collapsed && <span className="font-medium">{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-slate-700">
                {/* Logout Button */}
                {isLoggedIn && (
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors ${collapsed ? "justify-center" : ""}`}
                    >
                        <span className="text-lg">🚪</span>
                        {!collapsed && <span className="font-medium">Logout</span>}
                    </button>
                )}

                {/* Collapse Toggle */}
                <div className="p-2">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <svg
                            className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
}

