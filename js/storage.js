/**
 * Storage Class for Blood Pressure Diary
 * Handles CRUD operations, statistics calculation, BP classification, and CSV import/export.
 */
class BPStorage {
  static STORAGE_KEY = 'blood_pressure_diary_records';

  /**
   * Get all records sorted by timestamp descending (newest first)
   * @returns {Array} List of blood pressure records
   */
  static getAll() {
    try {
      const records = localStorage.getItem(this.STORAGE_KEY);
      if (!records) return [];
      
      const parsed = JSON.parse(records);
      return parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
      console.error('Failed to parse records from localStorage', e);
      return [];
    }
  }

  /**
   * Save a single record (creates new or updates existing)
   * @param {Object} record - The record to save
   * @returns {Object} Saved record
   */
  static save(record) {
    const records = this.getAll();
    
    // Auto-detect type based on hour if not explicitly set
    if (!record.type) {
      const hour = new Date(record.timestamp).getHours();
      // Morning is defined as 4 AM to 12 PM (noon)
      record.type = (hour >= 4 && hour < 12) ? 'morning' : 'evening';
    }

    if (record.id) {
      // Edit existing
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        records[index] = { ...records[index], ...record };
      } else {
        records.push(record);
      }
    } else {
      // Create new
      record.id = 'bp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      records.push(record);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    return record;
  }

  /**
   * Delete a record by ID
   * @param {String} id - The record ID to delete
   * @returns {Boolean} Success state
   */
  static delete(id) {
    const records = this.getAll();
    const filtered = records.filter(r => r.id !== id);
    
    if (records.length === filtered.length) return false;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Classify blood pressure based on Japanese Society of Hypertension (JSH) home guidelines
   * @param {Number} sys - Systolic blood pressure (mmHg)
   * @param {Number} dia - Diastolic blood pressure (mmHg)
   * @returns {Object} { status: 'normal'|'elevated'|'high', label: String, colorClass: String }
   */
  static classify(sys, dia) {
    sys = Number(sys);
    dia = Number(dia);

    if (isNaN(sys) || isNaN(dia)) {
      return { status: 'unknown', label: '未判定', colorClass: 'status-unknown' };
    }

    // JSH Home BP guidelines:
    // Normal: SYS < 115 AND DIA < 75
    // Elevated: SYS 115-134 OR DIA 75-84 (Non-high, but above normal)
    // High BP: SYS >= 135 OR DIA >= 85
    if (sys < 115 && dia < 75) {
      return { status: 'normal', label: '正常血圧', colorClass: 'status-normal' };
    } else if (sys < 135 && dia < 85) {
      return { status: 'elevated', label: '正常高値・高値', colorClass: 'status-elevated' };
    } else {
      return { status: 'high', label: '高血圧 (基準超)', colorClass: 'status-high' };
    }
  }

  /**
   * Calculate summary statistics for a given range of days
   * @param {Number} days - Range of days (e.g. 7, 30)
   * @returns {Object} Calculated stats
   */
  static getStats(days = 7) {
    const records = this.getAll();
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days);

    // Filter records within range
    const filteredRecords = records.filter(r => new Date(r.timestamp) >= cutoffDate);

    const initStats = () => ({ sumSys: 0, sumDia: 0, sumPulse: 0, count: 0, maxSys: 0, minSys: 999, maxDia: 0, minDia: 999 });
    const morning = initStats();
    const evening = initStats();
    const overall = initStats();

    filteredRecords.forEach(r => {
      const sys = Number(r.sys);
      const dia = Number(r.dia);
      const pulse = Number(r.pulse);

      const update = (stats) => {
        stats.sumSys += sys;
        stats.sumDia += dia;
        stats.sumPulse += pulse;
        stats.count += 1;
        if (sys > stats.maxSys) stats.maxSys = sys;
        if (sys < stats.minSys) stats.minSys = sys;
        if (dia > stats.maxDia) stats.maxDia = dia;
        if (dia < stats.minDia) stats.minDia = dia;
      };

      update(overall);
      if (r.type === 'morning') {
        update(morning);
      } else {
        update(evening);
      }
    });

    const finalize = (stats) => {
      if (stats.count === 0) {
        return { avgSys: 0, avgDia: 0, avgPulse: 0, maxSys: 0, minSys: 0, maxDia: 0, minDia: 0, count: 0 };
      }
      return {
        avgSys: Math.round(stats.sumSys / stats.count),
        avgDia: Math.round(stats.sumDia / stats.count),
        avgPulse: Math.round(stats.sumPulse / stats.count),
        maxSys: stats.maxSys,
        minSys: stats.minSys === 999 ? 0 : stats.minSys,
        maxDia: stats.maxDia,
        minDia: stats.minDia === 999 ? 0 : stats.minDia,
        count: stats.count
      };
    };

    return {
      overall: finalize(overall),
      morning: finalize(morning),
      evening: finalize(evening),
      totalCount: filteredRecords.length
    };
  }

  /**
   * Export database records to CSV string
   * @returns {String} CSV content
   */
  static exportToCSV() {
    const records = this.getAll();
    const headers = ['ID', '測定日時', '測定区分(morning/evening)', '収縮期血圧(上)', '拡張期血圧(下)', '脈拍', 'メモ'];
    
    const rows = records.map(r => [
      r.id,
      r.timestamp,
      r.type,
      r.sys,
      r.dia,
      r.pulse,
      (r.notes || '').replace(/"/g, '""') // Escape quotes for CSV
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Import database records from CSV string
   * @param {String} csvText - The imported CSV content
   * @returns {Object} { success: Boolean, count: Number, error: String }
   */
  static importFromCSV(csvText) {
    try {
      if (!csvText || !csvText.trim()) {
        throw new Error('CSVデータが空です。');
      }

      const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length <= 1) {
        throw new Error('CSVにデータ行が見つかりません。');
      }

      // Regex to parse CSV row respecting quotes
      const parseCSVRow = (text) => {
        const result = [];
        let curVal = '';
        let insideQuote = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"') {
            if (insideQuote && nextChar === '"') {
              curVal += '"';
              i++; // skip next quote
            } else {
              insideQuote = !insideQuote;
            }
          } else if (char === ',' && !insideQuote) {
            result.push(curVal);
            curVal = '';
          } else {
            curVal += char;
          }
        }
        result.push(curVal);
        return result;
      };

      const importedRecords = [];
      const existingRecords = this.getAll();
      const existingIds = new Set(existingRecords.map(r => r.id));

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVRow(lines[i]);
        if (cols.length < 6) continue; // Minimum required columns

        const id = cols[0] || ('bp_' + (Date.now() + i) + '_' + Math.random().toString(36).substr(2, 9));
        const timestamp = cols[1];
        const type = cols[2] === 'morning' || cols[2] === 'evening' ? cols[2] : 'morning';
        const sys = Number(cols[3]);
        const dia = Number(cols[4]);
        const pulse = Number(cols[5]);
        const notes = cols[6] || '';

        // Validate basic parameters
        if (!timestamp || isNaN(sys) || isNaN(dia) || isNaN(pulse)) {
          console.warn(`Skipping invalid CSV row at index ${i}:`, cols);
          continue;
        }

        importedRecords.push({ id, timestamp, type, sys, dia, pulse, notes });
      }

      if (importedRecords.length === 0) {
        throw new Error('取り込み可能な有効なデータ行がありませんでした。');
      }

      // Merge records, avoiding duplicates by ID
      let mergedRecords = [...existingRecords];
      let addCount = 0;

      importedRecords.forEach(imp => {
        const matchIdx = mergedRecords.findIndex(r => r.id === imp.id);
        if (matchIdx !== -1) {
          // Overwrite with imported
          mergedRecords[matchIdx] = imp;
        } else {
          mergedRecords.push(imp);
          addCount++;
        }
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedRecords));
      return { success: true, count: addCount, total: mergedRecords.length };
    } catch (e) {
      console.error('CSV import failed:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Helper to seed initial mockup data for rich experience on first open
   */
  static seedMockupData() {
    const records = this.getAll();
    if (records.length > 0) return; // Don't overwrite existing user data

    const mockup = [];
    const now = new Date();
    
    // Seed 14 days of data (both morning and evening)
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Morning record (usually lower pulse, slightly higher BP on waking sometimes)
      const morningDate = new Date(date);
      morningDate.setHours(7, Math.floor(Math.random() * 60), 0);
      
      // Simulate blood pressure pattern (with slight random variation)
      // Normal BP ranges but with occasional high/elevated readings
      const baseSys = 120 + Math.round((Math.sin(i / 2) * 8)) + Math.round((Math.random() * 8) - 4);
      const baseDia = 78 + Math.round((Math.sin(i / 2) * 5)) + Math.round((Math.random() * 6) - 3);
      
      mockup.push({
        id: `mock_m_${i}`,
        timestamp: morningDate.toISOString(),
        type: 'morning',
        sys: baseSys,
        dia: baseDia,
        pulse: 60 + Math.floor(Math.random() * 15),
        notes: i === 5 ? '少し頭痛あり' : i === 10 ? '寝不足ぎみ' : ''
      });

      // Evening record
      const eveningDate = new Date(date);
      eveningDate.setHours(21, Math.floor(Math.random() * 60), 0);
      
      const eveSys = baseSys - 4 + Math.round((Math.random() * 8) - 4);
      const eveDia = baseDia - 3 + Math.round((Math.random() * 6) - 3);

      mockup.push({
        id: `mock_e_${i}`,
        timestamp: eveningDate.toISOString(),
        type: 'evening',
        sys: eveSys,
        dia: eveDia,
        pulse: 65 + Math.floor(Math.random() * 15),
        notes: ''
      });
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockup));
  }
}
