// views/attendance_report.js - Attendance Report Page
let attendanceReportData = [];
let reportDate = new Date().toISOString().split('T')[0];
let reportClassFilter = 'all';

export async function render(el, perm = 'full') {
  const canEdit = perm === 'full';
  await loadAttendanceReport();
  drawReportPage(el, canEdit);
}

async function loadAttendanceReport() {
  try {
    attendanceReportData = await apiFetch(`${API}/attendance.php?action=list&date=${reportDate}`);
  } catch (e) {
    console.error('Failed to load attendance report:', e);
    attendanceReportData = [];
  }
}

function drawReportPage(el, canEdit) {
  const classes = [...new Set(attendanceReportData.map(a => a.class_name).filter(Boolean))];
  const filtered = filterAttendanceReport(attendanceReportData, reportClassFilter);
  
  // Count by status
  const stats = {
    present: filtered.filter(a => a.status === 'ມາຮຽນ').length,
    absent: filtered.filter(a => a.status === 'ຂາດຮຽນ').length,
    late: filtered.filter(a => a.status === 'ມາຊ້າ').length,
    sick: filtered.filter(a => a.status === 'ປ່ວຍ').length,
    total: filtered.length
  };

  el.innerHTML = `
    <div class="page-shell fade-up" style="max-width: 1400px; margin: 0 auto;">
      <!-- Page Header with Icon -->
      <div class="page-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <span style="font-size: 32px;">📋</span>
        <div>
          <h2 class="page-title" style="margin: 0; font-size: 28px; font-weight: 700;">ລາຍງານການເຂົ້າຮຽນ</h2>
          <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 13px;">ວັນທີ: <strong>${reportDate}</strong></p>
        </div>
      </div>

      <!-- Controls Card -->
      <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
        <div class="card-body" style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center; padding: 18px 20px;">
          <div style="display: flex; gap: 8px; align-items: center; flex: 1; min-width: 220px;">
            <span style="font-size: 18px;">📅</span>
            <div style="display: flex; flex-direction: column;">
              <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">ເລືອກວັນທີ</label>
              <input type="date" id="report-date" value="${reportDate}" style="padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; background: white; cursor: pointer;" onchange="updateReportDate(this.value)">
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; flex: 1; min-width: 220px;">
            <span style="font-size: 18px;">🏫</span>
            <div style="display: flex; flex-direction: column;">
              <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">ເລືອກຫ້ອງ</label>
              <select id="report-class" style="padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; background: white; cursor: pointer;" onchange="updateReportClass(this.value)">
                <option value="all">ທັງໝົດ (${attendanceReportData.length})</option>
                ${classes.map(c => `<option value="${c}" ${reportClassFilter === c ? 'selected' : ''}>${c} (${attendanceReportData.filter(a => a.class_name === c).length})</option>`).join('')}
              </select>
            </div>
          </div>

          <button class="btn btn-primary btn-sm" style="margin-top: 24px;" onclick="exportAttendanceReport()">
            <i class="fas fa-download"></i> ດາວໂຫຼດ CSV
          </button>
        </div>
      </div>

      <!-- Statistics Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 24px;">
        <!-- Present Card -->
        <div class="card" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: none; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center;">
          <span style="font-size: 36px; margin-bottom: 8px;">✅</span>
          <div style="font-weight: 600; color: #047857; font-size: 28px;">${stats.present}</div>
          <div style="font-size: 12px; color: #065f46; font-weight: 500; margin-top: 4px;">ມາຮຽນ</div>
        </div>

        <!-- Absent Card -->
        <div class="card" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: none; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center;">
          <span style="font-size: 36px; margin-bottom: 8px;">❌</span>
          <div style="font-weight: 600; color: #dc2626; font-size: 28px;">${stats.absent}</div>
          <div style="font-size: 12px; color: #991b1b; font-weight: 500; margin-top: 4px;">ຂາດຮຽນ</div>
        </div>

        <!-- Late Card -->
        <div class="card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: none; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center;">
          <span style="font-size: 36px; margin-bottom: 8px;">🕐</span>
          <div style="font-weight: 600; color: #d97706; font-size: 28px;">${stats.late}</div>
          <div style="font-size: 12px; color: #92400e; font-weight: 500; margin-top: 4px;">ມາຊ້າ</div>
        </div>

        <!-- Sick Card -->
        <div class="card" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: none; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center;">
          <span style="font-size: 36px; margin-bottom: 8px;">🏥</span>
          <div style="font-weight: 600; color: #2563eb; font-size: 28px;">${stats.sick}</div>
          <div style="font-size: 12px; color: #1e40af; font-weight: 500; margin-top: 4px;">ປ່ວຍ</div>
        </div>
      </div>

      <!-- Attendance Table -->
      <div class="card" style="overflow: hidden;">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <span>📝</span> ລາຍລະອຽດການເຂົ້າຮຽນ (${filtered.length} ຄົນ)
          </h3>
        </div>
        <div class="table-responsive">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 2px solid var(--border);">
                <th style="padding: 14px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ລະຫັດ</th>
                <th style="padding: 14px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ຊື່ນັກຮຽນ</th>
                <th style="padding: 14px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ຫ້ອງ</th>
                <th style="padding: 14px; text-align: center; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody id="attendance-report-tbody">
              ${renderAttendanceRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  window.updateReportDate = updateReportDateHandler;
  window.updateReportClass = updateReportClassHandler;
  window.exportAttendanceReport = exportReport;
}

function renderAttendanceRows(data) {
  if (!data.length) {
    return `<tr><td colspan="4" style="padding: 40px; text-align: center; color: var(--text-muted);"><div style="font-size: 32px; margin-bottom: 8px;">📭</div><div>ບໍ່ພົບຂໍ້ມູນການເຂົ້າຮຽນ</div></td></tr>`;
  }

  const statusConfig = {
    'ມາຮຽນ': { emoji: '✅', color: '#047857', bg: '#d1fae5' },
    'ຂາດຮຽນ': { emoji: '❌', color: '#dc2626', bg: '#fee2e2' },
    'ມາຊ້າ': { emoji: '🕐', color: '#d97706', bg: '#fef3c7' },
    'ປ່ວຍ': { emoji: '🏥', color: '#2563eb', bg: '#dbeafe' }
  };

  return data.map((a, idx) => {
    const config = statusConfig[a.status] || { emoji: '❓', color: '#6b7280', bg: '#f3f4f6' };
    return `<tr style="border-bottom: 1px solid var(--border); transition: background 0.2s ease; ${idx % 2 === 0 ? 'background: #f9fafb;' : ''}">
      <td style="padding: 14px; font-family: 'Courier New', monospace; font-size: 12px; font-weight: 500; color: var(--text-secondary);">${a.student_code || '-'}</td>
      <td style="padding: 14px; font-weight: 500; color: var(--text-primary);">${a.full_name_lao || '-'}</td>
      <td style="padding: 14px; font-size: 13px; color: var(--text-secondary);">
        <span style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1e40af; padding: 4px 10px; border-radius: 12px; font-weight: 500; font-size: 12px;">
          🏫 ${a.class_name || '-'}
        </span>
      </td>
      <td style="padding: 14px; text-align: center;">
        <span style="background: ${config.bg}; color: ${config.color}; padding: 8px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
          ${config.emoji} ${a.status}
        </span>
      </td>
    </tr>`;
  }).join('');
}

function filterAttendanceReport(data, classFilter) {
  if (classFilter === 'all') return data;
  return data.filter(a => a.class_name === classFilter);
}

async function updateReportDateHandler(date) {
  reportDate = date;
  await loadAttendanceReport();
  const el = document.getElementById('page-content');
  if (el) drawReportPage(el, true);
}

async function updateReportClassHandler(classId) {
  reportClassFilter = classId;
  const el = document.getElementById('page-content');
  if (el) drawReportPage(el, true);
}

function exportReport() {
  const filtered = filterAttendanceReport(attendanceReportData, reportClassFilter);
  let csv = 'ລະຫັດ,ຊື່ນັກຮຽນ,ຫ້ອງ,ສະຖານະ\n';
  filtered.forEach(a => {
    csv += `${a.student_code},${a.full_name_lao},${a.class_name},${a.status}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', `ລາຍງານການເຂົ້າຮຽນ-${reportDate}.csv`);
  link.click();
}
