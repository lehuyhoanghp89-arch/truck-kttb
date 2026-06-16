/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Check, X, RefreshCw, Truck as TruckIcon, Wrench } from 'lucide-react';
import { Truck, Trailer, Tire, TireLatest, MaintRequest, RepairLog } from '../types';
import { t as translate } from '../i18n';

interface DashboardViewProps {
  trucks: Truck[];
  trailers: Trailer[];
  tires: Tire[];
  tireLatest: TireLatest[];
  maintRequests: MaintRequest[];
  repairLogs: RepairLog[];
  onActionApproveRequest: (id: string) => void;
  onActionRejectRequest: (id: string) => void;
  onNavigateToView: (view: any) => void;
  isDarkMode: boolean;
  language?: 'vi' | 'en';
}

export default function DashboardView({
  trucks,
  trailers,
  tires,
  tireLatest,
  maintRequests,
  repairLogs,
  onActionApproveRequest,
  onActionRejectRequest,
  onNavigateToView,
  isDarkMode,
  language = 'vi'
}: DashboardViewProps) {

  // Local helper for translate
  const t = (key: string): string => translate(key, language);

  // Current Date display string (Language dependent)
  const dateStr = language === 'vi' 
    ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Compute status counts of tires
  const okCount = tireLatest.filter(t => t.status === 'OK').length;
  const warnCount = tireLatest.filter(t => t.status === 'WARN').length;
  const badCount = tireLatest.filter(t => t.status === 'BAD').length;
  const unknownCount = tires.filter(t => t.status === 'SPARE' && t.asset_id === null).length;

  // Filter pending requests
  const pendingRequests = maintRequests.filter(r => r.status === 'PENDING');
  // Filter recently done requests for bottom panel
  const doneRequests = maintRequests.filter(r => r.status === 'DONE');
  // Maintenance logs list combining repair completed
  const completedRepairs = repairLogs.filter(r => r.status === 'DONE');

  // Modern thin, soft borders for dark mode
  const borderClass = isDarkMode ? 'border-slate-700/50' : 'border-slate-205';
  const cardBgClass = isDarkMode ? 'bg-slate-900/40' : 'bg-white shadow-xs';

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Title & Today Header */}
      <div id="dash_title_bar" className={`flex justify-between items-center bg-slate-950/20 p-2 rounded-2xl border ${borderClass} mb-2`}>
        <div>
          <h2 id="dash_primary_title" className="text-2xl font-black tracking-tight select-none font-sans flex items-center gap-3">
            {t('dash.title')}
          </h2>
          <p id="dash_primary_subtitle" className="text-xs text-slate-500 font-medium font-sans mt-0.5">
            {t('dash.subtitle')}, <span className="text-indigo-550 font-extrabold font-mono uppercase">hoang lehuy</span> · {dateStr}
          </p>
        </div>
        <button 
          id="dash_refresh_btn"
          type="button" 
          onClick={() => alert(t('dash.sync_success'))}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-700/50 text-slate-300 hover:bg-slate-800/40 hover:text-white' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t('dash.refresh')}</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div id="dash_kpi_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Card 1: OK */}
        <div 
          id="kpi_card_ok"
          className={`border p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer hover:translate-y-[-1px] ${
            isDarkMode 
              ? 'bg-slate-900/60 border-emerald-700/35 text-emerald-500' 
              : 'border-emerald-100 bg-emerald-50/50 text-emerald-600'
          }`}
          onClick={() => onNavigateToView('reports')}
        >
          <div>
            <div className={`text-xs font-bold tracking-wider uppercase opacity-80 ${isDarkMode ? 'text-emerald-550' : 'text-emerald-500'}`}>{t('dash.kpi.good_tires')}</div>
            <div className="text-3xl font-black tracking-tight mt-1 font-mono">{okCount}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
        </div>

        {/* Card 2: WARN */}
        <div 
          id="kpi_card_warn"
          className={`border p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer hover:translate-y-[-1px] ${
            isDarkMode 
              ? 'bg-slate-900/60 border-amber-700/35 text-amber-500' 
              : 'border-amber-100 bg-amber-50/50 text-amber-600'
          }`}
        >
          <div>
            <div className={`text-xs font-bold tracking-wider uppercase opacity-80 ${isDarkMode ? 'text-amber-550' : 'text-amber-500'}`}>{t('dash.kpi.warn_tires')}</div>
            <div className="text-3xl font-black tracking-tight mt-1 font-mono">{warnCount}</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500/80" />
        </div>

        {/* Card 3: BAD */}
        <div 
          id="kpi_card_bad"
          className={`border p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer hover:translate-y-[-1px] ${
            isDarkMode 
              ? 'bg-slate-900/60 border-rose-700/35 text-rose-500' 
              : 'border-rose-100 bg-rose-50/50 text-rose-600'
          }`}
          onClick={() => onNavigateToView('alerts')}
        >
          <div>
            <div className={`text-xs font-bold tracking-wider uppercase opacity-80 ${isDarkMode ? 'text-rose-550' : 'text-rose-500'}`}>{t('dash.kpi.bad_tires')}</div>
            <div className="text-3xl font-black tracking-tight mt-1 font-mono">{badCount}</div>
          </div>
          <XCircle className="w-8 h-8 text-rose-500/80" />
        </div>

        {/* Card 4: Spare Inventory (previously Chưa đo) */}
        <div 
          id="kpi_card_undone"
          className={`border p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer hover:translate-y-[-1px] ${
            isDarkMode 
              ? 'bg-slate-900/60 border-slate-700/50 text-slate-400' 
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
          onClick={() => onNavigateToView('warehouse')}
        >
          <div>
            <div className="text-xs font-bold tracking-wider uppercase opacity-80">{t('dash.kpi.spare_tires')}</div>
            <div className="text-3xl font-black tracking-tight mt-1 font-mono">{unknownCount}</div>
          </div>
          <Clock className="w-8 h-8 opacity-60" />
        </div>
      </div>

      {/* Main Panels Layout Grid */}
      <div id="dash_panels_grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Xe Truck List */}
        <div 
          id="panel_xe_truck" 
          className={`border rounded-2xl p-6 flex flex-col justify-between shadow-xs ${borderClass} ${cardBgClass}`}
        >
          <div className="space-y-4">
            <div className={`flex justify-between items-center border-b pb-3 ${borderClass}`}>
              <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-505 flex items-center gap-2">
                <TruckIcon className="w-4 h-4" /> {language === 'vi' ? 'Xe đầu kéo' : 'Tractor Trucks'}
              </h3>
              <button 
                id="view_all_trucks_btn"
                type="button"
                onClick={() => onNavigateToView('vehicles')}
                className="text-xs text-indigo-500 hover:text-indigo-400 font-bold transition-all"
              >
                {language === 'vi' ? 'Xem cả bãi' : 'View fleet'} →
              </button>
            </div>

            <div className="space-y-3 font-sans">
              {trucks.slice(0, 5).map(truck => (
                <div 
                  key={truck.id}
                  className={`flex justify-between items-center py-2.5 px-3 rounded-xl border text-sm transition-all hover:bg-slate-850/10 ${
                    isDarkMode ? 'bg-slate-950/35 border-slate-700/40' : 'bg-slate-50 border-slate-200/50'
                  }`}
                >
                  <span className="font-extrabold text-indigo-500 tracking-wide font-mono">
                    {truck.truck_id}
                  </span>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                    truck.status === 'ACTIVE' 
                      ? 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-500' 
                      : 'bg-amber-500/10 border border-amber-500/15 text-amber-500'
                  }`}>
                    {truck.status === 'ACTIVE' ? (language === 'vi' ? 'Hoạt động' : 'Active') : (language === 'vi' ? 'Bảo trì' : 'Maint')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Yêu cầu chờ duyệt Panel */}
        <div 
          id="panel_pending_requests" 
          className={`border rounded-2xl p-6 shadow-xs ${borderClass} ${cardBgClass}`}
        >
          <div className={`flex justify-between items-center border-b pb-3 ${borderClass} mb-4`}>
            <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-505 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {language === 'vi' ? 'Yêu cầu chờ duyệt' : 'Pending Requests'}
            </h3>
            {pendingRequests.length > 0 && (
              <span className="text-xs font-black bg-indigo-600 text-slate-100 px-2 py-0.5 rounded-full font-mono shadow-xs">
                {pendingRequests.length}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                {t('dash.request.no_pending')}
              </div>
            ) : (
              pendingRequests.map(req => (
                <div 
                  key={req.id}
                  className={`p-3.5 rounded-xl border flex flex-col gap-3 leading-relaxed ${
                    isDarkMode ? 'bg-slate-950/45 border-slate-700/40' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-amber-500 uppercase tracking-wide font-mono">
                      {req.request_type === 'REPLACE' ? (language === 'vi' ? 'Thay lốp' : 'Replace') : req.request_type === 'SWAP' ? (language === 'vi' ? 'Đảo lốp' : 'Rotation') : (language === 'vi' ? 'Sửa bọc' : 'Repair')}
                    </div>
                    <div className={`text-xs mt-1 leading-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {req.request_type === 'REPLACE' 
                        ? `${language === 'vi' ? 'Thay lốp' : 'Replace'}: ${req.asset_id} · ${req.position}`
                        : `${language === 'vi' ? 'Đảo lốp' : 'Rotate axis'}: ${req.asset_id} · ${req.position} ↔ ${req.swap_position}`
                      }
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1 select-none">
                    <button
                      id={`req_approve_btn_${req.id}`}
                      type="button"
                      onClick={() => onActionApproveRequest(req.id)}
                      className="py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> {language === 'vi' ? 'Duyệt' : 'Approve'}
                    </button>
                    <button
                      id={`req_reject_btn_${req.id}`}
                      type="button"
                      onClick={() => onActionRejectRequest(req.id)}
                      className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-all ${
                        isDarkMode 
                          ? 'bg-slate-800 border border-slate-705 text-slate-300 hover:bg-red-950/20 hover:text-red-400' 
                          : 'bg-slate-100 border border-slate-200 text-slate-650 hover:bg-slate-200'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" /> {language === 'vi' ? 'Từ chối' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Operation Logs Panel */}
        <div 
          id="panel_sub_logs" 
          className="space-y-4 flex flex-col"
        >
          {/* Section 3.1: Đo lốp gần đây */}
          <div 
            className={`border rounded-2xl p-4 flex-1 ${borderClass} ${cardBgClass}`}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> {language === 'vi' ? 'Đo lốp mới nhất' : 'Recent Measurements'}
            </h4>
            <div className="text-center py-6 text-xs text-slate-555">
              {language === 'vi' ? 'Mọi dữ liệu đo đều khớp' : 'All measurements synchronized'}
            </div>
          </div>

          {/* Section 3.2: Đảo / Thay lốp gần đây */}
          <div 
            className={`border rounded-2xl p-4 flex-1 shadow-xs ${borderClass} ${cardBgClass}`}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2 mb-3">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> {language === 'vi' ? 'Bảo trì vừa thực hiện' : 'Recent Implementations'}
            </h4>
            {doneRequests.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-555 font-medium">
                {language === 'vi' ? 'Chưa ghi nhận hoạt động đảo/thay vỏ' : 'No recent operations logged'}
              </div>
            ) : (
              <div className="space-y-2 font-mono">
                {doneRequests.slice(0, 3).map(req => (
                  <div key={req.id} className={`flex justify-between items-center text-xs py-1 border-b pb-1 last:border-b-0 ${isDarkMode ? 'border-slate-700/40' : 'border-slate-100'}`}>
                    <span className="font-extrabold text-indigo-505">{req.asset_id} · {req.position}</span>
                    <span className={`px-1.5 py-0.5 rounded-md font-sans text-[10px] uppercase font-bold border ${
                      req.request_type === 'REPLACE' 
                        ? (isDarkMode ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900/20' : 'bg-indigo-700 text-white' )
                        : (isDarkMode ? 'bg-slate-850 text-slate-400 border-slate-800/30' : 'bg-slate-100 text-slate-700' )
                    }`}>
                      {req.request_type === 'REPLACE' ? (language === 'vi' ? 'Thay lốp' : 'Replace') : (language === 'vi' ? 'Đảo trục' : 'Swap')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3.3: Sửa chữa xe gần đây */}
          <div 
            className={`border rounded-2xl p-4 flex-1 shadow-xs ${borderClass} ${cardBgClass}`}
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2 mb-3">
              <Wrench className="w-3.5 h-3.5 text-indigo-400" /> {language === 'vi' ? 'Lịch sử bảo trì sửa xe' : 'Recent Workshop Repairs'}
            </h4>
            {completedRepairs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-555 font-medium">
                {language === 'vi' ? 'Đội hoạt động an toàn - Không ghi nhận lỗi' : 'All assets operational, zero active repair events'}
              </div>
            ) : (
              <div className="space-y-2">
                {completedRepairs.slice(0, 3).map(rep => (
                  <div key={rep.id} className={`flex flex-col gap-0.5 text-xs border-b pb-1 last:border-b-0 ${isDarkMode ? 'border-slate-700/40' : 'border-slate-100'}`}>
                    <div className="flex justify-between font-extrabold text-indigo-500 font-mono">
                      <span>{rep.asset_id}</span>
                      <span className="text-slate-555 font-sans font-medium text-[10px]">{language === 'vi' ? 'Xong' : 'Completed'}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] truncate leading-tight mt-0.5 font-sans">
                      {rep.fault_description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
