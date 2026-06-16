// views/staff.js
let allStaff = [];

export async function render(el, perm='full') {
  allStaff = await apiFetch(`${API}/staff.php?action=list`);
  drawPage(el, allStaff, perm);

  document.addEventListener('app:search', handler);
  function handler(e) {
    const q = e.detail.toLowerCase();
    drawPage(el, allStaff.filter(s =>
      s.full_name_lao?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    ), perm);
  }
}

function drawPage(el, data, perm='full') {
  const canEdit = perm === 'full';
  const colors = ['#3b82f6','#8b5cf6','#ec4899','#22c55e','#f97316','#14b8a6'];
  const groups = groupStaffBySchoolStructure(data);
  el.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">ຄູ ແລະ ພະນັກງານ (${data.length})</h2>
      ${canEdit
        ? `<button class="btn btn-primary" onclick="openStaffModal()"><i class="fas fa-plus"></i> ເພີ່ມພະນັກງານ</button>`
        : `<span class="badge badge-blue"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>`}
    </div>
    ${groups.map(g => `
      <div class="card" style="margin-bottom:14px;">
        <div class="card-header">
          <h2 class="card-title">${g.icon} ${g.title} (${g.items.length})</h2>
        </div>
        <div class="card-body">
          <div class="staff-grid">
      ${g.items.map((s,i)=>`
        <div class="staff-card" onclick="openStaffProfile(${s.staff_id})" style="cursor:pointer;">
          <div class="staff-avatar" style="background:linear-gradient(135deg,${colors[i%colors.length]},${colors[(i+2)%colors.length]})">
            ${safeLocalImage(s.profile_picture)
              ? `<img src="${safeLocalImage(s.profile_picture)}" alt="${s.full_name_lao}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
              : `${s.full_name_lao[0]}`}
          </div>
          <div class="staff-name">${s.full_name_lao}</div>
          <div class="staff-role"><span class="badge badge-blue">${s.role}</span></div>
          <div class="staff-dept">${s.department||''}</div>
          <div class="staff-phone">📞 ${s.phone||'-'}</div>
          ${canEdit ? `<div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openStaffModal(${s.staff_id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteStaff(${s.staff_id},'${s.full_name_lao}')"><i class="fas fa-trash"></i></button>
          </div>` : ''}
        </div>`).join('')}
          </div>
        </div>
      </div>
    `).join('')}
    ${!data.length ? '<p class="empty-state"><span class="empty-state-icon">👨‍🏫</span><h3>ຍັງບໍ່ມີຂໍ້ມູນພະນັກງານ</h3></p>' : ''}`;

  window.openStaffProfile = (id) => _openProfile(id);
  if (canEdit) {
    window.openStaffModal = (id) => _openModal(id);
    window.deleteStaff = (id, name) => _delete(id, name);
  }
}

function groupStaffBySchoolStructure(data) {
  const sections = [
    { key: 'leaders', title: 'ຜູ້ອຳນວຍການ ແລະ ຮອງ', icon: '🏛️', items: [] },
    { key: 'kinder', title: 'ຄູອະນຸບານ', icon: '🧸', items: [] },
    { key: 'primary', title: 'ຄູປະຖົມ', icon: '📘', items: [] },
    { key: 'other', title: 'ພະນັກງານອື່ນໆ', icon: '👥', items: [] },
  ];

  const has = (txt, words) => {
    const t = (txt || '').toLowerCase();
    return words.some(w => t.includes(w));
  };

  for (const s of data) {
    const role = s.role || '';
    const dept = s.department || '';
    if (has(role, ['ຜູ້ອຳນວຍ', 'ອຳນວຍ', 'director']) || has(role, ['ຮອງ', 'deputy', 'vice'])) {
      sections[0].items.push(s);
    } else if (has(role, ['ຄູ']) && has(dept, ['ອະນຸບານ', 'k', 'nursery', 'kindergarten'])) {
      sections[1].items.push(s);
    } else if (has(role, ['ຄູ']) && has(dept, ['ປະຖົມ', 'p1', 'p2', 'p3', 'p4', 'p5', 'primary'])) {
      sections[2].items.push(s);
    } else if (has(role, ['ຄູ']) && !dept) {
      sections[2].items.push(s);
    } else {
      sections[3].items.push(s);
    }
  }

  return sections.filter(s => s.items.length > 0);
}

async function _openProfile(id) {
  const s = await apiFetch(`${API}/staff.php?action=get&id=${id}`);
  const pic = safeLocalImage(s?.profile_picture);
  openModal(`<div class="modal" style="max-width:560px;">
    <div class="modal-header"><h2 class="modal-title">ຮູບພາບຄູ/ພະນັກງານ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body" style="display:flex;justify-content:center;align-items:center;min-height:320px;">
      ${pic
        ? `<img src="${pic}" alt="${s?.full_name_lao||''}" style="max-width:100%;max-height:70vh;border-radius:14px;object-fit:contain;border:1px solid var(--border);">`
        : `<div class="empty-state" style="padding:0;"><div class="empty-state-icon">🖼️</div><h3>ບໍ່ມີຮູບພາບ</h3></div>`}
    </div>
  </div>`);
}

function safeLocalImage(path) {
  if (!path || typeof path !== 'string') return '';
  if (!path.startsWith('assets/uploads/staff/')) return '';
  return path;
}

async function _openModal(id) {
  let s = {};
  if (id) s = await apiFetch(`${API}/staff.php?action=get&id=${id}`);
  openModal(`<div class="modal">
    <div class="modal-header"><h2 class="modal-title">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ພະນັກງານ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <input type="hidden" id="f-sid" value="${s.staff_id||''}">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ຮູບໂປຣໄຟລ໌</label>
          <input type="file" id="f-photo" accept="image/png,image/jpeg,image/webp" style="display:none;">
          <div style="margin-top:8px;border:1px dashed var(--border);border-radius:14px;padding:14px;background:#f8fafc;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;border:1px solid var(--border);background:white;display:flex;align-items:center;justify-content:center;">
                <img id="f-photo-preview" src="${safeLocalImage(s.profile_picture)||''}" alt="" style="width:100%;height:100%;object-fit:cover;${safeLocalImage(s.profile_picture)?'':'display:none;'}">
                <span id="f-photo-placeholder" style="font-size:24px;color:var(--text-muted);${safeLocalImage(s.profile_picture)?'display:none;':''}">📷</span>
              </div>
              <div style="flex:1;">
                <button type="button" class="btn btn-secondary btn-sm" id="f-photo-btn"><i class="fas fa-image"></i> ເລືອກຮູບ</button>
                <div id="f-photo-name" style="margin-top:6px;font-size:12px;color:var(--text-muted);">${safeLocalImage(s.profile_picture)?'ມີຮູບແລ້ວ':'ຍັງບໍ່ໄດ້ເລືອກໄຟລ໌'}</div>
              </div>
            </div>
            <small style="display:block;margin-top:10px;color:var(--text-muted)">JPG/PNG/WEBP, ບໍ່ເກີນ 2MB</small>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຊື່ (ລາວ) *</label><input class="form-control" id="f-nlo" value="${s.full_name_lao||''}" placeholder="ຊື່ ແລະ ນາມສະກຸນ"></div>
        <div class="form-group"><label class="form-label">ຊື່ (ອັງກິດ)</label><input class="form-control" id="f-nen" value="${s.full_name_eng||''}" placeholder="Full Name"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຕຳແໜ່ງ *</label><input class="form-control" id="f-role" value="${s.role||''}" placeholder="ຄູສອນ, ຜູ້ອຳນວຍການ..."></div>
        <div class="form-group"><label class="form-label">ພະແນກ</label><input class="form-control" id="f-dept" value="${s.department||''}" placeholder="ອະນຸບານ, ປະຖົມ..."></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ເພດ</label><select class="form-control" id="f-gender">
          <option value="ຍິງ" ${s.gender==='ຍິງ'?'selected':''}>ຍິງ</option>
          <option value="ຊາຍ" ${s.gender==='ຊາຍ'?'selected':''}>ຊາຍ</option>
        </select></div>
        <div class="form-group"><label class="form-label">ເບີໂທ</label><input class="form-control" id="f-phone" value="${s.phone||''}" placeholder="020 XXXXXXXX"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ວັນທີ່ເລີ່ມວຽກ</label><input class="form-control" type="date" id="f-hire" value="${s.hire_date||''}"></div>
        <div class="form-group"><label class="form-label">ສະຖານະ</label><select class="form-control" id="f-status">
          <option value="active" ${s.status==='active'?'selected':''}>ເຮັດວຽກ</option>
          <option value="inactive" ${s.status==='inactive'?'selected':''}>ພັກ</option>
        </select></div>
      </div>
      <div class="form-group"><label class="form-label">ອີເມລ</label><input class="form-control" id="f-email" type="email" value="${s.email||''}" placeholder="email@example.com"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveStaff()"><i class="fas fa-save"></i> ບັນທຶກ</button>
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
      if (f.size > 2 * 1024 * 1024) {
        toast('ຂະໜາດຮູບຕ້ອງນ້ອຍກວ່າ 2MB', 'error');
        fileInput.value = '';
        fileName.textContent = 'ຍັງບໍ່ໄດ້ເລືອກໄຟລ໌';
        return;
      }
      preview.src = URL.createObjectURL(f);
      preview.style.display = '';
      placeholder.style.display = 'none';
      fileName.textContent = `ເລືອກແລ້ວ: ${f.name}`;
    });
  }
}

window.saveStaff = async function() {
  const data = {
    staff_id: document.getElementById('f-sid').value,
    full_name_lao: document.getElementById('f-nlo').value.trim(),
    full_name_eng: document.getElementById('f-nen').value.trim(),
    role: document.getElementById('f-role').value.trim(),
    department: document.getElementById('f-dept').value.trim(),
    gender: document.getElementById('f-gender').value,
    phone: document.getElementById('f-phone').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    hire_date: document.getElementById('f-hire').value,
    status: document.getElementById('f-status').value,
  };
  if (!data.full_name_lao || !data.role) { toast('ຕ້ອງໃສ່ຊື່ ແລະ ຕຳແໜ່ງ','error'); return; }

  const fd = new FormData();
  Object.entries(data).forEach(([k,v]) => fd.append(k, v ?? ''));
  const fileInput = document.getElementById('f-photo');
  const f = fileInput && fileInput.files ? fileInput.files[0] : null;
  if (f) fd.append('profile_picture', f);

  const r = await fetch(`${API}/staff.php?action=save`, { method:'POST', body: fd }).then(res => res.json());
  if (r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); reloadCurrentPage(); }
  else toast(r.error||'ເກີດຂໍ້ຜິດພາດ','error');
};

async function _delete(id, name) {
  if (!(await awaitConfirm('ຢືນຢັນການລົບ', `ລົບ "${name}" ອອກ?`))) return;
  const r = await apiPost(`${API}/staff.php?action=delete`, { staff_id: id });
  if (r.success) { toast('ລົບສຳເລັດ'); setTimeout(() => location.reload(), 800); }
  else toast('ເກີດຂໍ້ຜິດພາດ','error');
}
