/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Search, 
  Activity, 
  ArrowLeft, 
  Check, 
  TrendingUp, 
  Calendar,
  X,
  Info 
} from 'lucide-react';
import { Truck, Trailer, Tire, TireLatest, TireMeasure } from '../types';
import { getTireStatus, getInspectionStatus } from '../utils';

interface TireMeasureViewProps {
  trucks: Truck[];
  trailers: Trailer[];
  tires: Tire[];
  tireLatest: TireLatest[];
  onAddTireMeasure: (measure: Omit<TireMeasure, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => void;
  onReplaceTireWithSpare?: (assetId: string, position: string, damagedSeri: string, damageCause: string, replacementSeri: string) => void;
  onMountTireToVehicle?: (serial: string, assetId: string, position: string) => void;
  onUnmountTireFromVehicle?: (serial: string) => void;
  isDarkMode: boolean;
  currentUser: any;
  language?: 'vi' | 'en';
}

export default function TireMeasureView({
  trucks,
  trailers,
  tires,
  tireLatest,
  onAddTireMeasure,
  onReplaceTireWithSpare,
  onMountTireToVehicle,
  onUnmountTireFromVehicle,
  isDarkMode,
  currentUser,
  language = 'vi'
}: TireMeasureViewProps) {

  // Current sub-view step: 'selection' or 'active_measure'
  const [step, setStep] = useState<'selection' | 'active_measure'>('selection');
  
  // Selection tab filter: 'truck' or 'trailer'
  const [tab, setTab] = useState<'truck' | 'trailer'>('truck');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected vehicle tracking
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<'TRUCK' | 'TRAILER'>('TRUCK');

  // Input results sidebar drawer states
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [depthInput, setDepthInput] = useState('');
  const [measuredAt, setMeasuredAt] = useState('2026-06-05');
  const [measureNotes, setMeasureNotes] = useState('');
  const [errInput, setErrInput] = useState('');

  // Local state for selecting spare tire to mount
  const [mountSpareSeri, setMountSpareSeri] = useState('');

  // Damaged tyre report state variables
  const [isDamagedChecked, setIsDamagedChecked] = useState(false);
  const [damageCause, setDamageCause] = useState('');
  const [selectedSpareSeri, setSelectedSpareSeri] = useState('');

  // Handle asset selecting
  const handleSelectAsset = (assetId: string, assetType: 'TRUCK' | 'TRAILER') => {
    setSelectedAssetId(assetId);
    setSelectedAssetType(assetType);
    setStep('active_measure');
    setSelectedPosition(null);
  };

  const handleBackToSelect = () => {
    setStep('selection');
    setSelectedAssetId(null);
    setSelectedPosition(null);
  };

  // Click wheel on interactive skeleton
  const handleWheelClick = (position: string) => {
    // Find current tyre on this position, if none exist, warn
    const currentTyre = tireLatest.find(
      t => t.asset_id === selectedAssetId && t.position === position
    );
    
    setSelectedPosition(position);
    setDepthInput(currentTyre ? String(currentTyre.depth_mm) : '5.5');
    setMeasuredAt(new Date().toISOString().split('T')[0]);
    setMeasureNotes('');
    setErrInput('');
    setMountSpareSeri('');

    // Reset damaged states
    setIsDamagedChecked(false);
    setDamageCause('');
    setSelectedSpareSeri('');
  };

  // Submit tire measurement or replacement
  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedPosition) return;

    if (isDamagedChecked) {
      if (!damageCause.trim()) {
        setErrInput('Vui lòng nhập nguyên nhân hỏng lốp (VD: Nổ lốp, nứt thành).');
        return;
      }
      if (!selectedSpareSeri) {
        setErrInput('Vui lòng chọn một chiếc lốp dự phòng thay thế phù hợp.');
        return;
      }

      // Collect current wheel serial 
      const currentWheelTire = tireLatest.find(
        t => t.asset_id === selectedAssetId && t.position === selectedPosition
      );
      const damagedSeri = currentWheelTire ? currentWheelTire.tire_seri : `AUTO-${selectedAssetId}-${selectedPosition}`;

      if (onReplaceTireWithSpare) {
        onReplaceTireWithSpare(selectedAssetId, selectedPosition, damagedSeri, damageCause, selectedSpareSeri);
        alert(`Báo hỏng lốp ${damagedSeri} và thay bằng lốp dự phòng ${selectedSpareSeri} thành công!`);
        setSelectedPosition(null);
        setIsDamagedChecked(false);
        setDamageCause('');
        setSelectedSpareSeri('');
        return;
      }
    }

    const depth = parseFloat(depthInput);
    if (isNaN(depth) || depth < 0 || depth > 25) {
      setErrInput('Độ sâu gai phải là số hợp lệ từ 0 đến 25 (mm).');
      return;
    }

    // Capture serial number if mapping exists, else general auto-generated serial
    const record = tireLatest.find(
      t => t.asset_id === selectedAssetId && t.position === selectedPosition
    );
    const resolvedSeri = record ? record.tire_seri : `AUTO-${selectedAssetId}-${selectedPosition}`;

    // Add entry
    onAddTireMeasure({
      asset_id: selectedAssetId,
      asset_type: selectedAssetType,
      position: selectedPosition,
      tire_seri: resolvedSeri,
      depth_mm: depth,
      status: getTireStatus(depth, selectedAssetType), // dynamically calculate status
      measured_at: new Date().toISOString(),
      measured_by: currentUser.full_name || 'Hoàng Lê Huy',
      notes: measureNotes
    });

    alert(`Đã lưu kết quả đo chiều sâu gai lốp (${depth}mm) cho vị trí ${selectedPosition} thành công!`);
    setSelectedPosition(null);
    setDepthInput('');
    setMeasureNotes('');
  };

  // Searching logic
  const filteredTrucks = trucks.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return t.truck_id.toLowerCase().includes(q) || t.license_plate.toLowerCase().includes(q);
  });

  const filteredTrailers = trailers.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return t.trailer_id.toLowerCase().includes(q) || t.license_plate.toLowerCase().includes(q);
  });

  const getDisplayPosition = (pos: string | null): string => {
    if (!pos) return '';
    if (selectedAssetType === 'TRAILER') {
      const mapping: { [key: string]: string } = {
        'A_OL': 'OFL',
        'A_IL': 'IFL',
        'A_IR': 'IFR',
        'A_OR': 'OFR',
        'B_OL': 'ORL',
        'B_IL': 'IRL',
        'B_IR': 'IRR',
        'B_OR': 'ORR'
      };
      return mapping[pos] || pos;
    }
    return pos;
  };

  // Helper render wheel component inside skeleton
  const renderInteractiveWheel = (position: string, label: string) => {
    const record = tireLatest.find(
      t => t.asset_id === selectedAssetId && t.position === position
    );
    const isSelected = selectedPosition === position;

    let bgClass = 'bg-slate-950 border-slate-750 text-slate-500 hover:border-slate-500';
    if (record) {
      if (record.status === 'OK') bgClass = 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500';
      else if (record.status === 'WARN') bgClass = 'bg-amber-950/20 border-amber-500/50 text-amber-400 hover:bg-amber-950/40 hover:border-amber-500';
      else if (record.status === 'BAD') bgClass = 'bg-rose-950/20 border-rose-500/50 text-rose-450 hover:bg-rose-950/40 hover:border-rose-500';
    }

    if (isSelected) {
      bgClass = 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-4 ring-indigo-500/20';
    }

    return (
      <button
        id={`interactive_wheel_${position}`}
        key={position}
        type="button"
        onClick={() => handleWheelClick(position)}
        className={`border-2 p-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer font-sans min-h-[70px] ${bgClass}`}
      >
        <span className="text-[10px] uppercase font-black tracking-wider leading-none">{label}</span>
        <span className="text-sm font-black font-mono tracking-wide mt-1 block">
          {record ? `${record.depth_mm}` : '?'}
        </span>
        <span className="text-[8px] font-mono opacity-80 mt-0.5 truncate max-w-[69px]">
          {record ? record.tire_seri.slice(-8) : 'Không lốp'}
        </span>
      </button>
    );
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-101' : 'text-slate-800'}`}>
      
      {/* Step 1: Selection screen */}
      {step === 'selection' && (
        <div id="selection_view_wrapper" className="space-y-6 leading-relaxed">
          <div>
            <h2 id="measure_title" className="text-2xl font-black tracking-tight">
              {language === 'vi' ? 'Đo lốp' : 'Tire Measurement'}
            </h2>
            <p id="measure_desc" className="text-xs text-slate-505 font-medium mt-0.5">
              {language === 'vi' ? 'Nhập số liệu đo độ sâu gai lốp định kỳ cho xe và rơ moóc' : 'Enter periodic tire tread depth measurements for trucks and trailers'}
            </p>
          </div>

          {/* Subtabs filter (Matches Image 10: Tab "Truck" and Tab "Trailer") */}
          <div id="measure_tabs" className="flex bg-slate-950/20 p-1.5 rounded-xl border border-slate-700/50 max-w-sm select-none">
            <button
              id="measure_tab_truck"
              onClick={() => setTab('truck')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'truck' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-105'
              }`}
            >
              Truck
            </button>
            <button
              id="measure_tab_trailer"
              onClick={() => setTab('trailer')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'trailer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-105'
              }`}
            >
              Trailer
            </button>
          </div>

          {/* Search box input */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4_5 h-4_5 text-slate-501" />
            <input
              id="measure_search_input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã xe hoặc biển số..."
              className={`w-full pl-11 pr-4 py-2.5 text-sm rounded-xl outline-none border transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-505' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Vehicles list for selecting (Matches Image 10 list elements with Chevron triggers) */}
          <div id="measure_vehicles_list" className="space-y-2 max-w-2xl">
            {tab === 'truck' ? (
              filteredTrucks.map(truck => (
                <div
                  id={`item_row_measure_truck_${truck.truck_id}`}
                  key={truck.id}
                  onClick={() => handleSelectAsset(truck.truck_id, 'TRUCK')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900/40 border-slate-705 hover:border-indigo-505/30' 
                      : 'bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-250 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 font-sans">
                    <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-400">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className={`font-extrabold font-mono text-sm tracking-wide block ${isDarkMode ? 'text-slate-200' : 'text-slate-850'}`}>{truck.truck_id}</span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider">{truck.license_plate} · {truck.model}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              ))
            ) : (
              filteredTrailers.map(trailer => (
                <div
                  id={`item_row_measure_trailer_${trailer.trailer_id}`}
                  key={trailer.id}
                  onClick={() => handleSelectAsset(trailer.trailer_id, 'TRAILER')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900/40 border-slate-705 hover:border-indigo-505/30' 
                      : 'bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-250 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 font-sans">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className={`font-extrabold font-mono text-sm tracking-wide block ${isDarkMode ? 'text-slate-200' : 'text-slate-850'}`}>{trailer.trailer_id}</span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider">{trailer.license_plate} · {trailer.model}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 2: Interactive measurement screen display */}
      {step === 'active_measure' && selectedAssetId && (
        <div id="active_measure_screen" className="space-y-6">
          
          {/* Back navigational bar (Matches Image 11 Header layouts) */}
          <div className={`flex items-center justify-between border-b pb-4 select-none ${isDarkMode ? 'border-slate-700/50' : 'border-slate-205'}`}>
            <div className="flex items-center gap-3">
              <button
                id="btn_back_to_selection"
                type="button"
                onClick={handleBackToSelect}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="w-4 h-4 text-slate-305" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black font-sans">{selectedAssetId}</h3>
                  <span className="text-[9.5px] uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold px-1.5 py-0.5 rounded-md">
                    ACTIVE
                  </span>
                </div>
                <span className="text-xs text-slate-505 font-medium block">
                  {selectedAssetType === 'TRUCK' ? 'Xe đầu kéo vận hành' : 'Rơ moóc tải container'}
                </span>
              </div>
            </div>

            <span className="text-xs text-slate-500 italic">Nhấp vào từng lốp để ghi số đo độ sâu gai</span>
          </div>

          {/* Interactive grid elements & standard cards panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Skeletal Wheel selection diagram center panel */}
            <div className={`lg:col-span-8 p-6 border rounded-2xl flex flex-col items-center ${
              isDarkMode ? 'bg-slate-900/20 border-slate-705' : 'bg-slate-50/50 border-slate-150'
            }`}>
              
              <div className="text-xs text-slate-500 italic mb-4 font-semibold flex items-center gap-1.5 justify-center">
                <Info className="w-3.5 h-3.5 text-blue-500" /> Click vào lốp để nhập số liệu
              </div>

              {selectedAssetType === 'TRUCK' ? (
                /* Interactive Truck Skeleton (Image 11) */
                <div id="interactive_truck_skeleton" className="space-y-6 w-full max-w-sm">
                  
                  {/* Front Axle */}
                  <div className="text-center text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">Trục trước (FL / FR)</div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderInteractiveWheel('FL', 'FL (lái TRÁI)')}
                    {renderInteractiveWheel('FR', 'FR (lái PHẢI)')}
                  </div>

                  {/* Rear Axle Container */}
                  <div className="text-center text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mt-4">Trục sau (RL / RR)</div>
                  <div className="grid grid-cols-4 gap-2">
                    {renderInteractiveWheel('ORL', 'ORL (ngoài TRÁI)')}
                    {renderInteractiveWheel('IRL', 'IRL (trong TRÁI)')}
                    {renderInteractiveWheel('IRR', 'IRR (trong PHẢI)')}
                    {renderInteractiveWheel('ORR', 'ORR (ngoài PHẢI)')}
                  </div>

                  <div className="text-center pt-8 opacity-25">
                    <span className="text-[10px] tracking-widest font-black uppercase block">↑ Hướng mũi đầu kéo</span>
                  </div>

                </div>
              ) : (
                /* Interactive Trailer 8-wheel Skeleton (Image 14) */
                <div id="interactive_trailer_skeleton" className="space-y-6 w-full max-w-md">
                  
                  {/* Axle A */}
                  <div className="text-center text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">Trục A (Vị trí trước rơ moóc)</div>
                  <div className="grid grid-cols-4 gap-2">
                    {renderInteractiveWheel('A_OL', 'OFL')}
                    {renderInteractiveWheel('A_IL', 'IFL')}
                    {renderInteractiveWheel('A_IR', 'IFR')}
                    {renderInteractiveWheel('A_OR', 'OFR')}
                  </div>

                  {/* Axle B */}
                  <div className="text-center text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mt-4">Trục B (Vị trí sau rơ moóc)</div>
                  <div className="grid grid-cols-4 gap-2">
                    {renderInteractiveWheel('B_OL', 'ORL')}
                    {renderInteractiveWheel('B_IL', 'IRL')}
                    {renderInteractiveWheel('B_IR', 'IRR')}
                    {renderInteractiveWheel('B_OR', 'ORR')}
                  </div>

                  <div className="text-center pt-8 opacity-25">
                    <span className="text-[10px] tracking-widest font-black uppercase block">↑ Hướng mũi rơ moóc kéo đầu</span>
                  </div>

                </div>
              )}

            </div>

            {/* Assessment guideline side-container panel (Matches Image 11 right-panels) */}
            <div className="lg:col-span-4 space-y-4 font-sans select-none">
              
              {/* Box 1: Tiêu chuẩn đánh giá */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-705' : 'bg-white border-slate-200'}`}>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 block">Tiêu chuẩn đánh giá</h4>
                <div className="space-y-2 font-semibold text-xs leading-normal">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-emerald-500">🟢 OK  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ≥ 3mm (An toàn bám tốt)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                    <span className="text-amber-500">🟡 WARN &nbsp;&nbsp;&nbsp; 1 - 3mm (Cần lưu ý kiểm định)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                    <span className="text-rose-550">🔴 BAD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt; 1mm (Nguy cơ hỏng, thay gấp)</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Trạng thái hiện tại selection wheel info */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-705' : 'bg-white border-slate-200'}`}>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Thông số chi tiết</h4>
                
                {selectedPosition ? (
                  <div className="space-y-3 pt-2 text-xs leading-relaxed">
                    <div className="p-3 bg-blue-900/10 border border-blue-500/15 rounded-xl">
                      <span className="font-extrabold text-blue-400 block text-sm uppercase">Lốp {getDisplayPosition(selectedPosition)}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-1 font-mono">
                        {tireLatest.find(t => t.asset_id === selectedAssetId && t.position === selectedPosition)?.tire_seri || 'Chưa gắn lốp mã định danh'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-700/30 pb-2">
                      <span className="text-slate-500 font-medium">Chiều sâu gai cũ:</span>
                      <span className="font-extrabold text-slate-300 font-mono">
                        {tireLatest.find(t => t.asset_id === selectedAssetId && t.position === selectedPosition)?.depth_mm || 0} mm
                      </span>
                    </div>

                    <div className="flex justify-between pb-2 border-b border-slate-700/30">
                      <span className="text-slate-500 font-medium">Nhân viên sửa cuối:</span>
                      <span className="font-extrabold text-slate-450">
                        {tireLatest.find(t => t.asset_id === selectedAssetId && t.position === selectedPosition)?.measured_by || 'Hoàng Lê Huy'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs py-4 leading-normal">
                    Hãy nhấp chọn một lốp trên sơ đồ để xem thông số và ghi số liệu đo lốp mới.
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Type 3: Measurement Entry slideout (Image 12 & 15 Popup form) */}
          {selectedPosition && (
            <div id="measure_drawer_overlay" className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs select-none">
              <div className="flex-1" onClick={() => setSelectedPosition(null)}></div>
              
              <div className={`w-full max-w-md h-screen p-6 overflow-y-auto shadow-2xl flex flex-col justify-between border-l leading-relaxed font-sans ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-205 text-slate-800'
              }`}>
                
                <div className={`flex justify-between items-center border-b pb-4 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-150'}`}>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-indigo-500">
                      Đo lốp · {getDisplayPosition(selectedPosition)}
                    </h3>
                    <span className="text-[10px] text-slate-550 font-mono select-none block">Vehicle: {selectedAssetId}</span>
                  </div>
                  <button 
                    id="measure_close"
                    type="button" 
                    onClick={() => setSelectedPosition(null)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                      isDarkMode ? 'border-slate-700 hover:bg-slate-805' : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                 {/* Form Measurement Details */}
                 <form onSubmit={handleSaveResult} className="flex-1 py-8 space-y-5">
                   {errInput && <div className="p-3 text-xs text-rose-455 bg-rose-950/20 border border-rose-500/25 rounded-xl">{errInput}</div>}
 
                   <div>
                     <label id="lbl_pos" className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5 font-sans">Vị trí lốp</label>
                     <div className={`w-full px-3.5 py-3 border rounded-xl font-bold font-sans ${
                       isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-250 text-slate-800'
                     }`}>
                       Vị trí {getDisplayPosition(selectedPosition)} · Càng xe {selectedAssetId}
                     </div>
                   </div>

                   {/* Damaged reporting switcher checkbox */}
                   <div className="p-3.5 bg-rose-500/5 dark:bg-rose-950/15 border border-rose-500/25 rounded-xl space-y-2.5">
                     <label className="flex items-center gap-2.5 cursor-pointer font-bold select-none text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wide">
                       <input
                         type="checkbox"
                         checked={isDamagedChecked}
                         onChange={(e) => {
                           setIsDamagedChecked(e.target.checked);
                           if (e.target.checked) {
                             setDepthInput('');
                           } else {
                             // Restore defaults
                             const currentTyre = tireLatest.find(
                               t => t.asset_id === selectedAssetId && t.position === selectedPosition
                             );
                             setDepthInput(currentTyre ? String(currentTyre.depth_mm) : '5.5');
                           }
                         }}
                         className="w-4 h-4 rounded-md border-rose-500 text-rose-600 focus:ring-rose-500 cursor-pointer"
                       />
                       <span>Đánh dấu lốp BI HỎNG & Thay dự phòng</span>
                     </label>

                     {isDamagedChecked && (
                       <div className="space-y-4 pt-3 border-t border-rose-500/10 transition-all duration-305">
                         {/* 1) Damaged Cause */}
                         <div>
                           <label className="block text-[10px] font-black uppercase text-rose-500 mb-1.5 font-sans">Nguyên nhân hỏng lốp *</label>
                           <input
                             type="text"
                             required={isDamagedChecked}
                             value={damageCause}
                             onChange={e => setDamageCause(e.target.value)}
                             placeholder="VD: Nổ lốp trên đường, nứt rãnh sâu, đá chém..."
                             className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 focus:border-rose-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-xl outline-none transition-all font-sans"
                           />
                         </div>

                         {/* 2) Selector with available spares */}
                         <div>
                           <label className="block text-[10px] font-black uppercase text-rose-500 mb-1.5 font-sans">Chọn lốp dự phòng thay thế *</label>
                           <select
                             required={isDamagedChecked}
                             value={selectedSpareSeri}
                             onChange={e => setSelectedSpareSeri(e.target.value)}
                             className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 focus:border-rose-500 text-slate-800 dark:text-slate-101 text-xs rounded-xl outline-none transition-all cursor-pointer font-sans"
                           >
                             <option value="">-- Chọn lốp từ kho dự phòng --</option>
                             {tires.filter(t => t.status === 'SPARE').map(t => (
                               <option key={t.id} value={t.tire_seri}>
                                 {t.tire_seri} - {t.brand} {t.model} ({t.size}, Gai {t.current_depth}mm)
                               </option>
                             ))}
                           </select>
                           {tires.filter(t => t.status === 'SPARE').length === 0 && (
                             <span className="text-[10px] text-amber-500 block mt-1">⚠️ Cảnh báo: Hiện không có chiếc lốp dự phòng nào trong bãi!</span>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
 
                   {!isDamagedChecked && (
                     <div>
                       <label id="lbl_depth" className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5 font-sans">Độ sâu gai (mm) *</label>
                       <input
                         type="number"
                         step="0.1"
                         required={!isDamagedChecked}
                         value={depthInput}
                         onChange={e => setDepthInput(e.target.value)}
                         placeholder="VD: 5.5"
                         className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 focus:border-indigo-505 text-slate-800 dark:text-slate-100 font-mono text-sm rounded-xl outline-none transition-all"
                       />
                     </div>
                   )}
 
                   <div>
                     <label id="lbl_dt" className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5 font-sans">Thời gian đo</label>
                     <div className="relative">
                       <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4_5 h-4_5 text-slate-500" />
                       <input
                         type="date"
                         value={measuredAt}
                         onChange={e => setMeasuredAt(e.target.value)}
                         className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 focus:border-indigo-505 text-slate-800 dark:text-slate-100 font-mono text-sm rounded-xl outline-none transition-all"
                       />
                     </div>
                   </div>
 
                   {!isDamagedChecked && (
                     <div>
                       <label id="lbl_notes" className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5 font-sans">Ghi chú (tùy chọn)</label>
                       <input
                         type="text"
                         value={measureNotes}
                         onChange={e => setMeasureNotes(e.target.value)}
                         placeholder="Nhập ghi chú thêm..."
                         className="w-full px-3.5 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 focus:border-indigo-505 text-slate-800 dark:text-slate-100 text-xs rounded-xl outline-none transition-all font-sans"
                       />
                     </div>
                   )}
 
                   <button
                     id="inner_save"
                     type="submit"
                     className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                   >
                     <Check className="w-4 h-4" /> {isDamagedChecked ? "Xác nhận báo hỏng & đổi lốp" : "Lưu kết quả đo"}
                   </button>
                 </form>

                {/* footer prompt info */}
                <div className="p-3 rounded-xl border border-dashed border-slate-850 text-[10px] text-slate-500 leading-normal mb-2">
                  Chiều sâu đo độ gai được lưu trực tiếp vào bảng danh sách đo lốp (sheet TireMeasures) phục vụ việc chạy phân tích chu kỳ hao mòn hàng năm tại cảng.
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
