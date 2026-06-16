// views/settings.js
export async function render(el, perm='full') {
  const tabs = perm === 'full' 
    ? ['school','academic','users','logs','password'] 
    : ['password'];

  el.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">ການຕັ້ງຄ່າ</h2>
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:4px;margin-bottom:24px;border-bottom:2px solid var(--border);padding-bottom:0">
      ${tabs.map((t,i)=>
        `<button class="settings-tab ${i===0?'active':''}" data-tab="${t}" onclick="switchTab('${t}')" style="padding:10px 20px;background:none;border:none;font-size:13.5px;font-weight:${i===0?'700':'500'};color:${i===0?'var(--accent-green)':'var(--text-secondary)'};cursor:pointer;border-bottom:2px solid ${i===0?'var(--accent-green)':'transparent'};margin-bottom:-2px;font-family:inherit">
          ${{school:'🏫 ຂໍ້ມູນໂຮງຮຽນ',academic:'📅 ສົກຮຽນ',users:'👥 ຜູ້ໃຊ້',logs:'📋 ບັນທຶກການເຂົ້າລະບົບ',password:'🔒 ລະຫັດຜ່ານ'}[t]}
        </button>`
      ).join('')}
    </div>

    <!-- SCHOOL INFO TAB -->
    ${perm === 'full' ? `
    <div id="tab-school">
      <div class="card">
        <div class="card-header"><span>🏫</span><h2 class="card-title">ຂໍ້ມູນໂຮງຮຽນ</h2></div>
        <div class="card-body">
           <div class="form-row">
            <div class="form-group"><label class="form-label">ຊື່ໂຮງຮຽນ (ລາວ)</label><input class="form-control" id="s-name-lo" value=""></div>
            <div class="form-group"><label class="form-label">ຊື່ໂຮງຮຽນ (ອັງກິດ)</label><input class="form-control" id="s-name-en" value=""></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">ໃບອະນຸຍາດ / ທະບຽນ</label><input class="form-control" id="s-license" value=""></div>
            <div class="form-group"><label class="form-label">ຜູ້ອຳນວຍການ</label><input class="form-control" id="s-principal" value=""></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">ເບີໂທ</label><input class="form-control" id="s-phone" value=""></div>
            <div class="form-group"><label class="form-label">ອີເມລ</label><input class="form-control" id="s-email" value=""></div>
          </div>
          <div class="form-group"><label class="form-label">ທີ່ຢູ່</label><textarea class="form-control" id="s-addr"></textarea></div>
          <div class="form-group"><label class="form-label">ວິໄສທັດ</label><textarea class="form-control" id="s-vision"></textarea></div>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" onclick="saveSchoolInfo()"><i class="fas fa-save"></i> ບັນທຶກ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ACADEMIC TAB -->
    <div id="tab-academic" style="display:none">
      <div class="card">
        <div class="card-header"><span>📅</span><h2 class="card-title">ສົກຮຽນ</h2></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">ສົກຮຽນ</label><input class="form-control" id="a-year" value=""></div>
            <div class="form-group"><label class="form-label">ສະຖານະ</label><select class="form-control" id="a-status"><option value="active">ກຳລັງດຳເນີນ</option><option value="closed">ສິ້ນສຸດ</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">ວັນເປີດຮຽນ</label><input class="form-control" type="date" id="a-start" value=""></div>
            <div class="form-group"><label class="form-label">ວັນປິດຮຽນ</label><input class="form-control" type="date" id="a-end" value=""></div>
          </div>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" onclick="saveAcademicInfo()"><i class="fas fa-save"></i> ບັນທຶກ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- LOGS TAB -->
    <div id="tab-logs" style="display:none">
      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span>📋</span><h2 class="card-title">ບັນທຶກການເຂົ້າລະບົບ</h2>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <input class="form-control" id="log-filter-user" placeholder="ຄົ້ນຫາຊື່ຜູ້ໃຊ້..." style="width:160px;height:34px;">
            <input class="form-control" type="date" id="log-filter-date" style="width:150px;height:34px;">
            <button class="btn btn-primary btn-sm" onclick="loadLoginLogs()"><i class="fas fa-search"></i> ຄົ້ນຫາ</button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('log-filter-user').value='';document.getElementById('log-filter-date').value='';loadLoginLogs()"><i class="fas fa-eraser"></i> ລ້າງຄົ້ນຫາ</button>
            <button class="btn btn-danger btn-sm" onclick="clearAllLoginLogs()" title="ລ້າງປະຫວັດທັງໝົດ"><i class="fas fa-trash-alt"></i> ລ້າງທັງໝົດ</button>
          </div>
        </div>
        <div id="login-logs-table"><div style="padding:20px;text-align:center;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> ກຳລັງໂຫຼດ...</div></div>
      </div>
    </div>

    <!-- USERS TAB -->
    <div id="tab-users" style="display:none">
      <div class="card">
        <div class="card-header"><span>👥</span><h2 class="card-title">ຜູ້ໃຊ້ລະບົບ</h2>
          <button class="btn btn-primary btn-sm" onclick="openUserModal()"><i class="fas fa-plus"></i> ເພີ່ມ</button>
        </div>
        <div id="users-table"></div>
      </div>
    </div>` : ''}

    <!-- PASSWORD TAB -->
    <div id="tab-password" style="${perm==='full'?'display:none':''}">
      <div class="card" style="max-width:480px">
        <div class="card-header"><span>🔒</span><h2 class="card-title">ປ່ຽນລະຫັດຜ່ານ</h2></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">ລະຫັດຜ່ານປັດຈຸບັນ</label><input class="form-control" type="password" id="p-old" placeholder="ລະຫັດຜ່ານເກົ່າ"></div>
          <div class="form-group"><label class="form-label">ລະຫັດຜ່ານໃໝ່</label><input class="form-control" type="password" id="p-new" placeholder="ລະຫັດຜ່ານໃໝ່ (ຢ່າງໜ້ອຍ 6 ຕົວ)"></div>
          <div class="form-group"><label class="form-label">ຢືນຢັນລະຫັດຜ່ານ</label><input class="form-control" type="password" id="p-confirm" placeholder="ໃສ່ລະຫັດໃໝ່ອີກຄັ້ງ"></div>
          <button class="btn btn-primary" onclick="changePassword()"><i class="fas fa-lock"></i> ປ່ຽນລະຫັດ</button>
        </div>
      </div>
    </div>`;

  // Load data
  if (perm === 'full') {
    loadSettingsData();
    loadUsersTable();
  }

  window.switchTab = function(tab) {
    document.querySelectorAll('[id^="tab-"]').forEach(t=>t.style.display='none');
    document.getElementById('tab-'+tab).style.display = 'block';
    document.querySelectorAll('.settings-tab').forEach(b=>{
      const isActive = b.dataset.tab===tab;
      b.style.fontWeight = isActive?'700':'500';
      b.style.color = isActive?'var(--accent-green)':'var(--text-secondary)';
      b.style.borderBottomColor = isActive?'var(--accent-green)':'transparent';
    });
    if (tab==='users') loadUsersTable();
    if (tab==='logs')  loadLoginLogs();
  };

  window.changePassword = async function() {
    const o=document.getElementById('p-old').value;
    const n=document.getElementById('p-new').value;
    const c=document.getElementById('p-confirm').value;
    if (!o||!n) { toast('ຕ້ອງໃສ່ລະຫັດຜ່ານ','error'); return; }
    if (n.length<6) { toast('ລະຫັດໃໝ່ຕ້ອງຢ່າງໜ້ອຍ 6 ຕົວ','error'); return; }
    if (n!==c) { toast('ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນ ບໍ່ຕົງກັນ','error'); return; }
    const r = await apiPost(`${API}/auth.php?action=change_password`, { old_password:o, new_password:n });
    if (r.success) { toast('ປ່ຽນລະຫັດສຳເລັດ'); document.querySelectorAll('#tab-password input').forEach(i=>i.value=''); }
    else toast(r.error||'ລະຫັດເກົ່າບໍ່ຖືກຕ້ອງ','error');
  };

  window.saveSchoolInfo = async function() {
    const data = {
      school_name_lo: document.getElementById('s-name-lo').value,
      school_name_en: document.getElementById('s-name-en').value,
      license: document.getElementById('s-license').value,
      principal: document.getElementById('s-principal').value,
      phone: document.getElementById('s-phone').value,
      email: document.getElementById('s-email').value,
      address: document.getElementById('s-addr').value,
      vision: document.getElementById('s-vision').value,
    };
    const r = await apiPost(`${API}/settings.php?action=save`, data);
    if (r.success) toast('ບັນທຶກຂໍ້ມູນໂຮງຮຽນສຳເລັດແລ້ວ');
    else toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
  };

  window.saveAcademicInfo = async function() {
    const data = {
      academic_year: document.getElementById('a-year').value,
      academic_status: document.getElementById('a-status').value,
      term_start: document.getElementById('a-start').value,
      term_end: document.getElementById('a-end').value,
    };
    const r = await apiPost(`${API}/settings.php?action=save`, data);
    if (r.success) toast('ບັນທຶກຂໍ້ມູນສົກຮຽນສຳເລັດແລ້ວ');
    else toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
  };
}

async function loadSettingsData() {
  const r = await apiFetch(`${API}/settings.php?action=get`);
  if (r && r.success && r.data) {
    const d = r.data;
    if (document.getElementById('s-name-lo')) document.getElementById('s-name-lo').value = d.school_name_lo || '';
    if (document.getElementById('s-name-en')) document.getElementById('s-name-en').value = d.school_name_en || '';
    if (document.getElementById('s-license')) document.getElementById('s-license').value = d.license || '';
    if (document.getElementById('s-principal')) document.getElementById('s-principal').value = d.principal || '';
    if (document.getElementById('s-phone')) document.getElementById('s-phone').value = d.phone || '';
    if (document.getElementById('s-email')) document.getElementById('s-email').value = d.email || '';
    if (document.getElementById('s-addr')) document.getElementById('s-addr').value = d.address || '';
    if (document.getElementById('s-vision')) document.getElementById('s-vision').value = d.vision || '';
    
    if (document.getElementById('a-year')) document.getElementById('a-year').value = d.academic_year || '';
    if (document.getElementById('a-status')) document.getElementById('a-status').value = d.academic_status || 'active';
    if (document.getElementById('a-start')) document.getElementById('a-start').value = d.term_start || '';
    if (document.getElementById('a-end')) document.getElementById('a-end').value = d.term_end || '';
  }
}

async function loadUsersTable() {
  const el = document.getElementById('users-table');
  if (!el) return;
  const users = await apiFetch(`${API}/auth.php?action=list_users`);
  if (!users || users.error) { el.innerHTML='<div style="padding:20px;color:var(--text-muted)">ໂຫຼດຂໍ້ມູນຜິດພາດ</div>'; return; }
  
  const curUserId = window.currentUser ? window.currentUser().user_id : 0;

  el.innerHTML=`<div class="table-responsive"><table><thead><tr><th>ຊື່ຜູ້ໃຊ້</th><th>ສິດ</th><th>ສ້າງວັນທີ່</th><th>ສະຖານະ</th><th></th></tr></thead><tbody>
    ${users.map(u=>`<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="user-avatar" style="width:30px;height:30px;font-size:11px">${u.username[0].toUpperCase()}</div>${u.username}</div></td>
      <td><span class="badge badge-blue">${u.role}</span></td>
      <td>${fmtDate(u.created_at)}</td>
      <td><span class="badge ${u.is_active?'badge-green':'badge-gray'}">${u.is_active?'ໃຊ້ງານ':'ຢຸດ'}</span></td>
      <td style="text-align:right">
        <button class="btn btn-secondary btn-sm btn-icon" title="ແກ້ໄຂ" onclick="openUserModal(${u.user_id})"><i class="fas fa-edit"></i></button>
        ${u.role==='staff'?`<button class="btn btn-sm" title="ຈັດການສິດ" onclick="openPermModal(${u.user_id},'${u.username}')" style="margin-left:4px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:12px"><i class="fas fa-shield-alt"></i> ສິດ</button>`:''}
        ${curUserId != u.user_id ? `<button class="btn btn-sm btn-icon" title="ລົບຜູ້ໃຊ້" onclick="deleteUser(${u.user_id}, '${u.username}')" style="margin-left:4px;background:#fee2e2;color:#ef4444;border:none;cursor:pointer"><i class="fas fa-trash-alt"></i></button>` : ''}
      </td>
    </tr>`).join('')}
  </tbody></table></div>`;

  window.openUserModal = (id) => _openUserModal(id, users);
  window.openPermModal = (id, username) => _openPermModal(id, username);

  
  window.deleteUser = async function(id, username) {
    if (!(await awaitConfirm('ຢືນຢັນການລົບ', `ທ່ານໝັ້ນໃຈແທ້ບໍ່ວ່າຕ້ອງການລົບຜູ້ໃຊ້ '${username}' ອອກຈາກລະບົບ?`))) return;
    const r = await apiPost(`${API}/auth.php?action=delete_user`, { user_id: id });
    if (r.success) {
      toast('ລົບຜູ້ໃຊ້ສຳເລັດແລ້ວ');
      setTimeout(() => location.reload(), 800);
    } else {
      toast(r.error || 'ເກີດຂໍ້ຜິດພາດໃນການລົບຜູ້ໃຊ້', 'error');
    }
  };
}

function _openUserModal(id, users=[]) {
  const u = id ? users.find(x=>x.user_id==id)||{} : {};
  openModal(`<div class="modal">
    <div class="modal-header"><h2 class="modal-title">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ຜູ້ໃຊ້</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <input type="hidden" id="u-uid" value="${u.user_id||''}">
      <div class="form-group"><label class="form-label">ຊື່ຜູ້ໃຊ້ *</label><input class="form-control" id="u-name" value="${u.username||''}" placeholder="username"></div>
      <div class="form-group"><label class="form-label">ສິດ</label><select class="form-control" id="u-role">
        <option value="admin" ${u.role==='admin'?'selected':''}>admin</option>
        <option value="teacher" ${u.role==='teacher'?'selected':''}>teacher</option>
        <option value="staff" ${u.role==='staff'?'selected':''}>staff</option>
      </select></div>
      ${!id?`<div class="form-group"><label class="form-label">ລະຫັດຜ່ານ *</label><input class="form-control" type="password" id="u-pass" placeholder="ລະຫັດຜ່ານ"></div>`:''}
      <div class="form-group"><label class="form-label">ສະຖານະ</label><select class="form-control" id="u-active">
        <option value="1" ${u.is_active?'selected':''}>ໃຊ້ງານ</option>
        <option value="0" ${!u.is_active?'selected':''}>ຢຸດ</option>
      </select></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveUser()"><i class="fas fa-save"></i> ບັນທຶກ</button>
    </div>
  </div>`);

  window.saveUser = async function() {
    const data = {
      user_id: document.getElementById('u-uid').value,
      username: document.getElementById('u-name').value.trim(),
      role: document.getElementById('u-role').value,
      is_active: document.getElementById('u-active').value,
      password: document.getElementById('u-pass')?.value||'',
    };
    if (!data.username) { toast('ຕ້ອງໃສ່ຊື່ຜູ້ໃຊ້','error'); return; }
    const r = await apiPost(`${API}/auth.php?action=save_user`, data);
    if (r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); loadUsersTable(); }
    else toast(r.error||'ເກີດຂໍ້ຜິດພາດ','error');
  };
}

// ─── PERMISSION MODAL ─────────────────────────────────────────
async function _openPermModal(uid, username) {
  // Load current permissions
  const cur = await apiFetch(`${API}/permissions.php?action=get&user_id=${uid}`);

  const pages = [
    { key:'dashboard',         label:'📊 ໜ້າຫຼັກ' },
    { key:'students',          label:'🎒 ນັກຮຽນ' },
    { key:'staff',             label:'👩‍🏫 ຄູ / ພະນັກງານ' },
    { key:'classes',           label:'🚪 ຫ້ອງຮຽນ' },
    { key:'schedule',          label:'📅 ຕາລາງຮຽນ' },
    { key:'attendance',        label:'✅ ການເຂົ້າຮຽນ' },
    { key:'attendance_report', label:'📑 ລາຍງານເຂົ້າຮຽນ' },
    { key:'scores',            label:'🏆 ຄະແນນ' },
    { key:'finance',           label:'💰 ການເງິນ' },
    { key:'transport',         label:'🚌 ລົດຮັບສົ່ງ' },
    { key:'meals',             label:'🍽️ ອາຫານ' },
    { key:'health',            label:'❤️ ສຸຂະພາບ' },
    { key:'calendar',          label:'📆 ກິດຈະກຳ' },
    { key:'inventory',         label:'📦 ວັດຖຸ / ສາງ' },
    { key:'settings',          label:'⚙️ ການຕັ້ງຄ່າ' },
  ];

  const levelOpts = [
    { val:'none',     label:'ບໍ່ມີສິດ',    color:'#e5e7eb', textColor:'#6b7280' },
    { val:'readonly', label:'ເບິ່ງໄດ້',    color:'#dbeafe', textColor:'#1d4ed8' },
    { val:'limited',  label:'ຈຳກັດ',       color:'#fef3c7', textColor:'#92400e' },
    { val:'full',     label:'ເຕັມສິດ',     color:'#dcfce7', textColor:'#15803d' },
  ];

  const rows = pages.map(p => {
    const curVal = cur[p.key] || 'none';
    const btns = levelOpts.map(lv => {
      const active = curVal === lv.val;
      return `<button 
        class="perm-btn" 
        data-page="${p.key}" 
        data-level="${lv.val}"
        onclick="setPermBtn(this,'${p.key}')"
        style="
          padding:4px 10px;font-size:11px;font-weight:600;border-radius:20px;cursor:pointer;
          border:2px solid ${active ? lv.textColor : '#d1d5db'};
          background:${active ? lv.color : '#fff'};
          color:${active ? lv.textColor : '#9ca3af'};
          transition:all 0.15s;
        "
      >${lv.label}</button>`;
    }).join('');

    return `<tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:10px 12px;font-size:13px;font-weight:500;color:#374151;white-space:nowrap">${p.label}</td>
      <td style="padding:8px 12px">
        <div style="display:flex;gap:6px;flex-wrap:wrap" data-section="${p.key}">
          ${btns}
        </div>
      </td>
    </tr>`;
  }).join('');

  openModal(`<div class="modal" style="max-width:640px;width:95vw">
    <div class="modal-header" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:12px 12px 0 0">
      <h2 class="modal-title" style="color:#fff">
        <i class="fas fa-shield-alt" style="margin-right:8px"></i>
        ກຳນົດສິດ: ${username}
      </h2>
      <span class="modal-close" onclick="closeModal()" style="color:#fff;opacity:0.8">✕</span>
    </div>
    <div class="modal-body" style="padding:0;max-height:60vh;overflow-y:auto">
      <div style="padding:12px 16px;background:#f8f7ff;border-bottom:1px solid #e5e7eb;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span style="font-size:12px;font-weight:600;color:#6b7280">ຄຳອະທິບາຍ :</span>
        <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#e5e7eb;color:#6b7280">ບໍ່ມີສິດ = ເຂົ້າບໍ່ໄດ້</span>
        <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#dbeafe;color:#1d4ed8">ເບິ່ງໄດ້ = ອ່ານຢ່າງດຽວ</span>
        <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#fef3c7;color:#92400e">ຈຳກັດ = ເພີ່ມ/ແກ້ໄຂ ບາງສ່ວນ</span>
        <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#dcfce7;color:#15803d">ເຕັມສິດ = ທຸກຢ່າງ</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="modal-footer" style="justify-content:space-between">
      <button class="btn btn-secondary" onclick="_resetAllPerms()">
        <i class="fas fa-times-circle"></i> ລ້າງທົ່ວ
      </button>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
        <button class="btn btn-primary" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)" onclick="savePerms(${uid})">
          <i class="fas fa-save"></i> ບັນທຶກສິດ
        </button>
      </div>
    </div>
  </div>`);

  // ─── Perm toggle logic ───────────────────────────────────
  window.setPermBtn = function(btn, page) {
    const section = document.querySelector(`[data-section="${page}"]`);
    if (!section) return;
    section.querySelectorAll('.perm-btn').forEach(b => {
      const lv = levelOpts.find(x => x.val === b.dataset.level);
      b.style.border = `2px solid #d1d5db`;
      b.style.background = '#fff';
      b.style.color = '#9ca3af';
    });
    const lv = levelOpts.find(x => x.val === btn.dataset.level);
    btn.style.border = `2px solid ${lv.textColor}`;
    btn.style.background = lv.color;
    btn.style.color = lv.textColor;
  };

  window._resetAllPerms = function() {
    document.querySelectorAll('.perm-btn').forEach(b => {
      b.style.border = '2px solid #d1d5db';
      b.style.background = '#fff';
      b.style.color = '#9ca3af';
    });
    // Set all "ບໍ່ມີສິດ" active
    document.querySelectorAll('.perm-btn[data-level="none"]').forEach(b => {
      b.style.border = '2px solid #6b7280';
      b.style.background = '#e5e7eb';
      b.style.color = '#6b7280';
    });
  };

  window.savePerms = async function(userId) {
    const data = { user_id: userId };
    pages.forEach(p => {
      const section = document.querySelector(`[data-section="${p.key}"]`);
      let val = 'none';
      if (section) {
        // Find active btn (colored)
        const active = Array.from(section.querySelectorAll('.perm-btn')).find(b => {
          return b.style.background !== 'rgb(255, 255, 255)' && b.style.background !== '#fff' && b.style.background !== '';
        });
        if (active) val = active.dataset.level;
      }
      data[p.key] = val;
    });

    const r = await apiPost(`${API}/permissions.php?action=save`, data);
    if (r.success) {
      closeModal();
      toast(`ບັນທຶກສິດຂອງ ${username} ສຳເລັດ ✓`);
    } else {
      toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
    }
  };
}

// ─── LOGIN LOGS ─────────────────────────────────────────────────────────────
async function loadLoginLogs() {
  const el = document.getElementById('login-logs-table');
  if (!el) return;

  const userFilter = document.getElementById('log-filter-user')?.value.trim() || '';
  const dateFilter = document.getElementById('log-filter-date')?.value || '';

  el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> ກຳລັງໂຫຼດ...</div>';

  const qs = new URLSearchParams({ limit: 200 });
  if (userFilter) qs.set('username', userFilter);
  if (dateFilter) qs.set('date', dateFilter);

  const rows = await apiFetch(`${API}/auth.php?action=login_logs&${qs}`);
  if (!Array.isArray(rows)) {
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">ໂຫຼດຂໍ້ມູນຜິດພາດ (ຕ້ອງ Admin)</div>';
    return;
  }

  if (!rows.length) {
    el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-muted)"><i class="fas fa-clipboard" style="font-size:32px;opacity:.3"></i><br><br>ຍັງບໍ່ມີຂໍ້ມູນການເຂົ້າລະບົບ</div>';
    return;
  }

  const LAO_MONTHS = ['ມ.ກ.','ກ.ພ.','ມີ.ນ.','ເມ.ສ.','ພ.ພ.','ມິ.ຖ.','ກ.ລ.','ສ.ຫ.','ກ.ຍ.','ຕ.ລ.','ພ.ຈ.','ທ.ວ.'];
  const roleLabel = { admin: '👑 ຜູ້ດູແລ', teacher: '📚 ຄູສອນ', staff: '🏢 ພະນັກງານ' };

  const fmtLogDate = (dt) => {
    const d = new Date(dt);
    if (isNaN(d)) return { date: dt, time: '-', period: { label: '-', color: '#f1f5f9', text: '#6b7280' } };
    const day   = d.getDate();
    const month = LAO_MONTHS[d.getMonth()];
    const year  = d.getFullYear() + 543;
    const hh    = d.getHours();
    const mm    = String(d.getMinutes()).padStart(2, '0');
    const ss    = String(d.getSeconds()).padStart(2, '0');
    const timeStr = `${String(hh).padStart(2,'0')}:${mm}:${ss}`;
    let period;
    if      (hh >= 5  && hh < 12) period = { label: '🌅 ຕອນເຊົ້າ', color: '#f0fdf4', text: '#15803d' };
    else if (hh >= 12 && hh < 17) period = { label: '☀️ ຕອນສວຍ',  color: '#fffbeb', text: '#92400e' };
    else if (hh >= 17 && hh < 21) period = { label: '🌆 ຕອນແລງ',  color: '#fff7ed', text: '#c2410c' };
    else                           period = { label: '🌙 ຕອນຄ່ຳ',   color: '#f1f5f9', text: '#475569' };
    return { date: `${day} ${month} ${year}`, time: timeStr, period };
  };

  el.innerHTML = `
    <div style="padding:10px 16px;background:#f8fafc;border-bottom:1px solid var(--border);font-size:12px;color:var(--text-muted);">
      <i class="fas fa-info-circle"></i> ພົບທັງໝົດ <strong>${rows.length}</strong> ລາຍການ
    </div>
    <div class="table-responsive">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;">
            <th style="padding:10px 12px;text-align:center;width:50px;">ລ/ດ</th>
            <th style="padding:10px 12px;text-align:left;min-width:130px;">ຊື່ຜູ້ໃຊ້</th>
            <th style="padding:10px 12px;text-align:center;min-width:100px;">ສິດ</th>
            <th style="padding:10px 12px;text-align:center;min-width:130px;">ວັນທີ</th>
            <th style="padding:10px 12px;text-align:center;min-width:90px;">ເວລາ</th>
            <th style="padding:10px 12px;text-align:center;min-width:120px;">ຊ່ວງເວລາ</th>
            <th style="padding:10px 12px;text-align:center;min-width:110px;">IP Address</th>
            <th style="padding:10px 12px;text-align:center;width:60px;"><i class="fas fa-cog"></i></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r, i) => {
            const fmt  = fmtLogDate(r.logged_at);
            const bg   = i % 2 === 0 ? '#fff' : '#f8fafc';
            const rl   = roleLabel[r.role] || r.role;
            const roleBg  = r.role === 'admin' ? '#fef3c7' : r.role === 'teacher' ? '#dbeafe' : '#f0fdf4';
            const roleClr = r.role === 'admin' ? '#92400e' : r.role === 'teacher' ? '#1d4ed8' : '#15803d';
            return `<tr style="background:${bg};border-bottom:1px solid #f1f5f9;"
                        onmouseover="this.style.background='#eff6ff'"
                        onmouseout="this.style.background='${bg}'">
              <td style="padding:9px 12px;text-align:center;color:#9ca3af;font-size:11px;">${i + 1}</td>
              <td style="padding:9px 12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">
                    ${(r.username || '?')[0].toUpperCase()}
                  </div>
                  <strong style="color:var(--text-primary);">${r.username}</strong>
                </div>
              </td>
              <td style="padding:9px 12px;text-align:center;">
                <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${roleBg};color:${roleClr};">${rl}</span>
              </td>
              <td style="padding:9px 12px;text-align:center;font-weight:600;color:var(--text-primary);">${fmt.date}</td>
              <td style="padding:9px 12px;text-align:center;font-family:monospace;color:#374151;">${fmt.time}</td>
              <td style="padding:9px 12px;text-align:center;">
                <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${fmt.period.color};color:${fmt.period.text};">${fmt.period.label}</span>
              </td>
              <td style="padding:9px 12px;text-align:center;font-size:11px;color:#6b7280;font-family:monospace;">${r.ip_address || '-'}</td>
              <td style="padding:9px 12px;text-align:center;">
                <button class="btn btn-danger btn-sm btn-icon" onclick="deleteLoginLog(${r.log_id})" title="ລົບລາຍການນີ້" style="padding:4px 8px;font-size:12px;"><i class="fas fa-trash"></i></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  window.loadLoginLogs = loadLoginLogs;

  window.deleteLoginLog = async function(logId) {
    if (!(await awaitConfirm('ຢືນຢັນການລົບ', 'ທ່ານຕ້ອງການລົບປະຫວັດການເຂົ້າລະບົບລາຍການນີ້ແທ້ບໍ່?'))) return;
    const r = await apiPost(`${API}/auth.php?action=delete_login_log`, { log_id: logId });
    if (r.success) {
      toast('ລົບປະຫວັດສຳເລັດແລ້ວ');
      loadLoginLogs();
    } else {
      toast(r.error || 'ລົບບໍ່ສຳເລັດ', 'error');
    }
  };

  window.clearAllLoginLogs = async function() {
    if (!(await awaitConfirm('ຢືນຢັນການລ້າງປະຫວັດທັງໝົດ', 'ປະຫວັດການເຂົ້າລະບົບທັງໝົດຈະຖືກລຶບ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້! ທ່ານໝັ້ນໃຈແທ້ບໍ່?'))) return;
    const r = await apiPost(`${API}/auth.php?action=clear_login_logs`, {});
    if (r.success) {
      toast('ລ້າງປະຫວັດການເຂົ້າລະບົບທັງໝົດສຳເລັດແລ້ວ');
      loadLoginLogs();
    } else {
      toast(r.error || 'ລ້າງບໍ່ສຳເລັດ', 'error');
    }
  };
}
