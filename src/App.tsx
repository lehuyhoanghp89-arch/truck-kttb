/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  ViewType, 
  Truck, 
  Trailer, 
  Tire, 
  TireLatest, 
  TireMeasure, 
  MaintRequest, 
  RepairLog 
} from './types';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { supabase, hasSupabaseConfig } from './lib/supabase';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import VehicleView from './components/VehicleView';
import TireMeasureView from './components/TireMeasureView';
import AlertView from './components/AlertView';
import InspectionView from './components/InspectionView';
import ReportView from './components/ReportView';
import TireWarehouseView from './components/TireWarehouseView';
import UsersView from './components/UsersView';

export default function App() {
  // Dynamic local users database state
  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('tt_users_list');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tt_users_list', JSON.stringify(usersList));
  }, [usersList]);

  // Current user authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tt_current_user');
    if (saved) {
      const parsed = JSON.parse(saved) as User;
      const savedUsersList = localStorage.getItem('tt_users_list');
      const latestList = savedUsersList ? (JSON.parse(savedUsersList) as User[]) : [];
      const matched = latestList.find(u => u.id === parsed.id);
      return matched || parsed;
    }
    return null;
  });

  // Theme control state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('tt_dark_mode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode cosmic feel
  });

  // Language translation selector (VN or EN, default VN)
  const [language, setLanguage] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('tt_language') as 'vi' | 'en') || 'vi';
  });

  // Current selected active navigation view
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Mobile menu visibility control state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Unified Data Entities states with localStorage fallback for durability
  const [trucks, setTrucks] = useState<Truck[]>(() => {
    const saved = localStorage.getItem('tt_trucks');
    return saved ? JSON.parse(saved) : [];
  });

  const [trailers, setTrailers] = useState<Trailer[]>(() => {
    const saved = localStorage.getItem('tt_trailers');
    return saved ? JSON.parse(saved) : [];
  });

  const [tires, setTires] = useState<Tire[]>(() => {
    const saved = localStorage.getItem('tt_tires');
    return saved ? JSON.parse(saved) : [];
  });

  const [tireLatest, setTireLatest] = useState<TireLatest[]>(() => {
    const saved = localStorage.getItem('tt_tire_latest');
    return saved ? JSON.parse(saved) : [];
  });

  const [maintRequests, setMaintRequests] = useState<MaintRequest[]>(() => {
    const saved = localStorage.getItem('tt_maint_requests');
    const records = saved ? JSON.parse(saved) : [];
    return records;
  });

  const [repairLogs, setRepairLogs] = useState<RepairLog[]>(() => {
    const saved = localStorage.getItem('tt_repair_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [tireMeasures, setTireMeasures] = useState<TireMeasure[]>(() => {
    const saved = localStorage.getItem('tt_tire_measures');
    return saved ? JSON.parse(saved) : []; // Empty initially, loaded on interactive measurer
  });

  // Supabase Initial Load
  useEffect(() => {
    if (!hasSupabaseConfig || !currentUser) return;
    
    const loadData = async () => {
      try {
        const [
          { data: trucksData },
          { data: trailersData },
          { data: tiresData },
          { data: tireLatestData },
          { data: maintReqData },
          { data: logsData },
          { data: measuresData }
        ] = await Promise.all([
          supabase.from('trucks').select('*').order('created_date', { ascending: false }),
          supabase.from('trailers').select('*').order('created_date', { ascending: false }),
          supabase.from('tires').select('*').order('created_date', { ascending: false }),
          supabase.from('tire_latest').select('*').order('last_updated', { ascending: false }),
          supabase.from('maint_requests').select('*').order('created_date', { ascending: false }),
          supabase.from('repair_logs').select('*').order('created_date', { ascending: false }),
          supabase.from('tire_measures').select('*').order('measured_at', { ascending: false })
        ]);

        if (trucksData) setTrucks(trucksData as Truck[]);
        if (trailersData) setTrailers(trailersData as Trailer[]);
        if (tiresData) setTires(tiresData as Tire[]);
        if (tireLatestData) setTireLatest(tireLatestData as TireLatest[]);
        if (maintReqData) setMaintRequests(maintReqData as MaintRequest[]);
        if (logsData) setRepairLogs(logsData as RepairLog[]);
        if (measuresData) setTireMeasures(measuresData as TireMeasure[]);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu từ Supabase:', err);
      }
    };

    loadData();
  }, [currentUser]);

  // Sync data entities list back to localStorage automatically whenever state alters
  useEffect(() => {
    localStorage.setItem('tt_trucks', JSON.stringify(trucks));
  }, [trucks]);

  useEffect(() => {
    localStorage.setItem('tt_trailers', JSON.stringify(trailers));
  }, [trailers]);

  useEffect(() => {
    localStorage.setItem('tt_tires', JSON.stringify(tires));
  }, [tires]);

  useEffect(() => {
    localStorage.setItem('tt_tire_latest', JSON.stringify(tireLatest));
  }, [tireLatest]);

  useEffect(() => {
    localStorage.setItem('tt_maint_requests', JSON.stringify(maintRequests));
  }, [maintRequests]);

  useEffect(() => {
    localStorage.setItem('tt_repair_logs', JSON.stringify(repairLogs));
  }, [repairLogs]);

  useEffect(() => {
    localStorage.setItem('tt_tire_measures', JSON.stringify(tireMeasures));
  }, [tireMeasures]);

  useEffect(() => {
    localStorage.setItem('tt_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('tt_language', language);
  }, [language]);

  // Auth triggers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('tt_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tt_current_user');
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  // Fleet Modification callbacks
  const handleAddTruck = (newTruck: Omit<Truck, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => {
    const item: Truck = {
      ...newTruck,
      id: `tr-${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'System Admin'
    };
    setTrucks(prev => [item, ...prev]);
    if (hasSupabaseConfig) supabase.from('trucks').insert([item]).then();
  };

  const handleEditTruck = (id: string, updated: Partial<Truck>) => {
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, ...updated, updated_date: new Date().toISOString() } : t));
    if (hasSupabaseConfig) {
      const truckToUpdate = trucks.find(t => t.id === id);
      if (truckToUpdate) supabase.from('trucks').update({ ...updated, updated_date: new Date().toISOString() }).eq('id', id).then();
    }
  };

  const handleDeleteTruck = (id: string) => {
    setTrucks(prev => prev.filter(t => t.id !== id));
    if (hasSupabaseConfig) supabase.from('trucks').delete().eq('id', id).then();
  };

  const handleAddTrailer = (newTrailer: Omit<Trailer, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => {
    const item: Trailer = {
      ...newTrailer,
      id: `trail-${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'System Admin'
    };
    setTrailers(prev => [item, ...prev]);
    if (hasSupabaseConfig) supabase.from('trailers').insert([item]).then();
  };

  const handleEditTrailer = (id: string, updated: Partial<Trailer>) => {
    setTrailers(prev => prev.map(t => t.id === id ? { ...t, ...updated, updated_date: new Date().toISOString() } : t));
    if (hasSupabaseConfig) {
      const trailerToUpdate = trailers.find(t => t.id === id);
      if (trailerToUpdate) supabase.from('trailers').update({ ...updated, updated_date: new Date().toISOString() }).eq('id', id).then();
    }
  };

  const handleDeleteTrailer = (id: string) => {
    setTrailers(prev => prev.filter(t => t.id !== id));
    if (hasSupabaseConfig) supabase.from('trailers').delete().eq('id', id).then();
  };

  // Linking Trucks & Trailers Gắn Rơ Moóc logic (Image 6 slider panel mechanics)
  const handleAttachTrailer = (truckId: string, trailerId: string) => {
    // 1. Cross reference on Trucks array
    setTrucks(prev => prev.map(t => t.truck_id === truckId ? { ...t, attached_trailer_id: trailerId } : t));
    // 2. Cross reference on Trailers array (status transfers to ACTIVE)
    setTrailers(prev => prev.map(t => t.trailer_id === trailerId ? { ...t, attached_truck_id: truckId, status: 'ACTIVE' } : t));

    if (hasSupabaseConfig) {
      supabase.from('trucks').update({ attached_trailer_id: trailerId }).eq('truck_id', truckId).then();
      supabase.from('trailers').update({ attached_truck_id: truckId, status: 'ACTIVE' }).eq('trailer_id', trailerId).then();
    }
  };

  const handleDetachTrailer = (truckId: string) => {
    // Locate the current trailer linked
    const linkedTruckObj = trucks.find(t => t.truck_id === truckId);
    if (linkedTruckObj && linkedTruckObj.attached_trailer_id) {
      const trailerId = linkedTruckObj.attached_trailer_id;
      // Clear link on Truck
      setTrucks(prev => prev.map(t => t.truck_id === truckId ? { ...t, attached_trailer_id: null } : t));
      // Clear link on Trailer, resetting to SPARE (dự phòng sẵn sàng)
      setTrailers(prev => prev.map(t => t.trailer_id === trailerId ? { ...t, attached_truck_id: null, status: 'SPARE' } : t));

      if (hasSupabaseConfig) {
        supabase.from('trucks').update({ attached_trailer_id: null }).eq('truck_id', truckId).then();
        supabase.from('trailers').update({ attached_truck_id: null, status: 'SPARE' }).eq('trailer_id', trailerId).then();
      }
    }
  };

  // Create customized repair log
  const handleAddRepairLog = (log: Omit<RepairLog, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => {
    const entry: RepairLog = {
      ...log,
      id: `rep-${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'System Auto'
    };
    setRepairLogs(prev => [entry, ...prev]);
    if (hasSupabaseConfig) supabase.from('repair_logs').insert([entry]).then();
  };

  // Approving Awaiting Requests (Duyệt yêu cầu thay lốp, đảo lốp tại Dashboard)
  const handleActionApproveRequest = (id: string) => {
    const req = maintRequests.find(r => r.id === id);
    if (!req) return;

    // Approve logic: Apply changes based on request type
    if (req.request_type === 'REPLACE' && req.new_tire_seri) {
      // 1. Update tireLatest position to map to the new serial
      setTireLatest(prev => prev.map(t => {
        if (t.asset_id === req.asset_id && t.position === req.position) {
          // Replace with the parameters of the chosen warehouse spare tire
          const matchedWarehouseTire = tires.find(wt => wt.tire_seri === req.new_tire_seri);
          return {
            ...t,
            tire_seri: req.new_tire_seri,
            depth_mm: matchedWarehouseTire ? matchedWarehouseTire.current_depth_mm : 11.5,
            status: 'OK',
            measured_at: new Date().toISOString(),
            measured_by: currentUser?.full_name || 'Duyệt viên tự động'
          };
        }
        return t;
      }));

      // 2. Adjust state in general warehouse 'tires' register
      setTires(prev => prev.map(t => {
        // Old tire is unattached, becomes loose spare in stock
        if (t.tire_seri === req.old_tire_seri) {
          return { ...t, asset_id: null, position: null, status: 'SPARE' };
        }
        // New tire is now mounted on this vehicles position
        if (t.tire_seri === req.new_tire_seri) {
          return { ...t, asset_id: req.asset_id, position: req.position, status: 'IN_USE' };
        }
        return t;
      }));
    }

    if (req.request_type === 'SWAP' && req.swap_position) {
      // Inter-change positions of two tyres FL <-> ORR
      const recordA = tireLatest.find(t => t.asset_id === req.asset_id && t.position === req.position);
      const recordB = tireLatest.find(t => t.asset_id === req.asset_id && t.position === req.swap_position);

      if (recordA && recordB) {
        setTireLatest(prev => prev.map(t => {
          if (t.asset_id === req.asset_id && t.position === req.position) {
            return { ...t, tire_seri: recordB.tire_seri, depth_mm: recordB.depth_mm, status: recordB.status };
          }
          if (t.asset_id === req.asset_id && t.position === req.swap_position) {
            return { ...t, tire_seri: recordA.tire_seri, depth_mm: recordA.depth_mm, status: recordA.status };
          }
          return t;
        }));

        setTires(prev => prev.map(t => {
          if (t.tire_seri === recordA.tire_seri) {
            return { ...t, position: req.swap_position };
          }
          if (t.tire_seri === recordB.tire_seri) {
            return { ...t, position: req.position };
          }
          return t;
        }));
      }
    }

    // Set status to DONE
    setMaintRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'DONE', updated_date: new Date().toISOString() } : r));
    if (hasSupabaseConfig) supabase.from('maint_requests').update({ status: 'DONE', updated_date: new Date().toISOString() }).eq('id', id).then();
    alert('Đã DUYỆT yêu cầu vận hành xe thành công. Các chỉ số vỏ lốp trên xe và tồn kho đã được sắp đặt tự động.');
  };

  const handleActionRejectRequest = (id: string) => {
    setMaintRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED', updated_date: new Date().toISOString() } : r));
    if (hasSupabaseConfig) supabase.from('maint_requests').update({ status: 'REJECTED', updated_date: new Date().toISOString() }).eq('id', id).then();
    alert('Đã từ chối phiếu yêu cầu kỹ thuật.');
  };

  // Adjust Expiry Date calendar registry triggers (Kiểm định)
  const handleEditTruckExpiry = (id: string, targetDate: string) => {
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, inspection_expiry: targetDate } : t));
    if (hasSupabaseConfig) supabase.from('trucks').update({ inspection_expiry: targetDate }).eq('id', id).then();
  };

  const handleEditTrailerExpiry = (id: string, targetDate: string) => {
    setTrailers(prev => prev.map(t => t.id === id ? { ...t, inspection_expiry: targetDate } : t));
    if (hasSupabaseConfig) supabase.from('trailers').update({ inspection_expiry: targetDate }).eq('id', id).then();
  };

  // Bulk uploads from CSV files
  const handleBulkImportTrucks = (importList: Omit<Truck, 'id' | 'created_date' | 'updated_date' | 'created_by'>[]) => {
    const list: Truck[] = importList.map((tk, idx) => ({
      ...tk,
      id: `tr-bulk-${Date.now()}-${idx}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'System Bulk Loader'
    }));
    setTrucks(prev => [...list, ...prev]);
  };

  const handleBulkImportTrailers = (importList: Omit<Trailer, 'id' | 'created_date' | 'updated_date' | 'created_by'>[]) => {
    const list: Trailer[] = importList.map((tr, idx) => ({
      ...tr,
      id: `trail-bulk-${Date.now()}-${idx}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'System Bulk Loader'
    }));
    setTrailers(prev => [...list, ...prev]);
  };

  const handleBulkImportTires = (importList: Omit<Tire, 'id' | 'created_date' | 'updated_date' | 'created_by'>[]) => {
    const list: Tire[] = importList.map((tr, idx) => ({
      ...tr,
      id: `tire-bulk-${Date.now()}-${idx}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'System Bulk Loader'
    }));
    setTires(prev => {
      const existingSerials = new Set(prev.map(t => t.tire_seri.toUpperCase()));
      const filteredNew = list.filter(t => {
        if (existingSerials.has(t.tire_seri.toUpperCase())) {
          return false;
        }
        existingSerials.add(t.tire_seri.toUpperCase());
        return true;
      });
      return [...filteredNew, ...prev];
    });
  };

  // Logging interactive Tyre inspections results
  const handleAddTireMeasure = (newMeasure: Omit<TireMeasure, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => {
    const measureItem: TireMeasure = {
      ...newMeasure,
      id: `meas-${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'Inspector'
    };
    
    // Save to measures logs records
    setTireMeasures(prev => [measureItem, ...prev]);

    // Update the live depth on corresponding tyreLatest tracker
    setTireLatest(prev => prev.map(t => {
      if (t.asset_id === newMeasure.asset_id && t.position === newMeasure.position) {
        return {
          ...t,
          depth_mm: newMeasure.depth_mm,
          status: newMeasure.status,
          measured_at: new Date().toISOString(),
          measured_by: currentUser?.full_name || 'Kiểm định viên'
        };
      }
      return t;
    }));

    // Synchronize current depth millimeters in warehouse tires array
    setTires(prev => prev.map(t => {
      if (t.tire_seri === newMeasure.tire_seri) {
        return {
          ...t,
          current_depth: newMeasure.depth_mm
        };
      }
      return t;
    }));
  };

  // Registering loose tyre elements into stockpile
  const handleAddTire = (newTirePayload: Omit<Tire, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => {
    const item: Tire = {
      ...newTirePayload,
      id: `tire-unit-${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'Warehouse Staff'
    };
    setTires(prev => [item, ...prev]);
  };

  const handleDeleteTire = (id: string) => {
    setTires(prev => prev.filter(t => t.id !== id));
  };

  // Installation of loose stockpile tyres onto empty vehicle slots
  const handleMountTireToVehicle = (serial: string, assetId: string, position: string) => {
    const targetTireObj = tires.find(t => t.tire_seri === serial);
    if (!targetTireObj) return;

    // 1) Mark tire status inside central warehouse state as mounted
    setTires(prev => prev.map(t => {
      if (t.tire_seri === serial) {
        return { ...t, asset_id: assetId, position: position, status: 'IN_USE' };
      }
      return t;
    }));

    // 2) Overwrite or append tyre on that vehicle's live tyreLatest record
    // Is there already something mounted at that position?
    const alreadyInstalled = tireLatest.some(tl => tl.asset_id === assetId && tl.position === position);

    if (alreadyInstalled) {
      setTireLatest(prev => prev.map(tl => {
        if (tl.asset_id === assetId && tl.position === position) {
          return {
            ...tl,
            tire_seri: serial,
            depth_mm: targetTireObj.current_depth,
            status: 'OK',
            last_updated: new Date().toISOString(),
            measured_by: currentUser?.full_name || 'Gắn viên'
          };
        }
        return tl;
      }));
    } else {
      // Create new skeleton entry
      const newLiveSlot: TireLatest = {
        id: `tl-${Date.now()}`,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by: currentUser?.full_name || 'Gắn viên',
        asset_id: assetId,
        asset_type: assetId.startsWith('RM') ? 'TRAILER' : 'TRUCK',
        position: position,
        tire_seri: serial,
        depth_mm: targetTireObj.current_depth,
        status: 'OK',
        last_updated: new Date().toISOString(),
        measured_by: currentUser?.full_name || 'Gắn viên'
      };
      setTireLatest(prev => [...prev, newLiveSlot]);
    }
  };

  const handleUnmountTireFromVehicle = (serial: string) => {
    // Collect parameters
    const target = tires.find(t => t.tire_seri === serial);
    if (!target) return;

    const { asset_id, position } = target;

    // 1) Clear link on general warehouse tires array
    setTires(prev => prev.map(t => {
      if (t.tire_seri === serial) {
        return { ...t, asset_id: null, position: null, status: 'SPARE' };
      }
      return t;
    }));

    // 2) Disconnect from Live TireLatest registry
    if (asset_id && position) {
      setTireLatest(prev => prev.filter(tl => !(tl.asset_id === asset_id && tl.position === position)));
    }
  };

  const handleReplaceTireWithSpare = (
    assetId: string,
    position: string,
    damagedSeri: string,
    damageCause: string,
    replacementSeri: string
  ) => {
    const backupTireObj = tires.find(t => t.tire_seri === replacementSeri);
    if (!backupTireObj) return;

    // 1) Mark old tire as DAMAGED, clear its asset assignment
    setTires(prev => prev.map(t => {
      if (t.tire_seri === damagedSeri) {
        return { 
          ...t, 
          asset_id: null, 
          position: null, 
          status: 'DAMAGED', 
          notes: `${t.notes || ''} [BÁO HỎNG: ${damageCause}]`.trim() 
        };
      }
      // 2) Mount the replacement tire
      if (t.tire_seri === replacementSeri) {
        return {
          ...t,
          asset_id: assetId,
          position: position,
          status: 'IN_USE'
        };
      }
      return t;
    }));

    // 3) Update that position in live tireLatest registry
    setTireLatest(prev => prev.map(tl => {
      if (tl.asset_id === assetId && tl.position === position) {
        return {
          ...tl,
          tire_seri: replacementSeri,
          depth_mm: backupTireObj.current_depth,
          status: 'OK',
          last_updated: new Date().toISOString(),
          measured_by: currentUser?.full_name || 'Huy Thợ Lốp'
        };
      }
      return tl;
    }));

    // 4) Auto append Completed Maintenance Ticket
    const repairTicket = {
      asset_id: assetId,
      asset_type: assetId.startsWith('RM') ? 'TRAILER' : 'TRUCK' as 'TRAILER' | 'TRUCK',
      type: 'TIRE_SWAP' as const,
      description: `Thay thế lốp hỏng ${damagedSeri} ở vị trí ${position} (Nguyên nhân: ${damageCause}) bằng lốp dự phòng ${replacementSeri}.`,
      status: 'COMPLETED' as const,
      notes: 'Đã hoàn thành tự động đồng bộ.'
    };
    
    setMaintRequests(prev => [
      {
        ...repairTicket,
        id: `maint-req-${Date.now()}`,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by: currentUser?.full_name || 'Huy Thợ Lốp'
      },
      ...prev
    ]);
  };

  const handleAddMaintRequest = (req: Omit<MaintRequest, 'id' | 'created_date' | 'updated_date' | 'created_by'>) => {
    const ticket: MaintRequest = {
      ...req,
      id: `maint-req-${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: currentUser?.full_name || 'System Operator'
    };
    setMaintRequests(prev => [ticket, ...prev]);
  };

  // Guard routing for unauthenticated users
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div 
      className={`min-h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans ${
        isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Mobile Top Navigation Bar */}
      <div className={`md:hidden flex items-center justify-between px-4 py-3 border-b select-none transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-150 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <button
            id="mobile_hamburger"
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-2 rounded-lg transition-all border ${
              isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-100' : 'border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-3.5 h-3.5 bg-white rounded-xs rotate-45"></div>
            </div>
            <div>
              <span className={`font-black text-sm tracking-tight block leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Terminor Tracktor</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold font-mono mt-0.5">TT-Port</span>
            </div>
          </div>
        </div>

        {/* Quick action buttons on Mobile Header bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            className={`p-2 rounded-lg border transition-all ${
              isDarkMode ? 'border-slate-800 text-amber-500 hover:bg-slate-800' : 'border-slate-200 text-indigo-600 hover:bg-slate-50'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg border transition-all ${
              isDarkMode ? 'border-red-500/10 text-red-400 hover:bg-red-950/20' : 'border-slate-200 text-red-500 hover:bg-red-50'
            }`}
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Mobile Slide-out Menu Drawer */}
      {isMobileMenuOpen && (
        <div id="mobile_drawer_overlay" className="fixed inset-0 z-50 flex md:hidden">
          {/* Simple Backdrop to close drawer */}
          <div 
            id="mobile_drawer_backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-305"
          ></div>
          
          {/* Main absolute sliding panel in dark neutral styling */}
          <div 
            id="mobile_drawer_content"
            className="relative flex flex-col w-64 max-w-[80vw] h-[100dvh] bg-slate-900 border-r border-slate-850 shadow-2xl animate-fade-in overflow-hidden"
          >
            {/* Direct close button wrapper */}
            <div className="absolute right-3.5 top-3.5 z-55">
              <button
                id="close_mobile_drawer"
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-850 hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar element container */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <Sidebar
                currentView={currentView}
                onViewChange={(view) => {
                  setCurrentView(view);
                  setIsMobileMenuOpen(false); // Tap item automatically closes mobile navigation drawer
                }}
                currentUser={currentUser}
                onLogout={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                isDarkMode={isDarkMode}
                onToggleTheme={handleToggleTheme}
                language={language}
                onToggleLanguage={handleToggleLanguage}
                forceExpanded={true} // Mobile drawer should display elements in elegant full expansion mode
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-screen">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          currentUser={currentUser}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          language={language}
          onToggleLanguage={handleToggleLanguage}
        />
      </div>

      {/* Main layout container viewport */}
      <main id="app_main_viewport" className="flex-1 overflow-y-auto h-screen p-4 sm:p-8">
        
        {currentView === 'dashboard' && (
          <DashboardView
            trucks={trucks}
            trailers={trailers}
            tires={tires}
            tireLatest={tireLatest}
            maintRequests={maintRequests}
            repairLogs={repairLogs}
            onActionApproveRequest={handleActionApproveRequest}
            onActionRejectRequest={handleActionRejectRequest}
            onNavigateToView={setCurrentView}
            isDarkMode={isDarkMode}
            language={language}
          />
        )}

        {currentView === 'vehicles' && (
          <VehicleView
            trucks={trucks}
            trailers={trailers}
            tires={tires}
            tireLatest={tireLatest}
            repairLogs={repairLogs}
            maintRequests={maintRequests}
            onAddTruck={handleAddTruck}
            onEditTruck={handleEditTruck}
            onDeleteTruck={handleDeleteTruck}
            onAddTrailer={handleAddTrailer}
            onEditTrailer={handleEditTrailer}
            onDeleteTrailer={handleDeleteTrailer}
            onAttachTrailer={handleAttachTrailer}
            onDetachTrailer={handleDetachTrailer}
            onAddRepairLog={handleAddRepairLog}
            onBulkImportTrucks={handleBulkImportTrucks}
            onBulkImportTrailers={handleBulkImportTrailers}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            language={language}
          />
        )}

        {currentView === 'measure' && (
          <TireMeasureView
            trucks={trucks}
            trailers={trailers}
            tires={tires}
            tireLatest={tireLatest}
            onAddTireMeasure={handleAddTireMeasure}
            onReplaceTireWithSpare={handleReplaceTireWithSpare}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            language={language}
          />
        )}

        {currentView === 'alerts' && (
          <AlertView
            trucks={trucks}
            trailers={trailers}
            tires={tires}
            tireLatest={tireLatest}
            maintRequests={maintRequests}
            onAddMaintRequest={handleAddMaintRequest}
            onAddRepairLog={handleAddRepairLog}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            language={language}
          />
        )}

        {currentView === 'inspection' && (
          <InspectionView
            trucks={trucks}
            trailers={trailers}
            onEditTruckExpiry={handleEditTruckExpiry}
            onEditTrailerExpiry={handleEditTrailerExpiry}
            isDarkMode={isDarkMode}
            language={language}
          />
        )}

        {currentView === 'reports' && (
          <ReportView
            trucks={trucks}
            trailers={trailers}
            tires={tires}
            tireLatest={tireLatest}
            tireMeasures={tireMeasures}
            maintRequests={maintRequests}
            isDarkMode={isDarkMode}
            language={language}
          />
        )}

        {currentView === 'warehouse' && (
          <TireWarehouseView
            tires={tires}
            trucks={trucks}
            trailers={trailers}
            tireLatest={tireLatest}
            onAddTire={handleAddTire}
            onDeleteTire={handleDeleteTire}
            onMountTireToVehicle={handleMountTireToVehicle}
            onUnmountTireFromVehicle={handleUnmountTireFromVehicle}
            onBulkImportTires={handleBulkImportTires}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            language={language}
          />
        )}

        {currentView === 'users' && (
          <UsersView
            usersList={usersList}
            onUpdateUsers={setUsersList}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            language={language}
          />
        )}

      </main>
    </div>
  );
}
