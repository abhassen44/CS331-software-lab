'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                // Store tokens
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                // Redirect to chat
                router.push('/chat');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-icon">🔐</span>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your Intelligent Coding Agent</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="submit-btn">
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link href="/register">Create one</Link></p>
                </div>
            </div>

            <style jsx>{`
                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
                    padding: 20px;
                }

                .auth-card {
                    background: rgba(26, 26, 46, 0.9);
                    border: 1px solid #2d2d44;
                    border-radius: 16px;
                    padding: 40px;
                    width: 100%;
                    max-width: 420px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .auth-icon {
                    font-size: 48px;
                    display: block;
                    margin-bottom: 16px;
                }

                .auth-header h1 {
                    color: #fff;
                    font-size: 28px;
                    margin: 0 0 8px 0;
                }

                .auth-header p {
                    color: #9ca3af;
                    margin: 0;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    color: #e5e7eb;
                    font-size: 14px;
                    font-weight: 500;
                }

                .form-group input {
                    padding: 12px 16px;
                    background: #252540;
                    border: 1px solid #3d3d5c;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 16px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                }

                .form-group input::placeholder {
                    color: #6b7280;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid #ef4444;
                    color: #f87171;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    text-align: center;
                }

                .submit-btn {
                    padding: 14px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.2s;
                }

                .submit-btn:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .auth-footer {
                    text-align: center;
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #2d2d44;
                }

                .auth-footer p {
                    color: #9ca3af;
                    margin: 0;
                }

                .auth-footer a {
                    color: #6366f1;
                    text-decoration: none;
                    font-weight: 500;
                }

                .auth-footer a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
