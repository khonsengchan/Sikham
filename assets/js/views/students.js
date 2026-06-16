// views/students.js ຄະແນນລວມ
let allStudents = [];
let classesCache = [];
let selectedClassId = 'all';
let localSearch = '';
let selectedLevel = '';

export async function render(el, perm='full') {
  classesCache = await apiFetch(`${API}/classes.php?action=list`);
  
  // Check for level filter from dashboard
  selectedLevel = sessionStorage.getItem('studentFilterLevel') || '';
  sessionStorage.removeItem('studentFilterLevel');
  
  // Check for class filter from classes page
  let filterClassId = sessionStorage.getItem('studentFilterClassId');
  if (filterClassId) {
    selectedClassId = filterClassId;
    sessionStorage.removeItem('studentFilterClassId');
  } else {
    selectedClassId = 'all';
  }
  
  // Track if we navigated from classes to show a back button
  let fromClassNavigation = !!filterClassId;

  if (selectedLevel) {
    allStudents = await apiFetch(`${API}/students.php?action=list&level=${encodeURIComponent(selectedLevel)}`);
  } else {
    allStudents = await apiFetch(`${API}/students.php?action=list`);
  }
  
  drawPage(el, perm, fromClassNavigation);

  document.addEventListener('app:search', handler);
  function handler(e) {
    localSearch = (e.detail || '').toLowerCase();
    const localInput = document.getElementById('student-local-search');
    if (localInput) localInput.value = e.detail || '';
    drawPage(el, perm, fromClassNavigation);
  }
}

function drawPage(el, perm='full', fromClassNavigation=false) {
  const canEdit = perm === 'full';
  const filtered = filterStudents(allStudents, selectedClassId, localSearch);
  const classTabs = buildClassTabs(allStudents, classesCache, selectedClassId);

  el.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;">
        ${fromClassNavigation ? `<button class="btn btn-secondary btn-icon" onclick="navigateTo('classes')" title="ກັບຄືນຫາຫ້ອງຮຽນ"><i class="fas fa-arrow-left"></i></button>` : ''}
        <h2 class="page-title" style="margin:0;">ນັກຮຽນ (<span id="students-count">${filtered.length}</span>)</h2>
      </div>
      ${canEdit
        ? `<button class="btn btn-primary" onclick="openStudentModal()"><i class="fas fa-plus"></i> ເພີ່ມນັກຮຽນ</button>`
        : `<span class="badge badge-blue"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>`}
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div class="card-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          ${classTabs.map(t => `
            <button class="btn ${t.active ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setStudentClassFilter('${t.id}')">
              ${t.label} (${t.count})
            </button>
          `).join('')}
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <div style="position:relative;flex:1;min-width:260px;">
            <i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);"></i>
            <input id="student-local-search" class="form-control" style="padding-left:36px;" placeholder="ຄົ້ນຫາຊື່/ລະຫັດນັກຮຽນ..." value="${escapeAttr(localSearch)}">
          </div>
          <span class="badge badge-gray">ຫ້ອງ: ${currentClassLabel(classesCache, selectedClassId)}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table><thead><tr>
          <th>ນັກຮຽນ</th><th>ລະຫັດ</th><th>ເພດ</th><th>ຫ້ອງຮຽນ</th><th>ວັນເດືອນປີເກີດ</th><th>ຜູ້ປົກຄອງ</th><th>ສະຖານະ</th>
          ${canEdit ? '<th></th>' : ''}
        </tr></thead><tbody id="students-tbody">
          ${renderStudentRows(filtered, canEdit)}
        </tbody></table>
      </div>
    </div>`;

  window.setStudentClassFilter = (classId) => {
    selectedClassId = classId;
    drawPage(el, perm, fromClassNavigation);
  };

  const localInput = document.getElementById('student-local-search');
  if (localInput) {
    localInput.addEventListener('input', (ev) => {
      localSearch = (ev.target.value || '').toLowerCase();
      updateStudentsList(el, perm);
    });
  }

  if (canEdit) {
    window.openStudentModal = (id) => _openStudentModal(id);
    window.deleteStudent = (id, name) => _deleteStudent(id, name);
  }
  window.openStudentProfile = (id) => _openStudentProfile(id);
}

function updateStudentsList(el, perm='full') {
  const canEdit = perm === 'full';
  const filtered = filterStudents(allStudents, selectedClassId, localSearch);
  const countEl = document.getElementById('students-count');
  const bodyEl = document.getElementById('students-tbody');
  if (countEl) countEl.textContent = String(filtered.length);
  if (bodyEl) bodyEl.innerHTML = renderStudentRows(filtered, canEdit);
}

function renderStudentRows(filtered, canEdit) {
  if (!filtered.length) {
    return `<tr><td colspan="${canEdit?8:7}"><div class="empty-state"><div class="empty-state-icon">🎒</div><h3>ບໍ່ພົບນັກຮຽນໃນເງື່ອນໄຂນີ້</h3></div></td></tr>`;
  }
  return filtered.map(s=>`<tr>
    <td><div class="student-cell">
      ${studentAvatar(s, 44)}
      <div><div class="student-name">${s.full_name_lao}</div><div class="student-code">${s.full_name_eng||''}</div></div>
    </div></td>
    <td><span class="badge badge-gray">${s.student_code}</span></td>
    <td>${s.gender==='ຊາຍ'?'<span class="badge badge-blue">👦 ຊາຍ</span>':'<span class="badge badge-green">👧 ຍິງ</span>'}</td>
    <td>${s.class_name||'-'}</td>
    <td>${fmtDateNumeric(s.date_of_birth)}</td>
    <td><div style="font-size:12px">${normalizeGuardianName(s.parent_name) || '-'}</div><div style="font-size:11px;color:var(--text-muted)">${s.parent_phone||''}</div></td>
    <td>${statusBadge(s.status)}</td>
    ${canEdit ? `<td><div class="d-flex gap-8">
      <button class="btn btn-secondary btn-sm btn-icon" onclick="openStudentModal(${s.student_id})" title="ແກ້ໄຂ"><i class="fas fa-edit"></i></button>
      <button class="btn btn-danger btn-sm btn-icon" onclick='deleteStudent(${s.student_id},${jsString(s.full_name_lao)})' title="ລົບ"><i class="fas fa-trash"></i></button>
    </div></td>` : ''}
  </tr>`).join('');
}

function studentAvatar(s, size = 44) {
  const pic = safeLocalStudentImage(s.profile_picture);
  const letter = (s.full_name_lao || 'ນ')[0];
  return `<div class="student-avatar ${s.gender==='ຊາຍ'?'boy':''}" onclick="event.stopPropagation();openStudentProfile(${s.student_id})" title="ເບິ່ງໂປຣໄຟລ໌" style="width:${size}px;height:${size}px;cursor:pointer;overflow:hidden;">
    ${pic ? `<img src="${pic}" alt="${escapeAttr(s.full_name_lao)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : letter}
  </div>`;
}

function normalizeGuardianName(v) {
  const txt = String(v ?? '').trim();
  if (!txt || txt === '0') return '';
  return txt;
}

function filterStudents(list, classId, q) {
  const query = (q || '').trim().toLowerCase();
  return list.filter(s => {
    const classMatch = classId === 'all' || String(s.class_id || '') === String(classId);
    if (!classMatch) return false;
    if (!query) return true;
    return (
      (s.full_name_lao || '').toLowerCase().includes(query) ||
      (s.full_name_eng || '').toLowerCase().includes(query) ||
      (s.student_code || '').toLowerCase().includes(query)
    );
  });
}

function buildClassTabs(students, classes, activeId) {
  const counts = new Map();
  for (const s of students) {
    const k = String(s.class_id || '');
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const tabs = [{ id: 'all', label: 'ທັງໝົດ', count: students.length, active: activeId === 'all' }];
  for (const c of classes) {
    const id = String(c.class_id);
    tabs.push({
      id,
      label: c.class_name || `${c.level || ''}`,
      count: counts.get(id) || 0,
      active: activeId === id,
    });
  }
  return tabs;
}

function currentClassLabel(classes, classId) {
  if (classId === 'all') return 'ທຸກຫ້ອງ';
  const c = classes.find(x => String(x.class_id) === String(classId));
  return c ? `${c.class_name}` : 'ບໍ່ຮູ້ຈັກຫ້ອງ';
}

function escapeAttr(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsString(v) {
  return JSON.stringify(String(v ?? '')).replace(/</g, '\\u003c');
}

function safeLocalStudentImage(path) {
  if (!path || typeof path !== 'string') return '';
  if (!path.startsWith('assets/uploads/students/')) return '';
  return path;
}

async function _openStudentModal(id) {
  let s = {};
  if (id) s = await apiFetch(`${API}/students.php?action=get&id=${id}`);
  const classOpts = classesCache.map(c=>`<option value="${c.class_id}" ${s.class_id==c.class_id?'selected':''}>${c.class_name} (${c.level})</option>`).join('');
  const pic = safeLocalStudentImage(s.profile_picture);
  openModal(`<div class="modal">
    <div class="modal-header"><h2 class="modal-title">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ນັກຮຽນ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <input type="hidden" id="f-sid" value="${s.student_id||''}">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" style="font-weight:700;color:var(--text-primary);">ຮູບໂປຣໄຟລ໌</label>
          <input type="file" id="f-photo" accept="image/png,image/jpeg,image/webp" style="display:none;">
          <div style="margin-top:8px;border:1px dashed #d7e1ef;border-radius:12px;padding:12px 14px;background:#f8fbff;max-width:300px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;border:1px solid #dbe7f5;background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(15,23,42,.04);">
                <img id="f-photo-preview" src="${pic||''}" alt="" style="width:100%;height:100%;object-fit:cover;${pic?'':'display:none;'}">
                <span id="f-photo-placeholder" style="font-size:22px;color:#8aa0bd;${pic?'display:none;':''}"><i class="fas fa-camera"></i></span>
              </div>
              <div style="flex:1;min-width:0;">
                <button type="button" class="btn btn-secondary btn-sm" id="f-photo-btn" style="background:#fff;color:#0f172a;border:1px solid #dbe7f5;box-shadow:0 1px 2px rgba(15,23,42,.04);">
                  <i class="fas fa-image"></i> ເລືອກຮູບ
                </button>
                <div id="f-photo-name" style="margin-top:6px;font-size:11px;color:#8aa0bd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pic?'ມີຮູບໂປຣໄຟລ໌ແລ້ວ':'ຍັງບໍ່ໄດ້ເລືອກໄຟລ໌'}</div>
              </div>
            </div>
            <small style="display:block;margin-top:8px;color:#7690b1;font-size:11px;">JPG/PNG/WEBP, ບໍ່ເກີນ 2MB</small>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຊື່ (ລາວ) *</label><input class="form-control" id="f-name-lao" value="${s.full_name_lao||''}" placeholder="ຊື່ ແລະ ນາມສະກຸນ"></div>
        <div class="form-group"><label class="form-label">ຊື່ (ອັງກິດ)</label><input class="form-control" id="f-name-eng" value="${s.full_name_eng||''}" placeholder="Full Name"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ເພດ *</label><select class="form-control" id="f-gender"><option value="ຍິງ" ${s.gender==='ຍິງ'?'selected':''}>ຍິງ</option><option value="ຊາຍ" ${s.gender==='ຊາຍ'?'selected':''}>ຊາຍ</option></select></div>
        <div class="form-group"><label class="form-label">ວັນເດືອນປີເກີດ</label><input class="form-control" type="date" id="f-dob" value="${s.date_of_birth||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຫ້ອງຮຽນ</label><select class="form-control" id="f-class"><option value="">-- ເລືອກຫ້ອງ --</option>${classOpts}</select></div>
        <div class="form-group"><label class="form-label">ວັນລົງທະບຽນ</label><input class="form-control" type="date" id="f-enroll" value="${s.enrollment_date||new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຊື່ຜູ້ປົກຄອງ</label><input class="form-control" id="f-parent" value="${normalizeGuardianName(s.parent_name)}" placeholder="ຊື່ຜູ້ປົກຄອງ"></div>
        <div class="form-group"><label class="form-label">ເບີໂທຜູ້ປົກຄອງ</label><input class="form-control" id="f-phone" value="${s.parent_phone||''}" placeholder="020 XXXXXXXX"></div>
      </div>
      <div class="form-group"><label class="form-label">ສະຖານະ</label><select class="form-control" id="f-status">
        <option value="ກຳລັງຮຽນ" ${s.status==='ກຳລັງຮຽນ'?'selected':''}>ກຳລັງຮຽນ</option>
        <option value="ພັກການຮຽນ" ${s.status==='ພັກການຮຽນ'?'selected':''}>ພັກການຮຽນ</option>
        <option value="ຮຽນຈົບ" ${s.status==='ຮຽນຈົບ'?'selected':''}>ຮຽນຈົບ</option>
      </select></div>
      <div class="form-group"><label class="form-label">ທີ່ຢູ່</label><textarea class="form-control" id="f-addr">${s.address||''}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveStudent()"><i class="fas fa-save"></i> ບັນທຶກ</button>
    </div>
  </div>`);

  const fileInput = document.getElementById('f-photo');
  const preview = document.getElementById('f-photo-preview');
  const chooseBtn = document.getElementById('f-photo-btn');
  const fileName = document.getElementById('f-photo-name');
  const placeholder = document.getElementById('f-photo-placeholder');
  if (chooseBtn && fileInput) {
    chooseBtn.addEventListener('click', () => fileInput.click());
  }
  if (fileInput && preview && fileName && placeholder) {
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast('ຮອງຮັບສະເພາະ JPG, PNG, WEBP', 'error');
        fileInput.value = '';
        return;
      }
      if (f.size > 2 * 1024 * 1024) {
        toast('ຂະໜາດຮູບຕ້ອງນ້ອຍກວ່າ 2MB', 'error');
        fileInput.value = '';
        fileName.textContent = pic ? 'ມີຮູບໂປຣໄຟລ໌ແລ້ວ' : 'ຍັງບໍ່ໄດ້ເລືອກໄຟລ໌';
        return;
      }
      preview.src = URL.createObjectURL(f);
      preview.style.display = '';
      placeholder.style.display = 'none';
      fileName.textContent = `ເລືອກແລ້ວ: ${f.name}`;
    });
  }
}

window.saveStudent = async function() {
  const data = {
    student_id: document.getElementById('f-sid').value,
    full_name_lao: document.getElementById('f-name-lao').value.trim(),
    full_name_eng: document.getElementById('f-name-eng').value.trim(),
    gender: document.getElementById('f-gender').value,
    date_of_birth: document.getElementById('f-dob').value,
    class_id: document.getElementById('f-class').value,
    enrollment_date: document.getElementById('f-enroll').value,
    parent_name: document.getElementById('f-parent').value.trim(),
    parent_phone: document.getElementById('f-phone').value.trim(),
    status: document.getElementById('f-status').value,
    address: document.getElementById('f-addr').value.trim(),
  };
  if (!data.full_name_lao) { toast('ກະລຸນາໃສ່ຊື່ນັກຮຽນ','error'); return; }

  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.append(k, v ?? ''));
  const fileInput = document.getElementById('f-photo');
  const f = fileInput && fileInput.files ? fileInput.files[0] : null;
  if (f) fd.append('profile_picture', f);

  const r = await fetch(`${API}/students.php?action=save`, { method: 'POST', body: fd }).then(res => res.json());
  if (r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); reloadCurrentPage(); }
  else toast(r.error||'ເກີດຂໍ້ຜິດພາດ','error');
};

async function _openStudentProfile(id) {
  const [s, scoreRows] = await Promise.all([
    apiFetch(`${API}/students.php?action=get&id=${id}`),
    apiFetch(`${API}/scores.php?action=list&student_id=${id}`),
  ]);
  const scores = Array.isArray(scoreRows) ? scoreRows : [];
  const pic = safeLocalStudentImage(s?.profile_picture);
  const avg = scores.length
    ? scores.reduce((sum, x) => sum + ((Number(x.score) || 0) / (Number(x.max_score) || 100) * 100), 0) / scores.length
    : 0;

  openModal(`<div class="modal" style="max-width:860px;width:95vw;">
    <div class="modal-header">
      <h2 class="modal-title">ໂປຣໄຟລ໌ນັກຮຽນ</h2>
      <span class="modal-close" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start;">
        <div style="text-align:center;">
          <div style="width:180px;height:180px;margin:0 auto 12px;border-radius:22px;overflow:hidden;border:1px solid var(--border);background:#f8fafc;display:flex;align-items:center;justify-content:center;">
            ${pic
              ? `<img src="${pic}" alt="${escapeAttr(s.full_name_lao)}" style="width:100%;height:100%;object-fit:cover;">`
              : `<div class="student-avatar ${s.gender==='ຊາຍ'?'boy':''}" style="width:110px;height:110px;font-size:42px;">${(s.full_name_lao || 'ນ')[0]}</div>`}
          </div>
          <h2 style="font-size:20px;margin-bottom:4px;">${escapeHtml(s.full_name_lao || '-')}</h2>
          <div style="color:var(--text-secondary);font-size:13px;">${escapeHtml(s.full_name_eng || '')}</div>
          <div style="margin-top:10px;">${statusBadge(s.status)}</div>
        </div>
        <div>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px;">
            ${profileStat('ລະຫັດ', s.student_code || '-')}
            ${profileStat('ຫ້ອງຮຽນ', s.class_name || '-')}
            ${profileStat('ຄະແນນສະເລ່ຍ', scores.length ? `${avg.toFixed(2)}%` : '-')}
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
            ${profileItem('ເພດ', s.gender)}
            ${profileItem('ວັນເດືອນປີເກີດ', fmtDateNumeric(s.date_of_birth))}
            ${profileItem('ວັນລົງທະບຽນ', fmtDate(s.enrollment_date))}
            ${profileItem('ຜູ້ປົກຄອງ', normalizeGuardianName(s.parent_name) || '-')}
            ${profileItem('ເບີໂທຜູ້ປົກຄອງ', s.parent_phone || '-')}
            ${profileItem('ລະດັບ', s.level || '-')}
          </div>
          <div style="margin-top:10px;">${profileItem('ບ້ານ/ທີ່ຢູ່', s.address || '-', true)}</div>
        </div>
      </div>

      <div style="margin-top:20px;">
        <h3 style="font-size:16px;margin-bottom:10px;">ຄະແນນນັກຮຽນ</h3>
        ${renderProfileScores(scores)}
      </div>
    </div>
  </div>`);
}

function profileStat(label, value) {
  return `<div style="border:1px solid var(--border);border-radius:10px;padding:12px;background:#f8fafc;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">${escapeHtml(label)}</div>
    <div style="font-weight:700;color:var(--text-primary);">${escapeHtml(value)}</div>
  </div>`;
}

function profileItem(label, value, wide = false) {
  return `<div style="border:1px solid var(--border);border-radius:10px;padding:10px;background:#fff;${wide ? 'min-height:72px;' : ''}">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${escapeHtml(label)}</div>
    <div style="font-weight:600;color:var(--text-primary);white-space:pre-wrap;">${escapeHtml(value || '-')}</div>
  </div>`;
}

function renderProfileScores(scores) {
  if (!scores.length) {
    return `<div class="empty-state" style="padding:22px;"><div class="empty-state-icon"><i class="fas fa-table" style="color:var(--accent-blue);opacity:0.3;"></i></div><h3>ຍັງບໍ່ມີຄະແນນ</h3></div>`;
  }

  // Collect unique subjects and max scores
  const subjectsSet = new Set();
  const maxScoresMap = new Map();
  scores.forEach(s => {
    subjectsSet.add(s.subject);
    if (s.max_score && Number(s.max_score) > 0) {
      maxScoresMap.set(s.subject, s.max_score);
    }
  });
  const subjects = Array.from(subjectsSet).sort();

  // Group by "Year|Term|ExamType"
  const rowsMap = new Map();
  scores.forEach(s => {
    const key = `${s.academic_year}|${s.term}|${s.exam_type}`;
    if (!rowsMap.has(key)) {
      rowsMap.set(key, {
        academic_year: s.academic_year,
        term: s.term,
        exam_type: s.exam_type,
        scores: {},
        total: 0
      });
    }
    const row = rowsMap.get(key);
    row.scores[s.subject] = Number(s.score);
    row.total += Number(s.score);
  });

  const rows = Array.from(rowsMap.values()).sort((a,b) => {
    if (a.academic_year !== b.academic_year) return b.academic_year.localeCompare(a.academic_year);
    if (a.term !== b.term) return b.term.localeCompare(a.term);
    return a.exam_type.localeCompare(b.exam_type);
  });

  return `<div class="table-responsive" style="overflow-x:auto;">
    <table class="score-matrix-table" style="width:100%;border-collapse:collapse;font-size:13px;margin-top:10px;">
      <thead>
        <tr style="background:linear-gradient(135deg,var(--accent-blue),#2563eb);color:#fff;">
          <th style="padding:10px 8px;border:1px solid rgba(255,255,255,0.1);width:44px;text-align:center;">ລຳດັບ</th>
          <th style="padding:10px 8px;border:1px solid rgba(255,255,255,0.1);min-width:160px;text-align:left;">ປະຈຳ/ປະເພດ</th>
          ${subjects.map(s => `<th style="padding:10px 8px;border:1px solid rgba(255,255,255,0.1);min-width:70px;text-align:center;">${escapeHtml(s)}</th>`).join('')}
          <th style="padding:10px 8px;border:1px solid rgba(255,255,255,0.1);min-width:72px;text-align:center;background:rgba(0,0,0,.12);color:#fff;">ຄະແນນລວມ</th>
        </tr>
        <!-- max score row -->
        <tr style="background:#eff6ff;border-bottom:2px solid #bfdbfe;">
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#6b7280;">ຄ.ເຕັມ</td>
          <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;font-style:italic;">— ຄະແນນເຕັມ —</td>
          ${subjects.map(s => {
            const mx = maxScoresMap.get(s) || '—';
            return `<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;color:#2563eb;font-weight:600;">${mx}</td>`;
          }).join('')}
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#6b7280;">—</td>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, idx) => {
          const isEven = idx % 2 === 0;
          const bg     = isEven ? '#fff' : '#f8fafc';
          return `
          <tr style="background:${bg};" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='${bg}'">
            <td style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:#374151;">${idx + 1}</td>
            <td style="padding:10px 8px;border:1px solid #e5e7eb;">
              <div style="font-weight:700;color:#1e293b;font-size:14px;">${escapeHtml(r.exam_type || 'ທົ່ວໄປ')}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(r.academic_year)} ${escapeHtml(r.term)}</div>
            </td>
            ${subjects.map(s => {
              const val = r.scores[s];
              const showVal = val !== undefined ? val : '—';
              const color = val !== undefined ? '#1e293b' : '#cbd5e1';
              return `<td style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;font-size:14px;color:${color};">${showVal}</td>`;
            }).join('')}
            <td style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:14px;color:#2563eb;background:rgba(37,99,235,0.03);">
              ${r.total > 0 ? r.total : '—'}
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

function _deleteStudent(id, name) {
  Swal.fire({
    title: 'ຢືນຢັນການລົບ',
    html: `ທ່ານຕ້ອງການລົບນັກຮຽນ <strong>${escapeHtml(name)}</strong> ອອກຈາກລະບົບແທ້ໆບໍ?<br><br><span style="color:var(--text-muted);font-size:14px;">ການກະທຳນີ້ຈະລົບຂໍ້ມູນທີ່ກ່ຽວຂ້ອງທັງໝົດ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="fas fa-trash"></i> ຢືນຢັນລົບ',
    cancelButtonText: 'ຍົກເລີກ',
    background: '#ffffff',
    backdrop: `rgba(15, 23, 42, 0.5)`
  }).then((result) => {
    if (result.isConfirmed) {
      executeDeleteStudent(id);
    }
  });
}

window.executeDeleteStudent = async (id) => {
  Swal.fire({
    title: 'ກຳລັງລົບ...',
    text: 'ກະລຸນາລໍຖ້າສັກຄູ່',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const r = await apiPost(`${API}/students.php?action=delete`, { student_id: id });
  
  if (r.success) { 
    Swal.fire({
      icon: 'success',
      title: 'ສຳເລັດ!',
      text: 'ລົບຂໍ້ມູນນັກຮຽນອອກຈາກລະບົບສຳເລັດແລ້ວ',
      timer: 2000,
      showConfirmButton: false
    });
    reloadCurrentPage(); 
  } else { 
    Swal.fire({
      icon: 'error',
      title: 'ຜິດພາດ',
      text: r.error || 'ບໍ່ສາມາດລົບຂໍ້ມູນໄດ້'
    });
  }
};

function statusBadge(s) {
  const m = {'ກຳລັງຮຽນ':'badge-green','ພັກການຮຽນ':'badge-orange','ຮຽນຈົບ':'badge-blue'};
  return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
}
