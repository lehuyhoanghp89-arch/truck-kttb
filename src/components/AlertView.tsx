/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Wrench, 
  RotateCw, 
  Plus, 
  Briefcase, 
  CheckCircle,
  FileText,
  X,
  Grid
} from 'lucide-react';
import { Truck, Trailer, Tire, TireLatest, MaintRequest, RepairLog } from '../types';

interface AlertViewProps {
  trucks: Truck[];
  trailers: Trailer[];
  tires: Tire[];
  tireLatest: TireLatest[];
  maintRequests: MaintRequest[];
  onAddMaintRequest: (req: Omit<MaintRequest, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => void;
  onAddRepairLog: (log: Omit<RepairLog, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => void;
  isDarkMode: boolean;
  currentUser: any;
}

export default function AlertView({
  trucks,
  trailers,
  tires,
  tireLatest,
  maintRequests,
  onAddMaintRequest,
  onAddRepairLog,
  isDarkMode,
  currentUser
}: AlertViewProps) {

  // Visual sub-view tab: 'worn_gai' (Mòn gai <3mm) or 'overdue' (Quá 30 ngày chưa đo)
  const [activeTab, setActiveTab] = useState<'worn_gai' | 'overdue'>('worn_gai');

  // Popup overlay states
  const [modalType, setModalType] = useState<'none' | 'replace' | 'swap'>('none');
  const [targetTire, setTargetTire] = useState<TireLatest | null>(null);

  // Replacement modal states
  const [selectedSpareSerial, setSelectedSpareSerial] = useState('');
  // Swapping modal states
  const [targetSwapPosition, setTargetSwapPosition] = useState('');

  // Compute Gai warnings (< 3mm)
  const wornWarnings = tireLatest.filter(t => t.depth_mm < 3.0);

  // Compute Overdue warnings (> 30 days)
  // Our static current mockup is Wednesday, June 3rd, 2026.
  // We suppose any tire whose last measure date is before May 3rd, 2026 is overdue.
  const overdueWarnings = tireLatest.filter(t => {
    const cutoffDate = new Date('2026-05-03T00:00:00Z');
    const measuredDate = t.last_updated ? new Date(t.last_updated) : new Date('2026-04-01T00:00:00Z');
    return measuredDate.getTime() < cutoffDate.getTime();
  });

  // Available spare tyres in warehouse list
  const spareWarehouseTires = tires.filter(t => t.status === 'SPARE' && t.asset_id === null);

  // Form handlers
  const handleCreateReplaceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTire) return;
    if (!selectedSpareSerial) {
      alert('Vui lòng chọn lốp dự phòng từ kho');
      return;
    }

    onAddMaintRequest({
      asset_id: targetTire.asset_id,
      asset_type: targetTire.asset_id.startsWith('RM') ? 'TRAILER' : 'TRUCK',
      position: targetTire.position,
      request_type: 'REPLACE',
      old_tire_seri: targetTire.tire_seri,
      new_tire_seri: selectedSpareSerial,
      swap_position: undefined,
      reason: 'Độ mòn gai mỏng không an toàn cơ học đường cao tốc',
      status: 'PENDING',
      requested_by: currentUser?.full_name || 'Inspector System',
      approved_by: null,
      approved_at: null,
      notes: `Yêu cầu thay lốp mòn từ trang Cảnh báo bãi cảng. Lốp thay thế: ${selectedSpareSerial}.`
    });

    alert(`Đã khởi tạo yêu cầu thay lốp thành công cho tài sản ${targetTire.asset_id} tại vị trí ${targetTire.position}! Bạn có thể phê duyệt yêu cầu này ngay lập tức tại Dashboard để áp dụng tác vụ.`);
    setModalType('none');
    setTargetTire(null);
    setSelectedSpareSerial('');
  };

  const handleCreateSwapRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTire) return;
    if (!targetSwapPosition) {
      alert('Vui lòng chọn vị trí đối ứng');
      return;
    }

    onAddMaintRequest({
      asset_id: targetTire.asset_id,
      asset_type: targetTire.asset_id.startsWith('RM') ? 'TRAILER' : 'TRUCK',
      position: targetTire.position,
      request_type: 'SWAP',
      old_tire_seri: targetTire.tire_seri,
      new_tire_seri: '',
      swap_position: targetSwapPosition,
      reason: 'Đảo trục gầm dàn xe giảm áp lực bào mòn mặt bãi',
      status: 'PENDING',
      requested_by: currentUser?.full_name || 'Inspector System',
      approved_by: null,
      approved_at: null,
      notes: `Yêu cầu đảo lốp: di chuyển ${targetTire.tire_seri} từ ${targetTire.position} sang ${targetSwapPosition}.`
    });

    alert(`Đã khởi tạo yêu cầu Đảo lốp thành công cho xe ${targetTire.asset_id}: vị trí ${targetTire.position} ↔ ${targetSwapPosition}. Hãy Duyệt phiếu tại Dashboard để hoàn tất.`);
    setModalType('none');
    setTargetTire(null);
    setTargetSwapPosition('');
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-101' : 'text-slate-800'}`}>
      
      {/* Title */}
      <div>
        <h2 id="alert_title" className="text-2xl font-black tracking-tight flex items-center gap-2">
          Hệ thống cảnh báo an toàn lốp
        </h2>
        <p id="alert_desc" className="text-xs text-slate-550 font-semibold mt-0.5">
          Tự động phát hiện lốp có nguy cơ hư hỏng và trễ lịch kiểm tra định kỳ xe tải bãi
        </p>
      </div>

      {/* Selector Subtabs (Matches Image 8 Layout) */}
      <div id="alert_tabs_row" className={`flex border-b select-none ${isDarkMode ? 'border-slate-700/50' : 'border-slate-205'}`}>
        <button
          id="tab_worn_tires"
          type="button"
          onClick={() => setActiveTab('worn_gai')}
          className={`px-5 py-3.5 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'worn_gai'
              ? 'border-rose-500 text-rose-500 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-300'
          }`}
        >
          <AlertTriangle className="w-4.5 h-4.5" />
          Mòn gai vỏ lốp (&lt; 3.0mm) ({wornWarnings.length})
        </button>

        <button
          id="tab_overdue_tires"
          type="button"
          onClick={() => setActiveTab('overdue')}
          className={`px-5 py-3.5 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'overdue'
              ? 'border-amber-500 text-amber-500 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-300'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          Trễ đo định kỳ (&gt; 30 ngày) ({overdueWarnings.length})
        </button>
      </div>

      {/* Main Alerts Table View (Matches Image 8 columns layout) */}
      <div className={`border rounded-2xl overflow-hidden leading-relaxed ${
        isDarkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-150 shadow-xs'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${
                isDarkMode ? 'bg-slate-950/60 border-slate-700/45 text-slate-450' : 'bg-slate-50 border-slate-150 text-slate-605'
              } font-bold select-none`}>
                <th className="p-4">Mã Xe / Plate</th>
                <th className="p-4">Vị trí lốp</th>
                <th className="p-4">Mã Seri Lốp</th>
                <th className="p-4">Độ sâu gai hiện tại</th>
                <th className="p-4">Lần đo cuối</th>
                <th className="p-4 text-center">Tình Trạng</th>
                <th className="p-4 text-right">Khởi Tạo Phiếu / Hành Động Nhanh</th>
              </tr>
            </thead>
            <tbody className={`divide-y select-none ${isDarkMode ? 'divide-slate-700/35' : 'divide-slate-200'}`}>
              
              {/* Gai wear mode */}
              {activeTab === 'worn_gai' && (
                wornWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 font-medium italic">
                      Yên tâm! Tất cả lốp xe trong bãi cảng đều có chiều sâu gai an toàn trên mức tối thiểu (&gt; 3mm)
                    </td>
                  </tr>
                ) : (
                  wornWarnings.map(warn => {
                    const isExtreme = warn.depth_mm < 1.0;
                    return (
                      <tr 
                        id={`warn_row_worn_${warn.tire_seri}`}
                        key={warn.tire_seri} 
                        className={`transition-all hover:bg-slate-850/5 ${isExtreme ? 'bg-rose-950/5' : ''}`}
                      >
                        <td className="p-4 font-mono">
                          <span className="font-extrabold text-indigo-400 block">{warn.asset_id}</span>
                          <span className="text-[10px] text-slate-550 block font-sans">Đầu kéo Container</span>
                        </td>
                        <td className="p-4 font-extrabold text-slate-300 uppercase">{warn.position}</td>
                        <td className="p-4 font-mono font-bold text-slate-400">{warn.tire_seri}</td>
                        <td className={`p-4 font-mono font-extrabold ${isExtreme ? 'text-rose-500 text-sm' : 'text-amber-500'}`}>
                          {warn.depth_mm} mm
                        </td>
                        <td className="p-4 text-slate-500 font-mono">{warn.last_updated ? warn.last_updated.split('T')[0] : 'Chưa thu thập'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isExtreme ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500' : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                          }`}>
                            {isExtreme ? 'Hỏng nặng (Cực mỏng)' : 'Mòn đáng kể'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              id={`action_replace_${warn.tire_seri}`}
                              type="button"
                              onClick={() => {
                                setTargetTire(warn);
                                setModalType('replace');
                                setSelectedSpareSerial('');
                              }}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-550 text-white font-bold rounded-md hover:-translate-y-[0.5px] transition-all flex items-center gap-1 cursor-pointer text-[10px] uppercase tracking-wide font-sans"
                              title="Tạo phiếu lắp lốp mới thay thế lốp mỏng gai này"
                            >
                              <Plus className="w-3 h-3" /> Thay lốp
                            </button>
 
                            <button
                              id={`action_swap_${warn.tire_seri}`}
                              type="button"
                              onClick={() => {
                                setTargetTire(warn);
                                setModalType('swap');
                                setTargetSwapPosition('');
                              }}
                              className={`px-2 py-1 font-bold rounded-md hover:-translate-y-[0.5px] transition-all flex items-center gap-1 cursor-pointer text-[10px] uppercase tracking-wide font-sans border ${
                                isDarkMode 
                                  ? 'bg-slate-955 border-slate-700/60 hover:bg-slate-800 text-orange-400' 
                                  : 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700'
                              }`}
                              title="Tạo phiếu đảo lốp sang trục khác chịu lực ít hơn"
                            >
                              <RotateCw className="w-3 h-3" /> Đảo lốp
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              )}

              {/* Overdue check mode */}
              {activeTab === 'overdue' && (
                overdueWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-505 font-medium italic">
                      Tuyệt vời! Toàn bộ lốp xe đã được kiểm tra liên tục trong vòng 30 ngày qua.
                    </td>
                  </tr>
                ) : (
                  overdueWarnings.map(warn => (
                    <tr 
                      id={`warn_row_overdue_${warn.tire_seri}`}
                      key={warn.tire_seri} 
                      className="transition-all hover:bg-slate-850/5"
                    >
                      <td className="p-4 font-mono font-extrabold text-indigo-400">{warn.asset_id}</td>
                      <td className="p-4 font-extrabold text-slate-300 uppercase">{warn.position}</td>
                      <td className="p-4 font-mono text-slate-450">{warn.tire_seri}</td>
                      <td className="p-4 font-mono text-slate-300">{warn.depth_mm} mm</td>
                      <td className="p-4 text-amber-505 font-mono font-bold">
                        {warn.last_updated ? warn.last_updated.split('T')[0] : '04/15/2026'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-500 uppercase">
                          Quá hạn {Math.floor((new Date('2026-06-03').getTime() - (warn.last_updated ? new Date(warn.last_updated).getTime() : new Date('2026-04-15').getTime())) / (1000 * 300 * 200 * 24))} ngày
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            id={`action_remeasure_${warn.tire_seri}`}
                            type="button"
                            onClick={() => alert(`Để đo lại lốp, quý khách vui lòng truy cập menu "Đo lốp" ngoài sidebar và chọn phương tiện ${warn.asset_id} để hoàn thành tác vụ.`)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md hover:-translate-y-[0.5px] transition-all flex items-center gap-1.5 cursor-pointer text-[11px]"
                          >
                            <Clock className="w-3 h-3" /> Yêu cầu đo lại lốp ngay
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Popups overlay layout for alerts activity creators */}
      {modalType !== 'none' && targetTire && (
        <div id="alert_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs leading-relaxed">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 font-sans ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-205 text-slate-800'
          }`}>
            
            {/* Modal Header */}
            <div className={`flex justify-between items-start border-b pb-4 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-205'}`}>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-indigo-500">
                  {modalType === 'replace' && 'Lắp lốp mới thay thế'}
                  {modalType === 'swap' && 'Gửi phiếu Đảo lốp'}
                  {modalType === 'retread' && 'Gia cố / Bọc dán vỏ'}
                </h4>
                <p className="text-xs text-slate-550 mt-1 select-none">
                  Sản phẩm: Vị trí <span className="font-bold text-slate-200">{targetTire.position}</span> trên xe đầu kéo <span className="font-bold text-slate-200">{targetTire.asset_id}</span>
                </p>
              </div>
              <button
                id="close_modal"
                type="button"
                onClick={() => {
                  setModalType('none');
                  setTargetTire(null);
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                  isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal forms depending on type */}
            {modalType === 'replace' && (
              <form onSubmit={handleCreateReplaceRequest} className="space-y-4">
                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-slate-400">
                  ⚠️ Lốp hiện tại: <span className="font-extrabold font-mono text-rose-450">{targetTire.tire_seri}</span> có độ gai chỉ còn <span className="font-extrabold text-rose-450">{targetTire.depth_mm}mm</span> (Mòn mỏng nguy hiểm bám sát mặt).
                </div>

                <div>
                  <label id="spare_sel" className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Chọn lốp thay thế từ kho bãi *</label>
                  {spareWarehouseTires.length === 0 ? (
                    <div className={`text-center py-4 rounded-xl text-xs italic border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700/50 text-slate-555' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      Cảnh báo: Hiện không còn vỏ lốp dự trữ nào trong kho bãi! Hãy nhập thêm lốp tại "Kho lốp" để xử lý.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedSpareSerial}
                      onChange={e => setSelectedSpareSerial(e.target.value)}
                      className={`w-full px-3.5 py-3 rounded-xl text-xs outline-none font-mono border ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-505 text-slate-250' : 'bg-white border-slate-300 focus:border-indigo-500 text-slate-900'
                      }`}
                    >
                      <option value="">-- Ấn chọn lốp dự trữ --</option>
                      {spareWarehouseTires.map(t => (
                        <option key={t.id} value={t.tire_seri}>
                          Seri: {t.tire_seri} · Hiệu: {t.brand} · Độ gai: {t.current_depth}mm
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  id="submit_replace"
                  type="submit"
                  disabled={spareWarehouseTires.length === 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-center transition-all"
                >
                  Gửi yêu cầu phê duyệt
                </button>
              </form>
            )}

            {modalType === 'swap' && (
              <form onSubmit={handleCreateSwapRequest} className="space-y-4">
                <div>
                  <label id="lbl_swap" className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Chọn vị trí lốp đối ứng trên xe *</label>
                  <select
                    required
                    value={targetSwapPosition}
                    onChange={e => setTargetSwapPosition(e.target.value)}
                    className={`w-full px-3.5 py-3 rounded-xl text-xs outline-none border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-505 text-slate-250' : 'bg-white border-slate-300 focus:border-indigo-500 text-slate-900'
                    }`}
                  >
                    <option value="">-- Chọn vị trí đảo ngược --</option>
                    {targetTire.asset_id.startsWith('RM') ? (
                      /* Trailer slots */
                      <>
                        <option value="A_OL">Trục A - Ngoài Trái (A_OL)</option>
                        <option value="A_OR">Trục A - Ngoài Phải (A_OR)</option>
                        <option value="B_OL">Trục B - Ngoài Trái (B_OL)</option>
                        <option value="B_OR">Trục B - Ngoài Phải (B_OR)</option>
                      </>
                    ) : (
                      /* Truck slots */
                      <>
                        <option value="FL">Trục Lái - Trái (FL)</option>
                        <option value="FR">Trục Lái - Phải (FR)</option>
                        <option value="ORL">Trục Sau - Ngoài Trái (ORL)</option>
                        <option value="ORR">Trục Sau - Ngoài Phải (ORR)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className={`text-[10px] leading-normal p-3 rounded-xl border border-dashed ${
                  isDarkMode ? 'text-slate-450 bg-slate-950/20 border-slate-700/50' : 'text-slate-500 bg-slate-50 border-slate-205'
                }`}>
                  Quy trình đảo lốp giúp nâng cao tuổi thọ gai lốp thêm 15-20% bằng cách phân bố lại lực chà sát mài mòn từ bãi cảng.
                </div>

                <button
                  id="submit_swap"
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer shadow-lg transition-all"
                >
                  Đăng ký phiếu đảo lốp
                </button>
              </form>
            )}

            {/* Swapping form inside modal */}

          </div>
        </div>
      )}

    </div>
  );
}
