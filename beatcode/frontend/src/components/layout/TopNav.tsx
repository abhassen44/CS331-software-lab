"use client";

import Link from "next/link";
import { useState } from "react";

export default function TopNav() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-700 z-50 flex items-center px-4 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
                <span className="text-2xl">🧠</span>
                <span className="hidden sm:inline">ICA</span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search repos, chats, tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {/* Context Tag */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-slate-500">📁</span>
                <span>No project selected</span>
            </div>

            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <button className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    U
                </div>
            </button>
        </header>
    );
}
