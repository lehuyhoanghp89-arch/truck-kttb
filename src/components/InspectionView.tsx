/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CalendarDays, 
  Search, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  ChevronDown
} from 'lucide-react';
import { Truck, Trailer } from '../types';
import { getInspectionStatus } from '../utils';

interface InspectionViewProps {
  trucks: Truck[];
  trailers: Trailer[];
  onEditTruckExpiry: (id: string, nextDate: string) => void;
  onEditTrailerExpiry: (id: string, nextDate: string) => void;
  isDarkMode: boolean;
  language?: 'vi' | 'en';
}

export default function InspectionView({
  trucks,
  trailers,
  onEditTruckExpiry,
  onEditTrailerExpiry,
  isDarkMode,
  language = 'vi'
}: InspectionViewProps) {

  // Search filter options
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPIRED_WARN'>('ALL'); // ALL, EXPIRED_WARN (Sắp hết hạn đăng kiểm)

  // Track inline date correction ID
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [nextExpiryInput, setNextExpiryInput] = useState('');

  // Assemble full fleet assets with unified structure for unified registry tracking
  const unifiedFleet = [
    ...trucks.map(t => ({
      id: t.id,
      asset_id: t.truck_id,
      license_plate: t.license_plate,
      model: t.model,
      type: 'TRUCK' as const,
      inspection_expiry: t.inspection_expiry,
      status: t.status
    })),
    ...trailers.map(t => ({
      id: t.id,
      asset_id: t.trailer_id,
      license_plate: t.license_plate,
      model: t.model,
      type: 'TRAILER' as const,
      inspection_expiry: t.inspection_expiry,
      status: t.status
    }))
  ].sort((a, b) => a.asset_id.localeCompare(b.asset_id, undefined, { numeric: true, sensitivity: 'base' }));

  // Apply visual filtering
  const filteredDataset = unifiedFleet.filter(item => {
    // Search query constraint
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      item.asset_id.toLowerCase().includes(query) ||
      item.license_plate.toLowerCase().includes(query) ||
      item.model.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Days alarm status logic
    if (filterType === 'EXPIRED_WARN') {
      const stats = getInspectionStatus(item.inspection_expiry);
      return stats.status === 'OVERDUE' || stats.status === 'NEAR_EXPIRY';
    }

    return true;
  });

  // Handle saving new calendar expiry date
  const handleUpdateExpiry = (id: string, type: 'TRUCK' | 'TRAILER', targetDate: string) => {
    if (!targetDate) return;
    if (type === 'TRUCK') {
      onEditTruckExpiry(id, targetDate);
    } else {
      onEditTrailerExpiry(id, targetDate);
    }
    setEditingAssetId(null);
    alert('Đã gia hạn đăng kiểm mới thành công cho phương tiện!');
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-101' : 'text-slate-800'}`}>
      
      {/* View Titles */}
      <div>
        <h2 id="inspect_title" className="text-2xl font-black tracking-tight select-none">
          {language === 'vi' ? 'Kiểm định đăng kiểm' : 'Vehicle Inspection'}
        </h2>
        <p id="inspect_desc" className="text-xs text-slate-505 font-medium mt-0.5">
          {language === 'vi' ? 'Theo dõi chu kỳ gia hạn đăng kiểm và kiểm định giao thông bắt buộc tại bãi cảng' : 'Track inspection renewal cycles and mandatory traffic checks at the port'}
        </p>
      </div>

      {/* Primary search controls (Matches Image 16 layout buttons block) */}
      <div id="inspect_top_row" className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 select-none ${isDarkMode ? 'border-slate-700/50' : 'border-slate-205'}`}>
        
        {/* Toggle alarms subtabs */}
        <div id="tabs_inspect" className={`flex p-1.5 rounded-xl border max-w-sm ${isDarkMode ? 'bg-slate-950/20 border-slate-705' : 'bg-slate-100 border-slate-200'}`}>
          <button
            id="inspect_tab_all"
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filterType === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'vi' ? 'Tất cả' : 'All'} ({unifiedFleet.length})
          </button>
          <button
            id="inspect_tab_warn"
            type="button"
            onClick={() => setFilterType('EXPIRED_WARN')}
            className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filterType === 'EXPIRED_WARN' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'vi' ? 'Khẩn cấp/Sắp hạn' : 'Alert/Expired'}
          </button>
        </div>

        {/* Searching bar */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="inspect_search_input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã xe, biển số..."
            className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl outline-none border transition-all ${
              isDarkMode 
                ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-505' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
          />
        </div>

      </div>

      {/* Grid dataset display styled in table layout matching Image 16 */}
      <div className={`border rounded-2xl overflow-hidden leading-relaxed ${
        isDarkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-150 shadow-xs'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className={`border-b ${
                isDarkMode ? 'bg-slate-950/60 border-slate-700/45 text-slate-450' : 'bg-slate-50 border-slate-150 text-slate-655'
              } font-bold`}>
                <th className="p-4">Loại hình</th>
                <th className="p-4">Mã tài sản</th>
                <th className="p-4">Biển kiểm soát</th>
                <th className="p-4">Tình trạng sửa chữa?</th>
                <th className="p-4">Ngày Đăng Kiểm hết hạn</th>
                <th className="p-4">Hạn quy chuẩn còn lại</th>
                <th className="p-4 text-right">Cập Nhật Ngày Đăng Kiểm nhanh</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/35' : 'divide-slate-200'}`}>
              {filteredDataset.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-550 font-medium italic">
                    Không tìm thấy phương tiện nào khớp với phạm vi lọc lịch gia hạn.
                  </td>
                </tr>
              ) : (
                filteredDataset.map(item => {
                  const inspStats = getInspectionStatus(item.inspection_expiry);
                  const isEditingThis = editingAssetId === item.asset_id;
 
                  let countdownBadge = 'bg-slate-800 text-slate-455';
                  if (inspStats.status === 'OVERDUE') {
                    countdownBadge = 'bg-rose-500 text-white font-extrabold shadow-sm ring-1 ring-rose-400/25';
                  } else if (inspStats.status === 'NEAR_EXPIRY') {
                    countdownBadge = isDarkMode 
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm ring-1 ring-amber-400/20' 
                      : 'bg-amber-100 text-amber-802 border border-amber-200 font-extrabold';
                  } else if (inspStats.status === 'VALID') {
                    countdownBadge = isDarkMode 
                      ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' 
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold';
                  }
 
                  return (
                    <tr 
                      id={`inspect_row_${item.asset_id}`}
                      key={item.asset_id}
                      className="transition-all hover:bg-slate-850/5"
                    >
                      {/* Typology */}
                      <td className="p-4 font-bold col-span-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          item.type === 'TRUCK' 
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                        }`}>
                          {item.type === 'TRUCK' ? 'XE TẢI' : 'RƠ MOÓC'}
                        </span>
                      </td>
 
                      {/* Asset ID token */}
                      <td className={`p-4 font-extrabold tracking-wide font-mono ${isDarkMode ? 'text-slate-205' : 'text-slate-900 text-sm'}`}>
                        {item.asset_id}
                      </td>
 
                      {/* License plate */}
                      <td className={`p-4 font-mono font-bold text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                        {item.license_plate}
                      </td>
 
                      {/* Fault warning state */}
                      <td className="p-4">
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                          item.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {item.status === 'ACTIVE' ? 'Sẵn sàng' : 'Đang bảo trì'}
                        </span>
                      </td>
 
                      {/* Calendar date string */}
                      <td className={`p-4 font-mono font-bold text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-750'}`}>
                        {item.inspection_expiry}
                      </td>
 
                      {/* Countdown Visual indicator */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[11px] rounded-lg ${countdownBadge}`}>
                          {inspStats.label}
                        </span>
                      </td>

                      {/* Direct update controls */}
                      <td className="p-4 text-right">
                        {isEditingThis ? (
                          <div className="flex items-center justify-end gap-1.5 select-none">
                            <input
                              type="date"
                              required
                              value={nextExpiryInput}
                              onChange={e => setNextExpiryInput(e.target.value)}
                              onClick={e => { try { e.currentTarget.showPicker(); } catch(err) {} }}
                              className={`px-2 py-1 border rounded-md font-mono text-xs focus:border-indigo-500 outline-none ${
                                isDarkMode 
                                  ? 'bg-slate-950 border-slate-705 text-slate-100' 
                                  : 'bg-white border-slate-300 text-slate-900 font-bold'
                              }`}
                            />
                            <button
                              id={`save_exp_${item.asset_id}`}
                              type="button"
                              onClick={() => handleUpdateExpiry(item.id, item.type, nextExpiryInput)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md font-sans text-xs cursor-pointer active:scale-97"
                            >
                              Lưu
                            </button>
                            <button
                              id={`cancel_exp_${item.asset_id}`}
                              type="button"
                              onClick={() => setEditingAssetId(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-350 rounded-md text-xs hover:bg-slate-700"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`edit_exp_${item.asset_id}`}
                            type="button"
                            onClick={() => {
                              setEditingAssetId(item.asset_id);
                              setNextExpiryInput(item.inspection_expiry);
                            }}
                            className={`px-2.5 py-1.5 font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1.5 ml-auto border ${
                              isDarkMode 
                                ? 'bg-slate-955 border-slate-700 hover:bg-slate-800 text-indigo-400 hover:text-indigo-350' 
                                : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-750'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Gia hạn đăng kiểm
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}
