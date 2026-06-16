// views/schedule.js
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const DAY_LABELS = {
  Monday: 'ວັນຈັນ', Tuesday: 'ວັນອັງຄານ', Wednesday: 'ວັນພຸດ',
  Thursday: 'ວັນພະຫັດ', Friday: 'ວັນສຸກ', Saturday: 'ວັນເສົາ', Sunday: 'ວັນອາທິດ'
};

export async function render(el, perm = 'full') {
  const css = `
    <style>
      .timetable-container {
        overflow-x: auto;
        margin-bottom: 40px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        padding: 24px;
        border: 1px solid #e2e8f0;
      }
      .timetable {
        width: 100%;
        border-collapse: collapse;
        text-align: center;
        min-width: 800px;
        font-family: 'Noto Sans Lao', sans-serif;
      }
      .timetable th, .timetable td {
        border: 1px solid #cbd5e1;
        padding: 12px;
        font-size: 14px;
      }
      .timetable th {
        background: #f8fafc;
        font-weight: 700;
        color: #1e293b;
      }
      .timetable th:first-child {
        background: #f1f5f9;
        width: 100px;
      }
      .timetable-title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 20px;
        color: #0f172a;
        text-align: center;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 10px;
      }
      .empty-cell {
        background: #f1f5f9;
      }
      .subject-cell {
        font-weight: 600;
        color: #334155;
      }
      .subject-cell .teacher {
        font-size: 11px;
        color: #64748b;
        font-weight: normal;
        margin-top: 4px;
      }
      .nav-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
        margin-bottom: 20px;
      }
      .nav-buttons button {
        background: #fff;
        border: 1px solid #cbd5e1;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        color: #475569;
        transition: all 0.2s;
      }
      .nav-buttons button:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        color: #1e293b;
      }
    </style>
  `;

  let [entries, classes, teachers] = await Promise.all([
    apiFetch(`${API}/schedule.php?action=list`),
    apiFetch(`${API}/classes.php?action=list`),
    apiFetch(`${API}/staff.php?action=list`),
  ]);

  if (!Array.isArray(entries)) entries = [];
  if (!Array.isArray(classes)) classes = [];
  if (!Array.isArray(teachers)) teachers = [];

  // Group entries by class_id
  const classEntries = {};
  entries.forEach(e => {
    if (!e.class_id) return;
    if (!classEntries[e.class_id]) classEntries[e.class_id] = [];
    classEntries[e.class_id].push(e);
  });

  const canEdit = perm === 'full';

  let html = `
    ${css}
    <div class="page-shell fade-up">
      <div class="page-header" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
        <div>
          <h2 class="page-title" style="margin:0;font-size:24px;">ຕາລາງຮຽນ (ຈາດຖານຂໍ້ມູນ)</h2>
          <p style="margin:4px 0 0 0;color:var(--text-secondary);font-size:14px;">ຂໍ້ມູນສະແດງອັດຕະໂນມັດຈາກຖານຂໍ້ມູນ</p>
        </div>
        ${canEdit ? `<button class="btn btn-primary" onclick="openScheduleModal()"><i class="fas fa-plus"></i> ເພີ່ມຕາລາງ</button>` : ''}
      </div>
      
      <div class="nav-buttons">
  `;

  // Filter classes that have schedule entries
  const activeClasses = classes.filter(c => classEntries[c.class_id] && classEntries[c.class_id].length > 0);
  
  if (activeClasses.length === 0) {
    html += `</div><div class="empty-state" style="padding:40px 20px; text-align:center;">
      <div class="empty-state-icon">📭</div>
      <h3>ບໍ່ພົບຂໍ້ມູນຕາລາງໃນຖານຂໍ້ມູນ</h3>
      <p>ກະລຸນາເພີ່ມຕາລາງຮຽນເຂົ້າໃນລະບົບກ່ອນ</p>
    </div></div>`;
    el.innerHTML = html;
    setupFunctions(el, entries, classes, teachers);
    return;
  }

  activeClasses.forEach(c => {
    html += `<button onclick="document.getElementById('class-${c.class_id}').scrollIntoView({behavior:'smooth'})">${c.class_name}</button>`;
  });
  html += `</div>`;

  // Build grid for each class
  activeClasses.forEach(c => {
    const items = classEntries[c.class_id];
    
    // Find unique timeslots
    const timeslotsMap = {};
    items.forEach(item => {
      const key = `${item.start_time.substring(0,5)} - ${item.end_time.substring(0,5)}`;
      timeslotsMap[key] = { start: item.start_time, end: item.end_time };
    });
    const timeslots = Object.values(timeslotsMap).sort((a, b) => a.start.localeCompare(b.start));

    // Build the table html
    let tableHtml = `
      <div class="timetable-container" id="class-${c.class_id}">
        <div class="timetable-title">ຕາຕະລາງຮຽນ ${c.class_name}</div>
        <table class="timetable">
          <thead>
            <tr>
              <th>ຈ/ດ</th>
              ${timeslots.map(t => `<th>${t.start.substring(0,5)} - ${t.end.substring(0,5)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    DAYS.forEach(day => {
      tableHtml += `<tr><th>${DAY_LABELS[day]}</th>`;
      timeslots.forEach(t => {
        // Find entry for this day and timeslot
        const entry = items.find(e => e.day_of_week === day && e.start_time === t.start && e.end_time === t.end);
        if (entry) {
            let actions = '';
            if (canEdit) {
                actions = `<div style="margin-top: 8px; display: flex; gap: 4px; justify-content: center;">
                    <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 10px;" onclick="openScheduleModal(${entry.schedule_id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" style="padding: 2px 6px; font-size: 10px;" onclick="deleteSchedule(${entry.schedule_id})"><i class="fas fa-trash"></i></button>
                </div>`;
            }
          tableHtml += `<td class="subject-cell">
            ${entry.subject}
            ${entry.teacher_name ? `<div class="teacher"><i class="fas fa-user-tie"></i> ${entry.teacher_name}</div>` : ''}
            ${entry.room ? `<div class="teacher"><i class="fas fa-door-open"></i> ${entry.room}</div>` : ''}
            ${actions}
          </td>`;
        } else {
          tableHtml += `<td class="empty-cell"></td>`;
        }
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table></div>`;
    html += tableHtml;
  });

  html += `</div>`;
  el.innerHTML = html;
  
  setupFunctions(el, entries, classes, teachers);
}

function setupFunctions(el, entries, classes, teachers) {
    window.openScheduleModal = async (id) => {
        const item = id ? entries.find(x => x.schedule_id == id) || {} : {};
        const classOptions = [{ class_id: '', class_name: '-- ເລືອກຫ້ອງ --' }, ...classes].map(c => `
          <option value="${c.class_id}" ${String(item.class_id) === String(c.class_id) ? 'selected' : ''}>${c.class_name} ${c.level ? '[' + c.level + ']' : ''}</option>
        `).join('');
        const teacherOptions = [{ staff_id: '', full_name_lao: '-- ເລືອກຄູ --' }, ...teachers].map(t => `
          <option value="${t.staff_id}" ${String(item.teacher_id) === String(t.staff_id) ? 'selected' : ''}>${t.full_name_lao || t.full_name_eng || 'ບໍ່ລະບຸ'}</option>
        `).join('');
        const dayOptions = DAYS.map(day => `
          <option value="${day}" ${item.day_of_week === day ? 'selected' : ''}>${DAY_LABELS[day]}</option>
        `).join('');
      
        openModal(`<div class="modal" style="max-width:640px;width:95vw;">
          <div class="modal-header"><h2 class="modal-title">${id ? 'ແກ້ໄຂ' : 'ເພີ່ມ'}ຕາລາງຮຽນ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
          <div class="modal-body">
            <input type="hidden" id="f-sid" value="${item.schedule_id || ''}">
            <div class="form-group"><label class="form-label">ວິຊາ *</label><input class="form-control" id="f-subject" value="${item.subject || ''}" placeholder="ຊື່ວິຊາ"></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">ຫ້ອງ</label><select class="form-control" id="f-class">${classOptions}</select></div>
              <div class="form-group"><label class="form-label">ຄູ</label><select class="form-control" id="f-teacher">${teacherOptions}</select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">ວັນ</label><select class="form-control" id="f-day">${dayOptions}</select></div>
              <div class="form-group"><label class="form-label">ເວລາ ເລີ່ມ</label><input class="form-control" type="time" id="f-start" value="${item.start_time || ''}"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">ເວລາ ສິ້ນສຸບ</label><input class="form-control" type="time" id="f-end" value="${item.end_time || ''}"></div>
              <div class="form-group"><label class="form-label">ຫ້ອງຮຽນ</label><input class="form-control" id="f-room" value="${item.room || ''}" placeholder="ເຊັ່ນ K1-01"></div>
            </div>
            <div class="form-group"><label class="form-label">ໝາຍເຫດ</label><textarea class="form-control" id="f-notes" rows="3" placeholder="ເພີ່ມລາຍລະອຽດ...">${item.notes || ''}</textarea></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
            <button class="btn btn-primary" onclick="saveSchedule()"><i class="fas fa-save"></i> ບັນທຶກ</button>
          </div>
        </div>`);
    };

    window.saveSchedule = async function() {
        const data = {
          schedule_id: document.getElementById('f-sid').value,
          subject: document.getElementById('f-subject').value.trim(),
          class_id: document.getElementById('f-class').value,
          teacher_id: document.getElementById('f-teacher').value,
          day_of_week: document.getElementById('f-day').value,
          start_time: document.getElementById('f-start').value,
          end_time: document.getElementById('f-end').value,
          room: document.getElementById('f-room').value.trim(),
          notes: document.getElementById('f-notes').value.trim(),
        };
      
        if (!data.subject || !data.day_of_week || !data.start_time || !data.end_time) {
          toast('ກະລຸນາໃສ່ວິຊາ ແລະ ເວລາຮຽນ', 'error');
          return;
        }
        if (data.end_time <= data.start_time) {
          toast('ເວລາສິ້ນສຸບຕ້ອງຫຼັງເວລາເລີ່ມ', 'error');
          return;
        }
      
        const r = await apiPost(`${API}/schedule.php?action=save`, data);
        if (r.success) {
          closeModal();
          toast('ບັນທຶກສຳເລັດ');
          reloadCurrentPage();
        } else {
          toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
        }
    };

    window.deleteSchedule = async function(id) {
        if (!(await awaitConfirm('ຢືນຢັນການລົບ', 'ຕ້ອງການລົບຕາລາງນີ້?'))) return;
        const r = await apiPost(`${API}/schedule.php?action=delete`, { schedule_id: id });
        if (r.success) {
          toast('ລົບສຳເລັດ');
          reloadCurrentPage();
        } else {
          toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
        }
    };
}
