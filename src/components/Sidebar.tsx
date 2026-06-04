/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Activity, 
  AlertTriangle, 
  CalendarDays, 
  BarChart3, 
  FileSpreadsheet, 
  Sun, 
  Moon, 
  LogOut, 
  Languages,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ViewType, User } from '../types';
import { t as translate } from '../i18n';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  currentUser: User;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  language: 'vi' | 'en';
  onToggleLanguage: () => void;
  forceExpanded?: boolean;
}

export default function Sidebar({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
  isDarkMode,
  onToggleTheme,
  language,
  onToggleLanguage,
  forceExpanded = false
}: SidebarProps) {

  // Local storage cache for sidebar collapsed preference state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tt_sidebar_collapsed') === 'true';
  });

  const collapsedState = forceExpanded ? false : isCollapsed;

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('tt_sidebar_collapsed', String(nextValue));
  };

  // Translate wrapper calling global translate
  const t = (key: string): string => {
    return translate(key, language);
  };

  const navItems = [
    { id: 'dashboard' as ViewType, label: t('menu.dashboard'), icon: LayoutDashboard },
    { id: 'vehicles' as ViewType, label: t('menu.vehicles'), icon: Truck },
    { id: 'measure' as ViewType, label: t('menu.measure'), icon: Activity },
    { id: 'alerts' as ViewType, label: t('menu.alerts'), icon: AlertTriangle },
    { id: 'inspection' as ViewType, label: t('menu.inspection'), icon: CalendarDays },
    { id: 'reports' as ViewType, label: t('menu.reports'), icon: BarChart3 },
    { id: 'warehouse' as ViewType, label: t('menu.warehouse'), icon: FileSpreadsheet },
    { id: 'users' as ViewType, label: t('menu.users'), icon: Users }
  ];

  return (
    <div 
      id="app_sidebar" 
      className={`${
        collapsedState ? 'w-20 px-3.5 py-6' : 'w-64 p-6'
      } flex-shrink-0 flex flex-col justify-between border-r border-slate-800/15 bg-slate-900 text-slate-400 font-sans h-full select-none transition-all duration-300 overflow-y-auto scrollbar-thin`}
    >
      {/* Sidebar Top Logo Block */}
      <div className="flex flex-col gap-6">
        <div id="sidebar_header_brand" className={`flex ${collapsedState ? 'flex-col items-center justify-center gap-3' : 'items-center justify-between'} py-2 px-1`}>
          {!collapsedState ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-white rounded-sm rotate-45 animate-pulse"></div>
              </div>
              <div className="overflow-hidden">
                <div className="font-extrabold text-md text-white tracking-tight whitespace-nowrap">
                  TireTrack
                </div>
                <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 whitespace-nowrap">
                  Quản lý lốp xe
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
          )}

          {!forceExpanded && (
            <button
              onClick={toggleCollapse}
              className={`p-1.5 hover:bg-slate-800 rounded-lg text-slate-505 hover:text-white transition-all flex items-center justify-center cursor-pointer`}
              title={collapsedState ? "Mở rộng" : "Thu gọn"}
            >
              {collapsedState ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
            </button>
          )}
        </div>

        {/* Main List Navigation items */}
        <nav id="sidebar_nav_menu" className="flex flex-col gap-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                id={`sidebar_nav_item_${item.id}`}
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center ${collapsedState ? 'justify-center py-3' : 'gap-3 px-4 py-3'} rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                title={collapsedState ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-450' : 'text-slate-500'}`} />
                {!collapsedState && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom Profile, Language, Theme, Logout */}
      <div className="flex flex-col gap-3 pt-6 border-t border-slate-800/60 mt-6">
        
        {/* User profile capsule display */}
        <div 
          id="sidebar_user_profile_box" 
          className={`rounded-xl bg-slate-950/60 text-slate-350 flex flex-col border border-slate-800/40 ${
            collapsedState ? 'items-center justify-center py-3 px-1' : 'px-4 py-3 gap-0.5 text-xs'
          }`}
        >
          {!collapsedState ? (
            <>
              <span className="text-slate-500 font-medium text-[11px]">{t('menu.login_as')}</span>
              <span className="font-extrabold text-indigo-400 text-sm tracking-wide block">
                {currentUser.full_name.toLowerCase()}
              </span>
              <span className="text-[10px] text-slate-450 uppercase tracking-widest font-semibold block">
                {currentUser.role}
              </span>
            </>
          ) : (
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest leading-none">
              {currentUser.full_name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Language switcher */}
        <button
          id="sidebar_translation_switcher"
          type="button"
          onClick={onToggleLanguage}
          className={`flex items-center ${collapsedState ? 'justify-center py-2.5' : 'gap-3 px-3.5 py-2.5'} w-full rounded-xl text-left text-xs font-semibold cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800/45 transition-all`}
          title={collapsedState ? (language === 'vi' ? 'Tiếng Việt' : 'English') : undefined}
        >
          <Languages className="w-4.5 h-4.5 text-slate-500 flex-shrink-0" />
          {!collapsedState && (
            <>
              <span className="flex-1 truncate">
                {language === 'vi' ? 'Tiếng Việt' : 'English'}
              </span>
              <span className="text-[9px] bg-slate-800 border border-slate-700 font-bold px-1.5 py-0.5 rounded text-slate-300">
                {language.toUpperCase()}
              </span>
            </>
          )}
        </button>

        {/* Theme select controls */}
        <button
          id="sidebar_theme_modes_changer"
          type="button"
          onClick={onToggleTheme}
          className={`flex items-center ${collapsedState ? 'justify-center py-2.5' : 'gap-3 px-3.5 py-2.5'} w-full rounded-xl text-left text-xs font-semibold cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800/45 transition-all`}
          title={collapsedState ? t(isDarkMode ? 'menu.light_mode' : 'menu.dark_mode') : undefined}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4.5 h-4.5 text-amber-400 flex-shrink-0" />
              {!collapsedState && <span>{t('menu.light_mode')}</span>}
            </>
          ) : (
            <>
              <Moon className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0" />
              {!collapsedState && <span>{t('menu.dark_mode')}</span>}
            </>
          )}
        </button>

        {/* Logout command trigger */}
        <button
          id="sidebar_logout_command_btn"
          type="button"
          onClick={onLogout}
          className={`flex items-center ${collapsedState ? 'justify-center py-3' : 'gap-3 px-3.5 py-3'} w-full rounded-xl text-left text-xs font-bold text-red-450 hover:bg-red-950/20 active:scale-98 transition-all cursor-pointer`}
          title={collapsedState ? t('menu.logout') : undefined}
        >
          <LogOut className="w-4.5 h-4.5 text-red-500/80 flex-shrink-0" />
          {!collapsedState && <span>{t('menu.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
