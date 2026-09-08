/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Truck as TruckIcon, 
  Search, 
  Wrench, 
  Edit2, 
  Trash2, 
  Power, 
  Link as LinkIcon, 
  Unlink, 
  Compass, 
  X, 
  Plus, 
  CalendarDays, 
  Coins, 
  ClipboardList, 
  Info,
  Check,
  Download,
  Upload,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Truck, Trailer, Tire, TireLatest, RepairLog, MaintRequest } from '../types';
import { getInspectionStatus, getTireStatus, exportToCsv, parseCsv, triggerCsvDownload } from '../utils';

interface VehicleViewProps {
  trucks: Truck[];
  trailers: Trailer[];
  tires: Tire[];
  tireLatest: TireLatest[];
  repairLogs: RepairLog[];
  maintRequests: MaintRequest[];
  onAddTruck: (truck: Omit<Truck, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => void;
  onEditTruck: (id: string, updated: Partial<Truck>) => void;
  onDeleteTruck: (id: string) => void;
  onAddTrailer: (trailer: Omit<Trailer, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => void;
  onEditTrailer: (id: string, updated: Partial<Trailer>) => void;
  onDeleteTrailer: (id: string) => void;
  onAttachTrailer: (truckId: string, trailerId: string) => void;
  onDetachTrailer: (truckId: string) => void;
  onAddRepairLog: (log: Omit<RepairLog, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => void;
  onBulkImportTrucks: (importList: Omit<Truck, 'id' | 'created_date' | 'updated_date' | 'created_by'>[]) => void;
  onBulkImportTrailers: (importList: Omit<Trailer, 'id' | 'created_date' | 'updated_date' | 'created_by'>[]) => void;
  isDarkMode: boolean;
  currentUser: any;
  language?: 'vi' | 'en';
}

export default function VehicleView({
  trucks,
  trailers,
  tires,
  tireLatest,
  repairLogs,
  maintRequests,
  onAddTruck,
  onEditTruck,
  onDeleteTruck,
  onAddTrailer,
  onEditTrailer,
  onDeleteTrailer,
  onAttachTrailer,
  onDetachTrailer,
  onAddRepairLog,
  onBulkImportTrucks,
  onBulkImportTrailers,
  isDarkMode,
  currentUser,
  language = 'vi'
}: VehicleViewProps) {

  // Current tab: 'trucks' or 'trailers'
  const [activeTab, setActiveTab] = useState<'trucks' | 'trailers'>('trucks');
  // Trailer subtabs: 'all', 'active', 'spare', 'maintenance'
  const [trailerSubTab, setTrailerSubTab] = useState<'all' | 'active' | 'spare' | 'maintenance'>('all');
  
  // View mode: 'grid' (cards) or 'list' (table)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Search query for vehicles
  const [searchQuery, setSearchQuery] = useState('');
  // Search query for attaching spare trailer in drawer
  const [attachSearchQuery, setAttachSearchQuery] = useState('');

  // Right-hand Side drawer states
  const [drawerType, setDrawerType] = useState<'none' | 'diagram' | 'attach_trailer' | 'repair_logs' | 'form_truck' | 'form_trailer'>('none');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<'TRUCK' | 'TRAILER'>('TRUCK');

  // Add/Edit structural payload states
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [formTruckId, setFormTruckId] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>('ACTIVE');
  const [formInspectionExpiry, setFormInspectionExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Trailer specific form inputs
  const [formTrailerStatus, setFormTrailerStatus] = useState<'ACTIVE' | 'SPARE' | 'MAINTENANCE' | 'INACTIVE'>('ACTIVE');

  // Repair log form inside drawer
  const [errRepairInput, setErrRepairInput] = useState('');
  const [repairDescription, setRepairDescription] = useState('');
  const [repairRootCause, setRepairRootCause] = useState('');
  const [repairTechnician, setRepairTechnician] = useState('');
  const [repairCost, setRepairCost] = useState('0');
  const [repairNotes, setRepairNotes] = useState('');
  const [repairStartTime, setRepairStartTime] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });

  // Sơ đồ lốp auxiliary helper
  const renderTyreCell = (positionLabel: string, latestEntry: TireLatest | undefined) => {
    let statusColor = 'bg-slate-800 text-slate-400 border-slate-700';
    if (latestEntry) {
      if (latestEntry.status === 'OK') statusColor = 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900/55';
      else if (latestEntry.status === 'WARN') statusColor = 'bg-amber-900/30 text-amber-400 border-amber-500/50 hover:bg-amber-900/55';
      else if (latestEntry.status === 'BAD') statusColor = 'bg-rose-900/30 text-rose-400 border-rose-500/50 hover:bg-rose-900/55';
    }
    
    return (
      <div 
        key={positionLabel}
        className={`border p-2 rounded-xl text-center flex flex-col items-center justify-center cursor-pointer transition-all ${statusColor}`}
        title={latestEntry ? `Lốp: ${latestEntry.tire_seri} - Gai: ${latestEntry.depth_mm}mm` : 'Không có lốp'}
      >
        <span className="text-[10px] uppercase font-black tracking-wider block">{positionLabel}</span>
        <span className="text-xs font-bold font-mono tracking-wide mt-1 block">{latestEntry ? latestEntry.tire_seri.slice(-8) : '?'}</span>
        <span className="text-[10px] font-mono tracking-tight block mt-0.5 opacity-80">{latestEntry ? `${latestEntry.depth_mm}mm` : 'Không có'}</span>
      </div>
    );
  };

  // Open tyre diagram drawer
  const openTireDiagram = (assetId: string, assetType: 'TRUCK' | 'TRAILER') => {
    setSelectedAssetId(assetId);
    setSelectedAssetType(assetType);
    setDrawerType('diagram');
  };

  // Open attach trailer drawer
  const openAttachTrailerDrawer = (truckId: string) => {
    setSelectedAssetId(truckId);
    setAttachSearchQuery('');
    setDrawerType('attach_trailer');
  };

  // Open repair log drawer
  const openRepairLogsDrawer = (assetId: string, assetType: 'TRUCK' | 'TRAILER') => {
    setSelectedAssetId(assetId);
    setSelectedAssetType(assetType);
    setRepairDescription('');
    setRepairRootCause('');
    setRepairTechnician('');
    setRepairCost('0');
    setRepairNotes('');
    setErrRepairInput('');
    setDrawerType('repair_logs');
  };

  // Open Truck Form
  const openTruckForm = (editTarget: Truck | null = null) => {
    if (editTarget) {
      setIsEditingForm(true);
      setSelectedAssetId(editTarget.truck_id);
      setFormTruckId(editTarget.truck_id || '');
      setFormPlate(editTarget.license_plate || '');
      setFormModel(editTarget.model || '');
      setFormStatus(editTarget.status);
      setFormInspectionExpiry(editTarget.inspection_expiry || '');
      setFormNotes(editTarget.notes || '');
    } else {
      setIsEditingForm(false);
      setSelectedAssetId(null);
      setFormTruckId(`TT${trucks.length + 1 > 9 ? trucks.length + 1 : '0' + (trucks.length + 1)}`);
      setFormPlate('');
      setFormModel('Kalmar');
      setFormStatus('ACTIVE');
      setFormInspectionExpiry('');
      setFormNotes('');
    }
    setDrawerType('form_truck');
  };

  // Open Trailer Form
  const openTrailerForm = (editTarget: Trailer | null = null) => {
    if (editTarget) {
      setIsEditingForm(true);
      setSelectedAssetId(editTarget.trailer_id);
      setFormTruckId(editTarget.trailer_id || ''); // using common state for key ID
      setFormPlate(editTarget.license_plate || '');
      setFormModel(editTarget.model || '');
      setFormTrailerStatus(editTarget.status);
      setFormInspectionExpiry(editTarget.inspection_expiry || '');
      setFormNotes(editTarget.notes || '');
    } else {
      setIsEditingForm(false);
      setSelectedAssetId(null);
      setFormTruckId(`RM-${trailers.length + 1 > 9 ? trailers.length + 1 : '0' + (trailers.length + 1)}`);
      setFormPlate('');
      setFormModel('Cimc 40ft');
      setFormTrailerStatus('SPARE');
      setFormInspectionExpiry('');
      setFormNotes('');
    }
    setDrawerType('form_trailer');
  };

  // Form submit handles
  const handleTruckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTruckId || !formPlate) {
      alert('Vui lòng điền mã xe và biển số');
      return;
    }

    const targetIdUpper = formTruckId.trim().toUpperCase();

    if (isEditingForm && selectedAssetId) {
      // Find exact record
      const record = trucks.find(t => t.truck_id === selectedAssetId);
      if (record) {
        // check if targetIdUpper is already used by ANOTHER truck or trailer
        if (trucks.some(t => t.id !== record.id && t.truck_id.toUpperCase() === targetIdUpper)) {
          alert(`Mã xe tải "${targetIdUpper}" này đã tồn tại ở một xe khác trong hệ thống!`);
          return;
        }
        if (trailers.some(t => t.trailer_id.toUpperCase() === targetIdUpper)) {
          alert(`Mã xe tải "${targetIdUpper}" này trùng với mã rơ moóc hiện có!`);
          return;
        }
        onEditTruck(record.id, {
          truck_id: targetIdUpper,
          license_plate: formPlate,
          model: formModel,
          status: formStatus,
          inspection_expiry: formInspectionExpiry,
          notes: formNotes
        });
      }
    } else {
      // check duplicates
      if (trucks.some(t => t.truck_id.toUpperCase() === targetIdUpper)) {
        alert(`Mã xe tải "${targetIdUpper}" này đã tồn tại trong hệ thống! Vui lòng nhập mã xe khác.`);
        return;
      }
      if (trailers.some(t => t.trailer_id.toUpperCase() === targetIdUpper)) {
        alert(`Mã xe tải "${targetIdUpper}" này trùng với mã rơ moóc hiện có trong hệ thống!`);
        return;
      }
      onAddTruck({
        truck_id: targetIdUpper,
        license_plate: formPlate,
        model: formModel,
        status: formStatus,
        attached_trailer_id: null,
        notes: formNotes,
        inspection_expiry: formInspectionExpiry,
        inspection_notes: ''
      });
    }

    setDrawerType('none');
  };

  const handleTrailerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTruckId || !formPlate) {
      alert('Vui lòng điền mã moóc và biển số');
      return;
    }

    const targetIdUpper = formTruckId.trim().toUpperCase();

    if (isEditingForm && selectedAssetId) {
      const record = trailers.find(t => t.trailer_id === selectedAssetId);
      if (record) {
        if (trailers.some(t => t.id !== record.id && t.trailer_id.toUpperCase() === targetIdUpper)) {
          alert(`Mã rơ moóc "${targetIdUpper}" này đã tồn tại ở một rơ moóc khác trong hệ thống!`);
          return;
        }
        if (trucks.some(t => t.truck_id.toUpperCase() === targetIdUpper)) {
          alert(`Mã rơ moóc "${targetIdUpper}" này trùng với mã xe tải hiện có!`);
          return;
        }
        onEditTrailer(record.id, {
          trailer_id: targetIdUpper,
          license_plate: formPlate,
          model: formModel,
          status: formTrailerStatus,
          inspection_expiry: formInspectionExpiry,
          notes: formNotes
        });
      }
    } else {
      if (trailers.some(t => t.trailer_id.toUpperCase() === targetIdUpper)) {
        alert(`Mã rơ moóc "${targetIdUpper}" này đã tồn tại! Vui lòng nhập mã rơ moóc khác.`);
        return;
      }
      if (trucks.some(t => t.truck_id.toUpperCase() === targetIdUpper)) {
        alert(`Mã rơ moóc "${targetIdUpper}" này trùng với mã xe tải hiện có trong hệ thống!`);
        return;
      }
      onAddTrailer({
        trailer_id: targetIdUpper,
        license_plate: formPlate,
        model: formModel,
        status: formTrailerStatus,
        attached_truck_id: null,
        notes: formNotes,
        inspection_expiry: formInspectionExpiry,
        inspection_notes: ''
      });
    }

    setDrawerType('none');
  };

  // Adding Repair Ticket handle
  const handleAddRepairLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairDescription.trim()) {
      setErrRepairInput('Mô tả triệu chứng, lỗi phát sinh là bắt buộc');
      return;
    }

    if (selectedAssetId) {
      onAddRepairLog({
        asset_id: selectedAssetId,
        asset_type: selectedAssetType,
        start_time: repairStartTime ? new Date(repairStartTime).toISOString() : new Date().toISOString(),
        end_time: '',
        fault_description: repairDescription,
        root_cause: repairRootCause,
        technician_name: repairTechnician,
        status: 'IN_PROGRESS',
        cost: Number(repairCost) || 0,
        notes: repairNotes
      });
      
      // Update vehicle status to MAINTENANCE
      if (selectedAssetType === 'TRUCK') {
        const truckRec = trucks.find(t => t.truck_id === selectedAssetId);
        if (truckRec) onEditTruck(truckRec.id, { status: 'MAINTENANCE' });
      } else {
        const trailerRec = trailers.find(t => t.trailer_id === selectedAssetId);
        if (trailerRec) onEditTrailer(trailerRec.id, { status: 'MAINTENANCE' });
      }

      setRepairDescription('');
      setRepairRootCause('');
      setRepairTechnician('');
      setRepairCost('0');
      setRepairNotes('');
      // reset repairStartTime
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      setRepairStartTime(new Date(now.getTime() - offset).toISOString().slice(0, 16));
      setErrRepairInput('');
      setDrawerType('none');
      alert(`Đã khởi tạo phiếu sửa chữa thành công cho mã ${selectedAssetId}. Trạng thái tài sản tự động chuyển sang BẢO TRÌ.`);
    }
  };

  // CSV Import / Export Handler
  const downloadSampleCsv = () => {
    if (activeTab === 'trucks') {
      const truckHeaders = [
        { key: 'truck_id', label: 'truck_id (Mã xe)' },
        { key: 'license_plate', label: 'license_plate (Biển số)' },
        { key: 'model', label: 'model (Model xe - Có thể để trống)' },
        { key: 'status', label: 'status (Trạng thái ACTIVE/MAINTENANCE/INACTIVE)' },
        { key: 'inspection_expiry', label: 'inspection_expiry (Đăng kiểm YYYY-MM-DD - Có thể để trống)' },
        { key: 'notes', label: 'notes (Ghi chú - Có thể để trống)' }
      ];
      const dummyRow = [
        { truck_id: 'TT99', license_plate: '51C-999.99', model: 'Howo A7', status: 'ACTIVE', inspection_expiry: '2026-12-31', notes: 'Lái xe Nguyễn Văn An' }
      ];
      const csvContent = exportToCsv(dummyRow, truckHeaders);
      triggerCsvDownload(csvContent, 'Bản_Mẫu_Nhập_Xe_Tải.csv');
    } else {
      const trailerHeaders = [
        { key: 'trailer_id', label: 'trailer_id (Mã moóc)' },
        { key: 'license_plate', label: 'license_plate (Biển số)' },
        { key: 'model', label: 'model (Model moóc - Có thể để trống)' },
        { key: 'status', label: 'status (Trạng thái ACTIVE/SPARE/MAINTENANCE/INACTIVE)' },
        { key: 'inspection_expiry', label: 'inspection_expiry (Đăng kiểm YYYY-MM-DD - Có thể để trống)' },
        { key: 'notes', label: 'notes (Ghi chú - Có thể để trống)' }
      ];
      const dummyRow = [
        { trailer_id: 'RM99', license_plate: '51R-999.99', model: 'Cimc 40ft', status: 'SPARE', inspection_expiry: '', notes: 'Rơ moóc xương' }
      ];
      const csvContent = exportToCsv(dummyRow, trailerHeaders);
      triggerCsvDownload(csvContent, 'Bản_Mẫu_Nhập_Ro_Mooc.csv');
    }
  };

  const exportCurrentDataset = () => {
    if (activeTab === 'trucks') {
      const hdrs = [
        { key: 'truck_id', label: 'truck_id' },
        { key: 'license_plate', label: 'license_plate' },
        { key: 'model', label: 'model' },
        { key: 'status', label: 'status' },
        { key: 'attached_trailer_id', label: 'attached_trailer_id' },
        { key: 'inspection_expiry', label: 'inspection_expiry' },
        { key: 'notes', label: 'notes' }
      ];
      const csvStr = exportToCsv(trucks, hdrs);
      triggerCsvDownload(csvStr, 'Danh_Sach_Xe_Tai_Hien_Co.csv');
    } else {
      const hdrs = [
        { key: 'trailer_id', label: 'trailer_id' },
        { key: 'license_plate', label: 'license_plate' },
        { key: 'model', label: 'model' },
        { key: 'status', label: 'status' },
        { key: 'attached_truck_id', label: 'attached_truck_id' },
        { key: 'inspection_expiry', label: 'inspection_expiry' },
        { key: 'notes', label: 'notes' }
      ];
      const csvStr = exportToCsv(trailers, hdrs);
      triggerCsvDownload(csvStr, 'Danh_Sach_Ro_Mooc_Hien_Co.csv');
    }
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
          alert('Khung dữ liệu CSV rỗng hoặc sai định dạng!');
          return;
        }

        const rawHeaders = parsed[0].map(h => h.trim().toLowerCase());
        const headers: string[] = [];
        
        rawHeaders.forEach(h => {
          let cleanStr = h.split('(')[0].trim();
          if (cleanStr.includes('truck_id') || cleanStr.includes('mã xe')) cleanStr = 'truck_id';
          else if (cleanStr.includes('trailer_id') || cleanStr.includes('mã moóc') || cleanStr.includes('mã moọc')) cleanStr = 'trailer_id';
          else if (cleanStr.includes('license_plate') || cleanStr.includes('biển số') || cleanStr.includes('biển kiểm soát')) cleanStr = 'license_plate';
          else if (cleanStr.includes('model') || cleanStr.includes('kiểu')) cleanStr = 'model';
          else if (cleanStr.includes('status') || cleanStr.includes('trạng thái')) cleanStr = 'status';
          else if (cleanStr.includes('inspection_expiry') || cleanStr.includes('hạn đăng kiểm') || cleanStr.includes('đăng kiểm')) cleanStr = 'inspection_expiry';
          else if (cleanStr.includes('notes') || cleanStr.includes('ghi chú')) cleanStr = 'notes';
          headers.push(cleanStr);
        });

        const importedDataList: any[] = [];

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;
          
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = row[idx] !== undefined ? row[idx].trim() : '';
          });
          importedDataList.push(obj);
        }

        if (importedDataList.length === 0) {
          alert('Không tìm thấy dòng dữ liệu nào hợp lệ trong file CSV!');
          return;
        }

        // Apply bulk uploads
        if (activeTab === 'trucks') {
          // Normalize status
          const cleanList = importedDataList.map((item, index) => {
            const truck_id = (item.truck_id || item.trailer_id || `TT-NEW-${index + 1}`).trim().toUpperCase();
            return {
              truck_id: truck_id,
              license_plate: item.license_plate || 'Chưa gắn',
              model: item.model || '',
              status: item.status && ['ACTIVE', 'MAINTENANCE', 'INACTIVE'].includes(item.status.toUpperCase()) 
                ? item.status.toUpperCase() as any 
                : 'ACTIVE',
              attached_trailer_id: null,
              notes: item.notes || '',
              inspection_expiry: item.inspection_expiry || '',
              inspection_notes: ''
            };
          });

          // Check if any truck ID or trailer ID is duplicated
          const existingTruckIds = new Set(trucks.map(t => t.truck_id.toUpperCase().trim()));
          const duplicateTruckIdsInDb: string[] = [];
          const duplicateTruckIdsInFile = new Set<string>();
          const seenTruckIds = new Set<string>();

          cleanList.forEach(item => {
            if (existingTruckIds.has(item.truck_id)) {
              duplicateTruckIdsInDb.push(item.truck_id);
            }
            if (seenTruckIds.has(item.truck_id)) {
              duplicateTruckIdsInFile.add(item.truck_id);
            }
            seenTruckIds.add(item.truck_id);
          });

          if (duplicateTruckIdsInDb.length > 0 || duplicateTruckIdsInFile.size > 0) {
            let errorMsg = 'Chặn nhập dữ liệu do phát hiện trùng lặp mã xe tải!\n\n';
            if (duplicateTruckIdsInDb.length > 0) {
              errorMsg += `- Trùng với xe tải đã có trên hệ thống: ${Array.from(new Set(duplicateTruckIdsInDb)).join(', ')}\n`;
            }
            if (duplicateTruckIdsInFile.size > 0) {
              errorMsg += `- Trùng lặp giữa các dòng trong file CSV vừa chọn: ${Array.from(duplicateTruckIdsInFile).join(', ')}\n`;
            }
            errorMsg += '\nVui lòng kiểm tra và chỉnh sửa lại file CSV trước khi import lại.';
            alert(errorMsg);
            return;
          }

          onBulkImportTrucks(cleanList);
          alert(`Đã nhập dữ liệu hàng loạt thành công ${cleanList.length} xe tải vào hệ thống.`);
        } else {
          const cleanList = importedDataList.map((item, index) => {
            const trailer_id = (item.trailer_id || item.truck_id || `RM-NEW-${index + 1}`).trim().toUpperCase();
            return {
              trailer_id: trailer_id,
              license_plate: item.license_plate || 'Chưa gắn',
              model: item.model || '',
              status: item.status && ['ACTIVE', 'SPARE', 'MAINTENANCE', 'INACTIVE'].includes(item.status.toUpperCase()) 
                ? item.status.toUpperCase() as any 
                : 'SPARE',
              attached_truck_id: null,
              notes: item.notes || '',
              inspection_expiry: item.inspection_expiry || '',
              inspection_notes: ''
            };
          });

          // Check duplicates for trailers
          const existingTrailerIds = new Set(trailers.map(t => t.trailer_id.toUpperCase().trim()));
          const duplicateTrailerIdsInDb: string[] = [];
          const duplicateTrailerIdsInFile = new Set<string>();
          const seenTrailerIds = new Set<string>();

          cleanList.forEach(item => {
            if (existingTrailerIds.has(item.trailer_id)) {
              duplicateTrailerIdsInDb.push(item.trailer_id);
            }
            if (seenTrailerIds.has(item.trailer_id)) {
              duplicateTrailerIdsInFile.add(item.trailer_id);
            }
            seenTrailerIds.add(item.trailer_id);
          });

          if (duplicateTrailerIdsInDb.length > 0 || duplicateTrailerIdsInFile.size > 0) {
            let errorMsg = 'Chặn nhập dữ liệu do phát hiện trùng lặp mã rơ moóc!\n\n';
            if (duplicateTrailerIdsInDb.length > 0) {
              errorMsg += `- Trùng với rơ moóc đã có trên hệ thống: ${Array.from(new Set(duplicateTrailerIdsInDb)).join(', ')}\n`;
            }
            if (duplicateTrailerIdsInFile.size > 0) {
              errorMsg += `- Trùng lặp giữa các dòng trong file CSV vừa chọn: ${Array.from(duplicateTrailerIdsInFile).join(', ')}\n`;
            }
            errorMsg += '\nVui lòng kiểm tra và chỉnh sửa lại file CSV trước khi import lại.';
            alert(errorMsg);
            return;
          }

          onBulkImportTrailers(cleanList);
          alert(`Đã nhập dữ liệu hàng loạt thành công ${cleanList.length} rơ moóc vào hệ thống.`);
        }
      } catch (err) {
        console.error('Lỗi phân tích cú pháp CSV tải lên:', err);
        alert('Lỗi xử lý file CSV. Vui lòng định dạng chuẩn Unicode UTF-8.');
      }
    };
    reader.readAsText(file);
  };

  // Searching logic
  const filteredTrucks = trucks.filter(t => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      t.truck_id.toLowerCase().includes(query) ||
      t.license_plate.toLowerCase().includes(query) ||
      t.model.toLowerCase().includes(query)
    );
  }).sort((a, b) => a.truck_id.localeCompare(b.truck_id, undefined, { numeric: true, sensitivity: 'base' }));

  const filteredTrailers = trailers.filter(t => {
    const query = searchQuery.trim().toLowerCase();
    // Tab filtering first
    let tabMatch = true;
    if (trailerSubTab === 'active') tabMatch = t.status === 'ACTIVE';
    else if (trailerSubTab === 'spare') tabMatch = t.status === 'SPARE';
    else if (trailerSubTab === 'maintenance') tabMatch = t.status === 'MAINTENANCE';

    if (!tabMatch) return false;
    if (!query) return true;

    return (
      t.trailer_id.toLowerCase().includes(query) ||
      t.license_plate.toLowerCase().includes(query) ||
      t.model.toLowerCase().includes(query)
    );
  }).sort((a, b) => a.trailer_id.localeCompare(b.trailer_id, undefined, { numeric: true, sensitivity: 'base' }));

  // Fetch spare list of trailers
  const spareTrailers = trailers.filter(t => t.status === 'SPARE');
  
  // Filter spare trailers for attach modal search
  const filteredSpareTrailers = spareTrailers.filter(t => {
    const q = attachSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.trailer_id.toLowerCase().includes(q) ||
      t.license_plate.toLowerCase().includes(q) ||
      (t.model && t.model.toLowerCase().includes(q))
    );
  }).sort((a, b) => a.trailer_id.localeCompare(b.trailer_id, undefined, { numeric: true, sensitivity: 'base' }));

  // Pagination logic
  const currentTotal = activeTab === 'trucks' ? filteredTrucks.length : filteredTrailers.length;
  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, currentTotal);

  const paginatedTrucks = filteredTrucks.slice(startIndex, endIndex);
  const paginatedTrailers = filteredTrailers.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safePage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safePage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-105' : 'text-slate-800'}`}>
      
      {/* Title & CSV Actions (Matches Image 4 Top Right) */}
      <div id="veh_header_controls" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-900">
        <div>
          <h2 id="veh_view_title" className="text-2xl font-black tracking-tight flex items-center gap-2">
            {language === 'vi' ? 'Quản lý xe' : 'Vehicle Management'}
          </h2>
          <p id="veh_view_desc" className="text-xs text-slate-505 font-medium mt-0.5">
            {language === 'vi' ? 'Truck · Trailer · Gắn kết phương tiện vận chuyển Port' : 'Truck · Trailer · Port Transport Logistics'}
          </p>
        </div>

        {/* Action button cluster */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <button
            id="csv_sample_download_btn"
            type="button"
            onClick={downloadSampleCsv}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Mẫu CSV
          </button>

          <button
            id="csv_export_btn"
            type="button"
            onClick={exportCurrentDataset}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> Xuất CSV
          </button>

          <label
            id="csv_import_label"
            htmlFor="csv_upload_input"
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload CSV
            <input
              id="csv_upload_input"
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>

          {(currentUser.role === 'admin' || currentUser.permission === 'all') && (
            <button
              id="add_new_asset_trigger_btn"
              type="button"
              onClick={() => {
                if (activeTab === 'trucks') openTruckForm(null);
                else openTrailerForm(null);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/10 hover:-translate-y-[0.5px] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'trucks' ? 'Thêm Truck' : 'Thêm Trailer'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & View Mode Switcher Row */}
      <div id="veh_search_row" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            id="vehicle_search_box"
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={language === 'vi' ? 'Tìm theo mã xe, biển số, kiểu mẫu...' : 'Search by vehicle ID, plate, model...'}
            className={`w-full pl-11 pr-10 py-2.5 text-sm rounded-xl outline-none border transition-all ${
              isDarkMode 
                ? 'bg-slate-950 border-slate-850 text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Mode Switcher (Dạng thẻ / Dạng danh sách) */}
        <div className="flex items-center gap-2 select-none self-end sm:self-auto">
          <div className={`flex items-center p-1 rounded-xl border ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              id="view_mode_grid_btn"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Dạng thẻ' : 'Grid'}</span>
            </button>
            <button
              id="view_mode_list_btn"
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Dạng danh sách' : 'List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs switcher (Matches Image 4 & 5 Tab layouts) */}
      <div id="veh_tabs_wrapper" className="flex border-b border-dashed border-slate-800/60">
        <button
          id="tab_vehicles_trucks"
          type="button"
          onClick={() => {
            setActiveTab('trucks');
            setSearchQuery('');
            setCurrentPage(1);
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all focus:outline-none cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'trucks'
              ? 'border-indigo-500 text-indigo-500 font-bold'
              : 'border-transparent text-slate-450 hover:text-slate-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
          Truck ({trucks.length})
        </button>
        <button
          id="tab_vehicles_trailers"
          type="button"
          onClick={() => {
            setActiveTab('trailers');
            setSearchQuery('');
            setCurrentPage(1);
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all focus:outline-none cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'trailers'
              ? 'border-indigo-500 text-indigo-500 font-bold'
              : 'border-transparent text-slate-450 hover:text-slate-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Trailer ({trailers.length})
        </button>
      </div>

      {/* TRAILERS Sub-tabs bar (Matches Image 5 Panel exactly: All, Active, Spare, Maint) */}
      {activeTab === 'trailers' && (
        <div id="trailers_subtabs_wrapper" className="flex flex-wrap items-center gap-2 select-none">
          {(['all', 'active', 'spare', 'maintenance'] as const).map(sub => (
            <button
              id={`trailer_sub_tab_${sub}`}
              key={sub}
              type="button"
              onClick={() => {
                setTrailerSubTab(sub);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                trailerSubTab === sub
                  ? 'bg-blue-600 text-white font-bold'
                  : isDarkMode
                    ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub === 'all' ? 'Tất cả' : sub === 'active' ? 'Đang kéo' : sub === 'spare' ? 'Dự phòng' : 'Sửa chữa'}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {currentTotal === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed ${isDarkMode ? 'border-slate-800 bg-slate-900/30 text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
          <TruckIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm text-slate-400">
            {language === 'vi' ? 'Không tìm thấy phương tiện nào phù hợp' : 'No matching vehicles found'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="mt-3 text-xs text-indigo-400 hover:underline font-bold cursor-pointer"
            >
              {language === 'vi' ? 'Xóa từ khóa tìm kiếm' : 'Clear search query'}
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Main Grid Dataset Displays */
        <div id="vehicle_cards_grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Render Trucks Cards */}
          {activeTab === 'trucks' && paginatedTrucks.map(truck => {
            const hasTrailer = !!truck.attached_trailer_id;
            
            return (
              <div 
                id={`truck_card_${truck.truck_id}`}
                key={truck.id}
                className={`border rounded-2xl p-4.5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-[0.5px] transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-slate-700/50 hover:border-indigo-500/50' 
                    : 'bg-white border-slate-150 hover:border-slate-250 shadow-xs'
                }`}
              >
                {/* Card top */}
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-extrabold tracking-wide text-blue-500 font-mono">
                        {truck.truck_id}
                      </h4>
                      <span className="text-xs text-slate-500 font-mono tracking-wider">
                        {truck.license_plate}
                      </span>
                      <div className="text-xs font-semibold text-slate-400 mt-1">
                        {truck.model}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-[9.5px] uppercase font-black px-2 py-0.5 rounded-full border ${
                      truck.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400 font-black'
                        : truck.status === 'MAINTENANCE'
                          ? 'bg-amber-500/15 border-amber-500/20 text-amber-400 font-black'
                          : 'bg-slate-500/10 border-slate-400/20 text-slate-450'
                    }`}>
                      {truck.status === 'ACTIVE' ? 'Hoạt động' : truck.status === 'MAINTENANCE' ? 'Bảo trì' : 'Ngưng'}
                    </span>
                  </div>

                  {/* Sub info links without registration (inspection) details */}
                  <div className="mt-4 pt-3 border-t border-dashed border-slate-800/10 dark:border-slate-850/40 space-y-1.5 text-xs text-slate-400 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Trailer đính kèm:</span>
                      {hasTrailer ? (
                        <span className="text-blue-504 font-extrabold font-mono">{truck.attached_trailer_id}</span>
                      ) : (
                        <span className="text-slate-600 italic">Chưa gắn moóc</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact, high contrast actions row */}
                <div className="mt-4 pt-3 flex items-center justify-between gap-1.5 border-t border-slate-800/10 dark:border-slate-850/30 select-none">
                  <button
                    id={`btn_truck_diagram_${truck.truck_id}`}
                    type="button"
                    onClick={() => openTireDiagram(truck.truck_id, 'TRUCK')}
                    className="flex-1 py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border border-indigo-505/20 hover:border-indigo-500/40 text-xs font-black rounded-lg cursor-pointer text-center flex items-center justify-center gap-1 transition-all"
                    title="Xem sơ đồ vị trí lốp"
                  >
                    <Compass className="w-3.5 h-3.5" /> <span>Sơ đồ</span>
                  </button>

                  {hasTrailer ? (
                    <button
                      id={`btn_truck_detach_${truck.truck_id}`}
                      type="button"
                      onClick={() => {
                        if (confirm(`Bạn chắc chắn muốn tháo rơ moóc ${truck.attached_trailer_id} khỏi xe ${truck.truck_id}?`)) {
                          onDetachTrailer(truck.truck_id);
                        }
                      }}
                      className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                        isDarkMode 
                          ? 'bg-rose-950/15 hover:bg-rose-950/35 text-rose-400 border-rose-500/20' 
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-2xs'
                      }`}
                      title={`Tháo moóc ${truck.attached_trailer_id}`}
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      id={`btn_truck_attach_${truck.truck_id}`}
                      type="button"
                      onClick={() => openAttachTrailerDrawer(truck.truck_id)}
                      className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                        isDarkMode 
                          ? 'bg-emerald-950/15 hover:bg-emerald-950/35 text-emerald-400 border-emerald-500/20' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-2xs'
                      }`}
                      title="Gắn moóc"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    id={`btn_truck_repair_${truck.truck_id}`}
                    type="button"
                    onClick={() => openRepairLogsDrawer(truck.truck_id, 'TRUCK')}
                    className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-350 text-slate-700 shadow-2xs'
                    }`}
                    title="Nhật ký Sửa chữa (Cờ lê)"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn_truck_edit_${truck.truck_id}`}
                    type="button"
                    onClick={() => openTruckForm(truck)}
                    className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-slate-450 hover:text-white'
                        : 'bg-indigo-50 hover:bg-indigo-150 border-indigo-250 text-indigo-755 shadow-2xs'
                    }`}
                    title="Sửa thông tin"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn_truck_delete_${truck.truck_id}`}
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn chắc chắn muốn xóa xe tải ${truck.truck_id} vĩnh viễn khỏi cơ sở dữ liệu?`)) {
                        onDeleteTruck(truck.id);
                      }
                    }}
                    className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 hover:bg-red-955/20 text-slate-500 hover:text-red-400'
                        : 'bg-rose-50 hover:bg-rose-150 border-rose-250 text-rose-700 shadow-2xs'
                    }`}
                    title="Xoá xe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Render Trailers listings (Matches Image 5 Card layouts) */}
          {activeTab === 'trailers' && paginatedTrailers.map(trailer => {
            const hasTruck = !!trailer.attached_truck_id;

            return (
              <div 
                id={`trailer_card_${trailer.trailer_id}`}
                key={trailer.id}
                className={`border rounded-2xl p-4.5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-[0.5px] transition-all duration-305 ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-slate-700/50 hover:border-indigo-500/50' 
                    : 'bg-white border-slate-150 hover:border-slate-250 shadow-xs'
                }`}
              >
                {/* Card top */}
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-extrabold tracking-wide text-blue-500 font-mono">
                        {trailer.trailer_id}
                      </h4>
                      <span className="text-xs text-slate-500 font-mono tracking-wider">
                        {trailer.license_plate}
                      </span>
                      <div className="text-xs font-semibold text-slate-400 mt-1">
                        {trailer.model}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[9.5px] uppercase font-black px-2 py-0.5 rounded-full border ${
                      trailer.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400 font-black'
                        : trailer.status === 'SPARE'
                          ? 'bg-blue-500/15 border-blue-500/20 text-blue-400 font-black'
                          : trailer.status === 'MAINTENANCE'
                            ? 'bg-amber-500/15 border-amber-500/20 text-amber-400 font-black'
                            : 'bg-slate-500/10 border-slate-400/20 text-slate-450'
                    }`}>
                      {trailer.status === 'ACTIVE' ? 'Đang kéo' : trailer.status === 'SPARE' ? 'Dự phòng' : trailer.status === 'MAINTENANCE' ? 'Đang sửa' : 'Ngưng'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-slate-800/10 dark:border-slate-850/40 space-y-1.5 text-xs text-slate-400 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Xe tải kéo:</span>
                      {hasTruck ? (
                        <span className="text-blue-504 font-extrabold font-mono">{trailer.attached_truck_id}</span>
                      ) : (
                        <span className="text-slate-600 italic">Đang ở bãi</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Actions row for Trailer */}
                <div className="mt-4 pt-3 flex items-center justify-between gap-1.5 border-t border-slate-800/10 dark:border-slate-850/30 select-none">
                  <button
                    id={`btn_trailer_diagram_${trailer.trailer_id}`}
                    type="button"
                    onClick={() => openTireDiagram(trailer.trailer_id, 'TRAILER')}
                    className="flex-1 py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border border-indigo-505/20 hover:border-indigo-500/40 text-xs font-black rounded-lg cursor-pointer text-center flex items-center justify-center gap-1 transition-all"
                    title="Xem sơ đồ vị trí lốp"
                  >
                    <Compass className="w-3.5 h-3.5" /> <span>Sơ đồ</span>
                  </button>

                  <button
                    id={`btn_trailer_repair_${trailer.trailer_id}`}
                    type="button"
                    onClick={() => openRepairLogsDrawer(trailer.trailer_id, 'TRAILER')}
                    className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-350 text-slate-705 shadow-2xs'
                    }`}
                    title="Nhật ký Sửa chữa (Cờ lê)"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn_trailer_edit_${trailer.trailer_id}`}
                    type="button"
                    onClick={() => openTrailerForm(trailer)}
                    className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-slate-455 hover:text-white'
                        : 'bg-indigo-50 hover:bg-indigo-150 border-indigo-250 text-indigo-755 shadow-2xs'
                    }`}
                    title="Sửa thông tin"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn_trailer_delete_${trailer.trailer_id}`}
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn chắc chắn muốn xóa rơ moóc ${trailer.trailer_id} khỏi bãi?`)) {
                        onDeleteTrailer(trailer.id);
                      }
                    }}
                    className={`p-2 rounded-lg border cursor-pointer text-center flex items-center justify-center transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 hover:bg-red-955/20 text-slate-500 hover:text-red-400'
                        : 'bg-rose-50 hover:bg-rose-150 border-rose-250 text-rose-705 shadow-2xs'
                    }`}
                    title="Xoá moóc"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Main List / Table Dataset Displays */
        <div>
          {activeTab === 'trucks' ? (
            <div className={`overflow-x-auto rounded-2xl border ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'} shadow-xs`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'} text-[11px] font-black uppercase tracking-wider`}>
                    <th className="py-3.5 px-4">Mã xe</th>
                    <th className="py-3.5 px-4">Biển số</th>
                    <th className="py-3.5 px-4">Kiểu / Model</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Trailer đính kèm</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-150 text-slate-700'}`}>
                  {paginatedTrucks.map(truck => {
                    const hasTrailer = !!truck.attached_trailer_id;
                    return (
                      <tr 
                        id={`truck_row_${truck.truck_id}`}
                        key={truck.id} 
                        className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-extrabold text-blue-500 text-sm">{truck.truck_id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {truck.license_plate}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {truck.model || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9.5px] uppercase font-black px-2 py-0.5 rounded-full border ${
                            truck.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                              : truck.status === 'MAINTENANCE'
                                ? 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                                : 'bg-slate-500/10 border-slate-400/20 text-slate-450'
                          }`}>
                            {truck.status === 'ACTIVE' ? 'Hoạt động' : truck.status === 'MAINTENANCE' ? 'Bảo trì' : 'Ngưng'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {hasTrailer ? (
                            <span className="font-mono font-extrabold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                              {truck.attached_trailer_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa gắn moóc</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 select-none">
                            <button
                              id={`btn_truck_diagram_list_${truck.truck_id}`}
                              type="button"
                              onClick={() => openTireDiagram(truck.truck_id, 'TRUCK')}
                              className="py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-black rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                              title="Xem sơ đồ vị trí lốp"
                            >
                              <Compass className="w-3.5 h-3.5" /> <span>Sơ đồ</span>
                            </button>

                            {hasTrailer ? (
                              <button
                                id={`btn_truck_detach_list_${truck.truck_id}`}
                                type="button"
                                onClick={() => {
                                  if (confirm(`Bạn chắc chắn muốn tháo rơ moóc ${truck.attached_trailer_id} khỏi xe ${truck.truck_id}?`)) {
                                    onDetachTrailer(truck.truck_id);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                  isDarkMode 
                                    ? 'bg-rose-950/15 hover:bg-rose-950/35 text-rose-400 border-rose-500/20' 
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                }`}
                                title={`Tháo moóc ${truck.attached_trailer_id}`}
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                id={`btn_truck_attach_list_${truck.truck_id}`}
                                type="button"
                                onClick={() => openAttachTrailerDrawer(truck.truck_id)}
                                className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                  isDarkMode 
                                    ? 'bg-emerald-950/15 hover:bg-emerald-950/35 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                title="Gắn moóc"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              id={`btn_truck_repair_list_${truck.truck_id}`}
                              type="button"
                              onClick={() => openRepairLogsDrawer(truck.truck_id, 'TRUCK')}
                              className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                isDarkMode
                                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 border-slate-350 text-slate-700'
                              }`}
                              title="Nhật ký Sửa chữa (Cờ lê)"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`btn_truck_edit_list_${truck.truck_id}`}
                              type="button"
                              onClick={() => openTruckForm(truck)}
                              className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                isDarkMode
                                  ? 'bg-slate-950 border-slate-800 text-slate-450 hover:text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-150 border-indigo-250 text-indigo-755'
                              }`}
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`btn_truck_delete_list_${truck.truck_id}`}
                              type="button"
                              onClick={() => {
                                if (confirm(`Bạn chắc chắn muốn xóa xe tải ${truck.truck_id} vĩnh viễn khỏi cơ sở dữ liệu?`)) {
                                  onDeleteTruck(truck.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                isDarkMode
                              ? 'bg-slate-950 border-slate-800 hover:bg-red-955/20 text-slate-500 hover:text-red-400'
                              : 'bg-rose-50 hover:bg-rose-150 border-rose-250 text-rose-700'
                              }`}
                              title="Xoá xe"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`overflow-x-auto rounded-2xl border ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'} shadow-xs`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'} text-[11px] font-black uppercase tracking-wider`}>
                    <th className="py-3.5 px-4">Mã moóc</th>
                    <th className="py-3.5 px-4">Biển số</th>
                    <th className="py-3.5 px-4">Kiểu / Model</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Xe tải kéo</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-150 text-slate-700'}`}>
                  {paginatedTrailers.map(trailer => {
                    const hasTruck = !!trailer.attached_truck_id;
                    return (
                      <tr 
                        id={`trailer_row_${trailer.trailer_id}`}
                        key={trailer.id} 
                        className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-extrabold text-blue-500 text-sm">{trailer.trailer_id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {trailer.license_plate}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {trailer.model || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9.5px] uppercase font-black px-2 py-0.5 rounded-full border ${
                            trailer.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                              : trailer.status === 'SPARE'
                                ? 'bg-blue-500/15 border-blue-500/20 text-blue-400'
                                : trailer.status === 'MAINTENANCE'
                                  ? 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                                  : 'bg-slate-500/10 border-slate-400/20 text-slate-450'
                          }`}>
                            {trailer.status === 'ACTIVE' ? 'Đang kéo' : trailer.status === 'SPARE' ? 'Dự phòng' : trailer.status === 'MAINTENANCE' ? 'Đang sửa' : 'Ngưng'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {hasTruck ? (
                            <span className="font-mono font-extrabold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                              {trailer.attached_truck_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Đang ở bãi</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 select-none">
                            <button
                              id={`btn_trailer_diagram_list_${trailer.trailer_id}`}
                              type="button"
                              onClick={() => openTireDiagram(trailer.trailer_id, 'TRAILER')}
                              className="py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-black rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                              title="Xem sơ đồ vị trí lốp"
                            >
                              <Compass className="w-3.5 h-3.5" /> <span>Sơ đồ</span>
                            </button>

                            <button
                              id={`btn_trailer_repair_list_${trailer.trailer_id}`}
                              type="button"
                              onClick={() => openRepairLogsDrawer(trailer.trailer_id, 'TRAILER')}
                              className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                isDarkMode
                                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 border-slate-350 text-slate-705'
                              }`}
                              title="Nhật ký Sửa chữa (Cờ lê)"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`btn_trailer_edit_list_${trailer.trailer_id}`}
                              type="button"
                              onClick={() => openTrailerForm(trailer)}
                              className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                isDarkMode
                                  ? 'bg-slate-950 border-slate-800 text-slate-455 hover:text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-150 border-indigo-250 text-indigo-755'
                              }`}
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`btn_trailer_delete_list_${trailer.trailer_id}`}
                              type="button"
                              onClick={() => {
                                if (confirm(`Bạn chắc chắn muốn xóa rơ moóc ${trailer.trailer_id} khỏi bãi?`)) {
                                  onDeleteTrailer(trailer.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all ${
                                isDarkMode
                                  ? 'bg-slate-950 border-slate-800 hover:bg-red-955/20 text-slate-500 hover:text-red-400'
                                  : 'bg-rose-50 hover:bg-rose-150 border-rose-250 text-rose-705'
                              }`}
                              title="Xoá moóc"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination Bar */}
      {currentTotal > 0 && (
        <div id="veh_pagination_row" className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t ${
          isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
        } text-xs select-none`}>
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {language === 'vi' 
                ? `Hiển thị ${startIndex + 1} - ${endIndex} trên tổng số ${currentTotal} ${activeTab === 'trucks' ? 'xe đầu kéo' : 'rơ moóc'}`
                : `Showing ${startIndex + 1} - ${endIndex} of ${currentTotal} ${activeTab === 'trucks' ? 'trucks' : 'trailers'}`
              }
            </span>
            <span className="text-slate-500">|</span>
            <div className="flex items-center gap-1.5">
              <span>{language === 'vi' ? 'Số lượng / trang:' : 'Per page:'}</span>
              <select
                id="veh_page_size_select"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'
                }`}
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                id="veh_page_first_btn"
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  safePage === 1
                    ? 'opacity-30 cursor-not-allowed border-transparent'
                    : isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
                title="Trang đầu"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                id="veh_page_prev_btn"
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  safePage === 1
                    ? 'opacity-30 cursor-not-allowed border-transparent'
                    : isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {getPageNumbers().map((p, idx) => {
                if (typeof p === 'string') {
                  return <span key={`ellipsis-${idx}`} className="px-1 text-slate-500 font-mono">...</span>;
                }
                const isCurrent = safePage === p;
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[30px] h-7 px-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                id="veh_page_next_btn"
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  safePage === totalPages
                    ? 'opacity-30 cursor-not-allowed border-transparent'
                    : isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
                title="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                id="veh_page_last_btn"
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  safePage === totalPages
                    ? 'opacity-30 cursor-not-allowed border-transparent'
                    : isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
                title="Trang cuối"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Renders drawers / drawers sidebar based on drawerType */}
      {drawerType !== 'none' && (
        <div id="drawer_overlay" className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs select-none">
          {/* Collapse trigger box clicking blank overlay */}
          <div className="flex-1" onClick={() => setDrawerType('none')}></div>
          
          <div className={`w-full max-w-md h-screen p-6 overflow-y-auto shadow-2xl flex flex-col justify-between border-l ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'
          }`}>
            
            {/* Header drawer */}
            <div className="flex justify-between items-center border-b pb-4 border-slate-850">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-widest text-blue-500">
                  {drawerType === 'diagram' && `Sơ đồ lốp · ${selectedAssetId}`}
                  {drawerType === 'attach_trailer' && `Gắn trailer cho ${selectedAssetId}`}
                  {drawerType === 'repair_logs' && `Sửa chữa · ${selectedAssetId}`}
                  {drawerType === 'form_truck' && (isEditingForm ? 'Sửa thông tin Truck' : 'Thêm xe tải mới')}
                  {drawerType === 'form_trailer' && (isEditingForm ? 'Sửa thông tin Trailer' : 'Thêm rơ moóc mới')}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">Mã hồ sơ: ID-ACTIVE-PORT</span>
              </div>
              <button 
                id="drawer_close_trigger_btn"
                type="button" 
                onClick={() => setDrawerType('none')}
                className="w-8 h-8 rounded-full border border-slate-800 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content drawer */}
            <div className="flex-1 py-6 overflow-y-auto">
              {/* Type 1: Sơ đồ lốp (Visual Skeletons based on Image 9) */}
              {drawerType === 'diagram' && selectedAssetId && (
                <div className="space-y-6">
                  {selectedAssetType === 'TRUCK' ? (
                    <div id="skeleton_truck_view" className="space-y-6">
                      <div className="text-center text-xs text-slate-500 italic">Sơ đồ lốp (chỉ xem)</div>
                      
                      <div className="w-full flex justify-center py-2 bg-blue-600/5 border border-blue-500/10 rounded-xl text-xs font-bold text-blue-400">Trục trước</div>
                      <div id="truck_diagram_axle_1" className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                        {renderTyreCell('FL (Trước Trái)', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'FL'))}
                        {renderTyreCell('FR (Trước Phải)', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'FR'))}
                      </div>

                      <div className="w-full flex justify-center py-2 bg-blue-600/5 border border-blue-500/10 rounded-xl text-xs font-bold text-blue-400">Trục sau</div>
                      <div id="truck_diagram_axle_2" className="grid grid-cols-4 gap-2">
                        {renderTyreCell('ORL', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'ORL'))}
                        {renderTyreCell('IRL', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'IRL'))}
                        {renderTyreCell('IRR', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'IRR'))}
                        {renderTyreCell('ORR', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'ORR'))}
                      </div>

                      <div className="text-center pt-8 opacity-40">
                        <TruckIcon className="w-16 h-16 mx-auto text-slate-500" />
                        <span className="text-[10px] tracking-widest font-bold uppercase mt-2 block">↑ Mũi xe</span>
                      </div>
                    </div>
                  ) : (
                    // Trailer Diagram (matches Image 14: 8 tyres dual cluster)
                    <div id="skeleton_trailer_view" className="space-y-6">
                      <div className="text-center text-xs text-slate-500 italic font-medium">Sơ đồ lốp moóc 8 lốp · 2 trục đôi</div>

                      <div className="w-full flex justify-center py-1.5 bg-emerald-600/5 border border-emerald-500/15 rounded-xl text-xs font-bold text-emerald-400">Trục A (Trước)</div>
                      <div id="trailer_diagram_axle_a" className="grid grid-cols-4 gap-2">
                        {renderTyreCell('OFL', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'A_OL'))}
                        {renderTyreCell('IFL', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'A_IL'))}
                        {renderTyreCell('IFR', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'A_IR'))}
                        {renderTyreCell('OFR', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'A_OR'))}
                      </div>

                      <div className="w-full flex justify-center py-1.5 bg-emerald-600/5 border border-emerald-500/15 rounded-xl text-xs font-bold text-emerald-400">Trục B (Sau)</div>
                      <div id="trailer_diagram_axle_b" className="grid grid-cols-4 gap-2">
                        {renderTyreCell('ORL', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'B_OL'))}
                        {renderTyreCell('IRL', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'B_IL'))}
                        {renderTyreCell('IRR', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'B_IR'))}
                        {renderTyreCell('ORR', tireLatest.find(t => t.asset_id === selectedAssetId && t.position === 'B_OR'))}
                      </div>

                      <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-800 text-xs leading-relaxed space-y-1 bg-slate-950/20 text-slate-400">
                        <div className="flex gap-1.5 items-center font-bold text-slate-300"><Info className="w-3.5 h-3.5" /> Ghi chú phân loại màu:</div>
                        <div className="flex items-center gap-3 pt-1">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> OK (≥3mm)</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> WARN (1-3mm)</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> BAD (&lt;1mm)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type 2: Gắn Rơ Moóc (Attach Trailer Slider Image 6) */}
              {drawerType === 'attach_trailer' && selectedAssetId && (
                <div className="space-y-4">
                  <p id="attach_instructions" className="text-xs text-slate-500 font-medium">
                    Chọn trailer dự phòng để gắn vào <span className="text-blue-400 font-extrabold">{selectedAssetId}</span>
                  </p>

                  {/* Search box for filtering spare trailers */}
                  {spareTrailers.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="attach_trailer_search_box"
                        type="text"
                        value={attachSearchQuery}
                        onChange={e => setAttachSearchQuery(e.target.value)}
                        placeholder="Tìm nhanh theo mã moóc, biển số, kiểu mẫu..."
                        className={`w-full pl-10 pr-9 py-2 text-xs rounded-xl outline-none border transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10' 
                            : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                        }`}
                      />
                      {attachSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setAttachSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                          title="Xóa tìm kiếm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {attachSearchQuery && spareTrailers.length > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>
                        Tìm thấy <strong className="text-indigo-400 font-bold">{filteredSpareTrailers.length}</strong> / {spareTrailers.length} trailer dự phòng
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachSearchQuery('')}
                        className="text-xs text-indigo-400 hover:underline cursor-pointer"
                      >
                        Đặt lại
                      </button>
                    </div>
                  )}
                  
                  {spareTrailers.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-505 bg-slate-950/30 rounded-2xl border border-dashed border-slate-850">
                      Không còn rơ moóc nào đang rảnh trong bãi! Vui lòng Tháo moóc trước khi gắn mới.
                    </div>
                  ) : filteredSpareTrailers.length === 0 ? (
                    <div className="text-center py-12 px-4 text-xs text-slate-400 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 space-y-2">
                      <p>Không tìm thấy rơ moóc dự phòng nào khớp với "{attachSearchQuery}"</p>
                      <button
                        type="button"
                        onClick={() => setAttachSearchQuery('')}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold cursor-pointer transition-all"
                      >
                        Xóa bộ lọc tìm kiếm
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSpareTrailers.map(trailer => (
                        <div 
                          id={`spare_trailer_row_${trailer.trailer_id}`}
                          key={trailer.id}
                          className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 flex justify-between items-center transition-all hover:bg-slate-950 hover:border-slate-700"
                        >
                          <div>
                            <span className="text-sm font-extrabold text-slate-200 font-mono block">{trailer.trailer_id}</span>
                            <span className="text-[10px] text-slate-500 block leading-tight font-mono">{trailer.license_plate} · {trailer.model}</span>
                          </div>
                          <button
                            id={`attach_action_btn_${trailer.trailer_id}`}
                            type="button"
                            onClick={() => {
                              onAttachTrailer(selectedAssetId, trailer.trailer_id);
                              setDrawerType('none');
                              alert(`Đã liên kết thành công rơ moóc ${trailer.trailer_id} vào xe đầu kéo ${selectedAssetId}.`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-sans cursor-pointer active:scale-98 transition-all shadow-sm"
                          >
                            Gắn kèm
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Type 3: Nhật ký sửa chữa & Tạo phiếu sửa chữa (Repair panel Image 7) */}
              {drawerType === 'repair_logs' && selectedAssetId && (
                <div className="space-y-6">
                  {/* Form creating repair ticket */}
                  <form onSubmit={handleAddRepairLogSubmit} className="space-y-4 border p-4 rounded-2xl bg-slate-950/40 border-slate-850 leading-relaxed">
                    <div className="flex justify-between items-center border-b border-dashed border-slate-850 pb-2">
                      <span className="text-xs font-black text-amber-500">Lịch sử sửa chữa · {selectedAssetId}</span>
                      <span className="text-[10.5px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">+ Tạo phiếu sửa</span>
                    </div>

                    {errRepairInput && <div className="p-2.5 text-xs text-rose-450 border border-rose-500/20 bg-rose-950/30 rounded-lg">{errRepairInput}</div>}

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Mô tả lỗi *</label>
                      <textarea
                        required
                        rows={2}
                        value={repairDescription}
                        onChange={e => setRepairDescription(e.target.value)}
                        placeholder="Mô tả triệu chứng, lỗi phát sinh..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-amber-500 text-xs rounded-lg text-slate-100 outline-none placeholder:text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Nguyên nhân sơ bộ</label>
                        <input
                          type="text"
                          value={repairRootCause}
                          onChange={e => setRepairRootCause(e.target.value)}
                          placeholder="Hư hỏng, mòn cũ..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-amber-500 text-xs rounded-lg text-slate-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Thợ sửa chữa</label>
                        <input
                          type="text"
                          value={repairTechnician}
                          onChange={e => setRepairTechnician(e.target.value)}
                          placeholder="Tên thợ..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-amber-500 text-xs rounded-lg text-slate-100 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Thời gian bắt đầu</label>
                        <input
                          type="datetime-local"
                          value={repairStartTime}
                          onChange={e => setRepairStartTime(e.target.value)}
                          onClick={e => { try { e.currentTarget.showPicker(); } catch(err) {} }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-amber-500 text-xs rounded-lg text-slate-100 outline-none cursor-pointer font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Chi phí ước tính (VND)</label>
                        <input
                          type="number"
                          value={repairCost}
                          onChange={e => setRepairCost(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-amber-500 text-xs rounded-lg text-slate-100 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-450 uppercase mb-1.5">Ghi chú</label>
                      <input
                        type="text"
                        value={repairNotes}
                        onChange={e => setRepairNotes(e.target.value)}
                        placeholder="Ghi chú thêm..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-amber-500 text-xs rounded-lg text-slate-100 outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="btn_create_repair_ticket"
                        type="submit"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        Tạo phiếu sửa
                      </button>
                      <button
                        id="btn_cancel_repair_ticket"
                        type="button"
                        onClick={() => {
                          setRepairDescription('');
                          setRepairRootCause('');
                          setRepairTechnician('');
                          setRepairCost('0');
                          setRepairNotes('');
                          setErrRepairInput('');
                        }}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-355 text-xs font-semibold rounded-lg"
                      >
                        Hủy
                      </button>
                    </div>

                  </form>

                  {/* List of active/done repair logs of selected ID */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-slate-500" /> Bảng nhật ký của {selectedAssetId}
                    </h5>
                    
                    {repairLogs.filter(rl => rl.asset_id === selectedAssetId).length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-600 italic">
                        Chưa có lịch sử sửa chữa
                      </div>
                    ) : (
                      repairLogs.filter(rl => rl.asset_id === selectedAssetId).map(log => (
                        <div 
                          key={log.id} 
                          className="p-3 border rounded-xl bg-slate-950/20 border-slate-850 leading-relaxed text-xs"
                        >
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-300 font-mono truncate max-w-[200px]">{log.fault_description}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-sans ${
                              log.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {log.status === 'DONE' ? 'Hoàn thành' : 'Đang xử lý'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-slate-500 text-[11px]">
                            <div>Thợ: <span className="text-slate-400 font-medium">{log.technician_name || 'N/A'}</span></div>
                            <div>Chi phí: <span className="text-slate-300 font-semibold font-mono">{log.cost.toLocaleString()} đ</span></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Type 4: Add / Edit TRUCK form */}
              {drawerType === 'form_truck' && (
                <form onSubmit={handleTruckSubmit} className="space-y-4 text-xs leading-relaxed font-sans">
                  <div className="p-4 rounded-xl border border-blue-500/15 bg-blue-500/5 text-[11px] text-blue-400 leading-normal mb-3 flex gap-2">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Mã xe và biển số xe là thông tin duy nhất dùng để truy xuất lốp sau này tại cảng.</span>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Mã Truck * (VD: TT01)</label>
                    <input
                      type="text"
                      required
                      value={formTruckId}
                      onChange={e => setFormTruckId(e.target.value.toUpperCase())}
                      placeholder="TT01"
                      disabled={isEditingForm}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Biển số * (VD: 51C-123.45)</label>
                    <input
                      type="text"
                      required
                      value={formPlate}
                      onChange={e => setFormPlate(e.target.value.toUpperCase())}
                      placeholder="51C-123.45"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Model xe tải</label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={e => setFormModel(e.target.value)}
                      placeholder="Hyundai HD1000 / Kalmar"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Trạng thái xe</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none"
                    >
                      <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                      <option value="MAINTENANCE">Cần bảo trì sửa chữa (MAINTENANCE)</option>
                      <option value="INACTIVE">Ngưng hoạt động (INACTIVE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Hạn Đăng Kiểm</label>
                    <div className="relative">
                      <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="date"
                        value={formInspectionExpiry}
                        onChange={e => setFormInspectionExpiry(e.target.value)}
                        onClick={e => { try { e.currentTarget.showPicker(); } catch(err) {} }}
                        className="w-full px-3 py-2.5 pl-3 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none font-mono cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Ghi chú</label>
                    <textarea
                      rows={3}
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="Ghi chú thêm..."
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none placeholder:text-slate-850"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      id="btn_submit_truck_form"
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center justify-center gap-1 transition-all shadow-md"
                    >
                      {isEditingForm ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                    <button
                      id="btn_cancel_truck_form"
                      type="button"
                      onClick={() => setDrawerType('none')}
                      className="px-6 py-2.5 bg-slate-950 hover:bg-slate-805 text-slate-355 rounded-lg border border-slate-850 font-semibold"
                    >
                      Hủy
                    </button>
                  </div>

                </form>
              )}

              {/* Type 5: Add / Edit TRAILER form */}
              {drawerType === 'form_trailer' && (
                <form onSubmit={handleTrailerSubmit} className="space-y-4 text-xs leading-relaxed font-sans">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Mã Moóc * (VD: RM-01)</label>
                    <input
                      type="text"
                      required
                      value={formTruckId}
                      onChange={e => setFormTruckId(e.target.value.toUpperCase())}
                      placeholder="RM-01"
                      disabled={isEditingForm}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Biển số rơ moóc *</label>
                    <input
                      type="text"
                      required
                      value={formPlate}
                      onChange={e => setFormPlate(e.target.value.toUpperCase())}
                      placeholder="51R-001.01"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Model Rơ Moóc</label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={e => setFormModel(e.target.value)}
                      placeholder="Cimc 40ft rơ moóc xương"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Trạng thái rơ moóc</label>
                    <select
                      value={formTrailerStatus}
                      onChange={e => setFormTrailerStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none"
                    >
                      <option value="ACTIVE">Đang kéo hoạt động (ACTIVE)</option>
                      <option value="SPARE">Có sẵn trong kho dự phòng (SPARE)</option>
                      <option value="MAINTENANCE">Cần sửa chữa bảo trì (MAINTENANCE)</option>
                      <option value="INACTIVE">Ngưng hoạt động hẳn (INACTIVE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Đăng kiểm hết hạn</label>
                    <div className="relative">
                      <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="date"
                        value={formInspectionExpiry}
                        onChange={e => setFormInspectionExpiry(e.target.value)}
                        onClick={e => { try { e.currentTarget.showPicker(); } catch(err) {} }}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none font-mono cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-450 uppercase mb-1.5">Ghi chú moóc</label>
                    <textarea
                      rows={3}
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="Ghi chú thêm về rơ moóc..."
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg text-slate-100 outline-none placeholder:text-slate-850"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      id="btn_submit_trailer_form"
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center justify-center gap-1 transition-all shadow-md"
                    >
                      {isEditingForm ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                    <button
                      id="btn_cancel_trailer_form"
                      type="button"
                      onClick={() => setDrawerType('none')}
                      className="px-6 py-2.5 bg-slate-955 hover:bg-slate-805 text-slate-355 rounded-lg border border-slate-850 font-semibold"
                    >
                      Hủy
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
