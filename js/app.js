// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

/**
 * Main Application Controller for Blood Pressure Diary
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- Initialize App State ---
  // Seed backup recovery will run asynchronously, wait for it in load workflow.

  // --- UI Elements ---
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    history: document.getElementById('view-history'),
    analytics: document.getElementById('view-analytics'),
    settings: document.getElementById('view-settings')
  };

  const navItems = document.querySelectorAll('.bottom-nav .nav-item:not(.fab-button)');
  const fabButton = document.getElementById('btn-quick-add-fab');
  const headerAddBtn = document.getElementById('btn-quick-add-header');

  // Modal elements
  const modalOverlay = document.getElementById('record-modal-overlay');
  const modalCloseBtn = document.getElementById('btn-modal-close');
  const recordForm = document.getElementById('record-form');
  const modalTitle = document.getElementById('modal-form-title');
  const inputId = document.getElementById('input-record-id');
  const inputSys = document.getElementById('input-sys');
  const inputDia = document.getElementById('input-dia');
  const inputPulse = document.getElementById('input-pulse');
  const inputDatetime = document.getElementById('input-datetime');
  const inputNotes = document.getElementById('input-notes');
  const selectMorningBtn = document.getElementById('btn-select-morning');
  const selectEveningBtn = document.getElementById('btn-select-evening');

  // Dashboard elements
  const dashMorningBP = document.getElementById('dash-morning-bp');
  const dashMorningStatus = document.getElementById('dash-morning-status');
  const dashEveningBP = document.getElementById('dash-evening-bp');
  const dashEveningStatus = document.getElementById('dash-evening-status');
  const dashRecordCount = document.getElementById('dash-record-count');
  const dashRecentList = document.getElementById('dashboard-recent-list');
  const dashGraphWrapper = document.getElementById('dashboard-graph');
  const dashGraphMonthLabel = document.getElementById('dash-graph-month-label');
  const btnDashGraphPrev = document.getElementById('btn-dash-graph-prev');
  const btnDashGraphNext = document.getElementById('btn-dash-graph-next');
  const btnDashFullscreen = document.getElementById('btn-dash-fullscreen');
  const btnDashResetZoom = document.getElementById('btn-dash-reset-zoom');
  const btnDashJumpCalendar = document.getElementById('btn-dash-jump-calendar');

  // History / Calendar / Graph elements
  const historyViewModeFilter = document.getElementById('history-view-mode-filter');
  const btnHistoryListMode = document.getElementById('btn-history-list-mode');
  const btnHistoryCalendarMode = document.getElementById('btn-history-calendar-mode');
  const btnHistoryGraphMode = document.getElementById('btn-history-graph-mode');
  const historyListContainer = document.getElementById('history-list-container');
  const historyCalendarContainer = document.getElementById('history-calendar-container');
  const historyGraphContainer = document.getElementById('history-graph-container');
  const historyGraphWrapper = document.getElementById('history-graph');
  const historyGraphMonthLabel = document.getElementById('history-graph-month-label');
  const btnHistoryGraphPrev = document.getElementById('btn-history-graph-prev');
  const btnHistoryGraphNext = document.getElementById('btn-history-graph-next');
  const btnHistoryFullscreen = document.getElementById('btn-history-fullscreen');
  const btnHistoryResetZoom = document.getElementById('btn-history-reset-zoom');
  const fullHistoryList = document.getElementById('full-history-list');
  
  const btnCalendarPrev = document.getElementById('btn-calendar-prev');
  const btnCalendarNext = document.getElementById('btn-calendar-next');
  const calendarCurrentMonth = document.getElementById('calendar-current-month');
  const calendarGridBody = document.getElementById('calendar-grid-body');
  const calendarDayDetailPanel = document.getElementById('calendar-day-detail-panel');
  const calendarSelectedDateLabel = document.getElementById('calendar-selected-date-label');
  const btnCalendarAddRecord = document.getElementById('btn-calendar-add-record');
  const calendarDayRecordsList = document.getElementById('calendar-day-records-list');

  // Analytics elements
  const analyticsGraphWrapper = document.getElementById('analytics-graph');
  const analyticsGraphMonthLabel = document.getElementById('analytics-graph-month-label');
  const btnAnalyticsGraphPrev = document.getElementById('btn-analytics-graph-prev');
  const btnAnalyticsGraphNext = document.getElementById('btn-analytics-graph-next');
  const btnAnalyticsFullscreen = document.getElementById('btn-analytics-fullscreen');
  const btnAnalyticsResetZoom = document.getElementById('btn-analytics-reset-zoom');
  const statMaxSys = document.getElementById('stat-max-sys');
  const statMinSys = document.getElementById('stat-min-sys');
  const statMaxDia = document.getElementById('stat-max-dia');
  const statMinDia = document.getElementById('stat-min-dia');
  const statAveragePulse = document.getElementById('stat-average-pulse');
  const statRecordCount = document.getElementById('stat-record-count');

  // Fullscreen Graph Modal elements
  const modalFullscreenGraph = document.getElementById('modal-fullscreen-graph');
  const fsGraphMonthLabel = document.getElementById('fs-graph-month-label');
  const btnFsGraphPrev = document.getElementById('btn-fs-graph-prev');
  const btnFsGraphNext = document.getElementById('btn-fs-graph-next');
  const btnCloseFullscreenGraph = document.getElementById('btn-close-fullscreen-graph');
  const btnFsResetZoom = document.getElementById('btn-fs-reset-zoom');
  const fullscreenGraphContainer = document.getElementById('fullscreen-graph-container');

  // Settings elements
  const settingsPrintReportBtn = document.getElementById('settings-print-report');
  const settingsExportBtn = document.getElementById('settings-export-csv');
  const settingsImportInput = document.getElementById('csv-file-input');
  const settingsDeleteAllBtn = document.getElementById('settings-delete-all');

  // Wallpaper elements
  const wallpaperPresets = document.querySelectorAll('#wallpaper-presets .preset-btn');
  const btnUploadWallpaper = document.getElementById('btn-upload-wallpaper');
  const wallpaperFileInput = document.getElementById('wallpaper-file-input');
  const btnResetWallpaper = document.getElementById('btn-reset-wallpaper');

  // Average Calculator elements
  const btnToggleCalc = document.getElementById('btn-toggle-calc');
  const calcFields = document.getElementById('calc-fields');
  const calcToggleIcon = document.getElementById('calc-toggle-icon');
  const btnClearCalc = document.getElementById('btn-clear-calc');
  const calcAutoNotes = document.getElementById('calc-auto-notes');

  const calcInputs = {
    sys: [document.getElementById('calc-sys-1'), document.getElementById('calc-sys-2'), document.getElementById('calc-sys-3')],
    dia: [document.getElementById('calc-dia-1'), document.getElementById('calc-dia-2'), document.getElementById('calc-dia-3')],
    pulse: [document.getElementById('calc-pulse-1'), document.getElementById('calc-pulse-2'), document.getElementById('calc-pulse-3')]
  };

  // Toast
  const toast = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');
  const toastIcon = document.getElementById('toast-icon');

  // PWA elements
  const pwaInstallBanner = document.getElementById('pwa-install-banner');
  const btnPwaInstall = document.getElementById('btn-pwa-install');
  let deferredPrompt = null;

  // App State Variables
  let selectedTiming = 'morning';
  let currentActiveView = 'dashboard';
  let currentHistoryMode = 'calendar'; // Default to calendar view
  let activeDashDays = 30; // Changed default from 7 to 30
  let activeAnalyticsDays = 30; // Changed default from 7 to 30
  let activeAnalyticsType = 'all';

  // Calendar State Variables
  let currentCalendarYear = new Date().getFullYear();
  let currentCalendarMonth = new Date().getMonth(); // 0-11
  let selectedCalendarDateStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

  // --- Average Calculator Logic ---
  // Toggle Calculator Accordion
  btnToggleCalc.addEventListener('click', () => {
    const isHidden = calcFields.style.display === 'none';
    calcFields.style.display = isHidden ? 'flex' : 'none';
    calcToggleIcon.textContent = isHidden ? '▲' : '▼';
  });

  // Calculate and Apply Average
  const calculateAverage = () => {
    const getAvg = (inputs) => {
      const vals = inputs.map(i => Number(i.value)).filter(v => v > 0);
      if (vals.length === 0) return '';
      const sum = vals.reduce((a, b) => a + b, 0);
      return Math.round(sum / vals.length);
    };

    const avgSys = getAvg(calcInputs.sys);
    const avgDia = getAvg(calcInputs.dia);
    const avgPulse = getAvg(calcInputs.pulse);

    if (avgSys !== '') inputSys.value = avgSys;
    if (avgDia !== '') inputDia.value = avgDia;
    if (avgPulse !== '') inputPulse.value = avgPulse;

    // Auto record notes if checked
    if (calcAutoNotes.checked) {
      const notesParts = [];
      for (let i = 0; i < 3; i++) {
        const s = calcInputs.sys[i].value;
        const d = calcInputs.dia[i].value;
        const p = calcInputs.pulse[i].value;
        if (s || d || p) {
          notesParts.push(`${i+1}回:${s || '-'}/${d || '-'}(脈${p || '-'})`);
        }
      }
      if (notesParts.length > 0) {
        inputNotes.value = `[複数回平均] ${notesParts.join(' ')}`;
      }
    }
  };

  // Attach input event listeners
  const allCalcInputs = [...calcInputs.sys, ...calcInputs.dia, ...calcInputs.pulse];
  allCalcInputs.forEach(input => {
    input.addEventListener('input', calculateAverage);
  });

  // Clear Calculator
  const clearCalculator = () => {
    allCalcInputs.forEach(i => i.value = '');
    calcFields.style.display = 'none';
    calcToggleIcon.textContent = '▼';
    if (inputNotes.value.startsWith('[複数回平均]')) {
      inputNotes.value = '';
    }
  };

  btnClearCalc.addEventListener('click', clearCalculator);

  // --- Helper: Format Datetime for input ---
  const getLocalDateTimeString = (dateObj = new Date()) => {
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // --- Helper: Toast Notification ---
  const showToast = (message, isSuccess = true) => {
    toastText.textContent = message;
    if (isSuccess) {
      toastIcon.style.color = 'var(--color-success)';
      toastIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />`;
    } else {
      toastIcon.style.color = 'var(--color-danger)';
      toastIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />`;
    }
    
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // --- Helper: Get time label from ISO string ---
  const formatTimeLabel = (isoString) => {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // --- Helper: Get Date short label ---
  const formatDateShort = (isoString) => {
    const d = new Date(isoString);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    return {
      monthDay: `${month}/${date}`,
      day: String(date).padStart(2, '0'),
      dayOfWeek: `(${dayOfWeek})`
    };
  };

  // --- View Controller: Switch views ---
  const switchView = (targetViewId) => {
    // Hide all views and remove active class from nav
    Object.values(views).forEach(v => v.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'));

    // Show target view
    const targetView = views[targetViewId];
    if (targetView) {
      targetView.classList.add('active');
      currentActiveView = targetViewId;
    }

    // Set active nav item
    const navBtn = Array.from(navItems).find(btn => btn.getAttribute('data-view') === targetViewId);
    if (navBtn) {
      navBtn.classList.add('active');
    }

    // Refresh view data
    refreshViewData();
  };

  // Attach nav click handlers
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-view');
      switchView(target);
    });
  });

  // --- Modal Controllers ---
  const openModal = (record = null) => {
    clearCalculator();
    if (record) {
      // Edit mode
      modalTitle.textContent = '記録を編集する';
      inputId.value = record.id;
      inputSys.value = record.sys;
      inputDia.value = record.dia;
      inputPulse.value = record.pulse;
      inputDatetime.value = record.timestamp.slice(0, 16);
      inputNotes.value = record.notes || '';
      
      setTimingType(record.type);
    } else {
      // New mode
      modalTitle.textContent = '血圧を記録する';
      inputId.value = '';
      inputSys.value = '';
      inputDia.value = '';
      inputPulse.value = '';
      
      const now = new Date();
      inputDatetime.value = getLocalDateTimeString(now);
      inputNotes.value = '';

      // Auto-set timing based on current hour
      const hour = now.getHours();
      setTimingType((hour >= 4 && hour < 12) ? 'morning' : 'evening');
    }

    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    recordForm.reset();
    clearCalculator();
  };

  const setTimingType = (type) => {
    selectedTiming = type;
    if (type === 'morning') {
      selectMorningBtn.classList.add('active');
      selectEveningBtn.classList.remove('active');
    } else {
      selectMorningBtn.classList.remove('active');
      selectEveningBtn.classList.add('active');
    }
  };

  selectMorningBtn.addEventListener('click', () => setTimingType('morning'));
  selectEveningBtn.addEventListener('click', () => setTimingType('evening'));

  fabButton.addEventListener('click', () => openModal());
  headerAddBtn.addEventListener('click', () => openModal());
  modalCloseBtn.addEventListener('click', closeModal);

  // Close modal when tapping outside content
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Handle Form Submission
  recordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const record = {
      sys: Number(inputSys.value),
      dia: Number(inputDia.value),
      pulse: Number(inputPulse.value),
      timestamp: new Date(inputDatetime.value).toISOString(),
      type: selectedTiming,
      notes: inputNotes.value.trim()
    };

    if (inputId.value) {
      record.id = inputId.value;
    }

    // Save record
    BPStorage.save(record);
    
    // Close modal & notify
    closeModal();
    showToast(record.id ? '記録を更新しました' : '血圧を記録しました');

    // Refresh view
    refreshViewData();
  });

  // --- Dynamic UI Renderers ---

  /**
   * Universal Calendar & Graph Month Synchronizer
   */
  const updateMonthLabels = () => {
    const labelText = `${currentCalendarYear}年${String(currentCalendarMonth + 1).padStart(2, '0')}月`;
    if (calendarCurrentMonth) calendarCurrentMonth.textContent = labelText;
    if (dashGraphMonthLabel) dashGraphMonthLabel.textContent = labelText;
    if (historyGraphMonthLabel) historyGraphMonthLabel.textContent = labelText;
    if (analyticsGraphMonthLabel) analyticsGraphMonthLabel.textContent = labelText;
    if (fsGraphMonthLabel) fsGraphMonthLabel.textContent = labelText;
  };

  /**
   * Change month across entire app (Calendar, Dashboard Graph, Analytics Graph, Fullscreen)
   */
  const changeCalendarMonth = (delta) => {
    if (delta < 0) {
      if (currentCalendarMonth === 0) {
        currentCalendarMonth = 11;
        currentCalendarYear -= 1;
      } else {
        currentCalendarMonth -= 1;
      }
    } else if (delta > 0) {
      if (currentCalendarMonth === 11) {
        currentCalendarMonth = 0;
        currentCalendarYear += 1;
      } else {
        currentCalendarMonth += 1;
      }
    }

    // Refresh whichever view is active
    refreshViewData();

    // If Fullscreen graph is open, update it directly
    if (modalFullscreenGraph && modalFullscreenGraph.style.display !== 'none') {
      renderFullscreenGraph();
    }
  };

  /**
   * Refreshes the active view with latest database records
   */
  const refreshViewData = () => {
    const allRecords = BPStorage.getAll();
    updateMonthLabels();

    if (currentActiveView === 'dashboard') {
      renderDashboard(allRecords);
    } else if (currentActiveView === 'history') {
      if (currentHistoryMode === 'list') {
        historyListContainer.style.display = 'block';
        historyCalendarContainer.style.display = 'none';
        if (historyGraphContainer) historyGraphContainer.style.display = 'none';
        renderHistoryList(allRecords);
      } else if (currentHistoryMode === 'graph') {
        historyListContainer.style.display = 'none';
        historyCalendarContainer.style.display = 'none';
        if (historyGraphContainer) historyGraphContainer.style.display = 'block';
        renderHistoryGraph(allRecords);
      } else {
        // default: calendar
        historyListContainer.style.display = 'none';
        historyCalendarContainer.style.display = 'block';
        if (historyGraphContainer) historyGraphContainer.style.display = 'none';
        renderCalendar(currentCalendarYear, currentCalendarMonth, allRecords);
      }
    } else if (currentActiveView === 'analytics') {
      renderAnalytics(allRecords);
    }
  };

  /**
   * Render History Tab Graph View (Synchronized with calendar month)
   */
  const renderHistoryGraph = (records) => {
    updateMonthLabels();
    if (!historyGraphWrapper) return;
    BPGraph.render(historyGraphWrapper, records, 'all', currentCalendarYear, currentCalendarMonth);
    BPGraph.setupGestures(
      historyGraphWrapper,
      (direction) => changeCalendarMonth(direction),
      (isZoomed) => {
        if (btnHistoryResetZoom) btnHistoryResetZoom.style.display = isZoomed ? 'block' : 'none';
      }
    );
  };

  /**
   * Render Dashboard View (Synchronized with calendar month)
   */
  const renderDashboard = (records) => {
    updateMonthLabels();

    // 1. Render stats for targeted calendar month
    const monthStats = BPStorage.getMonthStats(currentCalendarYear, currentCalendarMonth);

    // Morning Averaging
    if (monthStats.morning.count > 0) {
      dashMorningBP.innerHTML = `${monthStats.morning.avgSys}/${monthStats.morning.avgDia}<span class="unit">mmHg</span>`;
      const bpClass = BPStorage.classify(monthStats.morning.avgSys, monthStats.morning.avgDia);
      dashMorningStatus.textContent = bpClass.label;
      dashMorningStatus.className = `status ${bpClass.colorClass}`;
    } else {
      dashMorningBP.innerHTML = `--/--<span class="unit">mmHg</span>`;
      dashMorningStatus.textContent = '測定なし';
      dashMorningStatus.className = 'status';
    }

    // Evening Averaging
    if (monthStats.evening.count > 0) {
      dashEveningBP.innerHTML = `${monthStats.evening.avgSys}/${monthStats.evening.avgDia}<span class="unit">mmHg</span>`;
      const bpClass = BPStorage.classify(monthStats.evening.avgSys, monthStats.evening.avgDia);
      dashEveningStatus.textContent = bpClass.label;
      dashEveningStatus.className = `status ${bpClass.colorClass}`;
    } else {
      dashEveningBP.innerHTML = `--/--<span class="unit">mmHg</span>`;
      dashEveningStatus.textContent = '測定なし';
      dashEveningStatus.className = 'status';
    }

    // Total records count in this month
    dashRecordCount.textContent = `${monthStats.totalCount}件`;

    // 2. Render SVG Graph for synchronized calendar month
    BPGraph.render(dashGraphWrapper, records, 'all', currentCalendarYear, currentCalendarMonth);

    // 3. Setup Touch gestures: Pinch-to-Zoom, Pan, and Swipe Month
    BPGraph.setupGestures(
      dashGraphWrapper,
      (direction) => changeCalendarMonth(direction),
      (isZoomed) => {
        if (btnDashResetZoom) btnDashResetZoom.style.display = isZoomed ? 'block' : 'none';
      }
    );

    // 4. Render recent 3 records
    const recent = records.slice(0, 3);
    if (recent.length === 0) {
      dashRecentList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p style="font-size: 0.8rem; margin-top: 6px;">記録はありません。「記録する」から登録してください。</p>
        </div>
      `;
    } else {
      dashRecentList.innerHTML = '';
      recent.forEach(r => {
        dashRecentList.appendChild(createHistoryCard(r));
      });
    }
  };

  /**
   * Render History Tab View
   */
  const renderHistoryList = (records) => {
    if (records.length === 0) {
      fullHistoryList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.375c1.88 0 3.43-1.55 3.43-3.43V9c0-1.88-1.55-3.43-3.43-3.43H9m0 16.5V2.25M3 6.75h18" />
          </svg>
          <p style="font-size: 0.85rem; margin-top: 8px;">データが登録されていません。</p>
        </div>
      `;
      return;
    }

    fullHistoryList.innerHTML = '';
    records.forEach(r => {
      fullHistoryList.appendChild(createHistoryCard(r));
    });
  };

  /**
   * Render Calendar Grid
   */
  const renderCalendar = (year, month, records) => {
    // Set text month label
    calendarCurrentMonth.textContent = `${year}年${String(month + 1).padStart(2, '0')}月`;

    // Clear grid body
    calendarGridBody.innerHTML = '';

    // First day of the month
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Group records by local date key 'YYYY-MM-DD'
    const recordsByDate = {};
    records.forEach(r => {
      const localDateStr = new Date(r.timestamp).toLocaleDateString('sv'); // 'YYYY-MM-DD' Svenska locale is YYYY-MM-DD
      if (!recordsByDate[localDateStr]) {
        recordsByDate[localDateStr] = [];
      }
      recordsByDate[localDateStr].push(r);
    });

    const todayStr = new Date().toLocaleDateString('sv');

    // Render cells
    // 1. Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const cell = createCalendarCell(d, dateStr, true, recordsByDate[dateStr], todayStr);
      calendarGridBody.appendChild(cell);
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const cell = createCalendarCell(d, dateStr, false, recordsByDate[dateStr], todayStr);
      calendarGridBody.appendChild(cell);
    }

    // 3. Next month leading days (to fill grid properly)
    const totalCellsRendered = firstDay + daysInMonth;
    const nextMonthCells = (totalCellsRendered % 7 === 0) ? 0 : 7 - (totalCellsRendered % 7);
    for (let d = 1; d <= nextMonthCells; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const cell = createCalendarCell(d, dateStr, true, recordsByDate[dateStr], todayStr);
      calendarGridBody.appendChild(cell);
    }

    // Refresh detail panel for currently selected date
    if (selectedCalendarDateStr) {
      selectCalendarDay(selectedCalendarDateStr, records);
    }
  };

  /**
   * Helper to create a single calendar cell DOM element
   */
  const createCalendarCell = (dayNum, dateStr, isOtherMonth, dayRecords, todayStr) => {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    if (dateStr === todayStr) cell.classList.add('today');
    if (dateStr === selectedCalendarDateStr) {
      cell.style.borderColor = 'var(--primary)';
      cell.style.boxShadow = '0 0 8px var(--primary-glow)';
    }

    cell.innerHTML = `
      <span class="cell-number">${dayNum}</span>
      <div class="cell-badges"></div>
    `;

    const badgesContainer = cell.querySelector('.cell-badges');
    if (dayRecords && dayRecords.length > 0) {
      const hasMorning = dayRecords.some(r => r.type === 'morning');
      const hasEvening = dayRecords.some(r => r.type === 'evening');

      if (hasMorning) {
        const morningBadge = document.createElement('div');
        morningBadge.className = 'badge-indicator badge-morning';
        morningBadge.title = '朝の測定あり';
        badgesContainer.appendChild(morningBadge);
      }
      if (hasEvening) {
        const eveningBadge = document.createElement('div');
        eveningBadge.className = 'badge-indicator badge-evening';
        eveningBadge.title = '夜の測定あり';
        badgesContainer.appendChild(eveningBadge);
      }
    }

    cell.addEventListener('click', () => {
      selectedCalendarDateStr = dateStr;
      
      // Update highlights
      document.querySelectorAll('.calendar-cell').forEach(c => {
        c.style.borderColor = '';
        c.style.boxShadow = '';
      });
      cell.style.borderColor = 'var(--primary)';
      cell.style.boxShadow = '0 0 8px var(--primary-glow)';

      const allRecords = BPStorage.getAll();
      selectCalendarDay(dateStr, allRecords);
    });

    return cell;
  };

  /**
   * Selection handler for a calendar date, rendering its detail panel
   */
  const selectCalendarDay = (dateStr, records) => {
    const dayRecords = records.filter(r => new Date(r.timestamp).toLocaleDateString('sv') === dateStr);
    
    // Format date string
    const d = new Date(dateStr + 'T00:00:00');
    calendarSelectedDateLabel.textContent = `${d.getMonth() + 1}月${d.getDate()}日の記録`;
    
    calendarDayRecordsList.innerHTML = '';
    
    if (dayRecords.length === 0) {
      calendarDayRecordsList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 16px 0;">
          この日の記録はありません。
        </div>
      `;
    } else {
      // Sort Morning then Evening
      dayRecords.sort((a, b) => {
        if (a.type === 'morning' && b.type === 'evening') return -1;
        if (a.type === 'evening' && b.type === 'morning') return 1;
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      dayRecords.forEach(r => {
        calendarDayRecordsList.appendChild(createHistoryCard(r));
      });
    }

    calendarDayDetailPanel.style.display = 'block';
  };

  /**
   * Render Analytics View (Synchronized with calendar month)
   */
  const renderAnalytics = (records) => {
    updateMonthLabels();

    // 1. Render detailed SVG Graph for synchronized calendar month
    BPGraph.render(analyticsGraphWrapper, records, activeAnalyticsType, currentCalendarYear, currentCalendarMonth);

    // 2. Setup Touch gestures: Pinch-to-Zoom, Pan, and Swipe Month
    BPGraph.setupGestures(
      analyticsGraphWrapper,
      (direction) => changeCalendarMonth(direction),
      (isZoomed) => {
        if (btnAnalyticsResetZoom) btnAnalyticsResetZoom.style.display = isZoomed ? 'block' : 'none';
      }
    );

    // 3. Fetch stats for summary panel (current calendar month)
    const stats = BPStorage.getMonthStats(currentCalendarYear, currentCalendarMonth);
    const activeStats = activeAnalyticsType === 'all' ? stats.overall : stats[activeAnalyticsType];

    if (activeStats.count > 0) {
      statMaxSys.innerHTML = `${activeStats.maxSys} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">mmHg</span>`;
      statMinSys.textContent = `最低: ${activeStats.minSys} mmHg`;

      statMaxDia.innerHTML = `${activeStats.maxDia} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">mmHg</span>`;
      statMinDia.textContent = `最低: ${activeStats.minDia} mmHg`;

      statAveragePulse.textContent = `平均脈拍数: ${activeStats.avgPulse} bpm`;
      statRecordCount.textContent = `測定回数: ${activeStats.count} 回`;
    } else {
      statMaxSys.innerHTML = `-- <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">mmHg</span>`;
      statMinSys.textContent = '最低: -- mmHg';

      statMaxDia.innerHTML = `-- <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">mmHg</span>`;
      statMinDia.textContent = '最低: -- mmHg';

      statAveragePulse.textContent = '平均脈拍数: -- bpm';
      statRecordCount.textContent = '測定回数: 0 回';
    }
  };

  /**
   * Fullscreen Graph Modal Controls
   */
  const openFullscreenGraph = (isAuto = false) => {
    if (!modalFullscreenGraph) return;
    modalFullscreenGraph.style.display = 'flex';
    if (isAuto) {
      modalFullscreenGraph.dataset.autoOpened = 'true';
    }
    renderFullscreenGraph();
  };

  const closeFullscreenGraph = () => {
    if (!modalFullscreenGraph) return;
    modalFullscreenGraph.style.display = 'none';
    delete modalFullscreenGraph.dataset.autoOpened;
  };

  const renderFullscreenGraph = () => {
    updateMonthLabels();
    const records = BPStorage.getAll();
    BPGraph.render(
      fullscreenGraphContainer,
      records,
      activeAnalyticsType || 'all',
      currentCalendarYear,
      currentCalendarMonth,
      { isFullscreen: true }
    );

    // Setup gestures on fullscreen graph
    BPGraph.setupGestures(
      fullscreenGraphContainer,
      (direction) => changeCalendarMonth(direction),
      (isZoomed) => {
        if (btnFsResetZoom) btnFsResetZoom.style.display = isZoomed ? 'block' : 'none';
      }
    );
  };

  /**
   * Create dynamic HTML structure for a single history entry card
   */
  const createHistoryCard = (r) => {
    const card = document.createElement('div');
    card.className = 'glass-panel history-card no-press';
    card.setAttribute('data-id', r.id);

    const bpClass = BPStorage.classify(r.sys, r.dia);
    const dateMeta = formatDateShort(r.timestamp);
    const timeLabel = formatTimeLabel(r.timestamp);
    
    const timingClass = r.type === 'morning' ? 'morning' : 'evening';
    const timingName = r.type === 'morning' ? '朝' : '夜';

    card.innerHTML = `
      <div class="history-time-badge ${timingClass}">
        <span class="day">${dateMeta.day}</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); font-weight:500;">${dateMeta.monthDay}</span>
      </div>
      <div class="history-data">
        <div class="history-values">
          <span class="sys-dia">${r.sys}/${r.dia}</span>
          <span class="pulse">脈 ${r.pulse}</span>
        </div>
        <div class="history-meta">
          <span class="status ${bpClass.colorClass}" style="font-size: 0.65rem; padding: 1px 6px;">${bpClass.label}</span>
          <span>${timingName} ${timeLabel}</span>
          ${r.notes ? `<span style="color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;" title="${r.notes}">• ${r.notes}</span>` : ''}
        </div>
      </div>
      <div class="history-actions">
        <button class="icon-btn btn-edit" title="編集">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button class="icon-btn delete btn-delete" title="削除">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    `;

    // Bind item click actions
    card.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(r);
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('この記録を削除してもよろしいですか？')) {
        const deleted = BPStorage.delete(r.id);
        if (deleted) {
          showToast('記録を削除しました');
          refreshViewData();
        }
      }
    });

    return card;
  };

  // --- Dynamic Dashboard Graph Filter Attachments ---
  const dashFilterBtns = document.querySelectorAll('#view-dashboard .graph-filter-btn');
  dashFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dashFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDashDays = Number(btn.getAttribute('data-days'));
      refreshViewData();
    });
  });

  // --- Dynamic Analytics Filter Attachments ---
  const analyticsTypeBtns = document.querySelectorAll('#analytics-type-filter .graph-filter-btn');
  analyticsTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      analyticsTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeAnalyticsType = btn.getAttribute('data-type');
      refreshViewData();
    });
  });

  const analyticsDaysBtns = document.querySelectorAll('#analytics-days-filter .graph-filter-btn');
  analyticsDaysBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      analyticsDaysBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeAnalyticsDays = Number(btn.getAttribute('data-days'));
      refreshViewData();
    });
  });

  // --- Settings Tab Actions ---
  
  // PDF Report Print (A4 A4-friendly printer and PDF generation)
  settingsPrintReportBtn.addEventListener('click', () => {
    printReport();
  });

  // CSV Export
  settingsExportBtn.addEventListener('click', () => {
    try {
      const csvContent = BPStorage.exportToCSV();
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 with BOM for Excel compatibility
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const d = new Date();
      const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      link.setAttribute('download', `血圧手帳_${dateStr}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('CSVファイルを書き出しました');
    } catch (e) {
      console.error(e);
      showToast('CSV出力に失敗しました', false);
    }
  });

  // CSV Import
  settingsImportInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const res = BPStorage.importFromCSV(text);

      if (res.success) {
        showToast(`${res.count}件の新規データを取り込みました。`);
        refreshViewData();
      } else {
        showToast(`インポート失敗: ${res.error}`, false);
      }
      
      // Reset input value to allow importing same file again
      settingsImportInput.value = '';
    };
    
    reader.readAsText(file);
  });

  // Delete All Data
  settingsDeleteAllBtn.addEventListener('click', () => {
    if (confirm('【注意】すべての記録が削除され、元に戻せません。本当に削除しますか？\n(IndexedDBバックアップからも削除されます)')) {
      localStorage.removeItem(BPStorage.STORAGE_KEY);
      BPStorage.clearIndexedDBBackup();
      showToast('すべてのデータを削除しました');
      refreshViewData();
    }
  });

  // --- PDF Report Generator Logic ---
  const printReport = () => {
    const allRecords = BPStorage.getAll();
    if (allRecords.length === 0) {
      showToast('印刷するデータがありません', false);
      return;
    }

    // Statistics (Selected Calendar Month)
    const stats = BPStorage.getMonthStats(currentCalendarYear, currentCalendarMonth);
    const monthPrefix = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}`;
    const monthRecords = allRecords.filter(r => r.timestamp && r.timestamp.startsWith(monthPrefix));

    // Group records by Japanese Locale Date string for morning/evening representation in table
    const sorted = [...monthRecords].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const rowsByDate = {};
    sorted.forEach(r => {
      const localDate = new Date(r.timestamp).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
      if (!rowsByDate[localDate]) {
        rowsByDate[localDate] = { morning: null, evening: null };
      }
      rowsByDate[localDate][r.type] = r;
    });

    let tableRowsHTML = '';
    Object.keys(rowsByDate).forEach(dateStr => {
      const data = rowsByDate[dateStr];
      const m = data.morning;
      const e = data.evening;

      const mBP = m ? `${m.sys}/${m.dia}` : '-';
      const mPulse = m ? `${m.pulse}` : '-';
      const mNotes = m && m.notes ? m.notes : '';

      const eBP = e ? `${e.sys}/${e.dia}` : '-';
      const ePulse = e ? `${e.pulse}` : '-';
      const eNotes = e && e.notes ? e.notes : '';

      tableRowsHTML += `
        <tr>
          <td>${dateStr}</td>
          <td style="color: #0891b2; font-weight: 700;">${mBP}</td>
          <td>${mPulse}</td>
          <td style="font-size: 8pt; color: #555;">${mNotes}</td>
          <td style="color: #ea580c; font-weight: 700;">${eBP}</td>
          <td>${ePulse}</td>
          <td style="font-size: 8pt; color: #555;">${eNotes}</td>
        </tr>
      `;
    });

    // Clone the SVG graph from dashboard for static report rendering
    const graphClone = dashGraphWrapper.cloneNode(true);
    const tooltipInClone = graphClone.querySelector('#graph-tooltip');
    if (tooltipInClone) tooltipInClone.remove();

    // Create printer page element
    const printContainer = document.createElement('div');
    printContainer.className = 'print-report-layout';
    printContainer.style.display = 'none';

    const d = new Date();
    const printDate = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
    const targetMonthText = `${currentCalendarYear}年${currentCalendarMonth + 1}月`;

    printContainer.innerHTML = `
      <div class="print-report-header">
        <h1 class="print-report-title">血圧管理レポート (${targetMonthText})</h1>
        <p style="font-size: 9pt; color: #666; margin: 4px 0 0 0;">出力日: ${printDate} | 対象月: ${targetMonthText} | 血圧手帳</p>
      </div>

      <h3 style="font-size: 11pt; margin-top: 0; border-left: 4px solid #ea580c; padding-left: 8px;">📊 ${targetMonthText}の統計</h3>
      <table class="print-stats-table">
        <thead>
          <tr>
            <th>区分</th>
            <th>平均血圧 (最高/最低)</th>
            <th>平均脈拍</th>
            <th>最高血圧 (SYS)</th>
            <th>最低血圧 (DIA)</th>
            <th>測定回数</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>朝 (起床時)</td>
            <td>${stats.morning.count > 0 ? `${stats.morning.avgSys}/${stats.morning.avgDia} mmHg` : '-'}</td>
            <td>${stats.morning.count > 0 ? `${stats.morning.avgPulse} bpm` : '-'}</td>
            <td>${stats.morning.count > 0 ? `${stats.morning.maxSys} mmHg` : '-'}</td>
            <td>${stats.morning.count > 0 ? `${stats.morning.minDia} mmHg` : '-'}</td>
            <td>${stats.morning.count} 回</td>
          </tr>
          <tr>
            <td>夜 (就寝前)</td>
            <td>${stats.evening.count > 0 ? `${stats.evening.avgSys}/${stats.evening.avgDia} mmHg` : '-'}</td>
            <td>${stats.evening.count > 0 ? `${stats.evening.avgPulse} bpm` : '-'}</td>
            <td>${stats.evening.count > 0 ? `${stats.evening.maxSys} mmHg` : '-'}</td>
            <td>${stats.evening.count > 0 ? `${stats.evening.minDia} mmHg` : '-'}</td>
            <td>${stats.evening.count} 回</td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 11pt; margin-top: 24px; border-left: 4px solid #ea580c; padding-left: 8px;">📈 直近の血圧推移</h3>
      <div class="print-chart-container" style="background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 10px;">
        ${graphClone.innerHTML}
      </div>

      <div class="page-break"></div>

      <h3 style="font-size: 11pt; margin-top: 0; border-left: 4px solid #ea580c; padding-left: 8px;">📋 測定データ一覧</h3>
      <table class="print-records-table">
        <thead>
          <tr>
            <th rowspan="2">日付</th>
            <th colspan="3" style="background-color: #f0f8ff; text-align: center;">朝の測定 (起床時)</th>
            <th colspan="3" style="background-color: #fffaf0; text-align: center;">夜の測定 (就寝前)</th>
          </tr>
          <tr>
            <th style="background-color: #f0f8ff;">血圧 (mmHg)</th>
            <th style="background-color: #f0f8ff;">脈拍 (bpm)</th>
            <th style="background-color: #f0f8ff;">メモ</th>
            <th style="background-color: #fffaf0;">血圧 (mmHg)</th>
            <th style="background-color: #fffaf0;">脈拍 (bpm)</th>
            <th style="background-color: #fffaf0;">メモ</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHTML}
        </tbody>
      </table>
    `;

    document.body.appendChild(printContainer);
    
    // Short defer to allow browser DOM paint EKG graph clone
    setTimeout(() => {
      window.print();
      document.body.removeChild(printContainer);
    }, 150);
  };

  // --- Calendar & Graph Navigation & Toggle Events ---

  // History Mode Toggle: Calendar, Graph, List
  const setHistoryMode = (mode) => {
    currentHistoryMode = mode;
    const btns = [btnHistoryCalendarMode, btnHistoryGraphMode, btnHistoryListMode];
    btns.forEach(btn => {
      if (btn) {
        if (btn.getAttribute('data-mode') === mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
    refreshViewData();
  };

  if (btnHistoryCalendarMode) btnHistoryCalendarMode.addEventListener('click', () => setHistoryMode('calendar'));
  if (btnHistoryGraphMode) btnHistoryGraphMode.addEventListener('click', () => setHistoryMode('graph'));
  if (btnHistoryListMode) btnHistoryListMode.addEventListener('click', () => setHistoryMode('list'));

  // Dashboard jump directly to Calendar
  if (btnDashJumpCalendar) {
    btnDashJumpCalendar.addEventListener('click', () => {
      switchView('history');
      setHistoryMode('calendar');
    });
  }

  // Universal Month Navigation Buttons (Calendar, Dashboard, History Graph, Analytics, Fullscreen)
  if (btnCalendarPrev) btnCalendarPrev.addEventListener('click', () => changeCalendarMonth(-1));
  if (btnCalendarNext) btnCalendarNext.addEventListener('click', () => changeCalendarMonth(1));

  if (btnDashGraphPrev) btnDashGraphPrev.addEventListener('click', () => changeCalendarMonth(-1));
  if (btnDashGraphNext) btnDashGraphNext.addEventListener('click', () => changeCalendarMonth(1));

  if (btnHistoryGraphPrev) btnHistoryGraphPrev.addEventListener('click', () => changeCalendarMonth(-1));
  if (btnHistoryGraphNext) btnHistoryGraphNext.addEventListener('click', () => changeCalendarMonth(1));

  if (btnAnalyticsGraphPrev) btnAnalyticsGraphPrev.addEventListener('click', () => changeCalendarMonth(-1));
  if (btnAnalyticsGraphNext) btnAnalyticsGraphNext.addEventListener('click', () => changeCalendarMonth(1));

  if (btnFsGraphPrev) btnFsGraphPrev.addEventListener('click', () => changeCalendarMonth(-1));
  if (btnFsGraphNext) btnFsGraphNext.addEventListener('click', () => changeCalendarMonth(1));

  // Fullscreen Graph Buttons
  if (btnDashFullscreen) btnDashFullscreen.addEventListener('click', () => openFullscreenGraph(false));
  if (btnHistoryFullscreen) btnHistoryFullscreen.addEventListener('click', () => openFullscreenGraph(false));
  if (btnAnalyticsFullscreen) btnAnalyticsFullscreen.addEventListener('click', () => openFullscreenGraph(false));
  if (btnCloseFullscreenGraph) btnCloseFullscreenGraph.addEventListener('click', closeFullscreenGraph);

  // Zoom Reset Buttons
  if (btnDashResetZoom) {
    btnDashResetZoom.addEventListener('click', () => {
      if (dashGraphWrapper && dashGraphWrapper.resetZoom) dashGraphWrapper.resetZoom();
    });
  }
  if (btnHistoryResetZoom) {
    btnHistoryResetZoom.addEventListener('click', () => {
      if (historyGraphWrapper && historyGraphWrapper.resetZoom) historyGraphWrapper.resetZoom();
    });
  }
  if (btnAnalyticsResetZoom) {
    btnAnalyticsResetZoom.addEventListener('click', () => {
      if (analyticsGraphWrapper && analyticsGraphWrapper.resetZoom) analyticsGraphWrapper.resetZoom();
    });
  }
  if (btnFsResetZoom) {
    btnFsResetZoom.addEventListener('click', () => {
      if (fullscreenGraphContainer && fullscreenGraphContainer.resetZoom) fullscreenGraphContainer.resetZoom();
    });
  }

  // Device Orientation Listener (Automatic Fullscreen on Landscape tilt)
  const handleOrientation = () => {
    // Check if device is in landscape mode
    const isLandscape = window.matchMedia('(orientation: landscape)').matches || (window.orientation === 90 || window.orientation === -90);
    // On smartphones/tablets, landscape mode height is typically smaller than 600px
    if (isLandscape && window.innerHeight < 650) {
      if (modalFullscreenGraph && modalFullscreenGraph.style.display !== 'flex') {
        openFullscreenGraph(true);
      }
    } else {
      // Rotated back to portrait -> close if it was opened automatically
      if (modalFullscreenGraph && modalFullscreenGraph.dataset.autoOpened === 'true') {
        closeFullscreenGraph();
      }
    }
  };

  window.addEventListener('resize', handleOrientation);
  window.addEventListener('orientationchange', handleOrientation);

  // "Record this day" button click
  btnCalendarAddRecord.addEventListener('click', () => {
    openModal();
    // Pre-fill selection date into datetime input
    const d = new Date(selectedCalendarDateStr);
    const now = new Date();
    // Retain current hour/minute to make time input natural
    d.setHours(now.getHours(), now.getMinutes());
    inputDatetime.value = getLocalDateTimeString(d);
  });

  // --- Wallpaper Settings Actions ---
  
  const applyWallpaper = (wpData) => {
    const body = document.body;
    
    // Reset state
    body.classList.remove('has-custom-bg');
    body.style.background = '';
    body.style.backgroundImage = '';
    
    if (wpData.type === 'preset' && wpData.value !== 'default') {
      const presets = {
        sakura: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
        ocean: 'linear-gradient(135deg, #a5f3fc 0%, #0891b2 100%)',
        sunset: 'linear-gradient(135deg, #ffedd5 0%, #ea580c 100%)',
        forest: 'linear-gradient(135deg, #a7f3d0 0%, #059669 100%)'
      };
      body.style.background = presets[wpData.value] || '';
      btnResetWallpaper.style.display = 'block';
      updatePresetActiveState(wpData.value);
    } else if (wpData.type === 'image') {
      body.style.backgroundImage = `url("${wpData.value}")`;
      body.classList.add('has-custom-bg');
      btnResetWallpaper.style.display = 'block';
      updatePresetActiveState('custom');
    } else {
      // Default
      btnResetWallpaper.style.display = 'none';
      updatePresetActiveState('default');
    }
  };

  const updatePresetActiveState = (activeTheme) => {
    wallpaperPresets.forEach(btn => {
      const theme = btn.getAttribute('data-theme');
      if (theme === activeTheme) {
        btn.classList.add('active');
        btn.style.border = '2px solid var(--primary)';
      } else {
        btn.classList.remove('active');
        btn.style.border = '2px solid transparent';
      }
    });
  };

  const loadWallpaper = () => {
    const wp = localStorage.getItem('blood_pressure_diary_wallpaper');
    if (!wp) return;
    try {
      const wpData = JSON.parse(wp);
      applyWallpaper(wpData);
    } catch (e) {
      console.error('Failed to parse wallpaper from localStorage', e);
    }
  };

  // Preset Buttons Click
  wallpaperPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      const wpData = { type: 'preset', value: theme };
      localStorage.setItem('blood_pressure_diary_wallpaper', JSON.stringify(wpData));
      applyWallpaper(wpData);
      showToast('カラーテーマを変更しました');
    });
  });

  // Custom Image Upload Trigger
  btnUploadWallpaper.addEventListener('click', () => {
    wallpaperFileInput.click();
  });

  // File Input Changed
  wallpaperFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to 1.5MB to prevent localStorage quota error
    if (file.size > 1.5 * 1024 * 1024) {
      showToast('画像サイズが大きすぎます (1.5MB以下にしてください)', false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      const wpData = { type: 'image', value: base64 };
      try {
        localStorage.setItem('blood_pressure_diary_wallpaper', JSON.stringify(wpData));
        applyWallpaper(wpData);
        showToast('カスタム壁紙を設定しました');
      } catch (err) {
        console.error(err);
        showToast('保存に失敗しました。画像のサイズを下げてください。', false);
      }
    };
    reader.readAsDataURL(file);
  });

  // Reset Wallpaper
  btnResetWallpaper.addEventListener('click', () => {
    localStorage.removeItem('blood_pressure_diary_wallpaper');
    applyWallpaper({ type: 'preset', value: 'default' });
    showToast('壁紙を初期設定に戻しました');
  });

  // --- PWA Installation Guide & Prompts ---
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const installBannerText = document.getElementById('install-banner-text');
  const btnCloseInstallBanner = document.getElementById('btn-close-install-banner');

  if (btnCloseInstallBanner) {
    btnCloseInstallBanner.addEventListener('click', () => {
      pwaInstallBanner.style.display = 'none';
      sessionStorage.setItem('dismiss_install_banner', 'true');
    });
  }

  const isDismissed = sessionStorage.getItem('dismiss_install_banner') === 'true';

  if (isStandalone || isDismissed) {
    // Already installed or user dismissed banner
    if (pwaInstallBanner) pwaInstallBanner.style.display = 'none';
  } else {
    // Show appropriate install guidance based on OS
    if (isIOS) {
      if (installBannerText) {
        installBannerText.innerHTML = `
          <strong>📱 ホーム画面に追加してアプリ化</strong><br>
          Safari下の共有ボタン <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: -2px; display: inline-block;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/></svg> を押し、<strong>「ホーム画面に追加」</strong>をタップしてください。
        `;
      }
      if (btnPwaInstall) btnPwaInstall.style.display = 'none';
      if (pwaInstallBanner) pwaInstallBanner.style.display = 'flex';
    } else {
      // Android / Other Browser
      if (installBannerText) {
        installBannerText.innerHTML = `
          <strong>📱 ホーム画面に追加してアプリ化</strong><br>
          ブラウザ右上のメニュー（︙）から<strong>「ホーム画面に追加」</strong>または「アプリをインストール」をタップしてください。
        `;
      }
      if (btnPwaInstall) btnPwaInstall.style.display = 'none';
      if (pwaInstallBanner) pwaInstallBanner.style.display = 'flex';

      // If browser supports native install prompt (e.g. Chrome on PC/Android with criteria met)
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (btnPwaInstall) btnPwaInstall.style.display = 'block';
        if (installBannerText) {
          installBannerText.innerHTML = `
            <strong>血圧手帳アプリ</strong><br>
            ワンタップで端末にインストールできます
          `;
        }
      });
    }
  }

  btnPwaInstall.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install outcome: ${outcome}`);
    // We've used the prompt, and can't use it again
    deferredPrompt = null;
    // Hide the install banner
    pwaInstallBanner.style.display = 'none';
  });

  // --- Initial Render & Auto Recovery ---
  BPStorage.restoreFromBackup().then(recovered => {
    if (recovered) {
      showToast('バックアップからデータを復元しました');
    }
    loadWallpaper();
    refreshViewData();
  });
});
