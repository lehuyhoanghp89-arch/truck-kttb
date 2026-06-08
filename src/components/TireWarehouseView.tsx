/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Trash2, 
  FileSpreadsheet, 
  Link2, 
  Unlink, 
  Check, 
  X, 
  Layers,
  Download,
  ClipboardList,
  Upload
} from 'lucide-react';
import { Tire, Truck, Trailer, TireLatest } from '../types';
import { t as translate } from '../i18n';
import { parseCsv, exportToCsv, triggerCsvDownload } from '../utils';

interface TireWarehouseViewProps {
  tires: Tire[];
  trucks: Truck[];
  trailers: Trailer[];
  tireLatest: TireLatest[];
  onAddTire: (tire: Omit<Tire, 'id' | 'created_brand' | 'created_date' | 'updated_date' | 'created_by'>) => void;
  onDeleteTire: (id: string) => void;
  onMountTireToVehicle: (serial: string, assetId: string, position: string) => void;
  onUnmountTireFromVehicle: (serial: string) => void;
  onBulkImportTires: (importList: Omit<Tire, 'id' | 'created_date' | 'updated_date' | 'created_by'>[]) => void;
  isDarkMode: boolean;
  currentUser: any;
  language?: 'vi' | 'en';
}

export default function TireWarehouseView({
  tires,
  trucks,
  trailers,
  tireLatest,
  onAddTire,
  onDeleteTire,
  onMountTireToVehicle,
  onUnmountTireFromVehicle,
  onBulkImportTires,
  isDarkMode,
  currentUser,
  language = 'vi'
}: TireWarehouseViewProps) {

  const t = (key: string): string => translate(key, language);

  // CSV handlers
  const downloadSampleCsv = () => {
    const tireHeaders = [
      { key: 'tire_seri', label: 'Tire Serial (Số Seri Lốp)' },
      { key: 'brand', label: 'Brand (Thương hiệu)' },
      { key: 'size', label: 'Size (Kích cỡ)' },
      { key: 'current_depth', label: 'Current Depth (Độ sâu gai mm)' },
      { key: 'status', label: 'Status (Trạng thái)' },
      { key: 'notes', label: 'Notes (Ghi chú)' }
    ];
    const dummyRow = [
      {
        tire_seri: 'SN-99998888',
        brand: 'Bridgestone',
        size: '12R22.5',
        current_depth: '11.5',
        status: 'SPARE',
        notes: 'Lốp dự phòng nhập mới'
      }
    ];
    const csvContent = exportToCsv(dummyRow, tireHeaders);
    triggerCsvDownload(csvContent, 'Ban_Mau_Nhap_Kho_Lop.csv');
  };

  const exportCurrentDataset = () => {
    const tireHeaders = [
      { key: 'tire_seri', label: 'Tire Serial (Số Seri Lốp)' },
      { key: 'brand', label: 'Brand (Thương hiệu)' },
      { key: 'size', label: 'Size (Kích cỡ)' },
      { key: 'current_depth', label: 'Current Depth (Độ sâu gai mm)' },
      { key: 'status', label: 'Status (Trạng thái)' },
      { key: 'notes', label: 'Notes (Ghi chú)' }
    ];
    const mapped = tires.map(t => ({
      tire_seri: t.tire_seri,
      brand: t.brand,
      size: t.size,
      current_depth: t.current_depth,
      status: t.status,
      notes: t.notes || ''
    }));
    const csvContent = exportToCsv(mapped, tireHeaders);
    triggerCsvDownload(csvContent, 'Danh_Sach_Kho_Lop_Hien_Co.csv');
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.length < 2) {
          alert(language === 'vi' ? 'Khung dữ liệu CSV rỗng hoặc sai định dạng!' : 'CSV content is empty or invalid!');
          return;
        }

        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const importedDataList: any[] = [];

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length < headers.length) continue;
          
          const obj: any = {};
          headers.forEach((h, idx) => {
            let cleanedHeader = h.split('(')[0].trim().toLowerCase();
            if (cleanedHeader.includes('serial') || cleanedHeader.includes('seri')) cleanedHeader = 'tire_seri';
            if (cleanedHeader.includes('brand') || cleanedHeader.includes('thương hiệu')) cleanedHeader = 'brand';
            if (cleanedHeader.includes('size') || cleanedHeader.includes('kích cỡ')) cleanedHeader = 'size';
            if (cleanedHeader.includes('depth') || cleanedHeader.includes('độ sâu gai')) cleanedHeader = 'current_depth';
            if (cleanedHeader.includes('status') || cleanedHeader.includes('trạng thái')) cleanedHeader = 'status';
            if (cleanedHeader.includes('notes') || cleanedHeader.includes('ghi chú')) cleanedHeader = 'notes';

            obj[cleanedHeader] = row[idx];
          });
          importedDataList.push(obj);
        }

        const cleanList = importedDataList.map((item, index) => {
          const depthVal = parseFloat(item.current_depth);
          return {
            tire_seri: (item.tire_seri || `SN-BULK-${index}-${Date.now()}`).toUpperCase().trim(),
            brand: item.brand || 'Bridgestone',
            size: item.size || '12R22.5',
            model: 'Standard',
            current_depth: isNaN(depthVal) ? 11.5 : depthVal,
            status: item.status && ['IN_USE', 'SPARE', 'DAMAGED', 'RETIRED'].includes(item.status.toUpperCase())
              ? item.status.toUpperCase() as any
              : 'SPARE',
            asset_id: null,
            asset_type: null,
            current_position: null,
            last_measured: new Date().toISOString(),
            notes: item.notes || ''
          };
        }).filter(t => t.tire_seri);

        onBulkImportTires(cleanList);
        alert(language === 'vi' 
          ? `Đã nhập dữ liệu hàng loạt thành công ${cleanList.length} lốp vỏ xe vào kho!`
          : `Successfully imported ${cleanList.length} tires into repository!`
        );
      } catch (err) {
        alert(language === 'vi' ? 'Lỗi xử lý file CSV. Vui lòng định dạng chuẩn Unicode UTF-8.' : 'Error parsing CSV file. Please use standard Unicode UTF-8.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Inputs for creating spare tyre
  const [newSerial, setNewSerial] = useState('');
  
  // Dynamic brand list states
  const [brands, setBrands] = useState<string[]>(() => {
    const saved = localStorage.getItem('tire_brands_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ['Bridgestone', 'Michelin', 'Casumina', 'Maxxis', 'Yokohama'];
  });

  // Calculate unique brands present in Supabase tires + our configurable checklist
  const dbBrands = Array.from(new Set(tires.map(t => t.brand).filter(Boolean)));
  const allAvailableBrands = Array.from(new Set([...brands, ...dbBrands])).sort();
  
  const [newBrand, setNewBrand] = useState(() => {
    return allAvailableBrands[0] || 'Bridgestone';
  });

  const [isManagingBrands, setIsManagingBrands] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');

  const handleDeleteBrand = (brandToDelete: string) => {
    // Check if brand is physically being used currently in any tyre loaded from database
    const isCurrentlyUsed = tires.some(t => t.brand?.toLowerCase() === brandToDelete.toLowerCase());
    if (isCurrentlyUsed) {
      alert(language === 'vi' 
        ? `Thương hiệu "${brandToDelete}" đang được sử dụng bởi lốp xe trong hệ thống, không thể xóa bỏ!` 
        : `Brand "${brandToDelete}" is currently in use by some tires and cannot be deleted!`
      );
      return;
    }

    const updated = brands.filter(b => b.toLowerCase() !== brandToDelete.toLowerCase());
    setBrands(updated);
    localStorage.setItem('tire_brands_list', JSON.stringify(updated));
    if (newBrand.toLowerCase() === brandToDelete.toLowerCase()) {
      const remaining = allAvailableBrands.filter(b => b.toLowerCase() !== brandToDelete.toLowerCase());
      setNewBrand(remaining[0] || 'Bridgestone');
    }
  };

  const handleAddBrand = () => {
    const trimmed = customBrandName.trim();
    if (!trimmed) return;
    if (allAvailableBrands.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
      alert(language === 'vi' ? 'Hãng này đã có trong danh sách!' : 'Brand already exists!');
      return;
    }
    
    const updated = [...brands, trimmed];
    setBrands(updated);
    localStorage.setItem('tire_brands_list', JSON.stringify(updated));
    setNewBrand(trimmed);
    setCustomBrandName('');
  };

  const [newSize, setNewSize] = useState('12R22.5');
  const [newInitialDepth, setNewInitialDepth] = useState('11.5');
  const [newNotes, setNewNotes] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'SPARE' | 'MOUNTED'>('ALL');

  // Allocation Dialog overlay states
  const [mountingTireSerial, setMountingTireSerial] = useState<string | null>(null);
  const [targetAssetId, setTargetAssetId] = useState('');
  const [targetPosition, setTargetPosition] = useState('');

  // Handle spare tyre registration
  const handleAddNewTire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerial.trim()) {
      alert(language === 'vi' ? 'Vui lòng điền mã định danh lốp (Serial Number)' : 'Please input tire Serial Number');
      return;
    }

    // Is there duplicate?
    if (tires.some(t => t.tire_seri.toUpperCase() === newSerial.toUpperCase())) {
      alert(language === 'vi' ? 'Số Seri lốp này đã tồn tại trong kho!' : 'This Serial Number already exists in stock!');
      return;
    }

    onAddTire({
      tire_seri: newSerial.toUpperCase(),
      brand: newBrand,
      size: newSize,
      model: 'Standard',
      current_depth: parseFloat(newInitialDepth) || 11.5,
      status: 'SPARE',
      asset_id: null,
      asset_type: null,
      current_position: null,
      last_measured: new Date().toISOString(),
      notes: newNotes
    });

    alert(language === 'vi' 
      ? `Đã nhập kho lốp dự trữ mới Seri ${newSerial} thành công.`
      : `Successfully registered new spare tire Seri ${newSerial} in stock.`
    );
    setNewSerial('');
    setNewNotes('');
  };

  const handleOpenMountingModal = (serial: string) => {
    setMountingTireSerial(serial);
    setTargetAssetId('');
    setTargetPosition('');
  };

  const handleCompleteMounting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountingTireSerial || !targetAssetId || !targetPosition) {
      alert(language === 'vi' ? 'Vui lòng điền đầy đủ mã xe và vị trí lốp cần lắp!' : 'Please specify vehicle ID and wheel position!');
      return;
    }

    onMountTireToVehicle(mountingTireSerial, targetAssetId, targetPosition);
    alert(language === 'vi' 
      ? `Đã lắp ráp thành công lốp ${mountingTireSerial} vào xe ${targetAssetId} vị trí ${targetPosition}.`
      : `Successfully mounted tire ${mountingTireSerial} onto vehicle ${targetAssetId} at position ${targetPosition}.`
    );
    setMountingTireSerial(null);
  };

  // Filter tires list
  const filteredTires = tires.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.tire_seri.toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q) ||
      t.size.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (stockFilter === 'SPARE') return t.asset_id === null;
    if (stockFilter === 'MOUNTED') return t.asset_id !== null;

    return true;
  });

  // Soft design configs based on user guidelines
  const borderClass = isDarkMode ? 'border-slate-700/50' : 'border-slate-200/80';
  const bgCardClass = isDarkMode ? 'bg-slate-900/40' : 'bg-white shadow-xs';
  
  // High contrast labels for light mode
  const labelTextContrast = isDarkMode ? 'text-slate-400' : 'text-slate-800 font-extrabold';
  const bodyTextContrast = isDarkMode ? 'text-slate-350' : 'text-slate-900';

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* View Title & CSV Bulk Actions */}
      <div id="warehouse_header_controls" className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-205'}`}>
        <div>
          <h2 id="warehouse_title" className="text-2xl font-black tracking-tight select-none">
            {t('wh.title')}
          </h2>
          <p id="warehouse_desc" className={`text-xs font-medium mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>
            {t('wh.desc')}
          </p>
        </div>

        {/* Bulk Action button cluster */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <button
            id="tire_csv_sample_download_btn"
            type="button"
            onClick={downloadSampleCsv}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-750'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-indigo-505" /> {language === 'vi' ? 'Mẫu CSV' : 'Sample CSV'}
          </button>

          <button
            id="tire_csv_export_btn"
            type="button"
            onClick={exportCurrentDataset}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-755'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-505" /> {language === 'vi' ? 'Xuất CSV' : 'Export CSV'}
          </button>

          {(currentUser.role === 'admin' || currentUser.permission === 'all') && (
            <label
              id="tire_csv_import_label"
              htmlFor="tire_csv_upload_input"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-all ${
                isDarkMode ? 'bg-slate-900 border-slate-705 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-755'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-505" /> {language === 'vi' ? 'Upload CSV' : 'Upload CSV'}
              <input
                id="tire_csv_upload_input"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Grid: Left Column (Add spare Form), Right Column (Spare List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Thêm lốp mới vào kho */}
        {(currentUser.role === 'admin' || currentUser.permission === 'all') && (
          <div className={`lg:col-span-4 p-5 border rounded-2xl h-fit space-y-4 ${bgCardClass} ${borderClass}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b pb-3 ${
              isDarkMode ? 'text-indigo-400 border-slate-700/50' : 'text-indigo-700 border-slate-205'
            }`}>
              <Plus className="w-4 h-4" /> {t('wh.add_tire')}
            </h4>

            <form onSubmit={handleAddNewTire} className="space-y-4 text-xs leading-normal font-sans">
              <div>
                <label className={`block text-[11px] uppercase mb-1.5 ${labelTextContrast}`}>
                  {language === 'vi' ? 'Mã định danh lốp (Seri) *' : 'Tire Serial Key *'}
                </label>
                <input
                  type="text"
                  required
                  value={newSerial}
                  onChange={e => setNewSerial(e.target.value.toUpperCase())}
                  placeholder="VD: SN-123456789"
                  className={`w-full px-3 py-2 border rounded-lg outline-none font-mono text-xs transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-700/65 text-slate-100 focus:border-indigo-505 placeholder:text-slate-700' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400 font-bold'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-[11px] uppercase ${labelTextContrast}`}>
                      {language === 'vi' ? 'Thương hiệu' : 'Brand'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManagingBrands(!isManagingBrands)}
                      className="text-[10px] text-blue-500 hover:text-blue-400 font-bold focus:outline-none cursor-pointer"
                    >
                      {isManagingBrands 
                        ? (language === 'vi' ? 'Xong' : 'Done') 
                        : (language === 'vi' ? 'Quản lý' : 'Manage')}
                    </button>
                  </div>
                  {isManagingBrands ? (
                    <div className="space-y-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder={language === 'vi' ? 'Hiệu mới...' : 'Brand...'}
                          value={customBrandName}
                          onChange={e => setCustomBrandName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBrand();
                            }
                          }}
                          className="flex-1 px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-750 text-slate-100 rounded outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddBrand}
                          className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="max-h-20 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                        {allAvailableBrands.map(b => (
                          <div key={b} className="flex items-center justify-between text-[10px] py-0.5 px-1 bg-slate-900/50 border border-slate-800 rounded">
                            <span className="truncate text-slate-300 font-medium">{b}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBrand(b)}
                              className="text-red-500 hover:text-red-400 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <select
                      value={newBrand}
                      onChange={e => setNewBrand(e.target.value)}
                      className={`w-full px-2.5 py-2 border rounded-lg outline-none transition-all cursor-pointer ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700/65 text-slate-101 focus:border-indigo-505' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 font-bold'
                      }`}
                    >
                      {allAvailableBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className={`block text-[11px] uppercase mb-1.5 ${labelTextContrast}`}>
                    {language === 'vi' ? 'Cỡ lốp' : 'Dimension Size'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSize}
                    onChange={e => setNewSize(e.target.value)}
                    placeholder="12R22.5"
                    className={`w-full px-3 py-2 border font-mono rounded-lg outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-700/65 text-slate-100 focus:border-indigo-505' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 font-bold'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] uppercase mb-1.5 ${labelTextContrast}`}>
                  {language === 'vi' ? 'Độ dày gai lốp ban đầu (mm)' : 'Initial tread depth (mm)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newInitialDepth}
                  onChange={e => setNewInitialDepth(e.target.value)}
                  className={`w-full px-3 py-2 border font-mono rounded-lg outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-700/65 text-slate-101 focus:border-indigo-505' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-505 font-bold'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] uppercase mb-1.5 ${labelTextContrast}`}>
                  {language === 'vi' ? 'Ghi chú lốp' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Lốp mới tinh / bọc lần 1..."
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-700/65 text-slate-100 focus:border-indigo-505 placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400 font-bold'
                  }`}
                />
              </div>

              <button
                id="btn_submit_warehouse_tire"
                type="submit"
                className="w-full py-2.5 text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md text-center flex items-center justify-center gap-1 hover:-translate-y-[0.5px] transition-all"
              >
                <Building className="w-3.5 h-3.5" /> {language === 'vi' ? 'Khai báo nhập kho' : 'Stock Entry Approval'}
              </button>
            </form>
          </div>
        )}

        {/* Right Spreadsheet Stock Register */}
        <div className={`space-y-4 ${(currentUser.role === 'admin' || currentUser.permission === 'all') ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          {/* Filters strip */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
            
            {/* Stock sub-tabs filter */}
            <div id="stock_filters" className={`flex p-1.5 rounded-xl border ${isDarkMode ? 'bg-slate-950/20 border-slate-700/50' : 'bg-slate-100/50 border-slate-200'} max-w-sm`}>
              <button
                id="stock_filter_all"
                type="button"
                onClick={() => setStockFilter('ALL')}
                className={`py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  stockFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-indigo-500'
                }`}
              >
                {t('wh.filter_all')} ({tires.length})
              </button>
              <button
                id="stock_filter_spare"
                type="button"
                onClick={() => setStockFilter('SPARE')}
                className={`py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  stockFilter === 'SPARE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-indigo-500'
                }`}
              >
                {language === 'vi' ? 'Trong kho' : 'In stock'} ({tires.filter(t => t.asset_id === null).length})
              </button>
              <button
                id="stock_filter_mounted"
                type="button"
                onClick={() => setStockFilter('MOUNTED')}
                className={`py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  stockFilter === 'MOUNTED' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-indigo-500'
                }`}
              >
                {language === 'vi' ? 'Đang lắp' : 'Mounted'} ({tires.filter(t => t.asset_id !== null).length})
              </button>
            </div>

            {/* Simple Searching */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="stock_search_box"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('lbl.search_placeholder')}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl outline-none border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-505' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 font-bold'
                }`}
              />
            </div>

          </div>

          {/* Spreadsheet Stock Register Table */}
          <div className={`border rounded-2xl overflow-hidden leading-relaxed ${borderClass} ${bgCardClass}`}>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className={`border-b ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-700/40 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700 font-extrabold'
                  }`}>
                    <th className="p-3 font-extrabold">{t('wh.seri')}</th>
                    <th className="p-3 font-extrabold">{t('wh.brand')}</th>
                    <th className="p-3 font-extrabold">{t('wh.size')}</th>
                    <th className="p-3 font-extrabold">{t('wh.depth')}</th>
                    <th className="p-3 text-center font-extrabold">{t('wh.asset')}</th>
                    <th className="p-3 text-right font-extrabold">{t('lbl.actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/30' : 'divide-slate-200/80'} ${bodyTextContrast}`}>
                  {filteredTires.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 italic">
                        {language === 'vi' ? 'Không tìm thấy vỏ lốp nào phù hợp bộ lọc.' : 'No matched tires found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTires.map(tire => {
                      const isLoose = tire.asset_id === null;
                      return (
                        <tr 
                          id={`stock_row_${tire.tire_seri}`}
                          key={tire.id}
                          className={`transition-all ${isDarkMode ? 'hover:bg-slate-850/5' : 'hover:bg-slate-50'}`}
                        >
                          {/* Serial */}
                          <td className="p-3 font-mono font-extrabold text-indigo-650 dark:text-indigo-400">
                            {tire.tire_seri}
                          </td>

                          {/* Brand */}
                          <td className="p-3 font-bold">
                            {tire.brand}
                          </td>

                          {/* Size */}
                          <td className="p-3 font-mono">
                            {tire.size}
                          </td>

                          {/* Initial gauge */}
                          <td className="p-3 font-mono font-bold">
                            {tire.current_depth} mm
                          </td>

                          {/* Attached target */}
                          <td className="p-3 text-center font-mono">
                            {isLoose ? (
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-sans font-extrabold ${
                                isDarkMode ? 'bg-slate-950 border border-slate-700/40 text-slate-500' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {t('wh.loose')}
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-sans font-bold ${
                                isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {tire.asset_id} · {tire.current_position}
                              </span>
                            )}
                          </td>

                          {/* Fast install / unmount command controllers */}
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              {isLoose ? (
                                <button
                                  id={`mount_tire_${tire.tire_seri}`}
                                  type="button"
                                  onClick={() => handleOpenMountingModal(tire.tire_seri)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md hover:-translate-y-[0.5px] transition-all flex items-center gap-1 cursor-pointer text-[11px]"
                                >
                                  <Link2 className="w-3 h-3" /> {language === 'vi' ? 'Gắn' : 'Mount'}
                                </button>
                              ) : (
                                <button
                                  id={`unmount_tire_${tire.tire_seri}`}
                                  type="button"
                                  onClick={() => {
                                    const confirmMsg = language === 'vi' 
                                      ? `Bạn chắc chắn muốn tháo lốp ${tire.tire_seri} khỏi vị trí lắp đặt và thu hồi ngược vào kho?`
                                      : `Are you sure you want to unmount tire ${tire.tire_seri} back into stock?`;
                                    if (confirm(confirmMsg)) {
                                      onUnmountTireFromVehicle(tire.tire_seri);
                                    }
                                  }}
                                  className={`px-2 py-1 font-bold rounded-md hover:-translate-y-[0.5px] transition-all flex items-center gap-1 cursor-pointer text-[11px] ${
                                    isDarkMode 
                                      ? 'bg-slate-950 border border-slate-700/50 hover:bg-slate-800 text-rose-400 hover:text-rose-350' 
                                      : 'bg-white border border-slate-205 hover:bg-slate-100 text-rose-600 hover:text-rose-750 font-bold'
                                  }`}
                                >
                                  <Unlink className="w-3 h-3" /> {language === 'vi' ? 'Thu hồi' : 'Unmount'}
                                </button>
                              )}

                              {(currentUser.role === 'admin' || currentUser.permission === 'all') && (
                                <button
                                  id={`bin_tire_${tire.id}`}
                                  type="button"
                                  onClick={() => {
                                    const confirmDeleteMsg = language === 'vi'
                                      ? `Xóa vĩnh viễn lốp Seri ${tire.tire_seri} khỏi bãi?`
                                      : `Permanently delete tire ${tire.tire_seri} from system?`;
                                    if (confirm(confirmDeleteMsg)) {
                                      onDeleteTire(tire.id);
                                    }
                                  }}
                                  className={`p-1 rounded-md transition-all cursor-pointer ${
                                    isDarkMode 
                                      ? 'text-slate-500 hover:text-red-400 hover:bg-slate-950' 
                                      : 'text-slate-550 hover:text-red-650 hover:bg-slate-50'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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

      </div>

      {/* Assembly Allocations Modal (Fast attachment overlay) */}
      {mountingTireSerial && (
        <div id="mount_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs leading-relaxed select-none">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl space-y-4 font-sans ${
            isDarkMode ? 'bg-slate-900 border-slate-700/60 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className={`flex justify-between items-start border-b pb-3 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Link2 className="w-4 h-4 animate-bounce" /> {language === 'vi' ? 'Lắp lốp lên xe bãi' : 'Mount spare onto chassis'}
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-1">Tire Seri: {mountingTireSerial}</p>
              </div>
              <button
                id="close_mount"
                type="button"
                onClick={() => setMountingTireSerial(null)}
                className={`w-7 h-7 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                  isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-450' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteMounting} className="space-y-4 text-xs font-sans">
              {(() => {
                const isSelectedTrailer = trailers.some(tr => tr.trailer_id === targetAssetId);
                return (
                  <>
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase mb-1.5 text-indigo-500">
                        {language === 'vi' ? 'Chọn xe tải hoặc rơ moóc cần gắn *' : 'Target asset ID *'}
                      </label>
                      <select
                        required
                        value={targetAssetId}
                        onChange={e => setTargetAssetId(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg outline-none cursor-pointer transition-all ${
                          isDarkMode 
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' 
                            : 'bg-white border-slate-300 text-slate-900 font-bold focus:border-indigo-500'
                        }`}
                      >
                        <option value="" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>
                          {language === 'vi' ? '-- Chọn xe tải/moóc --' : '-- Select asset --'}
                        </option>
                        <optgroup label={language === 'vi' ? 'Dàn xe đầu kéo (Truck)' : 'Container Trucks'} className={isDarkMode ? 'bg-slate-900 text-slate-400' : ''}>
                          {[...trucks].sort((a,b) => a.truck_id.localeCompare(b.truck_id, undefined, {numeric: true})).map(tk => (
                            <option key={tk.id} value={tk.truck_id} className={isDarkMode ? 'bg-slate-900 text-white' : ''}>
                              {tk.truck_id} ({tk.license_plate})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={language === 'vi' ? 'Dàn Rơ Moóc (Trailer)' : 'Chassis Trailers'} className={isDarkMode ? 'bg-slate-900 text-slate-400' : ''}>
                          {[...trailers].sort((a,b) => a.trailer_id.localeCompare(b.trailer_id, undefined, {numeric: true})).map(tr => (
                            <option key={tr.id} value={tr.trailer_id} className={isDarkMode ? 'bg-slate-900 text-white' : ''}>
                              {tr.trailer_id} ({tr.license_plate})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase mb-1.5 text-indigo-500">
                        {language === 'vi' ? 'Nhấp chọn Vị trí gầm lắp đặt *' : 'Wheel axel position *'}
                      </label>
                      <select
                        required
                        value={targetPosition}
                        onChange={e => setTargetPosition(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg outline-none cursor-pointer transition-all ${
                          isDarkMode 
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' 
                            : 'bg-white border-slate-300 text-slate-900 font-bold focus:border-indigo-500'
                        }`}
                      >
                        <option value="" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>
                          {language === 'vi' ? '-- Ấn chọn cụm bánh --' : '-- Choose wheel --'}
                        </option>
                        {isSelectedTrailer ? (
                          <>
                            <option value="A_OL" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>OFL (Ngoài Trái - Trục A)</option>
                            <option value="A_IL" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>IFL (Trong Trái - Trục A)</option>
                            <option value="A_IR" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>IFR (Trong Phải - Trục A)</option>
                            <option value="A_OR" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>OFR (Ngoài Phải - Trục A)</option>
                            <option value="B_OL" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>ORL (Ngoài Trái - Trục B)</option>
                            <option value="B_IL" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>IRL (Trong Trái - Trục B)</option>
                            <option value="B_IR" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>IRR (Trong Phải - Trục B)</option>
                            <option value="B_OR" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>ORR (Ngoài Phải - Trục B)</option>
                          </>
                        ) : (
                          <>
                            <option value="FL" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>Trục Lái - Trái (FL)</option>
                            <option value="FR" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>Trục Lái - Phải (FR)</option>
                            <option value="ORL" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>Trục Sau - Ngoài Trái (ORL)</option>
                            <option value="IRL" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>Trục Sau - Trong Trái (IRL)</option>
                            <option value="IRR" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>Trục Sau - Trong Phải (IRR)</option>
                            <option value="ORR" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>Trục Sau - Ngoài Phải (ORR)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </>
                );
              })()}

              <div className="pt-2 select-none flex gap-2">
                <button
                  id="confirm_mount"
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer text-center text-xs"
                >
                  {language === 'vi' ? 'Lắp đặt lốp' : 'Apply Mount'}
                </button>
                <button
                  id="cancel_mount"
                  type="button"
                  onClick={() => setMountingTireSerial(null)}
                  className={`flex-1 py-2 border font-semibold rounded-lg text-center text-xs cursor-pointer ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {language === 'vi' ? 'Thoát' : 'Close'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
