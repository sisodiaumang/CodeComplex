'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, EyeOff, Terminal, Loader2, Trophy, Zap, BarChart3, Users } from 'lucide-react';

const colors = {
  bg: '#14110F',
  surface: '#1F1A16',
  surfaceAlt: '#241E18',
  border: '#34281F',
  textPrimary: '#F2E9DE',
  textSecondary: '#A8978A',
  ember: '#FF6B35',
  teal: '#2EC4B6',
  success: '#6FCB9F',
  error: '#E63946',
};

const benefits = [
  { icon: Trophy, title: 'Ranked matches', desc: 'Climb a live leaderboard against developers worldwide.' },
  { icon: Zap, title: 'Instant judging', desc: 'Get pass or fail feedback the moment you submit.' },
  { icon: BarChart3, title: 'Track your growth', desc: 'See your rating history and weak spots over time.' },
  { icon: Users, title: 'Weekly contests', desc: 'New problem sets drop every week, solo or in teams.' },
];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v9h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.66z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.34l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.17c-.43-1.27-.67-2.62-.67-4.17s.24-2.9.67-4.17v-5.7H4.34A21.93 21.93 0 0 0 2 24c0 3.55.85 6.9 2.34 9.87l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.13l7.35 5.7c1.73-5.2 6.58-9.08 12.31-9.08z" />
    </svg>
  );
}

export default function LoginPage() {
  const { loginMock, isLoading, error, clearError } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const switchMode = (mode: boolean) => {
    setIsLogin(mode);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginMock(formData.email);
  };

  return (
    <div style={{ backgroundColor: colors.bg }} className="w-full min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div
        style={{ backgroundColor: colors.surface, borderColor: colors.border, minHeight: 600 }}
        className="w-full max-w-4xl rounded-2xl border overflow-hidden flex flex-col sm:flex-row"
      >
        {/* FORM PANEL */}
        <div
          className={`w-full sm:w-1/2 flex flex-col justify-center p-8 sm:p-12 transition-transform duration-500 ${
            isLogin ? 'sm:translate-x-0' : 'sm:translate-x-full'
          }`}
        >
          <div className="w-full max-w-sm mx-auto">
            <div
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              className="h-11 w-11 rounded-xl border flex items-center justify-center mb-6"
            >
              <Terminal style={{ color: colors.ember }} className="h-5 w-5" />
            </div>

            <h1 style={{ color: colors.textPrimary }} className="text-2xl font-semibold mb-1">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ color: colors.textSecondary }} className="text-sm mb-7">
              {isLogin ? 'Sign in to pick up your ranked matches where you left off.' : 'Join the ranking pools and start competing.'}
            </p>

            {error && (
              <div style={{ backgroundColor: colors.bg, borderColor: colors.border }} role="alert" className="mb-5 rounded-lg border px-3 py-2.5">
                <p style={{ color: colors.error }} className="text-xs font-mono">// {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label htmlFor="username" style={{ color: colors.textPrimary }} className="text-sm font-medium">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    placeholder="Pick a handle"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }}
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" style={{ color: colors.textPrimary }} className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" style={{ color: colors.textPrimary }} className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }}
                    className="w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ background: 'transparent', border: 'none', padding: 0, color: colors.textSecondary }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-sm pt-1">
                  <label style={{ color: colors.textSecondary }} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" style={{ accentColor: colors.ember }} />
                    Remember for 30 days
                  </label>
                  <button type="button" style={{ color: colors.teal, background: 'transparent', border: 'none' }} className="font-medium">
                    Forgot password
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{ backgroundColor: colors.ember, color: colors.bg }}
                className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? 'Sign in' : 'Get started'}
              </button>

              <button
                type="button"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.textPrimary }}
                className="w-full py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2"
              >
                <GoogleIcon /> Continue with Google
              </button>
            </form>

            <p style={{ color: colors.textSecondary }} className="text-center text-sm mt-6">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                style={{ color: colors.teal, background: 'transparent', border: 'none' }}
                className="font-semibold"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* BENEFITS PANEL */}
        <div
          style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
          className={`hidden sm:flex sm:w-1/2 flex-col justify-center p-12 border-l transition-transform duration-500 ${
            isLogin ? 'sm:translate-x-0' : 'sm:-translate-x-full'
          }`}
        >
          <div className="max-w-sm">
            <p style={{ color: colors.textSecondary }} className="text-xs font-mono uppercase tracking-wide mb-3">
              Why DevArena
            </p>
            <h2 style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-6 leading-snug">
              Built for people who&apos;d rather compete than scroll a job board.
            </h2>

            <div className="space-y-5">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div
                    style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                    className="h-9 w-9 shrink-0 rounded-lg border flex items-center justify-center"
                  >
                    <Icon style={{ color: colors.ember }} className="h-4 w-4" />
                  </div>
                  <div>
                    <p style={{ color: colors.textPrimary }} className="text-sm font-medium">{title}</p>
                    <p style={{ color: colors.textSecondary }} className="text-xs mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderColor: colors.border }} className="mt-8 pt-5 border-t flex items-center gap-2">
              <span style={{ backgroundColor: colors.success }} className="h-1.5 w-1.5 rounded-full animate-pulse" />
              <span style={{ color: colors.textSecondary }} className="text-xs font-mono">
                12,400 developers competing this week
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
