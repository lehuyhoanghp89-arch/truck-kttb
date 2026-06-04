/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocaleDict {
  vi: string;
  en: string;
}

export const transData: Record<string, LocaleDict> = {
  // Shared / Common terms
  'lbl.search_placeholder': { vi: 'Tìm kiếm...', en: 'Search...' },
  'lbl.actions': { vi: 'Thao tác', en: 'Actions' },
  'lbl.notes': { vi: 'Ghi chú', en: 'Notes' },
  'lbl.status': { vi: 'Trạng thái', en: 'Status' },
  'lbl.add': { vi: 'Thêm mới', en: 'Add' },
  'lbl.save': { vi: 'Lưu lại', en: 'Save' },
  'lbl.cancel': { vi: 'Hủy bỏ', en: 'Cancel' },
  'lbl.edit': { vi: 'Chỉnh sửa', en: 'Edit' },
  'lbl.delete': { vi: 'Xóa', en: 'Delete' },
  'lbl.none': { vi: 'Chưa có', en: 'None' },
  'lbl.warning': { vi: 'Cảnh báo', en: 'Warning' },
  'lbl.yes': { vi: 'Có', en: 'Yes' },
  'lbl.no': { vi: 'Không', en: 'No' },

  // Dashboard Items
  'dash.title': { vi: 'Bảng điều khiển giám sát', en: 'Monitoring Dashboard' },
  'dash.subtitle': { vi: 'Xin chào', en: 'Welcome back' },
  'dash.refresh': { vi: 'Làm mới', en: 'Refresh Data' },
  'dash.role': { vi: 'Vai trò', en: 'Role' },
  'dash.sync_success': { vi: 'Dữ liệu đã được đồng bộ trực tiếp với bộ lưu trữ cục bộ.', en: 'Data synchronized with browser client-side localStorage.' },
  'dash.kpi.good_tires': { vi: 'Lốp tốt (OK)', en: 'Good Tires (OK)' },
  'dash.kpi.warn_tires': { vi: 'Cảnh báo (WARN)', en: 'Warning (WARN)' },
  'dash.kpi.bad_tires': { vi: 'Hỏng hóc (BAD)', en: 'Critical Wear (BAD)' },
  'dash.kpi.spare_tires': { vi: 'Lốp dự trữ bãi', en: 'Spare Inventory' },
  'dash.request.quick_approve': { vi: 'Phê duyệt nhanh yêu cầu sửa chữa lốp', en: 'Quick Approve Maintenance Requests' },
  'dash.request.type': { vi: 'Loại yêu cầu', en: 'Request Type' },
  'dash.request.asset': { vi: 'Xe / Moóc', en: 'Asset' },
  'dash.request.position': { vi: 'Vị trí', en: 'Position' },
  'dash.request.replacement': { vi: 'Lốp dự phòng thay', en: 'Replacement Spare' },
  'dash.request.reason': { vi: 'Lý do phát sinh', en: 'Reported Issue' },
  'dash.request.approve': { vi: 'Phê duyệt', en: 'Approve' },
  'dash.request.reject': { vi: 'Từ chối', en: 'Reject' },
  'dash.request.no_pending': { vi: 'Không có yêu cầu bảo trì nào đang chờ phê duyệt bãi lốp.', en: 'No pending tire maintenance requests found.' },
  'dash.system_status': { vi: 'Trạng thái hoạt động xe', en: 'Fleet Transport Status' },
  'dash.active_trucks': { vi: 'Xe đầu kéo hoạt động', en: 'Active Container Trucks' },
  'dash.active_trailers': { vi: 'Rơ moóc liên kết', en: 'Paired Semi-Trailers' },
  'dash.overdue_inspection': { vi: 'Số phương tiện quá hạn đăng kiểm', en: 'Vehicles with Overdue Registry' },
  'dash.active': { vi: 'Đang hoạt động', en: 'Active' },
  'dash.maintenance': { vi: 'Đang bảo trì', en: 'In Maintenance' },
  'dash.inactive': { vi: 'Ngừng hoạt động', en: 'Inactive' },
  'dash.spare': { vi: 'Dự phòng', en: 'Spare' },

  // Sidebar Items
  'menu.dashboard': { vi: 'Dashboard', en: 'Dashboard' },
  'menu.vehicles': { vi: 'Quản lý xe', en: 'Manage Fleet' }, 
  'menu.measure': { vi: 'Đo lốp', en: 'Measure Tires' }, 
  'menu.alerts': { vi: 'Cảnh báo', en: 'Safety Alerts' }, 
  'menu.inspection': { vi: 'Đăng kiểm', en: 'Registration' }, 
  'menu.reports': { vi: 'Báo cáo', en: 'Power BI Reports' }, 
  'menu.warehouse': { vi: 'Kho lốp', en: 'Tires Storage' }, 
  'menu.users': { vi: 'Người dùng', en: 'Users' }, 
  'menu.login_as': { vi: 'Đăng nhập là', en: 'Logged in as' },
  'menu.dark_mode': { vi: 'Giao diện tối', en: 'Dark Theme' },
  'menu.light_mode': { vi: 'Giao diện sáng', en: 'Light Theme' },
  'menu.logout': { vi: 'Đăng xuất', en: 'Logout' },

  // Vehicle view
  'veh.title': { vi: 'Quản lý Đội xe đầu kéo & Rơ moóc', en: 'Fleet & Trailer Management' },
  'veh.desc': { vi: 'Quản lý danh sách, biển kiểm soát, cấu hình lốp, liên kết rơ moóc và lịch sử sửa chữa vỏ bọc.', en: 'Manage trucks, license plates, tyre configuration schemes, coupling, and maintenance logbooks.' },
  'veh.add_truck': { vi: 'Thêm xe đầu kéo', en: 'Add Tractor Truck' },
  'veh.add_trailer': { vi: 'Thêm rơ moóc mới', en: 'Add Spare Trailer' },
  'veh.bulk_import': { vi: 'Nhập Excel / CSV', en: 'Batch Import CSV' },
  'veh.trucks_tab': { vi: 'Danh sách Xe đầu kéo', en: 'Truck Fleets' },
  'veh.trailers_tab': { vi: 'Danh sách Rơ moóc', en: 'Trailers Fleets' },
  'veh.truck_code': { vi: 'Mã xe đầu kéo', en: 'Tractor ID' },
  'veh.trailer_code': { vi: 'Mã rơ moóc', en: 'Trailer ID' },
  'veh.plate': { vi: 'Biển kiểm soát', en: 'License Plate' },
  'veh.brand_model': { vi: 'Nhãn hiệu / Model', en: 'Model specifications' },
  'veh.linked_trailer': { vi: 'Rơ moóc liên kết', en: 'Coupled Trailer' },
  'veh.expiry': { vi: 'Hạn đăng kiểm', en: 'Inspection Expiry' },
  'veh.link_btn': { vi: 'Ghép nối moóc', en: 'Couple Trailer' },
  'veh.unlink_btn': { vi: 'Tháo moóc', en: 'Uncouple' },
  'veh.repair_btn': { vi: 'Phiếu sửa chữa', en: 'Repair order' },
  'veh.view_tyres': { vi: 'Sơ đồ lốp', en: 'Tire Layout' },
  'veh.no_trailer_paired': { vi: 'Chưa liên kết rơ moóc', en: 'No trailer paired' },

  // Measure view
  'meas.title': { vi: 'Đo chiều sâu gai lốp định kỳ', en: 'Tread Depth Inspection' },
  'meas.desc': { vi: 'Nhập thông số đo gai lốp từng vị trí trục. Đội ngũ kỹ thuật viên bãi thực hiện cập nhật chiều sâu (mm).', en: 'Enter tread depth measurements per wheel position. Data registered directly into the ledger.' },
  'meas.select_vehicle': { vi: 'Chọn phương tiện cần đo lốp', en: 'Select vehicle to inspect' },
  'meas.search_veh': { vi: 'Tìm mã xe hoặc moóc...', en: 'Search fleet code...' },
  'meas.measure_position': { vi: 'Đo lốp tại vị trí', en: 'Inspect position' },
  'meas.tire_seri': { vi: 'Số Seri lốp', en: 'Tire Seri' },
  'meas.tread_depth': { vi: 'Độ sâu gai (mm)', en: 'Tread depth value (mm)' },
  'meas.maint_date': { vi: 'Ngày thực hiện đo', en: 'Date of Measure' },
  'meas.submit_btn': { vi: 'Lưu kết quả đo lốp', en: 'Save Tread Measurement' },
  'meas.report_dmg': { vi: 'Báo hỏng vỏ / Thay lốp dự phòng', en: 'Report Damaged / Apply Spare' },
  'meas.reason_dmg': { vi: 'Nguyên nhân hỏng lốp', en: 'Damage Description' },
  'meas.replace_by_spare': { vi: 'Chọn lốp dự phòng thay thế', en: 'Select Spare from warehouse' },
  'meas.execute_replace': { vi: 'Thực hiện thay lốp ngay', en: 'Replace Immediately' },

  // Alert view
  'alert.title': { vi: 'Hệ thống Cảnh báo & An toàn lốp', en: 'Tire Safety & Warnings Center' },
  'alert.desc': { vi: 'Tự động phát hiển các vỏ lốp có chiều sâu gai dưới tiêu chuẩn kỹ thuật (WARN < 3mm) hoặc có hư hại kiểm định (BAD < 1mm).', en: 'Automated warnings on critical tread wear (WARN < 3mm) or severe warning thresholds (BAD < 1mm).' },
  'alert.replace_list': { vi: 'Vỏ lốp mòn nghiêm trọng (Yêu cầu Thay lốp)', en: 'Critical Tread Wear (Requires Replacement)' },
  'alert.swap_list': { vi: 'Sự cố lệch vị trí đối xứng trục (Khuyên dùng Đảo lốp)', en: 'Uneven Axle Axis Wear (Axle Rotation Recommended)' },
  'alert.btn_maint_req': { vi: 'Phiếu thay lốp', en: 'Request Replace' },
  'alert.btn_swap_req': { vi: 'Phiếu đảo lốp', en: 'Request Swap' },

  // Inspection view
  'insp.title': { vi: 'Quản lý Đăng kiểm Xe & Rơ moóc', en: 'Vehicle Registry & Regulations Compliance' },
  'insp.desc': { vi: 'Giám sát chặt hiệu lực đăng kiểm định kỳ của đội xe tải container nội cảng và Moóc bến bãi đỗ.', en: 'Oversee and track registry records, road-safety standard renewals for cargo tractors.' },
  'insp.tabs_trucks': { vi: 'Đầu kéo Container', en: 'Tractor Trucks' },
  'insp.tabs_trailers': { vi: 'Dàn Rơ moóc bãi', en: 'Trailer Chassis' },
  'insp.overdue': { vi: 'Quá hạn đăng kiểm', en: 'Overdue' },
  'insp.near_expiry': { vi: 'Sắp hết hạn (30 ngày)', en: 'Near Expiry (< 30 days)' },
  'insp.valid': { vi: 'Đang hiệu lực an toàn', en: 'Valid' },
  'insp.extend_btn': { vi: 'Cập nhật đăng kiểm', en: 'Renew Inspection' },
  'insp.next_expiry': { vi: 'Hạn đăng kiểm tiếp theo', en: 'Next Expiry Date' },

  // Warehouse view
  'wh.title': { vi: 'Quản lý Kho vỏ lốp dự trữ bãi', en: 'Spare Tire Inventory Ledger' },
  'wh.desc': { vi: 'Nhập kho lốp mới nhập khẩu, lưu trữ bảo quản, rút cấp ráp gầm xe tại cảng biển.', en: 'Administer spare tier registries, stock retention, tracking, and chassis assembly procedures.' },
  'wh.add_tire': { vi: 'Khai báo nhập kho lốp mới', en: 'Register New Stock Tire' },
  'wh.filter_all': { vi: 'Tất cả lốp bãi', en: 'All Fleet & Spares' },
  'wh.filter_spare': { vi: 'Lốc rời / Dự phòng bãi', en: 'Warehouse Spares Only' },
  'wh.filter_damaged': { vi: 'Lốp hư hại chờ bọc', en: 'Damaged Tires Room' },
  'wh.filter_retired': { vi: 'Đã thanh lý phế liệu', en: 'Disposed / Retired' },
  'wh.register': { vi: 'Sổ sách Sổ cái Kho vỏ lốp bãi', en: 'Warehouse General Ledger Stock Register' },
  'wh.seri': { vi: 'Mã số Seri lốp', en: 'Tire Serial' },
  'wh.brand': { vi: 'Thương hiệu sản xuất', en: 'Manufacturer / Brand' },
  'wh.size': { vi: 'Kích cỡ lốp', en: 'Size spec' },
  'wh.depth': { vi: 'Độ sâu gai hiện trạng', en: 'Tread depth (mm)' },
  'wh.asset': { vi: 'ID Xe đang gắn / Trục', en: 'Mounted ID / Axle' },
  'wh.mount_btn': { vi: 'Lắp lên gầm', en: 'Mount to Axle' },
  'wh.unmount_btn': { vi: 'Thu hồi lốp', en: 'Unmount' },
  'wh.loose': { vi: 'Lốp rời - Dự phòng bãi', en: 'Spare loose stock' },

  // Users view
  'user.title': { vi: 'Quản lý người dùng hệ thống', en: 'System Personnel Directories' },
  'user.desc': { vi: 'Danh mục tài khoản nhân sự bãi cảng. Cấp quyền biên tập hay đọc tham chiếu lịch trình tài sản.', en: 'Configure system accesses, employee details, and workspace control permissions.' },
  'user.add': { vi: 'Đăng ký tài khoản nhân viên', en: 'Create Employee Login' },
  'user.fullname': { vi: 'Họ và tên nhân sự', en: 'Full Name' },
  'user.email': { vi: 'Địa chỉ Email thư', en: 'Email address' },
  'user.username': { vi: 'Tên đăng nhập', en: 'Account ID / Username' },
  'user.role': { vi: 'Phân quyền trách vụ', en: 'Assigned Role' },
  'user.permission': { vi: 'Đặc quyền thao tác', en: 'Action Privilege' },
  'user.delete_tooltip': { vi: 'Xóa vĩnh viễn tài khoản nhân sự', en: 'Permanently remove account' }
};

export function t(key: string, language: 'vi' | 'en' = 'vi'): string {
  return transData[key] ? transData[key][language] : key;
}
