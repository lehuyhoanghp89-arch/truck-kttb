/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Truck, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { supabase, hasSupabaseConfig } from '../lib/supabase';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập Email và Mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (hasSupabaseConfig) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (authError) {
          throw authError;
        }

        if (data.user) {
          onLoginSuccess({
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.email?.split('@')[0] || 'User',
            username: data.user.email?.split('@')[0] || 'user',
            password: '', // Never store password in state
            role: 'user', // Depending on structure, fetch from a "profiles" table later
            permission: 'view'
          });
          return;
        }
      } else {
        // Fallback for when Supabase is not yet configured
        onLoginSuccess({
          id: `usr-${Date.now()}`,
          email: email,
          full_name: email.split('@')[0],
          username: email.split('@')[0],
          password: password,
          role: email.includes('admin') || email === 'lehuyhoanghp89@gmail.com' ? 'admin' : 'user',
          permission: email.includes('admin') || email === 'lehuyhoanghp89@gmail.com' ? 'all' : 'view'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_container" className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans p-6 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Brand Block */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div id="brand_icon_wrapper" className="w-16 h-16 rounded-2xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
          <Truck className="w-10 h-10 text-blue-400" />
        </div>
        <h1 id="brand_primary_title" className="text-3xl font-extrabold tracking-wider text-slate-100 uppercase">
          HỆ THỐNG TRUCK-T
        </h1>
        <p id="brand_subtitle" className="text-sm font-medium text-slate-400 mt-1">
          Hệ thống quản lý xe TT - Port
        </p>
      </div>

      {/* Main Login Card */}
      <div id="login_card_wrapper" className="w-full max-w-md bg-slate-900/90 border border-slate-705 rounded-3xl overflow-hidden shadow-2xl shadow-slate-950">
        
        {/* Form Body */}
        <div className="p-8">
          <h2 id="login_form_title" className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            Đăng nhập
          </h2>

          {error && (
            <div id="login_error_alert" className="p-3 mb-4 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-400 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label id="label_email" htmlFor="email_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">
                Email hoặc Tên đăng nhập
              </label>
              <input
                id="email_input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-100 text-sm rounded-xl placeholder:text-slate-600 outline-none transition-all font-sans"
              />
            </div>

            <div>
              <label id="label_password" htmlFor="password_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password_input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-100 text-sm rounded-xl placeholder:text-slate-600 outline-none transition-all font-mono"
                />
                <button
                  id="password_eye_toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              id="login_submit_btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-600/10 cursor-pointer hover:shadow-blue-600/20 hover:-translate-y-[1px] active:translate-y-0 transition-all text-center mt-4 uppercase"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer copyright */}
      <p id="port_copyright_text" className="text-xs text-slate-600 mt-12 select-none">
        © 2026 TT - Port IT Operations. All rights reserved. Registered for hoang lehuy admin.
      </p>
    </div>
  );
}
