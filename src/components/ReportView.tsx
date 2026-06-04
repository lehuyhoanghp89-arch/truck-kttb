/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingDown, 
  Activity, 
  Award, 
  Download,
  Hammer,
  Boxes,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Truck, Trailer, Tire, TireLatest, TireMeasure, MaintRequest } from '../types';
import { triggerCsvDownload, exportToCsv } from '../utils';

interface ReportViewProps {
  trucks: Truck[];
  trailers: Trailer[];
  tires: Tire[];
  tireLatest: TireLatest[];
  tireMeasures: TireMeasure[];
  maintRequests?: MaintRequest[];
  isDarkMode: boolean;
  language?: 'vi' | 'en';
}

export default function ReportView({
  trucks,
  trailers,
  tires,
  tireLatest,
  tireMeasures,
  maintRequests = [],
  isDarkMode,
  language = 'vi'
}: ReportViewProps) {

  // Translate function wrapper
  const t = (key: string): string => {
    const dict: Record<string, { vi: string; en: string }> = {
      'report.title': { vi: 'Báo cáo phân tích lốp', en: 'Tire Analysis Report' },
      'report.desc': { vi: 'Phân tích số liệu độ gai vỏ và chu kỳ khấu hao kỹ thuật cho xe đầu kéo Port', en: 'Tread depth analysis and technical depreciation cycle for Port tractor trucks' },
      'report.export': { vi: 'Xuất báo cáo vị trí lốp', en: 'Export Position Report' },
      'report.safe_pct': { vi: 'Tỷ lệ lốp an toàn (OK)', en: 'Safe Tire Rate (OK)' },
      'report.warn_pct': { vi: 'Mức cảnh báo (WARN)', en: 'Warning Level (WARN)' },
      'report.bad_pct': { vi: 'Hư kiểm định cần thay', en: 'Inspection Failures (BAD)' },
      'report.status_stats': { vi: 'Thống kê trạng thái lốp', en: 'Tire Status Statistics' },
      'report.tires': { vi: 'Lốp vỏ', en: 'Tires' },
      'report.ok_legend': { vi: 'Lốp tốt (OK)', en: 'Good Tires (OK)' },
      'report.warn_legend': { vi: 'Cảnh báo (WARN)', en: 'Warning (WARN)' },
      'report.bad_legend': { vi: 'Hỏng hóc (BAD)', en: 'Damaged (BAD)' },
      'report.avg_depth_pos': { vi: 'Chiều sâu gai lốp trung bình theo vị trí', en: 'Average Tread Depth by Position' },
      'report.repair_req_stats': { vi: 'Biểu đồ thống kê yêu cầu sửa chữa lốp', en: 'Tire Repair & Maintenance Request Statistics' },
      'report.inventory_status': { vi: 'Biểu đồ tình trạng tồn kho lốp', en: 'Tire Inventory Status' },
      
      'lbl.req_type': { vi: 'Thống kê theo phân loại', en: 'Statistics by Type' },
      'lbl.req_status': { vi: 'Thống kê theo trạng thái', en: 'Statistics by Status' },
      
      // Status and Types
      'status.pending': { vi: 'Chờ duyệt', en: 'Pending' },
      'status.approved': { vi: 'Đã duyệt', en: 'Approved' },
      'status.rejected': { vi: 'Từ chối', en: 'Rejected' },
      'status.done': { vi: 'Hoàn thành', en: 'Completed' },
      'type.replace': { vi: 'Thay lốp', en: 'Replace' },
      'type.swap': { vi: 'Đảo lốp', en: 'Rotation/Swap' },
      'type.repair': { vi: 'Sửa bọc', en: 'Repair' },
      
      // Inventory designations
      'inv.in_use': { vi: 'Đang dùng', en: 'In Use' },
      'inv.spare': { vi: 'Dự phòng', en: 'Spare (Warehouse)' },
      'inv.damaged': { vi: 'Lốp hỏng', en: 'Damaged' },
      'inv.retired': { vi: 'Đã thanh lý', en: 'Disposed/Retired' },
      'inv.sub': { vi: 'Lượng lốp lưu chuyển trong hệ thống bãi', en: 'Total tires distributed across fleet and warehouse' }
    };
    return dict[key] ? dict[key][language] : key;
  };

  // Fetch count aggregations
  const totalTires = tireLatest.length;
  const okCount = tireLatest.filter(t => t.status === 'OK').length;
  const warnCount = tireLatest.filter(t => t.status === 'WARN').length;
  const badCount = tireLatest.filter(t => t.status === 'BAD').length;

  // Calculate percentages
  const okPct = totalTires ? Math.round((okCount / totalTires) * 100) : 0;
  const warnPct = totalTires ? Math.round((warnCount / totalTires) * 100) : 0;
  const badPct = totalTires ? Math.round((badCount / totalTires) * 100) : 0;

  // Average tread depths by tyre positions mapping (FL, FR, ORL, IRL, IRR, ORR)
  const positionKeys = ['FL', 'FR', 'ORL', 'IRL', 'IRR', 'ORR', 'A_OL', 'A_OR', 'B_OL', 'B_OR'];
  const avgDepthsByPosition = positionKeys.map(pos => {
    const matched = tireLatest.filter(t => t.position === pos);
    const avg = matched.length
      ? Number((matched.reduce((sum, item) => sum + item.depth_mm, 0) / matched.length).toFixed(1))
      : 0;
    return { position: pos, average_depth: avg };
  }).filter(item => item.average_depth > 0);

  // Maintenance Requests Breakdown Data
  const replaceCount = maintRequests.filter(r => r.request_type === 'REPLACE').length;
  const swapCount = maintRequests.filter(r => r.request_type === 'SWAP').length;
  const repairCount = maintRequests.filter(r => r.request_type === 'REPAIR').length;

  const pendingCount = maintRequests.filter(r => r.status === 'PENDING').length;
  const approvedCount = maintRequests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = maintRequests.filter(r => r.status === 'REJECTED').length;
  const doneCount = maintRequests.filter(r => r.status === 'DONE').length;

  // Tire inventory calculation
  const invInUse = tires.filter(t => t.status === 'IN_USE').length;
  const invSpare = tires.filter(t => t.status === 'SPARE').length;
  const invDamaged = tires.filter(t => t.status === 'DAMAGED').length;
  const invRetired = tires.filter(t => t.status === 'RETIRED').length;
  const grandTotalTires = tires.length;

  // Calculate percentage of inventory
  const getInvPct = (cnt: number) => {
    return grandTotalTires ? Math.round((cnt / grandTotalTires) * 100) : 0;
  };

  // Generate aggregate diagnostics data download
  const handleExportDiagnosticsReport = () => {
    const csvHdrs = [
      { key: 'position', label: language === 'vi' ? 'Vị trí lốp' : 'Tire Position' },
      { key: 'average_depth', label: language === 'vi' ? 'Độ sâu gai trung bình (mm)' : 'Avg Tread Depth (mm)' }
    ];
    const dataStr = exportToCsv(avgDepthsByPosition, csvHdrs);
    triggerCsvDownload(dataStr, language === 'vi' ? 'Bao_Cao_Gai_Trung_Binh_Vi_Tri.csv' : 'Average_Tread_Depth_By_Position.csv');
  };

  // Modern soft border classes for dark mode
  const borderClass = isDarkMode ? 'border-slate-700/50' : 'border-slate-205';
  const cardBgClass = isDarkMode ? 'bg-slate-900/40' : 'bg-white shadow-xs';

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Title block */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 ${isDarkMode ? 'border-slate-800/15' : 'border-slate-150'} select-none`}>
        <div>
          <h2 id="report_title" className="text-2xl font-black tracking-tight flex items-center gap-2">
            {t('report.title')}
          </h2>
          <p id="report_desc" className="text-xs text-slate-400 font-medium mt-0.5">
            {t('report.desc')}
          </p>
        </div>

        <button
          id="btn_download_diagnostics"
          type="button"
          onClick={handleExportDiagnosticsReport}
          className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer active:scale-98 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> {t('report.export')}
        </button>
      </div>

      {/* Main KPI aggregates strip */}
      <div id="stats_strip" className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${borderClass} ${isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-505/10 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">{t('report.safe_pct')}</span>
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">{okPct}%</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-4 ${borderClass} ${isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
          <div className="w-10 h-10 rounded-xl bg-orange-505/10 flex items-center justify-center text-orange-400">
            <TrendingDown className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">{t('report.warn_pct')}</span>
            <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">{warnPct}%</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-4 ${borderClass} ${isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
          <div className="w-10 h-10 rounded-xl bg-rose-505/10 flex items-center justify-center text-rose-455">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">{t('report.bad_pct')}</span>
            <span className="text-2xl font-black text-rose-500 font-mono tracking-tight">{badPct}%</span>
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div id="analytics_bento_grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none font-sans leading-relaxed">
        
        {/* Box 1: Pie Segment Pie Chart */}
        <div className={`lg:col-span-5 p-5 border rounded-2xl ${borderClass} ${cardBgClass}`}>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <PieChart className="w-4.5 h-4.5 text-indigo-500" /> {t('report.status_stats')}
          </h4>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            {/* Custom SVG Donut Chart */}
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDarkMode ? "#090d16" : "#f1f5f9"} strokeWidth="4" />
                
                {/* Segment 1: OK (green) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" 
                  stroke="#10b981" strokeWidth="4.2" 
                  strokeDasharray={`${okPct} ${100 - okPct}`} 
                  strokeDashoffset="0" 
                />
                
                {/* Segment 2: WARN (yellow) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" 
                  stroke="#f59e0b" strokeWidth="4.2" 
                  strokeDasharray={`${warnPct} ${100 - warnPct}`} 
                  strokeDashoffset={`-${okPct}`} 
                />
                
                {/* Segment 3: BAD (red) */}
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" 
                  stroke="#ef4444" strokeWidth="4.3" 
                  strokeDasharray={`${badPct} ${100 - badPct}`} 
                  strokeDashoffset={`-${okPct + warnPct}`} 
                />
              </svg>
              {/* Inner core title */}
              <div className="absolute flex flex-col items-center">
                <span className={`text-xl font-black font-mono leading-none ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{totalTires}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">{t('report.tires')}</span>
              </div>
            </div>

            {/* Legends list */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-lg"></span>
                <span className={`${isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-650 font-semibold'}`}>
                  {t('report.ok_legend')}: <span className={`font-bold font-mono ml-1 ${isDarkMode ? 'text-slate-200' : 'text-emerald-700'}`}>{okCount} ({okPct}%)</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 bg-amber-500 rounded-lg"></span>
                <span className={`${isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-650 font-semibold'}`}>
                  {t('report.warn_legend')}: <span className={`font-bold font-mono ml-1 ${isDarkMode ? 'text-slate-200' : 'text-amber-700'}`}>{warnCount} ({warnPct}%)</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 bg-rose-500 rounded-lg"></span>
                <span className={`${isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-655 font-semibold'}`}>
                  {t('report.bad_legend')}: <span className={`font-bold font-mono ml-1 ${isDarkMode ? 'text-slate-200' : 'text-rose-700'}`}>{badCount} ({badPct}%)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Horizontal Bar charts for tyre positions avg deep */}
        <div className={`lg:col-span-7 p-5 border rounded-2xl ${borderClass} ${cardBgClass}`}>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-500" /> {t('report.avg_depth_pos')} (mm)
          </h4>

          <div className="space-y-3.5">
            {avgDepthsByPosition.map(item => {
              const maxVal = 15;
              const barPercent = Math.min((item.average_depth / maxVal) * 100, 100);

              let barColor = 'bg-indigo-600';
              if (item.average_depth < 1.0) barColor = 'bg-rose-600';
              else if (item.average_depth < 3.0) barColor = 'bg-amber-500';
              else if (item.average_depth >= 8.0) barColor = 'bg-emerald-500';

              return (
                <div key={item.position} className="flex items-center text-xs">
                  <span className={`w-12 font-extrabold font-mono uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-750'}`}>{item.position}</span>
                  
                  <div className="flex-1 bg-slate-950/60 h-2.5 rounded-full overflow-hidden mx-3 relative border border-slate-900/20">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                      style={{ width: `${barPercent}%` }}
                    ></div>
                  </div>

                  <span className="w-16 text-right font-mono font-extrabold text-indigo-500 dark:text-indigo-400">{item.average_depth} mm</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* REPLACEMENT: Box 3: Biểu đồ thống kê yêu cầu sửa chữa */}
        <div className={`lg:col-span-6 p-5 border rounded-2xl space-y-4 ${borderClass} ${cardBgClass}`}>
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Hammer className="w-4.5 h-4.5 text-indigo-500" /> {t('report.repair_req_stats')}
            </h4>
            <span className="text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded font-mono font-bold text-indigo-400">Total: {maintRequests.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {/* Request Type Sub-chart */}
            <div className={`p-3 rounded-xl border ${borderClass} ${isDarkMode ? 'bg-slate-950/30' : 'bg-slate-50'} space-y-3`}>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">{t('lbl.req_type')}</span>
              
              <div className="space-y-2.5 text-xs">
                {/* Type REPLACE */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>{t('type.replace')}</span>
                    <span className="font-mono font-bold">{replaceCount}</span>
                  </div>
                  <div className="w-full bg-slate-905 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-sky-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${maintRequests.length ? (replaceCount / maintRequests.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Type SWAP */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>{t('type.swap')}</span>
                    <span className="font-mono font-bold">{swapCount}</span>
                  </div>
                  <div className="w-full bg-slate-905 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-550 h-full rounded-full transition-all duration-300"
                      style={{ width: `${maintRequests.length ? (swapCount / maintRequests.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Type REPAIR */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>{t('type.repair')}</span>
                    <span className="font-mono font-bold">{repairCount}</span>
                  </div>
                  <div className="w-full bg-slate-905 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${maintRequests.length ? (repairCount / maintRequests.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Status Sub-chart */}
            <div className={`p-3 rounded-xl border ${borderClass} ${isDarkMode ? 'bg-slate-950/30' : 'bg-slate-50'} space-y-3`}>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">{t('lbl.req_status')}</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 ${isDarkMode ? 'bg-slate-905/30 border border-slate-705/30' : 'bg-slate-950/20 border border-slate-200'} rounded-lg flex flex-col justify-center`}>
                  <span className="text-[9px] text-slate-450 block font-medium">{t('status.pending')}</span>
                  <span className="text-sm font-black font-mono text-amber-500 mt-1">{pendingCount}</span>
                </div>
                <div className={`p-2 ${isDarkMode ? 'bg-slate-905/30 border border-slate-705/30' : 'bg-slate-950/20 border border-slate-200'} rounded-lg flex flex-col justify-center`}>
                  <span className="text-[9px] text-slate-450 block font-medium">{t('status.approved')}</span>
                  <span className="text-sm font-black font-mono text-emerald-500 mt-1">{approvedCount}</span>
                </div>
                <div className={`p-2 ${isDarkMode ? 'bg-slate-905/30 border border-slate-705/30' : 'bg-slate-950/20 border border-slate-200'} rounded-lg flex flex-col justify-center`}>
                  <span className="text-[9px] text-slate-450 block font-medium">{t('status.done')}</span>
                  <span className="text-sm font-black font-mono text-cyan-400 mt-1">{doneCount}</span>
                </div>
                <div className={`p-2 ${isDarkMode ? 'bg-slate-905/30 border border-slate-705/30' : 'bg-slate-950/20 border border-slate-200'} rounded-lg flex flex-col justify-center`}>
                  <span className="text-[9px] text-slate-450 block font-medium">{t('status.rejected')}</span>
                  <span className="text-sm font-black font-mono text-rose-500 mt-1">{rejectedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REPLACEMENT: Box 4: Tình trạng tồn kho lốp */}
        <div className={`lg:col-span-6 p-5 border rounded-2xl space-y-4 ${borderClass} ${cardBgClass}`}>
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Boxes className="w-4.5 h-4.5 text-indigo-500" /> {t('report.inventory_status')}
            </h4>
            <span className="text-[10px] font-bold font-mono text-indigo-400 bg-indigo-500/12 px-2 py-0.5 rounded">Total: {grandTotalTires} {language === 'vi' ? 'lốp' : 'tires'}</span>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            {t('inv.sub')}
          </p>

          <div className="space-y-3 pt-1">
            {/* Stat: Đang dùng (IN_USE) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs items-center">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold">{t('inv.in_use')}</span>
                </div>
                <span className="font-mono font-black text-emerald-500">{invInUse} <span className="text-[10px] text-slate-500">({getInvPct(invInUse)}%)</span></span>
              </div>
              <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-900/10">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${getInvPct(invInUse)}%` }}
                ></div>
              </div>
            </div>

            {/* Stat: Dự phòng (SPARE) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs items-center">
                <div className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold">{t('inv.spare')}</span>
                </div>
                <span className="font-mono font-black text-indigo-400">{invSpare} <span className="text-[10px] text-slate-500">({getInvPct(invSpare)}%)</span></span>
              </div>
              <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-900/10">
                <div 
                  className="bg-indigo-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${getInvPct(invSpare)}%` }}
                ></div>
              </div>
            </div>

            {/* Stat: Lốp hỏng (DAMAGED) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs items-center">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-550" />
                  <span className="font-semibold">{t('inv.damaged')}</span>
                </div>
                <span className="font-mono font-black text-amber-500">{invDamaged} <span className="text-[10px] text-slate-500">({getInvPct(invDamaged)}%)</span></span>
              </div>
              <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-900/10">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${getInvPct(invDamaged)}%` }}
                ></div>
              </div>
            </div>

            {/* Stat: Đã thanh lý (RETIRED) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs items-center">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-semibold">{t('inv.retired')}</span>
                </div>
                <span className="font-mono font-black text-rose-500">{invRetired} <span className="text-[10px] text-slate-500">({getInvPct(invRetired)}%)</span></span>
              </div>
              <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-900/10">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${getInvPct(invRetired)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
