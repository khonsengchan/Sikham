// views/transport.js
export async function render(el, perm='full') {
  const data = await apiFetch(`${API}/transport.php?action=list`);
  drawPage(el, data, perm);
}

function drawPage(el, data, perm='full') {
  const canEdit = perm === 'full';
  el.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">ລົດຮັບສົ່ງ (${data.length})</h2>
      ${canEdit
        ? `<button class="btn btn-primary" onclick="openVehModal()"><i class="fas fa-plus"></i> ເພີ່ມລົດ</button>`
        : `<span class="badge badge-blue"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>`}
    </div>
    <div class="transport-grid">
      ${data.length ? data.map(v=>{
        const pct = v.capacity ? Math.min(100, Math.round(v.student_count/v.capacity*100)) : 0;
        const icon = v.type==='ລົດຕູ້' ? '🚐' : v.type==='ລົດບັດ' ? '🚌' : '🚗';
        return `<div class="transport-card">
          <div class="transport-header">
            <span class="transport-icon">${icon}</span>
            <div><div class="transport-name">${v.vehicle_name}</div><div class="transport-plate">${v.plate_number}</div></div>
            <span class="badge ${v.status==='active'?'badge-green':'badge-gray'}" style="margin-left:auto">${v.status==='active'?'ພ້ອມ':'ຢຸດ'}</span>
          </div>
          <div class="transport-info">
            <div class="transport-info-row"><span>🧑‍✈️ ຄົນຂັບ:</span> ${v.driver_name||'-'}</div>
            <div class="transport-info-row"><span>📞 ເບີໂທ:</span> ${v.driver_phone||'-'}</div>
            <div class="transport-info-row"><span>🗺️ ສາຍ:</span> ${v.route_name||'-'}</div>
          </div>
          <div style="margin-top:12px">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:4px"><span>${v.student_count||0} ນັກຮຽນ</span><span>ຄວາມຈຸ ${v.capacity}</span></div>
            <div class="progress-bar-container"><div class="progress-bar" style="width:${pct}%;background:${pct>80?'var(--accent-orange)':'var(--accent-green)'}"></div></div>
          </div>
          ${canEdit ? `<div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="openVehModal(${v.vehicle_id})"><i class="fas fa-edit"></i> ແກ້ໄຂ</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteVeh(${v.vehicle_id})"><i class="fas fa-trash"></i></button>
          </div>` : ''}
        </div>`;
      }).join('') : '<div class="empty-state"><div class="empty-state-icon">🚐</div><h3>ຍັງບໍ່ມີລົດ</h3></div>'}
    </div>`;

  if (canEdit) {
    window.openVehModal = (id) => _openModal(id, data);
    window.deleteVeh = (id) => _delete(id);
  }
}

async function _openModal(id, vehicles) {
  const v = id ? vehicles.find(x=>x.vehicle_id==id)||{} : {};
  openModal(`<div class="modal">
    <div class="modal-header"><h2 class="modal-title">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ລົດ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <input type="hidden" id="f-vid" value="${v.vehicle_id||''}">
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຊື່ລົດ *</label><input class="form-control" id="f-vname" value="${v.vehicle_name||''}" placeholder="ລົດຕູ້ 01"></div>
        <div class="form-group"><label class="form-label">ເລກທະບຽນ *</label><input class="form-control" id="f-plate" value="${v.plate_number||''}" placeholder="GN-0000"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ປະເພດ</label><select class="form-control" id="f-vtype">
          <option value="ລົດຕູ້" ${v.type==='ລົດຕູ້'?'selected':''}>ລົດຕູ້</option>
          <option value="ລົດບັດ" ${v.type==='ລົດບັດ'?'selected':''}>ລົດບັດ</option>
          <option value="ອື່ນໆ" ${v.type==='ອື່ນໆ'?'selected':''}>ອື່ນໆ</option>
        </select></div>
        <div class="form-group"><label class="form-label">ຄວາມຈຸ</label><input class="form-control" type="number" id="f-vcap" value="${v.capacity||15}" min="1"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຊື່ຄົນຂັບ</label><input class="form-control" id="f-drv" value="${v.driver_name||''}" placeholder="ທ່ານ ສົມ ດາ"></div>
        <div class="form-group"><label class="form-label">ເບີໂທ</label><input class="form-control" id="f-dphone" value="${v.driver_phone||''}" placeholder="020 XXXXXXXX"></div>
      </div>
      <div class="form-group"><label class="form-label">ສາຍ / ເສັ້ນທາງ</label><input class="form-control" id="f-route" value="${v.route_name||''}" placeholder="ສາຍ A - ໂພນສາ..."></div>
      <div class="form-group"><label class="form-label">ສະຖານະ</label><select class="form-control" id="f-vstatus">
        <option value="active" ${v.status==='active'?'selected':''}>ພ້ອມ</option>
        <option value="inactive" ${v.status==='inactive'?'selected':''}>ຢຸດ</option>
      </select></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveVeh()"><i class="fas fa-save"></i> ບັນທຶກ</button>
    </div>
  </div>`);
}

window.saveVeh = async function() {
  const data = {
    vehicle_id: document.getElementById('f-vid').value,
    vehicle_name: document.getElementById('f-vname').value.trim(),
    plate_number: document.getElementById('f-plate').value.trim(),
    type: document.getElementById('f-vtype').value,
    capacity: document.getElementById('f-vcap').value,
    driver_name: document.getElementById('f-drv').value.trim(),
    driver_phone: document.getElementById('f-dphone').value.trim(),
    route_name: document.getElementById('f-route').value.trim(),
    status: document.getElementById('f-vstatus').value,
  };
  if (!data.vehicle_name || !data.plate_number) { toast('ຕ້ອງໃສ່ຊື່ ແລະ ທະບຽນ','error'); return; }
  const r = await apiPost(`${API}/transport.php?action=save`, data);
  if (r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); reloadCurrentPage(); }
  else toast(r.error||'ເກີດຂໍ້ຜິດພາດ','error');
};

async function _delete(id) {
  if (!(await awaitConfirm('ຢືນຢັນການລົບ', 'ລົບລົດຄັນນີ້?'))) return;
  const r = await apiPost(`${API}/transport.php?action=delete`, { vehicle_id: id });
  if (r.success) { toast('ລົບສຳເລັດ'); reloadCurrentPage(); }
  else toast('ເກີດຂໍ້ຜິດພາດ','error');
}
