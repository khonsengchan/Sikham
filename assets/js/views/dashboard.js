// views/dashboard.js
let dashboardEvents = [];
let miniMonth = new Date().getMonth();
let miniYear = new Date().getFullYear();

const LAO_MONTHS = ['ມັງກອນ','ກຸມພາ','ມີນາ','ເມສາ','ພຶດສະພາ','ມິຖຸນາ','ກໍລະກົດ','ສິງຫາ','ກັນຍາ','ຕຸລາ','ພະຈິກ','ທັນວາ'];

function escHtml(v='') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function render(el) {
  el.innerHTML = `
    <div class="dashboard-shell fade-up dashboard-shell-modern">
      <!-- Top Row: Statistics Cards -->
      <div class="stats-grid stats-grid-inline">
        <div class="stat-card stat-card-inline tone-school">
          <div class="stat-card-accent"></div>
          <div class="stat-inline-icon"><i class="fas fa-school"></i></div>
          <div class="stat-inline-info">
            <div class="stat-label">ນັກຮຽນທັງໝົດ</div>
            <div class="stat-value" id="dash-students-total">0</div>
          </div>
        </div>
        <div class="stat-card stat-card-inline tone-student" style="cursor:pointer;" onclick="navigateTo('students')">
          <div class="stat-card-accent"></div>
          <div class="stat-inline-icon"><i class="fas fa-user-check"></i></div>
          <div class="stat-inline-info">
            <div class="stat-label">ມາຮຽນວັນນີ້</div>
            <div class="stat-value" id="dash-present-total">0</div>
          </div>
        </div>
        <div class="stat-card stat-card-inline tone-teacher" style="cursor:pointer;" onclick="navigateTo('staff')">
          <div class="stat-card-accent"></div>
          <div class="stat-inline-icon"><i class="fas fa-chalkboard-teacher"></i></div>
          <div class="stat-inline-info">
            <div class="stat-label">ຄູ ແລະ ພະນັກງານ</div>
            <div class="stat-value" id="dash-staff-total">0</div>
          </div>
        </div>
        <div class="stat-card stat-card-inline tone-parent" style="cursor:pointer;" onclick="navigateTo('finance')">
          <div class="stat-card-accent"></div>
          <div class="stat-inline-icon"><i class="fas fa-money-bill-wave"></i></div>
          <div class="stat-inline-info">
            <div class="stat-label">ລາຍຮັບ (ກີບ)</div>
            <div class="stat-value" id="dash-income-total">0</div>
          </div>
        </div>
      </div>

      <!-- Symmetrical 12-Column Dashboard Grid -->
      <div class="dashboard-grid">
        
        <!-- CARD 1: Attendance Today (span 4) -->
        <div class="card" style="grid-column: span 4;">
          <div class="card-header">
            <span style="font-size:18px">📋</span>
            <h2 class="card-title">ການເຂົ້າຮຽນວັນນີ້</h2>
          </div>
          <div class="card-body">
            <div id="attendance-mini">
              <div class="loading-state" style="padding:20px;"><div class="loading-spinner"></div></div>
            </div>
          </div>
        </div>

        <!-- CARD 2: Yearly Student Chart (span 4) -->
        <div class="card" style="grid-column: span 4;">
          <div class="card-body" style="padding:20px;">
            <div id="yearly-chart-container">
              <div class="loading-state" style="padding:20px;"><div class="loading-spinner"></div></div>
            </div>
          </div>
        </div>

        <!-- CARD 3: Student Proportions by Level (span 4) -->
        <div class="card" style="grid-column: span 4;">
          <div class="card-header">
            <span style="font-size:18px">📊</span>
            <h2 class="card-title">ສັດສ່ວນນັກຮຽນຕາມລະດັບ</h2>
          </div>
          <div class="card-body" style="padding:20px 24px;">
            <div class="level-dist-wrap" id="level-chart">
              <div class="loading-state" style="padding:20px;"><div class="loading-spinner"></div></div>
            </div>
          </div>
        </div>

        <!-- CARD 4: Activities Calendar (span 7) -->
        <div class="card" style="grid-column: span 7;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px">📅</span>
              <h2 class="card-title">ປະຕິທິນກິດຈະກຳ <span id="mini-cal-month-title" style="color:var(--accent-blue); font-weight:700; margin-left:4px;"></span></h2>
            </div>
            <div class="mini-cal-navs">
              <button class="mini-cal-btn" onclick="navMiniCal('prev')" title="ເດືອນກ່ອນໜ້າ"><i class="fas fa-chevron-left"></i></button>
              <button class="mini-cal-btn" onclick="navMiniCal('next')" title="ເດືອນຖັດໄປ"><i class="fas fa-chevron-right"></i></button>
            </div>
          </div>
          <div class="card-body" style="padding:20px;">
            <div id="calendar-mini-container">
              <div class="loading-state" style="padding:20px;"><div class="loading-spinner"></div></div>
            </div>
          </div>
        </div>

        <!-- CARD 5: Latest Financial transactions (span 5) -->
        <div class="card" style="grid-column: span 5;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px">💳</span>
              <h2 class="card-title">ລາຍການການເງິນລ່າສຸດ</h2>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('finance')"><i class="fas fa-arrow-right"></i> ເບິ່ງທັງໝົດ</button>
          </div>
          <div class="card-body" style="padding:0">
            <div id="finance-preview"><p class="text-muted" style="padding:20px;text-align:center;">ກຳລັງໂຫຼດ...</p></div>
          </div>
        </div>

      </div>
    </div>`;

  hydrateDashboard(el);
}

async function hydrateDashboard(el) {
  const [students, staff, attSum, finSum, txns, yearly, events] = await Promise.all([
    safeApiFetch(`${API}/students.php?action=stats`, { total: 0, by_level: [] }),
    safeApiFetch(`${API}/staff.php?action=count`, { count: 0 }),
    safeApiFetch(`${API}/attendance.php?action=today_summary`, { total: 0, present: 0, absent: 0, late: 0, sick: 0 }),
    safeApiFetch(`${API}/finance.php?action=summary`, { income: 0 }),
    safeApiFetch(`${API}/finance.php?action=list`, []),
    safeApiFetch(`${API}/students.php?action=yearly_counts`, []),
    safeApiFetch(`${API}/calendar.php?action=list`, []),
  ]);

  // Stop if user already navigated away.
  if (!el || !el.isConnected) return;

  const st = document.getElementById('dash-students-total');
  const pt = document.getElementById('dash-present-total');
  const sf = document.getElementById('dash-staff-total');
  const ic = document.getElementById('dash-income-total');
  if (st) st.textContent = String(students.total || 0);
  if (pt) pt.textContent = String(attSum.present || 0);
  if (sf) sf.textContent = String(staff.count || 0);
  if (ic) ic.textContent = String(numFmt(finSum.income));

  const attEl = document.getElementById('attendance-mini');
  if (attEl) attEl.innerHTML = renderAttMini(attSum || {});

  const chartContainer = document.getElementById('yearly-chart-container');
  if (chartContainer) {
    chartContainer.innerHTML = renderYearlyChart(yearly || []);
    
    // Add gender breakdown below chart
    const boys = students?.boys || 0;
    const girls = students?.girls || 0;
    const totalGender = boys + girls;
    const pBoy = totalGender ? Math.round((boys/totalGender)*100) : 0;
    const pGirl = totalGender ? Math.round((girls/totalGender)*100) : 0;
    
    chartContainer.innerHTML += `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed var(--border);">
        <div style="display:flex; justify-content:space-between; margin-bottom: 12px; align-items:center;">
          <strong style="color:var(--text-secondary); font-size:13px;"><i class="fas fa-venus-mars"></i> ສັດສ່ວນນັກຮຽນຍິງ-ຊາຍ (ປັດຈຸບັນ)</strong>
        </div>
        <div style="display:flex; height:12px; border-radius:10px; overflow:hidden; background:#e2e8f0; margin-bottom:12px;">
          <div style="width:${pBoy}%; background:linear-gradient(90deg, #60a5fa, #3b82f6);" title="ຊາຍ ${pBoy}%"></div>
          <div style="width:${pGirl}%; background:linear-gradient(90deg, #f472b6, #ec4899);" title="ຍິງ ${pGirl}%"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#3b82f6;box-shadow:0 0 5px rgba(59,130,246,0.5);"></span>
            <span>ຊາຍ: <strong style="color:#1d4ed8; font-size:14px;">${boys}</strong> ຄົນ (${pBoy}%)</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span>(${pGirl}%) <strong style="color:#be185d; font-size:14px;">${girls}</strong> ຄົນ :ຍິງ</span>
            <span style="width:10px;height:10px;border-radius:50%;background:#ec4899;box-shadow:0 0 5px rgba(236,72,153,0.5);"></span>
          </div>
        </div>
      </div>
    `;
  }

  // Update Mini Interactive Calendar
  dashboardEvents = Array.isArray(events) ? events : [];
  miniMonth = new Date().getMonth();
  miniYear = new Date().getFullYear();
  drawMiniCalendar();

  const chartEl = document.getElementById('level-chart');
  if (chartEl) {
    if (students.by_level && students.by_level.length) {
      const total = students.by_level.reduce((s, r) => s + Number(r.cnt || 0), 0);
      
      const segmentsHtml = students.by_level.map((r, idx) => {
        const count = Number(r.cnt || 0);
        const pct = total ? Math.round((count / total) * 100) : 0;
        if (pct === 0) return '';
        return `<div class="level-bar-segment level-color-${idx % 6}" style="width: ${pct}%;" title="${r.level}: ${count} ຄົນ (${pct}%)"></div>`;
      }).join('');

      const legendsHtml = students.by_level.map((r, idx) => {
        const count = Number(r.cnt || 0);
        const pct = total ? Math.round((count / total) * 100) : 0;
        return `
          <div class="level-legend-item" style="cursor:pointer;" onclick="navigateToStudentsByLevel('${r.level}')">
            <span class="level-legend-dot level-color-${idx % 6}"></span>
            <div class="level-legend-text">
              <strong>${r.level}</strong>
              <span class="text-muted">${count} ຄົນ (${pct}%)</span>
            </div>
          </div>`;
      }).join('');

      chartEl.innerHTML = `
        <div class="level-horizontal-container">
          <div class="level-stacked-bar">
            ${segmentsHtml}
          </div>
          <div class="level-legends-grid">
            ${legendsHtml}
          </div>
          <div class="level-dist-footer" style="margin-top: 8px;">
            <span>ລວມທັງໝົດ</span>
            <strong>${total} ຄົນ</strong>
          </div>
        </div>`;
    } else {
      chartEl.innerHTML = '<p class="text-muted" style="text-align:center;padding:16px;">ຍັງບໍ່ມີຂໍ້ມູນ</p>';
    }
  }

  const fp = document.getElementById('finance-preview');
  if (!fp) return;
  if (Array.isArray(txns) && txns.length) {
    fp.innerHTML = `<div class="table-responsive" style="max-height: 320px; overflow-y: auto;">
      <table style="width:100%; border-collapse:collapse;">
        <thead style="position: sticky; top: 0; background: #fff; z-index: 1; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <tr><th>ລາຍການ</th><th>ປະເພດ</th><th>ຈຳນວນ (ກີບ)</th><th>ສະຖານະ</th></tr>
        </thead>
        <tbody>
      ${txns.map(t=>`<tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 10px;">${t.title}</td>
        <td style="padding: 10px;">${t.type==='income'?'<span class="badge badge-green">ລາຍຮັບ</span>':'<span class="badge badge-red">ລາຍຈ່າຍ</span>'}</td>
        <td class="fw-bold" style="padding: 10px;">${numFmt(t.amount)}</td>
        <td style="padding: 10px;">${statusBadge(t.status)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
  } else {
    fp.innerHTML = '<p class="text-muted" style="padding:20px;text-align:center;">ຍັງບໍ່ມີຂໍ້ມູນການເງິນ</p>';
  }
}

async function safeApiFetch(url, fallback) {
  try {
    return await Promise.race([
      apiFetch(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 8000))
    ]);
  } catch (e) {
    console.warn('Dashboard API fallback:', url, e);
    return fallback;
  }
}


function renderAttMini(a) {
  const total = a.total || 0;
  const pct = total ? Math.round((a.present||0)/total*100) : 0;
  return `
    <div class="attendance-ring-wrap">
      <div class="attendance-ring" style="--p:${pct}">
        <div class="attendance-ring-content">
          <div class="attendance-ring-value">${pct}%</div>
          <div class="attendance-ring-label">ອັດຕາມາຮຽນ</div>
        </div>
      </div>
    </div>
    <div class="attendance-mini-grid">
      <div class="attendance-mini-item" style="cursor:pointer;" onclick="navigateTo('attendance_report')">
        <div class="attendance-mini-emoji stat-icon green">✅</div>
        <div class="attendance-mini-text"><strong>${a.present||0}</strong><span>ມາຮຽນ</span></div>
      </div>
      <div class="attendance-mini-item" style="cursor:pointer;" onclick="navigateTo('attendance_report')">
        <div class="attendance-mini-emoji stat-icon red">❌</div>
        <div class="attendance-mini-text"><strong>${a.absent||0}</strong><span>ຂາດຮຽນ</span></div>
      </div>
      <div class="attendance-mini-item" style="cursor:pointer;" onclick="navigateTo('attendance_report')">
        <div class="attendance-mini-emoji stat-icon orange">🕐</div>
        <div class="attendance-mini-text"><strong>${a.late||0}</strong><span>ມາຊ້າ</span></div>
      </div>
      <div class="attendance-mini-item" style="cursor:pointer;" onclick="navigateTo('attendance_report')">
        <div class="attendance-mini-emoji stat-icon blue">🏥</div>
        <div class="attendance-mini-text"><strong>${a.sick||0}</strong><span>ປ່ວຍ</span></div>
      </div>
    </div>`;
}

function renderYearlyChart(yearlyRows) {
  const yearly = Array.isArray(yearlyRows) ? yearlyRows.slice(-5) : [];
  const maxYearly = yearly.length ? Math.max(...yearly.map((r) => Number(r.total || 0)), 1) : 1;
  const yearlyTotal = yearly.reduce((sum, r) => sum + Number(r.total || 0), 0);

  // Get tick values
  const tick3 = maxYearly;
  const tick2 = Math.round(maxYearly * 2 / 3);
  const tick1 = Math.round(maxYearly / 3);
  const tick0 = 0;

  return `
    <div class="yearly-student-head">
      <strong> (ສົມທຽບ)</strong>
      <span>ລວມ <b>${numFmt(yearlyTotal)}</b> ຄົນ</span>
    </div>
    ${yearly.length ? `
      <div class="yearly-chart-wrapper">
        <div class="yearly-y-axis">
          <div class="yearly-y-tick">${numFmt(tick3)}</div>
          <div class="yearly-y-tick">${numFmt(tick2)}</div>
          <div class="yearly-y-tick">${numFmt(tick1)}</div>
          <div class="yearly-y-tick">${numFmt(tick0)}</div>
        </div>
        <div class="yearly-chart-plot">
          ${[0, 1, 2, 3].map((i) => `<span class="yearly-grid-line" style="bottom:${i * 33.33}%"></span>`).join('')}
          <div class="yearly-student-bars">
            ${yearly.map((r, idx) => {
              const value = Number(r.total || 0);
              const h = Math.max(8, Math.round((value / maxYearly) * 100));
              const yearBe = Number(r.year_ad || 0) > 0 ? Number(r.year_ad) + 543 : '-';
              return `
                <div class="yearly-student-col">
                  <div class="yearly-student-tooltip">
                    ປີ AD ${r.year_ad} (ພ.ສ. ${yearBe})<br>
                    ນັກຮຽນ: ${numFmt(value)} ຄົນ
                  </div>
                  <div class="yearly-student-value">${numFmt(value)}</div>
                  <div class="yearly-student-bar yearly-tone-${idx % 4}" style="height:${h}%"></div>
                </div>`;
            }).join('')}
          </div>
        </div>
        <div class="yearly-x-axis">
          ${yearly.map((r) => {
            const yearBe = Number(r.year_ad || 0) > 0 ? Number(r.year_ad) + 543 : '-';
            return `<div class="yearly-x-label">${yearBe}</div>`;
          }).join('')}
        </div>
      </div>` : `<p class="text-muted" style="font-size:12px;margin-top:8px;text-align:center;">ຍັງບໍ່ມີຂໍ້ມູນປະຈຳປີ</p>`}
  `;
}

function drawMiniCalendar() {
  const container = document.getElementById('calendar-mini-container');
  if (!container) return;

  const titleEl = document.getElementById('mini-cal-month-title');
  if (titleEl) {
    titleEl.textContent = `(${LAO_MONTHS[miniMonth]} ${miniYear + 543})`;
  }

  container.innerHTML = buildMiniCalendarHtml(dashboardEvents, miniYear, miniMonth);
}

function buildMiniCalendarHtml(allEvents, y, m) {
  const firstDay = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();
  const today = new Date();

  // Previous month trailing padding
  const prevMonthDays = new Date(y, m, 0).getDate();
  let cellsHtml = '';

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    cellsHtml += `<div class="mini-cal-day other-month">${d}</div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = allEvents.filter(e => e.date === dateStr);
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
    
    // Weekend styling (Sunday is index 0 in Javascript, Saturday is index 6 relative to the grid)
    const dayOfWeek = (firstDay + d - 1) % 7;
    let customStyle = '';
    if (!isToday) {
      if (dayOfWeek === 0) customStyle = 'style="color: var(--accent-red)"';
      else if (dayOfWeek === 6) customStyle = 'style="color: var(--accent-blue)"';
    }

    const dotsHtml = dayEvents.length 
      ? `<div class="mini-cal-dots">
          ${dayEvents.slice(0, 3).map(e => `<span class="mini-cal-dot" style="background:${e.color || '#22c55e'}"></span>`).join('')}
         </div>`
      : '';

    const dayTitle = dayEvents.length 
      ? `title="${dayEvents.map(e => e.title).join('\n')}"`
      : '';

    cellsHtml += `
      <div class="mini-cal-day ${isToday ? 'today' : ''}" ${dayTitle} ${customStyle}>
        <span>${d}</span>
        ${dotsHtml}
      </div>`;
  }

  const totalCells = firstDay + totalDays;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    cellsHtml += `<div class="mini-cal-day other-month">${d}</div>`;
  }

  // Monthly events list (chronological)
  const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}`;
  const monthEvents = allEvents.filter(e => e.date.startsWith(monthPrefix));

  const timelineHtml = monthEvents.length
    ? `<div class="mini-cal-timeline-list">
        ${monthEvents.map(e => `
          <div class="mini-cal-timeline-item">
            <div class="mini-cal-item-bullet" style="background:${e.color || '#22c55e'}"></div>
            <div class="mini-cal-item-details">
              <div class="mini-cal-item-title">${escHtml(e.title)}</div>
              <div class="mini-cal-item-date">${fmtDate(e.date)}</div>
            </div>
          </div>
        `).join('')}
       </div>`
    : '<p class="text-muted" style="font-size:12px;text-align:center;padding:12px 0;">ຍັງບໍ່ມີກິດຈະກຳໃນເດືອນນີ້</p>';

  const weekdaysHtml = [
    `<div style="color:var(--accent-red)">ອາທິດ</div>`,
    `<div>ຈັນ</div>`,
    `<div>ອັງຄານ</div>`,
    `<div>ພຸດ</div>`,
    `<div>ພະຫັດ</div>`,
    `<div>ສຸກ</div>`,
    `<div style="color:var(--accent-blue)">ເສົາ</div>`
  ].join('');

  return `
    <div class="mini-calendar-wrapper" style="display:grid; grid-template-columns: 1.15fr 1fr; gap: 20px;">
      <!-- Left side: Calendar days grid -->
      <div>
        <div class="mini-cal-weekdays">
          ${weekdaysHtml}
        </div>
        <div class="mini-cal-days">
          ${cellsHtml}
        </div>
      </div>
      
      <!-- Right side: Timeline of activities -->
      <div class="mini-cal-timeline" style="margin-top:0; border-top:none; padding-top:0; border-left:1px solid var(--border); padding-left:16px;">
        <div class="mini-cal-timeline-title">
          <i class="fas fa-calendar-alt" style="color:var(--accent-blue)"></i>
          <span>ກິດຈະກຳໃນເດືອນນີ້</span>
        </div>
        ${timelineHtml}
      </div>
    </div>`;
}

window.navMiniCal = function(direction) {
  if (direction === 'prev') {
    miniMonth--;
    if (miniMonth < 0) {
      miniMonth = 11;
      miniYear--;
    }
  } else if (direction === 'next') {
    miniMonth++;
    if (miniMonth > 11) {
      miniMonth = 0;
      miniYear++;
    }
  }
  drawMiniCalendar();
};

function statusBadge(s) {
  const m = {paid:'badge-green ຊຳລະແລ້ວ',pending:'badge-yellow ລໍຖ້າ',overdue:'badge-red ຄ້າງຊຳລະ'};
  const [cls,txt] = (m[s]||'badge-gray '+s).split(' ');
  return `<span class="badge ${cls}">${txt}</span>`;
}

window.navigateToStudentsByLevel = function(level) {
  sessionStorage.setItem('studentFilterLevel', level);
  navigateTo('students');
};
