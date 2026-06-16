// views/health.js

export async function render(el, perm = 'full') {
  const [data, students] = await Promise.all([
    apiFetch(`${API}/health.php?action=list`),
    apiFetch(`${API}/students.php?action=list`)
  ]);
  
  const alerts = data.alerts || [];
  const records = data.records || [];
  const canEdit = perm === 'full';

  el.innerHTML = `
    <div class="page-header" style="justify-content:space-between; flex-wrap:wrap; gap:16px;">
      <h2 class="page-title">ສຸຂະພາບ</h2>
      <div style="display:flex;gap:10px;">
        ${canEdit ? `
        <button class="btn btn-secondary" onclick="openAlertModal()"><i class="fas fa-plus"></i> ເພີ່ມການແພ້</button>
        <button class="btn btn-primary" onclick="openRecordModal()"><i class="fas fa-plus"></i> ເພີ່ມບັນທຶກປິ່ນປົວ</button>
        ` : `<span class="badge badge-blue"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>`}
      </div>
    </div>
    
    <!-- Allergy Alerts -->
    <div class="card" style="margin-bottom:20px;border-left:4px solid var(--accent-red)">
      <div class="card-header">
        <span style="font-size:18px">⚠️</span>
        <h2 class="card-title" style="color:var(--accent-red)">ການແຈ້ງເຕືອນການແພ້</h2>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ນັກຮຽນ</th>
                <th>ສິ່ງທີ່ແພ້</th>
                <th>ອາການ</th>
                <th>ຄຳແນະນຳ</th>
                <th>ຄວາມຮຸນແຮງ</th>
                ${canEdit ? '<th></th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${alerts.length ? alerts.map(a => `
              <tr>
                <td>
                  <div class="student-cell">
                    <div class="student-avatar">${a.student_name?.[0]||'ນ'}</div>
                    <div>
                      <div class="student-name">${a.student_name}</div>
                      <div class="student-code">${a.student_code}</div>
                    </div>
                  </div>
                </td>
                <td style="font-weight:600">${a.allergy}</td>
                <td>${a.symptoms}</td>
                <td>${a.advice}</td>
                <td>${formatSeverity(a.severity)}</td>
                ${canEdit ? `
                <td>
                  <button class="btn btn-danger btn-sm btn-icon" onclick="deleteAlert(${a.alert_id})"><i class="fas fa-trash"></i></button>
                </td>` : ''}
              </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted">ບໍ່ມີການແຈ້ງເຕືອນການແພ້</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Health Records -->
    <div class="card">
      <div class="card-header"><span>🏥</span><h2 class="card-title">ບັນທຶກສຸຂະພາບ</h2></div>
      <div class="card-body">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ນັກຮຽນ</th>
                <th>ວັນທີ່</th>
                <th>ອາການ</th>
                <th>ການວິນິດໄສ</th>
                <th>ການດູແລ</th>
                <th>ສະຖານະ</th>
                ${canEdit ? '<th></th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${records.length ? records.map(r => `
              <tr>
                <td class="fw-bold">${r.student_name}</td>
                <td>${fmtDate(r.visit_date)}</td>
                <td>${r.symptoms}</td>
                <td>${r.diagnosis}</td>
                <td>${r.treatment}</td>
                <td>${formatStatus(r.status)}</td>
                ${canEdit ? `
                <td>
                  <button class="btn btn-danger btn-sm btn-icon" onclick="deleteRecord(${r.record_id})"><i class="fas fa-trash"></i></button>
                </td>` : ''}
              </tr>`).join('') : '<tr><td colspan="7" class="text-center text-muted">ຍັງບໍ່ມີບັນທຶກການຮັກສາປິ່ນປົວ</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  const stuOpts = students.map(s => `<option value="${s.student_id}">${s.full_name_lao}</option>`).join('');

  window.openAlertModal = function() {
    openModal(`
      <div class="modal">
        <div class="modal-header"><h2 class="modal-title">ເພີ່ມປະຫວັດການແພ້</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">ນັກຮຽນ</label><select class="form-control" id="h-stu-alert"><option value="">-- ເລືອກ --</option>${stuOpts}</select></div>
          <div class="form-group"><label class="form-label">ສິ່ງທີ່ແພ້ (Allergy)</label><input class="form-control" id="h-allergy" placeholder="ເຊັ່ນ: ອາຫານທະເລ, ນົມ..."></div>
          <div class="form-group"><label class="form-label">ອາການແພ້</label><input class="form-control" id="h-symptoms-alert" placeholder="ເຊັ່ນ: ຜື່ນ, ຫາຍໃຈຍາກ"></div>
          <div class="form-group"><label class="form-label">ລາຍລະອຽດ ຫຼື ຄຳແນະນຳ</label><input class="form-control" id="h-advice" placeholder="ຫ້າມຮັບປະທານ"></div>
          <div class="form-group"><label class="form-label">ຄວາມຮຸນແຮງ</label>
            <select class="form-control" id="h-severity">
                <option value="mild">ເລັກນ້ອຍ</option>
                <option value="moderate">ປານກາງ</option>
                <option value="severe">ຮຸນແຮງ</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
          <button class="btn btn-primary" onclick="saveAlert()"><i class="fas fa-save"></i> ບັນທຶກ</button>
        </div>
      </div>`);
  };

  window.openRecordModal = function() {
    openModal(`
      <div class="modal">
        <div class="modal-header"><h2 class="modal-title">ເພີ່ມບັນທຶກການປິ່ນປົວ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">ນັກຮຽນ</label><select class="form-control" id="h-stu-rec"><option value="">-- ເລືອກ --</option>${stuOpts}</select></div>
            <div class="form-group"><label class="form-label">ວັນທີເຂົ້າຫ້ອງພະຍາບານ</label><input type="date" class="form-control" id="h-visit" value="${new Date().toISOString().split('T')[0]}"></div>
          </div>
          <div class="form-group"><label class="form-label">ອາການທີ່ພົບ</label><input class="form-control" id="h-symptoms"></div>
          <div class="form-group"><label class="form-label">ການວິນິດໄສ (Diagnosis)</label><input class="form-control" id="h-diag"></div>
          <div class="form-group"><label class="form-label">ການປະຖົມພະຍາບານ / ການດູແລ</label><input class="form-control" id="h-treatment" placeholder="ເຊັ່ນ: ໃຫ້ຢາແກ້ປວດ, ໃຫ້ພັກຜ່ອນ 1 ຊມ"></div>
          <div class="form-group"><label class="form-label">ສະຖານະລ່າສຸດ</label>
            <select class="form-control" id="h-status">
                <option value="recovering">ກຳລັງພັກຟື້ນ</option>
                <option value="recovered">ດີຂຶ້ນ / ກັບຫ້ອງ</option>
                <option value="sent_home">ສົ່ງກັບບ້ານ / ໂຮງໝໍ</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
          <button class="btn btn-primary" onclick="saveRecord()"><i class="fas fa-save"></i> ບັນທຶກ</button>
        </div>
      </div>`);
  };

  window.saveAlert = async () => {
    const data = {
      student_id: document.getElementById('h-stu-alert').value,
      allergy: document.getElementById('h-allergy').value,
      symptoms: document.getElementById('h-symptoms-alert').value,
      advice: document.getElementById('h-advice').value,
      severity: document.getElementById('h-severity').value,
    };
    if(!data.student_id || !data.allergy) { toast('ກະລຸນາເລືອກນັກຮຽນ ແລະ ປ້ອນສິ່ງທີ່ແພ້','error'); return; }
    
    const r = await apiPost(`${API}/health.php?action=save_alert`, data);
    if(r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); render(el, perm); }
    else toast(r.error||'ຜິດພາດ','error');
  };

  window.saveRecord = async () => {
    const data = {
      student_id: document.getElementById('h-stu-rec').value,
      visit_date: document.getElementById('h-visit').value,
      symptoms: document.getElementById('h-symptoms').value,
      diagnosis: document.getElementById('h-diag').value,
      treatment: document.getElementById('h-treatment').value,
      status: document.getElementById('h-status').value,
    };
    if(!data.student_id || !data.symptoms) { toast('ກະລຸນາເລືອກນັກຮຽນ ແລະ ປ້ອນອາການ','error'); return; }
    
    const r = await apiPost(`${API}/health.php?action=save_record`, data);
    if(r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); render(el, perm); }
    else toast(r.error||'ຜິດພາດ','error');
  };

  window.deleteAlert = async (id) => {
    if(!(await awaitConfirm('ຢືນຢັນການລົບ', 'ລຶບຂໍ້ມູນການແພ້ນີ້?'))) return;
    const r = await apiPost(`${API}/health.php?action=delete_alert`, {alert_id: id});
    if(r.success) { toast('ລຶບສຳເລັດ'); render(el, perm); } else { toast('ຜິດພາດ', 'error'); }
  };

  window.deleteRecord = async (id) => {
    if(!(await awaitConfirm('ຢືນຢັນການລົບ', 'ລຶບປະຫວັດການປິ່ນປົວນີ້?'))) return;
    const r = await apiPost(`${API}/health.php?action=delete_record`, {record_id: id});
    if(r.success) { toast('ລຶບສຳເລັດ'); render(el, perm); } else { toast('ຜິດພາດ', 'error'); }
  };
}

function formatSeverity(s) {
  if (s==='severe') return `<span class="badge badge-red">ຮຸນແຮງ</span>`;
  if (s==='moderate') return `<span class="badge badge-orange">ປານກາງ</span>`;
  return `<span class="badge badge-blue">ເລັກນ້ອຍ</span>`;
}

function formatStatus(s) {
  if (s==='recovered') return `<span class="badge badge-green">ດີຂຶ້ນ / ກັບຫ້ອງ</span>`;
  if (s==='sent_home') return `<span class="badge badge-red">ສົ່ງກັບບ້ານ</span>`;
  return `<span class="badge badge-yellow">ກຳລັງພັກຟື້ນ</span>`;
}
