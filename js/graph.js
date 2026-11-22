/**
 * SVG Custom Graph for Blood Pressure Diary
 * Generates lightweight, responsive, and beautiful SVG charts without external dependencies.
 * Supports Calendar Month Sync, Fullscreen Mode, Pinch-to-Zoom, and Swipe-to-Scroll/Navigate.
 */
class BPGraph {
  /**
   * Render blood pressure graph inside the container for a specific calendar month
   * @param {HTMLElement} container - The container element to insert SVG into
   * @param {Array} records - List of records
   * @param {String} mode - Filter mode: 'all' | 'morning' | 'evening'
   * @param {Number} targetYear - Year (e.g. 2026)
   * @param {Number} targetMonth - Month 0-11 (e.g. 10 for November)
   * @param {Object} options - { isFullscreen: boolean }
   */
  static render(container, records, mode = 'all', targetYear = null, targetMonth = null, options = {}) {
    if (!container) return;

    // Clear previous contents
    container.innerHTML = '';

    const now = new Date();
    const year = (targetYear !== null && targetYear !== undefined) ? targetYear : now.getFullYear();
    const month = (targetMonth !== null && targetMonth !== undefined) ? targetMonth : now.getMonth();

    // Days in targeted month (e.g., 28, 29, 30, 31)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Filter records for this month
    const filtered = records.filter(r => {
      if (!r.timestamp) return false;
      return r.timestamp.startsWith(monthPrefix);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 24px 16px; text-align: center;">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); opacity: 0.6;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
          <p style="font-size: 0.85rem; margin-top: 8px; color: var(--text-muted);">${year}年${month + 1}月の測定データがありません。</p>
        </div>
      `;
      return;
    }

    // Generate date map for whole month x-axis
    const dateLabels = [];
    const dateKeys = []; // 'YYYY-MM-DD'
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      dateKeys.push(`${monthPrefix}-${dayStr}`);
      dateLabels.push(`${month + 1}/${d}`);
    }

    // Graph Dimensions (viewBox coordinate system)
    const isFS = !!options.isFullscreen;
    const svgWidth = isFS ? 720 : 560;
    const svgHeight = isFS ? 320 : 230;
    const paddingLeft = 38;
    const paddingRight = 24;
    const paddingTop = 18;
    const paddingBottom = 28;

    const graphWidth = svgWidth - paddingLeft - paddingRight;
    const graphHeight = svgHeight - paddingTop - paddingBottom;

    // Y-Axis Range configuration (JSH Blood Pressure Guidelines)
    let minY = 50;
    let maxY = 180;

    filtered.forEach(r => {
      const sys = Number(r.sys);
      const dia = Number(r.dia);
      if (sys > maxY) maxY = sys + 10;
      if (dia < minY) minY = Math.max(30, dia - 10);
    });

    minY = Math.floor(minY / 10) * 10;
    maxY = Math.ceil(maxY / 10) * 10;
    const yRange = maxY - minY;

    const getY = (val) => {
      const percentage = (val - minY) / yRange;
      return svgHeight - paddingBottom - (percentage * graphHeight);
    };

    // Calculate X coordinate for day index (0 to daysInMonth - 1)
    const getX = (dateIndex, type = 'morning') => {
      const sectionWidth = graphWidth / (daysInMonth - 1 || 1);
      const baseX = paddingLeft + (dateIndex * sectionWidth);
      
      if (mode === 'all') {
        const offset = Math.min(6, Math.max(2, sectionWidth * 0.22));
        return type === 'morning' ? baseX - offset : baseX + offset;
      }
      return baseX;
    };

    const svgElements = [];

    // --- 1. Background Zones (JSH Guidelines) ---
    const highY_sys = getY(135);
    const elevatedY_sys = getY(115);
    const topY = getY(maxY);
    const bottomY = getY(minY);

    svgElements.push(`
      <!-- JSH Guideline Background Zones -->
      <rect x="${paddingLeft}" y="${topY}" width="${graphWidth}" height="${Math.max(0, bottomY - topY)}" fill="url(#bp-zone-gradient)" opacity="0.12" />
      <!-- Target Normal Systolic Line (135) -->
      <line x1="${paddingLeft}" y1="${highY_sys}" x2="${svgWidth - paddingRight}" y2="${highY_sys}" stroke="var(--color-danger)" stroke-width="1" stroke-dasharray="3,3" opacity="0.5" />
      <text x="${svgWidth - paddingRight + 4}" y="${highY_sys + 3}" fill="var(--color-danger)" font-size="7.5" font-weight="600" opacity="0.7">135</text>
      <!-- Target Normal Diastolic Line (85) -->
      <line x1="${paddingLeft}" y1="${getY(85)}" x2="${svgWidth - paddingRight}" y2="${getY(85)}" stroke="var(--color-danger)" stroke-width="1" stroke-dasharray="3,3" opacity="0.3" />
      <text x="${svgWidth - paddingRight + 4}" y="${getY(85) + 3}" fill="var(--color-danger)" font-size="7.5" font-weight="600" opacity="0.6">85</text>
    `);

    // --- 2. Grid lines & Y Axis Labels ---
    const tickInterval = yRange > 120 ? 30 : 20;
    const startTick = Math.ceil(minY / tickInterval) * tickInterval;
    
    for (let yVal = startTick; yVal <= maxY; yVal += tickInterval) {
      const yPos = getY(yVal);
      svgElements.push(`
        <line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="var(--border-color)" stroke-width="0.8" opacity="0.8" />
        <text x="${paddingLeft - 8}" y="${yPos + 3.5}" fill="var(--text-muted)" font-size="8.5" font-weight="600" text-anchor="end">${yVal}</text>
      `);
    }

    // --- 3. X Axis Labels (Calendar Key Dates) ---
    // Mark Day 1, 5, 10, 15, 20, 25, and Last Day
    const importantDays = [1, 5, 10, 15, 20, 25, daysInMonth];
    dateKeys.forEach((key, idx) => {
      const dayNum = idx + 1;
      if (importantDays.includes(dayNum)) {
        const xPos = getX(idx, 'morning');
        svgElements.push(`
          <line x1="${xPos}" y1="${svgHeight - paddingBottom}" x2="${xPos}" y2="${svgHeight - paddingBottom + 5}" stroke="var(--border-color)" stroke-width="1" />
          <text x="${xPos}" y="${svgHeight - paddingBottom + 15}" fill="var(--text-muted)" font-size="8.5" font-weight="600" text-anchor="middle">${dayNum}日</text>
        `);
      }
    });

    // --- 4. Organize Data Points & Connect Lines ---
    const recordsByDate = {};
    filtered.forEach(r => {
      const dateStr = r.timestamp.split('T')[0];
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = {};
      }
      recordsByDate[dateStr][r.type] = r;
    });

    const paths = {
      morningSys: [],
      morningDia: [],
      eveningSys: [],
      eveningDia: []
    };

    const points = [];

    dateKeys.forEach((key, idx) => {
      const dayData = recordsByDate[key];
      if (!dayData) return;

      // Handle Morning
      if ((mode === 'all' || mode === 'morning') && dayData.morning) {
        const r = dayData.morning;
        const x = getX(idx, 'morning');
        const ySys = getY(r.sys);
        const yDia = getY(r.dia);

        paths.morningSys.push({ x, y: ySys });
        paths.morningDia.push({ x, y: yDia });

        points.push({
          x, ySys, yDia,
          record: r,
          type: 'morning',
          dateStr: dateLabels[idx]
        });
      }

      // Handle Evening
      if ((mode === 'all' || mode === 'evening') && dayData.evening) {
        const r = dayData.evening;
        const x = getX(idx, 'evening');
        const ySys = getY(r.sys);
        const yDia = getY(r.dia);

        paths.eveningSys.push({ x, y: ySys });
        paths.eveningDia.push({ x, y: yDia });

        points.push({
          x, ySys, yDia,
          record: r,
          type: 'evening',
          dateStr: dateLabels[idx]
        });
      }
    });

    const drawPolyline = (pointsArray, strokeColor, strokeWidth, glowId) => {
      if (pointsArray.length < 2) return '';
      const d = pointsArray.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return `
        <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" filter="${glowId ? `url(#${glowId})` : 'none'}" />
      `;
    };

    // Render Lines
    if (mode === 'all' || mode === 'morning') {
      svgElements.push(drawPolyline(paths.morningSys, 'var(--secondary)', 2, 'blue-glow'));
      svgElements.push(drawPolyline(paths.morningDia, 'var(--secondary)', 1.6, 'blue-glow'));
    }
    if (mode === 'all' || mode === 'evening') {
      svgElements.push(drawPolyline(paths.eveningSys, 'var(--primary)', 2, 'red-glow'));
      svgElements.push(drawPolyline(paths.eveningDia, 'var(--primary)', 1.6, 'red-glow'));
    }

    // --- 5. Render Vertical Bars & Data Dots ---
    points.forEach(pt => {
      const color = pt.type === 'morning' ? 'var(--secondary)' : 'var(--primary)';
      const glow = pt.type === 'morning' ? 'var(--secondary-glow)' : 'var(--primary-glow)';

      // 1. Draw vertical bar between Sys and Dia
      svgElements.push(`
        <line x1="${pt.x}" y1="${pt.ySys}" x2="${pt.x}" y2="${pt.yDia}" stroke="${color}" stroke-width="2.5" opacity="0.3" stroke-linecap="round" />
      `);

      // 2. Draw Systolic Dot
      svgElements.push(`
        <circle cx="${pt.x}" cy="${pt.ySys}" r="4.5" fill="${color}" stroke="var(--bg-card)" stroke-width="1.5" style="filter: drop-shadow(0 2px 4px ${glow}); cursor: pointer;"
                class="graph-dot" data-id="${pt.record.id}" data-sys="${pt.record.sys}" data-dia="${pt.record.dia}" data-pulse="${pt.record.pulse}" data-type="${pt.type}" data-date="${pt.dateStr}" />
      `);

      // 3. Draw Diastolic Dot
      svgElements.push(`
        <circle cx="${pt.x}" cy="${pt.yDia}" r="4" fill="${color}" stroke="var(--bg-card)" stroke-width="1.2" style="filter: drop-shadow(0 2px 4px ${glow}); cursor: pointer;"
                class="graph-dot" data-id="${pt.record.id}" data-sys="${pt.record.sys}" data-dia="${pt.record.dia}" data-pulse="${pt.record.pulse}" data-type="${pt.type}" data-date="${pt.dateStr}" />
      `);
    });

    // --- 6. Tooltip Box ---
    svgElements.push(`
      <g id="graph-tooltip" opacity="0" pointer-events="none" style="transition: opacity 0.15s ease;">
        <rect id="tooltip-bg" x="0" y="0" width="94" height="52" rx="8" fill="var(--bg-card)" stroke="var(--border-color)" stroke-width="1" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.18));" />
        <text id="tooltip-date" x="8" y="16" fill="var(--text-muted)" font-size="8.5" font-weight="600"></text>
        <text id="tooltip-bp" x="8" y="30" fill="var(--text-main)" font-size="10.5" font-weight="700"></text>
        <text id="tooltip-pulse" x="8" y="44" fill="var(--text-muted)" font-size="8.5" font-weight="500"></text>
      </g>
    `);

    // Complete SVG structure with viewBox
    const svgHTML = `
      <svg id="chart-svg" width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" data-width="${svgWidth}" data-height="${svgHeight}">
        <defs>
          <filter id="blue-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" opacity="0.3" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" opacity="0.3" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bp-zone-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-danger)" />
            <stop offset="50%" stop-color="var(--color-warning)" />
            <stop offset="100%" stop-color="var(--color-success)" />
          </linearGradient>
        </defs>
        
        <!-- Y-Axis border line -->
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${svgHeight - paddingBottom}" stroke="var(--border-color)" stroke-width="1.2" />
        <!-- X-Axis border line -->
        <line x1="${paddingLeft}" y1="${svgHeight - paddingBottom}" x2="${svgWidth - paddingRight}" y2="${svgHeight - paddingBottom}" stroke="var(--border-color)" stroke-width="1.2" />
        
        ${svgElements.join('\n')}
      </svg>
    `;

    container.innerHTML = svgHTML;

    // Attach hover and tap interactivity to dots
    this.setupInteractivity(container);
  }

  /**
   * Set up hover and touch tooltips
   */
  static setupInteractivity(container) {
    const dots = container.querySelectorAll('.graph-dot');
    const tooltip = container.querySelector('#graph-tooltip');
    const tooltipBg = container.querySelector('#tooltip-bg');
    const tooltipDate = container.querySelector('#tooltip-date');
    const tooltipBp = container.querySelector('#tooltip-bp');
    const tooltipPulse = container.querySelector('#tooltip-pulse');

    if (!tooltip || dots.length === 0) return;

    dots.forEach(dot => {
      const showTooltip = (e) => {
        const sys = dot.getAttribute('data-sys');
        const dia = dot.getAttribute('data-dia');
        const pulse = dot.getAttribute('data-pulse');
        const typeLabel = dot.getAttribute('data-type') === 'morning' ? '朝' : '夜';
        const date = dot.getAttribute('data-date');
        
        const cx = parseFloat(dot.getAttribute('cx'));
        const cy = parseFloat(dot.getAttribute('cy'));

        tooltipDate.textContent = `${date} (${typeLabel})`;
        tooltipBp.textContent = `血圧: ${sys}/${dia} mmHg`;
        tooltipPulse.textContent = `脈拍: ${pulse} bpm`;

        const boxWidth = 96;
        const boxHeight = 52;
        
        let tooltipX = cx - boxWidth / 2;
        let tooltipY = cy - boxHeight - 8;

        if (tooltipX < 36) tooltipX = 36;
        if (tooltipX + boxWidth > 710) tooltipX = 710 - boxWidth;
        if (tooltipY < 5) tooltipY = cy + 8;

        tooltip.setAttribute('transform', `translate(${tooltipX}, ${tooltipY})`);
        tooltipBg.setAttribute('width', String(boxWidth));
        tooltip.setAttribute('opacity', '1');
      };

      const hideTooltip = () => {
        tooltip.setAttribute('opacity', '0');
      };

      dot.addEventListener('mouseenter', showTooltip);
      dot.addEventListener('mouseleave', hideTooltip);
      dot.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        showTooltip(e);
      }, { passive: true });
      dot.addEventListener('touchend', () => {
        setTimeout(hideTooltip, 2000);
      });
    });
  }

  /**
   * Setup gestures: Pinch-to-Zoom, Pan-to-Scroll, and Swipe Month Navigation
   * @param {HTMLElement} container - Graph wrapper container
   * @param {Function} onSwipeMonth - Callback (direction: -1 | 1) for prev/next month
   * @param {Function} onZoomChange - Callback (isZoomed: boolean)
   */
  static setupGestures(container, onSwipeMonth, onZoomChange) {
    if (!container) return;

    let scale = 1.0;
    let panX = 0;
    const minScale = 1.0;
    const maxScale = 3.5;

    let isPinching = false;
    let isPanning = false;
    let initialPinchDist = 0;
    let initialPinchScale = 1.0;
    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchX = 0;

    const getSvg = () => container.querySelector('svg#chart-svg');

    const updateViewBox = () => {
      const svg = getSvg();
      if (!svg) return;

      const baseWidth = parseFloat(svg.getAttribute('data-width')) || 560;
      const baseHeight = parseFloat(svg.getAttribute('data-height')) || 230;

      const visibleWidth = baseWidth / scale;
      const maxPanX = baseWidth - visibleWidth;

      if (panX < 0) panX = 0;
      if (panX > maxPanX) panX = maxPanX;

      svg.setAttribute('viewBox', `${panX} 0 ${visibleWidth} ${baseHeight}`);

      if (onZoomChange) {
        onZoomChange(scale > 1.08);
      }
    };

    // Reset Zoom Method attached to container
    container.resetZoom = () => {
      scale = 1.0;
      panX = 0;
      updateViewBox();
    };

    // --- Touch Event Handlers ---
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // Pinch start
        isPinching = true;
        isPanning = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchScale = scale;
      } else if (e.touches.length === 1) {
        // Single touch
        isPinching = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        lastTouchX = e.touches[0].clientX;
        isPanning = scale > 1.08;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        // Pinching
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        if (initialPinchDist > 0) {
          const factor = currentDist / initialPinchDist;
          scale = Math.min(maxScale, Math.max(minScale, initialPinchScale * factor));
          updateViewBox();
        }
      } else if (isPanning && e.touches.length === 1 && scale > 1.08) {
        // Pan scroll while zoomed
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - lastTouchX;
        lastTouchX = currentX;

        const svg = getSvg();
        if (svg) {
          const baseWidth = parseFloat(svg.getAttribute('data-width')) || 560;
          const containerWidth = container.clientWidth || baseWidth;
          const ratio = (baseWidth / scale) / containerWidth;
          panX -= deltaX * ratio;
          updateViewBox();
        }
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
        if (scale < 1.08) {
          scale = 1.0;
          panX = 0;
          updateViewBox();
        }
      }
      isPanning = false;
    }, { passive: true });

    // --- Mouse Wheel & Drag for Desktop testing ---
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      scale = Math.min(maxScale, Math.max(minScale, scale * zoomFactor));
      if (scale <= 1.05) {
        scale = 1.0;
        panX = 0;
      }
      updateViewBox();
    }, { passive: false });

    let isMouseDragging = false;
    let mouseStartX = 0;

    container.addEventListener('mousedown', (e) => {
      if (scale > 1.08) {
        isMouseDragging = true;
        mouseStartX = e.clientX;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDragging && scale > 1.08) {
        const deltaX = e.clientX - mouseStartX;
        mouseStartX = e.clientX;

        const svg = getSvg();
        if (svg) {
          const baseWidth = parseFloat(svg.getAttribute('data-width')) || 560;
          const containerWidth = container.clientWidth || baseWidth;
          const ratio = (baseWidth / scale) / containerWidth;
          panX -= deltaX * ratio;
          updateViewBox();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDragging = false;
    });
  }
}
