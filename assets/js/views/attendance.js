// views/attendance.js
let classesCache = [];
let currentPerm = 'full';
let attendanceRows = [];
let attendanceDate = '';
let attendanceClassId = '';
let attendanceSearch = '';
let attendancePage = 1;
const PAGE_SIZE = 12;

export async function render(el, perm = 'full') {
  currentPerm = perm;
  classesCache = await apiFetch(`${API}/classes.php?action=list`);
  const today = new Date().toISOString().split('T')[0];
  attendanceDate = today;
  attendanceClassId = '';
  attendanceSearch = '';
  attendancePage = 1;
  drawFilters(el);
}

function drawFilters(el) {
  const canEdit = currentPerm === 'full';
  const classOpts = classesCache.map(c => `<option value="${c.class_id}" ${String(attendanceClassId)===String(c.class_id)?'selected':''}>${c.class_name}</option>`).join('');
  el.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">ການເຂົ້າຮຽນ</h2>
      ${!canEdit ? `<span class="badge badge-blue"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>` : ''}
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="margin:0;min-width:160px">
          <label class="form-label">ວັນທີ່</label>
          <input class="form-control" type="date" id="att-date" value="${attendanceDate}">
        </div>
        <div class="form-group" style="margin:0;min-width:210px;flex:1">
          <label class="form-label">ຫ້ອງຮຽນ</label>
          <select class="form-control" id="att-class"><option value="">-- ທຸກຫ້ອງ --</option>${classOpts}</select>
        </div>
        <div class="form-group" style="margin:0;min-width:220px;flex:1">
          <label class="form-label">ຄົ້ນຫານັກຮຽນ</label>
          <input class="form-control" id="att-search" placeholder="ຊື່ ຫຼື ລະຫັດ..." value="${escapeHtml(attendanceSearch)}">
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="loadAttendance()"><i class="fas fa-search"></i> ໂຫຼດ</button>
          ${canEdit ? `<button class="btn btn-secondary" onclick="markAllPresent()"><i class="fas fa-check-double"></i> ເລືອກມາຮຽນທັງໝົດ</button>` : ''}
          ${canEdit ? `<button class="btn btn-secondary" onclick="saveAllAttendance()"><i class="fas fa-save"></i> ບັນທຶກທັງໝົດ</button>` : ''}
          <button class="btn btn-secondary" onclick="exportAttendanceCsv()"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
      </div>
    </div>
    <div id="att-list"></div>`;

  const s = document.getElementById('att-search');
  if (s) {
    s.addEventListener('input', (e) => {
      attendanceSearch = (e.target.value || '').toLowerCase();
      attendancePage = 1;
      renderAttendanceTable();
    });
  }

  loadAttendance();
}

window.loadAttendance = async function () {
  attendanceDate = document.getElementById('att-date').value;
  attendanceClassId = document.getElementById('att-class').value;
  const el = document.getElementById('att-list');
  el.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div></div>';

  const studentsUrl = attendanceClassId
    ? `${API}/students.php?action=list&class_id=${attendanceClassId}`
    : `${API}/students.php?action=list`;
  const [students, existing] = await Promise.all([
    apiFetch(studentsUrl),
    apiFetch(`${API}/attendance.php?action=list&date=${attendanceDate}&class_id=${attendanceClassId}`)
  ]);

  const attMap = {};
  existing.forEach(a => attMap[a.student_id] = a.status);

  attendanceRows = students.map(s => ({
    ...s,
    status: attMap[s.student_id] || '',
  }));
  attendancePage = 1;
  renderAttendanceTable();
};

function renderAttendanceTable() {
  const el = document.getElementById('att-list');
  const rows = filteredAttendanceRows();
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (attendancePage > totalPages) attendancePage = totalPages;
  const start = (attendancePage - 1) * PAGE_SIZE;
  const paged = rows.slice(start, start + PAGE_SIZE);
  const stats = summarize(rows);
  const canEdit = currentPerm === 'full';

  if (!attendanceRows.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>ບໍ່ພົບນັກຮຽນ</h3></div>';
    return;
  }

  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:12px;">
      <div class="stat-card"><div class="stat-info"><div class="stat-value">${stats.total}</div><div class="stat-label">ນັກຮຽນທັງໝົດ</div></div></div>
      <div class="stat-card"><div class="stat-info"><div class="stat-value" style="color:#15803d">${stats.present}</div><div class="stat-label">ມາຮຽນ</div></div></div>
      <div class="stat-card"><div class="stat-info"><div class="stat-value" style="color:#b91c1c">${stats.absent}</div><div class="stat-label">ຂາດຮຽນ</div></div></div>
      <div class="stat-card"><div class="stat-info"><div class="stat-value" style="color:#1d4ed8">${stats.sick}</div><div class="stat-label">ປ່ວຍ</div></div></div>
    </div>
    <div class="card"><div class="table-responsive"><table>
      <thead><tr>
        <th>ນັກຮຽນ</th><th>ຫ້ອງ</th>
        <th style="cursor:${canEdit?'pointer':'default'}" ${canEdit?'onclick="markAllPresent()"':''}><span style="color:var(--accent-green)">✅ ມາຮຽນ</span></th>
        <th><span style="color:var(--accent-red)">❌ ຂາດ</span></th>
        <th><span style="color:var(--accent-orange)">🕐 ມາຊ້າ</span></th>
        <th><span style="color:var(--accent-blue)">🏥 ປ່ວຍ</span></th>
      </tr></thead>
      <tbody>
      ${paged.map(s => `<tr data-sid="${s.student_id}">
        <td><div class="student-cell">
          <div class="student-avatar ${s.gender==='ຊາຍ'?'boy':''}">${(s.full_name_lao||'?')[0]}</div>
          <div><div class="student-name">${s.full_name_lao}</div><div class="student-code">${s.student_code}</div></div>
        </div></td>
        <td>${s.class_name||'-'}</td>
        ${['ມາຮຽນ','ຂາດຮຽນ','ມາຊ້າ','ປ່ວຍ'].map(v => `
          <td style="text-align:center">
            <button class="att-btn ${s.status===v?`selected-${attKey(v)}`:''}"
              onclick="${canEdit ? `setAttendance(${s.student_id},'${v}')` : 'void(0)'}"
              data-val="${v}" ${!canEdit?'disabled':''}>${attIcon(v)}</button>
          </td>`).join('')}
      </tr>`).join('')}
      </tbody>
    </table></div></div>
    ${renderPager(totalPages)}`;
}

window.setAttendance = function(studentId, val) {
  const row = attendanceRows.find(r => String(r.student_id) === String(studentId));
  if (!row) return;
  row.status = val;
  renderAttendanceTable();
};

window.markAllPresent = function() {
  if (currentPerm !== 'full') return;
  const rows = filteredAttendanceRows();
  const ids = new Set(rows.map(r => String(r.student_id)));
  attendanceRows.forEach(r => {
    if (ids.has(String(r.student_id))) r.status = 'ມາຮຽນ';
  });
  renderAttendanceTable();
};

window.saveAllAttendance = async function() {
  const rows = filteredAttendanceRows();
  if (!rows.length) { toast('ບໍ່ມີໃຜໃຫ້ບັນທຶກ','error'); return; }
  let saved = 0;
  for (const row of rows) {
    if (!row.status) continue;
    await apiPost(`${API}/attendance.php?action=save`, {
      student_id: row.student_id,
      att_date: attendanceDate,
      status: row.status,
      notes: '',
    });
    saved++;
  }
  toast(`ບັນທຶກ ${saved} ລາຍການສຳເລັດ`);
};

window.exportAttendanceCsv = function() {
  const rows = filteredAttendanceRows();
  const head = ['Date','Student Code','Student Name','Class','Status'];
  const lines = [head.join(',')];
  for (const r of rows) {
    lines.push([
      attendanceDate,
      csvCell(r.student_code),
      csvCell(r.full_name_lao),
      csvCell(r.class_name || ''),
      csvCell(r.status || ''),
    ].join(','));
  }
  const blob = new Blob(["\ufeff" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `attendance_${attendanceDate}_${attendanceClassId || 'all'}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};

window.attGotoPage = function(p) {
  attendancePage = p;
  renderAttendanceTable();
};

function renderPager(totalPages) {
  if (totalPages <= 1) return '';
  let html = `<div style="display:flex;justify-content:center;gap:6px;margin-top:12px;flex-wrap:wrap;">`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<button class="btn ${p===attendancePage?'btn-primary':'btn-secondary'} btn-sm" onclick="attGotoPage(${p})">${p}</button>`;
  }
  html += `</div>`;
  return html;
}

function filteredAttendanceRows() {
  return attendanceRows.filter(r => {
    const q = attendanceSearch.trim();
    if (!q) return true;
    return (r.full_name_lao || '').toLowerCase().includes(q) || (r.student_code || '').toLowerCase().includes(q);
  });
}

function summarize(rows) {
  const s = { total: rows.length, present: 0, absent: 0, late: 0, sick: 0 };
  for (const r of rows) {
    if (r.status === 'ມາຮຽນ') s.present++;
    else if (r.status === 'ຂາດຮຽນ') s.absent++;
    else if (r.status === 'ມາຊ້າ') s.late++;
    else if (r.status === 'ປ່ວຍ') s.sick++;
  }
  return s;
}

function csvCell(v) {
  const s = String(v || '').replace(/"/g, '""');
  return `"${s}"`;
}

function escapeHtml(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function attKey(v) {
  const m = {'ມາຮຽນ':'present','ຂາດຮຽນ':'absent','ມາຊ້າ':'late','ປ່ວຍ':'sick'};
  return m[v] || 'present';
}

function attIcon(v) {
  const m = {'ມາຮຽນ':'✅','ຂາດຮຽນ':'❌','ມາຊ້າ':'🕐','ປ່ວຍ':'🏥'};
  return m[v] || '•';
}
