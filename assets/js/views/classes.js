// views/classes.js
export async function render(el, perm='full') {
  const data = await apiFetch(`${API}/classes.php?action=list`);
  const staff = await apiFetch(`${API}/staff.php?action=list`);
  drawPage(el, data, staff, perm);
}

const levelColors = {
  Nursery:'#ec4899', K1:'#8b5cf6', K2:'#3b82f6', K3:'#14b8a6',
  P1:'#22c55e', P2:'#f97316', P3:'#eab308', P4:'#ef4444', P5:'#6366f1'
};

function drawPage(el, data, staff, perm='full') {
  const canEdit = perm === 'full';
  el.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">ຫ້ອງຮຽນ (${data.length})</h2>
      ${canEdit
        ? `<button class="btn btn-primary" onclick="openClassModal()"><i class="fas fa-plus"></i> ເພີ່ມຫ້ອງ</button>`
        : `<span class="badge badge-blue"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>`}
    </div>
    <div class="class-grid">
      ${data.length ? data.map(c=>{
        const pct = c.capacity ? Math.min(100, Math.round(c.student_count/c.capacity*100)) : 0;
        const col = levelColors[c.level]||'#64748b';
        return `<div class="class-card" style="cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'" onclick="viewClassStudents(${c.class_id})">
          <div><span class="class-level-badge" style="background:${col}22;color:${col}">${c.level}</span></div>
          <div class="class-name">${c.class_name}</div>
          <div class="class-teacher">👩‍🏫 ${c.teacher_name||'ຍັງບໍ່ໄດ້ກຳໜົດ'}</div>
          <div class="class-teacher">🚪 ຫ້ອງ ${c.room_number||'-'}</div>
          <div class="progress-bar-container" style="margin-top:12px">
            <div class="progress-bar" style="width:${pct}%;background:${col}"></div>
          </div>
          <div class="class-capacity"><span>${c.student_count||0} ນັກຮຽນ</span><span>/${c.capacity} ຄົນ</span></div>
          ${canEdit ? `<div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="event.stopPropagation(); openClassModal(${c.class_id})"><i class="fas fa-edit"></i> ແກ້ໄຂ</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation(); deleteClass(${c.class_id},'${c.class_name}')"><i class="fas fa-trash"></i></button>
          </div>` : ''}
          <div style="margin-top:8px;">
            <button class="btn btn-primary btn-sm" style="width:100%" onclick="event.stopPropagation(); viewClassStudents(${c.class_id})"><i class="fas fa-users"></i> ລາຍຊື່ນັກຮຽນ</button>
          </div>
        </div>`;
      }).join('') : '<div class="empty-state"><div class="empty-state-icon">🚪</div><h3>ຍັງບໍ່ມີຫ້ອງ</h3></div>'}
    </div>`;

  window.viewClassStudents = (classId) => {
    sessionStorage.setItem('studentFilterClassId', classId);
    navigateTo('students');
  };

  if (canEdit) {
    window.openClassModal = (id) => _openModal(id, data, staff);
    window.deleteClass = (id, name) => _delete(id, name);
  }
}

async function _openModal(id, classes, staffList) {
  const c = id ? classes.find(x=>x.class_id==id)||{} : {};
  const staffOpts = staffList.map(s=>`<option value="${s.staff_id}" ${c.mentor_teacher_id==s.staff_id?'selected':''}>${s.full_name_lao}</option>`).join('');
  const levels = ['Nursery','K1','K2','K3','P1','P2','P3','P4','P5','M1','M2','M3','M4'];
  openModal(`<div class="modal">
    <div class="modal-header"><h2 class="modal-title">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ຫ້ອງຮຽນ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <input type="hidden" id="f-cid" value="${c.class_id||''}">
      <div class="form-group"><label class="form-label">ຊື່ຫ້ອງ *</label><input class="form-control" id="f-cname" value="${c.class_name||''}" placeholder="ອະນຸບານ K1 A"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຊັ້ນຮຽນ *</label><select class="form-control" id="f-level">
          ${levels.map(l=>`<option value="${l}" ${c.level===l?'selected':''}>${l}</option>`).join('')}
        </select></div>
        <div class="form-group"><label class="form-label">ຈຳນວນນັກຮຽນ</label><input class="form-control" type="number" id="f-cap" value="${c.capacity||30}" min="1" max="100"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ໝາຍເລກຫ້ອງ</label><input class="form-control" id="f-room" value="${c.room_number||''}" placeholder="K1-01"></div>
        <div class="form-group"><label class="form-label">ຄູປະຈຳຫ້ອງ</label><select class="form-control" id="f-teacher"><option value="">-- ເລືອກຄູ --</option>${staffOpts}</select></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveClass()"><i class="fas fa-save"></i> ບັນທຶກ</button>
    </div>
  </div>`);
}

window.saveClass = async function() {
  const data = {
    class_id: document.getElementById('f-cid').value,
    class_name: document.getElementById('f-cname').value.trim(),
    level: document.getElementById('f-level').value,
    capacity: document.getElementById('f-cap').value,
    room_number: document.getElementById('f-room').value.trim(),
    mentor_teacher_id: document.getElementById('f-teacher').value,
  };
  if (!data.class_name) { toast('ຕ້ອງໃສ່ຊື່ຫ້ອງ','error'); return; }
  const r = await apiPost(`${API}/classes.php?action=save`, data);
  if (r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); reloadCurrentPage(); }
  else toast(r.error||'ເກີດຂໍ້ຜິດພາດ','error');
};

async function _delete(id, name) {
  if (!(await awaitConfirm('ຢືນຢັນການລົບ', `ລົບຫ້ອງ "${name}"?`))) return;
  const r = await apiPost(`${API}/classes.php?action=delete`, { class_id: id });
  if (r.success) { toast('ລົບສຳເລັດ'); reloadCurrentPage(); }
  else toast('ເກີດຂໍ້ຜິດພາດ','error');
}
