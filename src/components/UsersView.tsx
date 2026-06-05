/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { Users, Shield, ShieldCheck, Mail, Lock, UserPlus, KeyRound, Check, Edit2, Trash2 } from 'lucide-react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';

interface UsersViewProps {
  usersList: User[];
  onUpdateUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  isDarkMode: boolean;
  language?: 'vi' | 'en';
}

export default function UsersView({ usersList, onUpdateUsers, currentUser, isDarkMode, language = 'vi' }: UsersViewProps) {
  const isAdmin = currentUser.role === 'admin';
  
  // Local state for editing/adding
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    permission: 'view' as 'all' | 'view' | 'modify'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredUsers = usersList.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      full_name: '',
      password: '',
      role: 'user',
      permission: 'view'
    });
    setEditingUserId(null);
    setError('');
    setSuccess('');
  };

  const handleEditClick = (u: User) => {
    setEditingUserId(u.id);
    setFormData({
      email: u.email,
      username: u.username,
      full_name: u.full_name,
      password: u.password || 'user123',
      role: u.role,
      permission: u.permission
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Chỉ Admin mới có quyền thực hiện chỉnh sửa phân quyền.');
      return;
    }

    if (!formData.email || !formData.username || !formData.full_name || !formData.password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    // Check duplicate email or username
    const isDuplicate = usersList.some(u => 
      u.id !== editingUserId && 
      (u.email.toLowerCase() === formData.email.toLowerCase() || u.username.toLowerCase() === formData.username.toLowerCase())
    );

    if (isDuplicate) {
      setError('Email hoặc Tên đăng nhập này đã tồn tại trên hệ thống.');
      return;
    }

    if (editingUserId) {
      // Modify user
      onUpdateUsers(prev => prev.map(u => u.id === editingUserId ? {
        ...u,
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        password: formData.password,
        role: formData.role,
        permission: formData.permission
      } : u));
      
      if (hasSupabaseConfig) {
        supabase.from('profiles').update({
          email: formData.email,
          full_name: formData.full_name,
          username: formData.username,
          role: formData.role,
          permission: formData.permission
        }).eq('id', editingUserId).then(({ error }) => {
          if (error) console.error("Lỗi cập nhật profile:", error.message);
        });
      }
      setSuccess('Cập nhật người dùng thành công!');
      setTimeout(() => {
        resetForm();
      }, 1500);
    } else {
      // Add user
      if (hasSupabaseConfig) {
        setSuccess('Đang đăng ký tài khoản liên kết trên Supabase Auth...');
        supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              username: formData.username,
              role: formData.role,
              permission: formData.permission
            }
          }
        }).then(({ data, error }) => {
          if (error) {
            setError('Lỗi khi đăng ký tài khoản Supabase: ' + error.message);
          } else {
            const authUserId = data.user?.id || `usr-${Date.now()}`;
            const newUser: User = {
              id: authUserId,
              email: formData.email,
              full_name: formData.full_name,
              username: formData.username,
              password: formData.password,
              role: formData.role,
              permission: formData.permission
            };
            onUpdateUsers(prev => [...prev, newUser]);
            
            // Insert profile
            supabase.from('profiles').insert([{
              id: authUserId,
              email: formData.email,
              full_name: formData.full_name,
              username: formData.username,
              role: formData.role,
              permission: formData.permission
            }]).then(({ error: profileError }) => {
              if (profileError) {
                console.warn('Lỗi ghi vào bảng profiles:', profileError.message);
              }
            });
            setSuccess('Đã thêm người dùng và đăng ký tài khoản Supabase Auth thành công!');
            setTimeout(() => {
              resetForm();
            }, 1500);
          }
        });
      } else {
        const newUser: User = {
          id: `usr-${Date.now()}`,
          email: formData.email,
          full_name: formData.full_name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          permission: formData.permission
        };
        onUpdateUsers(prev => [...prev, newUser]);
        setSuccess('Thêm người dùng mới thành công!');
        setTimeout(() => {
          resetForm();
        }, 1500);
      }
    }
  };

  const handleDeleteUser = (id: string) => {
    if (!isAdmin) {
      alert('Chỉ Admin mới có quyền xóa tài khoản.');
      return;
    }
    if (id === currentUser.id) {
      alert('Bạn không thể tự xóa tài khoản của chính mình.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      onUpdateUsers(prev => prev.filter(u => u.id !== id));
      if (hasSupabaseConfig) {
        supabase.from('profiles').delete().eq('id', id).then(({ error }) => {
          if (error) console.error("Lỗi xóa profile:", error.message);
        });
      }
      setSuccess('Đã xóa tài khoản.');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  return (
    <div id="users_view_container" className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center select-none border-b pb-4 border-slate-850">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> {language === 'vi' ? 'Quản lý người dùng & Phân quyền' : 'User Management & Permissions'}
          </h2>
          <p className="text-xs text-slate-450 mt-1">
            {language === 'vi' ? 'Cấp quyền tài khoản, cấu hình vai trò của các thao tác viên hệ thống' : 'Grant privileges, configure roles for system operators'}
          </p>
        </div>
        <div className={`px-3 py-1 flex items-center gap-1.5 text-xs font-bold rounded-lg ${
          isAdmin ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Vai trò của bạn' : 'Your role'}: <strong className="uppercase">{currentUser.role}</strong> ({currentUser.permission})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Block (Add/Edit) - Admin-only edits trigger but User sees readable information */}
        <div className="lg:col-span-4 select-none">
          <div className={`p-5 border rounded-2xl h-fit space-y-4 ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/30' : 'bg-slate-100 border-slate-200'
          }`}>
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-505 flex items-center gap-2 border-b pb-3 border-slate-850">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              {editingUserId ? 'Hiệu chỉnh người dùng' : 'Thêm người dùng mới'}
            </h3>

            {error && (
              <div className="p-3 text-xs rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-400 font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-xs rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {success}
              </div>
            )}

            {!isAdmin && (
              <div className="p-3.5 text-xs rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-550 font-medium whitespace-normal">
                ⚠️ Bạn đang ở chế độ xem. Chỉ vị trí quản trị viên (Admin) mới có quyền cấp quyền và thay đổi thông tin.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Tên đầy đủ *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={formData.full_name}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="VD: Hoàng Lê Huy"
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800/15 text-slate-100 focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 font-bold'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  placeholder="VD: hoanglehuy"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-lg border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800/15 text-slate-100 focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 font-bold'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!isAdmin}
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                  placeholder="name@email.com"
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800/15 text-slate-100 focus:border-indigo-505' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-505 font-bold'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                  Mật khẩu đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Nhập mật khẩu mới..."
                  className={`w-full px-3 py-2 text-xs rounded-lg font-mono border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800/15 text-slate-100 focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 font-bold'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                    Vai trò (Role)
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.role}
                    onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                    className={`w-full px-2 py-2 text-xs rounded-lg border outline-none transition-all cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800/15 text-slate-200' 
                        : 'bg-white border-slate-200 text-slate-900 font-bold'
                    }`}
                  >
                    <option value="admin">Administrator (Admin)</option>
                    <option value="user">User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                    Quyền hạn (Permission)
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.permission}
                    onChange={e => setFormData(prev => ({ ...prev, permission: e.target.value as 'all' | 'view' | 'modify' }))}
                    className={`w-full px-2 py-2 text-xs rounded-lg border outline-none transition-all cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800/15 text-slate-200' 
                        : 'bg-white border-slate-200 text-slate-900 font-bold'
                    }`}
                  >
                    <option value="all">Tất cả [all]</option>
                    <option value="view">Chỉ xem [view]</option>
                    <option value="modify">Cập nhật [modify]</option>
                  </select>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md text-center transition-all hover:-translate-y-[0.5px]"
                  >
                    Lưu cấu hình
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-2 bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-semibold"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Users Table list */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Action Row */}
          <div className="flex justify-between items-center select-none">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm người dùng qua Tên, Email, Username..."
                className={`w-full px-4 py-2 pl-4 text-xs rounded-xl outline-none border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800/15 text-slate-100 focus:border-indigo-500' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 font-bold'
                }`}
              />
            </div>
            
            <span className="text-xs text-slate-500 font-mono">
              Tổng số khoản: {filteredUsers.length}
            </span>
          </div>

          <div className={`border rounded-2xl overflow-hidden ${
            isDarkMode ? 'border-slate-800/20 bg-slate-900/10' : 'border-slate-150 bg-white'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ${
                    isDarkMode ? 'border-slate-800/30 bg-slate-950/20' : 'border-slate-150 bg-slate-50'
                  }`}>
                    <th className="p-3.5">Mã ID</th>
                    <th className="p-3.5">Họ và Tên</th>
                    <th className="p-3.5">Tài khoản (Email / Username)</th>
                    <th className="p-3.5 font-mono">Mật khẩu</th>
                    <th className="p-3.5">Vai trò</th>
                    <th className="p-3.5">Quyền hạn</th>
                    {isAdmin && <th className="p-3.5 text-right">Lệnh</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20">
                  {filteredUsers.map(user => {
                    const isSelf = user.id === currentUser.id;
                    return (
                      <tr key={user.id} className="hover:bg-slate-850/5 transition-all">
                        <td className="p-3.5 font-mono text-slate-450 font-bold">{user.id}</td>
                        <td className="p-3.5 font-bold text-slate-300">
                          <span className={`${isSelf ? 'border-b border-indigo-400 text-indigo-450' : ''}`}>
                            {user.full_name}
                          </span>
                          {isSelf && <span className="ml-1 text-[9px] bg-indigo-500/10 text-indigo-400 px-1 py-0.5 rounded font-bold uppercase">Bạn</span>}
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-350 font-medium flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {user.email}
                          </div>
                          <div className="text-slate-500 text-[10px] font-mono mt-0.5 mt-0.5 flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-slate-600" />
                            @{user.username}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {isAdmin ? (
                            <span className="bg-slate-800/40 px-2 py-0.5 rounded border border-slate-850 font-bold text-[11px]">
                              {user.password || '••••••••'}
                            </span>
                          ) : (
                            <span>••••••••</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                            user.role === 'admin' 
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                              : 'bg-slate-850 text-slate-400 border-slate-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            user.permission === 'all' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : user.permission === 'modify'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800/60 text-slate-450 border border-slate-800'
                          }`}>
                            {user.permission}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="px-2 py-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all mr-1.5 cursor-pointer"
                              title="Sửa quyền hạn / thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={isSelf}
                              className={`px-2 py-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer ${
                                isSelf ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-xs text-slate-500">
                        Không tìm thấy người dùng phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
