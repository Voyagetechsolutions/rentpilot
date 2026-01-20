'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            } else {
                // Fetch session to get user role
                const sessionRes = await fetch('/api/auth/session');
                const session = await sessionRes.json();
                const role = session?.user?.role;

                // Redirect based on role
                if (role === 'ADMIN') {
                    router.push('/admin');
                } else if (role === 'TENANT') {
                    router.push('/tenant');
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            }
        } catch (err) {
            setError('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between">
                <div>
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">R</span>
                        </div>
                        <span className="font-bold text-2xl text-white">RentPilot</span>
                    </Link>
                </div>

                <div>
                    <h1 className="text-4xl font-bold text-white mb-6">
                        Welcome back to your<br />
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            property command center
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Track rent, manage tenants, and stay on top of maintenance — all in one place.
                    </p>
                </div>

                <div className="text-gray-500 text-sm">
                    © 2026 RentPilot. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">R</span>
                            </div>
                            <span className="font-bold text-2xl text-white">RentPilot</span>
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
                        <p className="text-gray-600 mb-8">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-cyan-600 hover:underline font-medium">
                                Sign up free
                            </Link>
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <Link href="/forgot-password" className="text-sm text-cyan-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
