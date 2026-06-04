/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Truck {
  id: string; // Auto generated UUID / string
  created_date: string;
  updated_date: string;
  created_by: string;
  truck_id: string; // VD: TT01, TT02...
  license_plate: string;
  model: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  attached_trailer_id: string | null;
  notes: string;
  inspection_expiry: string; // YYYY-MM-DD
  inspection_notes: string;
}

export interface Trailer {
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  trailer_id: string; // VD: RM-01, RM-02...
  license_plate: string;
  model: string;
  status: 'ACTIVE' | 'SPARE' | 'MAINTENANCE' | 'INACTIVE';
  attached_truck_id: string | null;
  notes: string;
  inspection_expiry: string; // YYYY-MM-DD
  inspection_notes: string;
}

export interface Tire {
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  tire_seri: string; // Duy nhất
  model: string;
  brand: string;
  size: string; // VD: 295/80R22.5
  asset_id: string | null; // ID xe/moóc đang gắn, null nếu làm lốp dự phòng
  asset_type: 'TRUCK' | 'TRAILER' | null;
  current_position: string | null; // VD: FL, FR, RL1, RL2...
  status: 'IN_USE' | 'SPARE' | 'DAMAGED' | 'RETIRED';
  current_depth: number; // Độ sâu gai (mm)
  last_measured: string; // ISO format
  notes: string;
}

export interface TireLatest {
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  asset_id: string;
  asset_type: 'TRUCK' | 'TRAILER';
  position: string;
  tire_seri: string;
  depth_mm: number;
  status: 'OK' | 'WARN' | 'BAD' | 'UNKNOWN';
  last_updated: string;
  measured_by: string;
}

export interface MaintRequest {
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  request_type: 'REPLACE' | 'SWAP' | 'REPAIR';
  asset_id: string;
  asset_type: 'TRUCK' | 'TRAILER';
  position: string;
  old_tire_seri: string;
  new_tire_seri: string;
  swap_position?: string; // used for SWAP request
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DONE';
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string;
}

export interface RepairLog {
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  asset_id: string;
  asset_type: 'TRUCK' | 'TRAILER';
  start_time: string; // ISO format
  end_time: string; // ISO format
  fault_description: string;
  root_cause: string;
  technician_name: string;
  status: 'IN_PROGRESS' | 'DONE' | 'PENDING';
  cost: number; // VND
  notes: string;
}

export interface TireMeasure {
  id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
  asset_id: string;
  asset_type: 'TRUCK' | 'TRAILER';
  position: string;
  tire_seri: string;
  depth_mm: number;
  status: 'OK' | 'WARN' | 'BAD';
  measured_at: string;
  measured_by: string;
  notes: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  permission: 'all' | 'view' | 'modify';
}

export type ViewType = 
  | 'dashboard'
  | 'vehicles'
  | 'measure'
  | 'alerts'
  | 'inspection'
  | 'reports'
  | 'warehouse'
  | 'users';

export interface Translation {
  [key: string]: {
    vi: string;
    en: string;
  };
}
