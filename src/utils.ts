/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to parse simple CSV file (supports Vietnamese characters and header normalization)
export function parseCsv(csvText: string): string[][] {
  const lines: string[][] = [];
  const rawLines = csvText.split(/\r?\n/);
  
  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    
    const row: string[] = [];
    let insideQuote = false;
    let currentField = '';
    
    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentField.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    lines.push(row);
  }
  
  return lines;
}

// Convert data to CSV file download format
export function exportToCsv(data: any[], headers: { key: string; label: string }[]): string {
  const rowHeaders = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rowData = data.map(row => {
    return headers.map(h => {
      const val = row[h.key];
      const stringifiedValue = val === null || val === undefined ? '' : String(val);
      return `"${stringifiedValue.replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [rowHeaders, ...rowData].join('\n');
}

// Download Trigger Helper
export function triggerCsvDownload(csvString: string, filename: string) {
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Calculate the inspection status for trucks/trailers based on expiry date
// Input format: YYYY-MM-DD
export function getInspectionStatus(expiryDateStr: string | null | undefined): {
  status: 'OVERDUE' | 'NEAR_EXPIRY' | 'VALID' | 'UNKNOWN';
  label: string;
  daysRemaining: number;
} {
  if (!expiryDateStr) {
    return { status: 'UNKNOWN', label: 'Chưa có thông tin', daysRemaining: 0 };
  }
  
  const expiryDate = new Date(expiryDateStr);
  if (isNaN(expiryDate.getTime())) {
    return { status: 'UNKNOWN', label: 'Lỗi định dạng', daysRemaining: 0 };
  }
  
  // Current date (normalized to midnight)
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'OVERDUE', label: `Quá hạn ${Math.abs(diffDays)} ngày`, daysRemaining: diffDays };
  } else if (diffDays <= 30) {
    return { status: 'NEAR_EXPIRY', label: `Còn ${diffDays} ngày`, daysRemaining: diffDays };
  } else {
    return { status: 'VALID', label: `Còn ${diffDays} ngày`, daysRemaining: diffDays };
  }
}

// Calculate Tyre Status (OK, WARN, BAD) based on tread depth and asset type
// Per prompt details:
// - BAD if depth < 1mm (or custom < 3mm)
// - WARN if depth < 3mm for Trailer and < 1mm for Truck (wait, the prompt says: or standard alert warning levels)
// Let's follow standard rules:
// - OK: >= 3mm
// - WARN: 1mm to 3mm
// - BAD: < 1mm
export function getTireStatus(depth: number, asset_type: 'TRUCK' | 'TRAILER' | null): 'OK' | 'WARN' | 'BAD' {
  if (depth < 1.0) {
    return 'BAD';
  } else if (depth < 3.0) {
    return 'WARN';
  } else {
    return 'OK';
  }
}

/**
 * Generate a sequential port serial starting with 'P' (e.g., P10001, P10002, etc.)
 * based on the highest existing serial.
 */
export function generatePortSerial(existingTires: any[]): string {
  let maxNum = 10000;
  if (Array.isArray(existingTires)) {
    existingTires.forEach(t => {
      if (t && t.port_serial && typeof t.port_serial === 'string' && t.port_serial.startsWith('P')) {
        const numPart = t.port_serial.substring(1);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });
  }
  return `P${maxNum + 1}`;
}
