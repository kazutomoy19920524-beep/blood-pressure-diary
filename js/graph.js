/**
 * SVG Custom Graph for Blood Pressure Diary
 * Generates lightweight, responsive, and beautiful SVG charts without external dependencies.
 */
class BPGraph {
  /**
   * Render blood pressure graph inside the container
   * @param {HTMLElement} container - The container element to insert SVG into
   * @param {Array} records - List of records to display
   * @param {String} mode - Filter mode: 'all' | 'morning' | 'evening'
   * @param {Number} days - Range of days: 7 | 30
   */
  static render(container, records, mode = 'all', days = 7) {
    if (!container) return;

    // Clear previous contents
    container.innerHTML = '';

    // Filter records by date range
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days + 1);
    cutoffDate.setHours(0, 0, 0, 0);

    const filtered = records.filter(r => new Date(r.timestamp) >= cutoffDate);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
          <p style="font-size: 0.85rem; margin-top: 8px;">選択された期間のデータがありません。</p>
        </div>
      `;
      return;
    }

    // Generate date map for x-axis
    const dateLabels = [];
    const dateKeys = []; // 'YYYY-MM-DD'
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      
      dateKeys.push(`${year}-${month}-${date}`);
      // Label style: '7/18' or '18日'
      dateLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }

    // Graph Dimensions (viewBox coordinate system)
    const svgWidth = 500;
    const svgHeight = 220;
    const paddingLeft = 36;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 25;

    const graphWidth = svgWidth - paddingLeft - paddingRight;
    const graphHeight = svgHeight - paddingTop - paddingBottom;

    // Y-Axis Range configuration
    // Default blood pressure range: 50 to 180 mmHg
    let minY = 50;
    let maxY = 180;

    // Adjust scale dynamically if there are extreme values
    filtered.forEach(r => {
      const sys = Number(r.sys);
      const dia = Number(r.dia);
      if (sys > maxY) maxY = sys + 10;
      if (dia < minY) minY = Math.max(30, dia - 10);
    });

    // Make Y axis ticks nice numbers (multiples of 20 or 10)
    minY = Math.floor(minY / 10) * 10;
    maxY = Math.ceil(maxY / 10) * 10;
    const yRange = maxY - minY;

    // Conversion helper from raw value to Y coordinate
    const getY = (val) => {
      const percentage = (val - minY) / yRange;
      return svgHeight - paddingBottom - (percentage * graphHeight);
    };

    // Conversion helper for X coordinate
    // For 'all' mode, each date has 2 slots (morning: left, evening: right)
    const getX = (dateIndex, type = 'morning') => {
      const sectionWidth = graphWidth / (days - 1 || 1);
      const baseX = paddingLeft + (dateIndex * sectionWidth);
      
      if (mode === 'all') {
        const offset = sectionWidth * 0.18; // Offset morning/evening
        return type === 'morning' ? baseX - offset : baseX + offset;
      }
      return baseX;
    };

    // SVG elements array
    const svgElements = [];

    // --- 1. Background Zones (JSH Guidelines) ---
    // High BP line / zone: >= 135 mmHg (Systolic) or >= 85 mmHg (Diastolic)
    // Normal BP line / zone: < 115 mmHg (Systolic) and < 75 mmHg (Diastolic)
    // We draw subtle background zones to guide the user
    const highY_sys = getY(135);
    const elevatedY_sys = getY(115);
    const topY = getY(maxY);
    const bottomY = getY(minY);

    svgElements.push(`
      <!-- JSH Guideline Background Zones -->
      <!-- High BP Zone (Above 135) -->
      <rect x="${paddingLeft}" y="${topY}" width="${graphWidth}" height="${Math.max(0, bottomY - topY)}" fill="url(#bp-zone-gradient)" opacity="0.12" />
      <!-- Target Normal Systolic Line (135) -->
      <line x1="${paddingLeft}" y1="${highY_sys}" x2="${svgWidth - paddingRight}" y2="${highY_sys}" stroke="var(--color-danger)" stroke-width="1" stroke-dasharray="3,3" opacity="0.5" />
      <!-- Target Normal Diastolic Line (85) -->
      <line x1="${paddingLeft}" y1="${getY(85)}" x2="${svgWidth - paddingRight}" y2="${getY(85)}" stroke="var(--color-danger)" stroke-width="1" stroke-dasharray="3,3" opacity="0.3" />
    `);

    // --- 2. Grid lines & Y Axis Labels ---
    // Generate grid lines every 20 or 30 mmHg
    const tickInterval = yRange > 120 ? 30 : 20;
    const startTick = Math.ceil(minY / tickInterval) * tickInterval;
    
    for (let yVal = startTick; yVal <= maxY; yVal += tickInterval) {
      const yPos = getY(yVal);
      svgElements.push(`
        <line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="var(--border-color)" stroke-width="0.8" />
        <text x="${paddingLeft - 8}" y="${yPos + 4}" fill="var(--text-muted)" font-size="8" font-weight="600" text-anchor="end">${yVal}</text>
      `);
    }

    // --- 3. X Axis Labels ---
    // Label step: if 30 days, label every 5 days. For 7 days, label every day.
    const labelStep = days === 30 ? 5 : 1;
    dateKeys.forEach((key, idx) => {
      if (idx % labelStep === 0) {
        const xPos = getX(idx, 'morning'); // centered
        svgElements.push(`
          <line x1="${xPos}" y1="${svgHeight - paddingBottom}" x2="${xPos}" y2="${svgHeight - paddingBottom + 4}" stroke="var(--border-color)" stroke-width="1" />
          <text x="${xPos}" y="${svgHeight - paddingBottom + 14}" fill="var(--text-muted)" font-size="8" font-weight="600" text-anchor="middle">${dateLabels[idx]}</text>
        `);
      }
    });

    // --- 4. Organize Data Points & Connect Lines ---
    // Group records by date key for drawing
    const recordsByDate = {};
    filtered.forEach(r => {
      const dateStr = r.timestamp.split('T')[0];
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = {};
      }
      recordsByDate[dateStr][r.type] = r;
    });

    // We'll build paths for:
    // - Morning Systolic (blue line)
    // - Morning Diastolic (blue line)
    // - Evening Systolic (red line)
    // - Evening Diastolic (red line)
    const paths = {
      morningSys: [],
      morningDia: [],
      eveningSys: [],
      eveningDia: []
    };

    const points = []; // Array to store coordinates for tooltip interactions

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

    // Render connection lines (SYS & DIA polylines)
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
      svgElements.push(drawPolyline(paths.morningDia, 'var(--secondary)', 1.5, 'blue-glow'));
    }
    if (mode === 'all' || mode === 'evening') {
      svgElements.push(drawPolyline(paths.eveningSys, 'var(--primary)', 2, 'red-glow'));
      svgElements.push(drawPolyline(paths.eveningDia, 'var(--primary)', 1.5, 'red-glow'));
    }

    // --- 5. Render Vertical Bars & Data Dots ---
    points.forEach(pt => {
      const color = pt.type === 'morning' ? 'var(--secondary)' : 'var(--primary)';
      const isHigh = pt.record.sys >= 135 || pt.record.dia >= 85;
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

    // --- 6. Tooltip Box (Hidden by default, positioned via Javascript) ---
    svgElements.push(`
      <g id="graph-tooltip" opacity="0" pointer-events="none" style="transition: opacity 0.15s ease;">
        <rect id="tooltip-bg" x="0" y="0" width="90" height="52" rx="8" fill="var(--bg-card)" stroke="var(--border-color)" stroke-width="1" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));" />
        <text id="tooltip-date" x="8" y="16" fill="var(--text-muted)" font-size="8.5" font-weight="600"></text>
        <text id="tooltip-bp" x="8" y="30" fill="var(--text-main)" font-size="10" font-weight="700"></text>
        <text id="tooltip-pulse" x="8" y="43" fill="var(--text-muted)" font-size="8.5" font-weight="500"></text>
      </g>
    `);

    // Complete SVG structure
    const svgHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" style="overflow: visible;">
        <defs>
          <!-- Neon glow effects for line lines -->
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
          <!-- BP Zone Gradients -->
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

    // Attach interactivity to graph dots
    this.setupInteractivity(container);
  }

  /**
   * Set up hover tooltip logic
   * @param {HTMLElement} container - The SVG container element
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

        // Update content
        tooltipDate.textContent = `${date} (${typeLabel})`;
        tooltipBp.textContent = `血圧: ${sys}/${dia} mmHg`;
        tooltipPulse.textContent = `脈拍: ${pulse} bpm`;

        // Measure content to fit box (roughly based on text lengths)
        const boxWidth = 92;
        const boxHeight = 52;
        
        // Position tooltip (try to center above point, prevent overflow)
        let tooltipX = cx - boxWidth / 2;
        let tooltipY = cy - boxHeight - 8;

        if (tooltipX < 36) tooltipX = 36; // Left boundary
        if (tooltipX + boxWidth > 490) tooltipX = 490 - boxWidth; // Right boundary
        if (tooltipY < 5) tooltipY = cy + 8; // Flip to bottom if it overflows top

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
        e.preventDefault();
        showTooltip(e);
      });
      dot.addEventListener('touchend', hideTooltip);
    });
  }
}
