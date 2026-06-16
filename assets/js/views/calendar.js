// views/calendar.js
const LAO_MONTHS = ['ມັງກອນ','ກຸມພາ','ມີນາ','ເມສາ','ພຶດສະພາ','ມິຖຸນາ','ກໍລະກົດ','ສິງຫາ','ກັນຍາ','ຕຸລາ','ພະຈິກ','ທັນວາ'];
const LAO_DAYS = ['ອາທິດ','ຈັນ','ອັງຄານ','ພຸດ','ພະຫັດ','ສຸກ','ເສົາ'];
let events = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentPerm = 'full';

function escHtml(v='') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function render(el, perm='full') {
  currentPerm = perm;
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  await loadEventsFromDb(el);
}

async function loadEventsFromDb(el) {
  try {
    const res = await apiFetch(`${API}/calendar.php?action=list`);
    if (res?.error) throw new Error(res.error);
    events = Array.isArray(res) ? res : [];
  } catch (e) {
    events = [];
    toast('ໂຫຼດຂໍ້ມູນປະຕິທິນບໍ່ສຳເລັດ', 'error');
    console.error('Calendar load error:', e);
  }

  const cur = new Date(currentYear, currentMonth, 1);
  drawCal(el, cur);
}

function drawCal(el, cur) {
  currentYear = cur.getFullYear();
  currentMonth = cur.getMonth();

  const y=cur.getFullYear(), m=cur.getMonth();
  const first = new Date(y,m,1).getDay();
  const days = new Date(y,m+1,0).getDate();
  const today = new Date();

  const prev = new Date(y,m-1,1);
  const next = new Date(y,m+1,1);

  let cells = '';
  for(let i=0;i<first;i++) cells+='<div style="padding:8px;"></div>';
  for(let d=1;d<=days;d++) {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const ev = events.filter(e=>e.date===ds);
    const isToday = y===today.getFullYear()&&m===today.getMonth()&&d===today.getDate();
    cells+=`<div style="padding:6px;min-height:70px;border:1px solid var(--border);border-radius:6px;background:${isToday?'#f0fdf4':'white'};position:relative">
      <div style="font-weight:${isToday?'800':'500'};color:${isToday?'var(--accent-green)':'var(--text-primary)'};font-size:13px">${d}</div>
      ${ev.map(e=>`<div style="background:${e.color};color:white;font-size:10px;padding:2px 6px;border-radius:4px;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${e.title}</div>`).join('')}
    </div>`;
  }

  el.innerHTML=`
    <div class="page-header">
      <h2 class="page-title">ປະຕິທິນ</h2>
      ${currentPerm === 'full' ? '<button class="btn btn-primary" onclick="openEventModal()"><i class="fas fa-plus"></i> ເພີ່ມກິດຈະກຳ</button>' : ''}
    </div>
    <div class="card">
      <div class="card-header">
        <button class="btn btn-secondary btn-sm" onclick="navMonth('prev')"><i class="fas fa-chevron-left"></i></button>
        <h2 class="card-title" style="text-align:center">${LAO_MONTHS[m]} ${y}</h2>
        <button class="btn btn-secondary btn-sm" onclick="navMonth('next')"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
          ${LAO_DAYS.map(d=>`<div style="text-align:center;font-weight:700;font-size:12px;color:var(--text-secondary);padding:4px">${d}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${cells}</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-header"><span>📅</span><h2 class="card-title">ກິດຈະກຳທີ່ກຳລັງຈະມາ</h2></div>
      <div class="card-body">
        ${events.length ? events.map(e=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:12px;height:36px;border-radius:4px;background:${e.color};flex-shrink:0"></div>
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${escHtml(e.title)}</div><div style="font-size:12px;color:var(--text-muted)">${escHtml(e.date)}</div></div>
          ${currentPerm === 'full' ? `
            <button class="btn btn-secondary btn-sm" onclick="openEventModal(${e.event_id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteEvent(${e.event_id})"><i class="fas fa-trash"></i></button>
          ` : ''}
        </div>`).join('') : '<p class="text-muted" style="padding:8px 0">ຍັງບໍ່ມີກິດຈະກຳ</p>'}
      </div>
    </div>`;

  window.navMonth = function(dir) {
    drawCal(el, dir==='next'?next:prev);
  };
  window.openEventModal = function(eventId=0) {
    const found = Number(eventId) ? events.find(x => Number(x.event_id) === Number(eventId)) : null;
    const isEdit = !!found;
    const defaultDate = found?.date || new Date().toISOString().split('T')[0];
    const defaultTitle = found?.title || '';
    const defaultColor = found?.color || '#22c55e';

    openModal(`<div class="modal">
      <div class="modal-header"><h2 class="modal-title">${isEdit ? 'ແກ້ໄຂກິດຈະກຳ' : 'ເພີ່ມກິດຈະກຳ'}</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">ຊື່ກິດຈະກຳ *</label><input class="form-control" id="ev-title" placeholder="ງານ..." value="${escHtml(defaultTitle)}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">ວັນທີ່</label><input class="form-control" type="date" id="ev-date" value="${escHtml(defaultDate)}"></div>
          <div class="form-group"><label class="form-label">ສີ</label><input class="form-control" type="color" id="ev-color" value="${escHtml(defaultColor)}" style="height:40px;padding:4px"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
        <button class="btn btn-primary" onclick="saveEvent(${isEdit ? Number(found.event_id) : 0})"><i class="fas fa-save"></i> ບັນທຶກ</button>
      </div>
    </div>`);
    window.saveEvent = async function(editEventId=0) {
      const t=document.getElementById('ev-title').value.trim();
      const d=document.getElementById('ev-date').value;
      const c=document.getElementById('ev-color').value;
      if(!t||!d){toast('ຕ້ອງໃສ່ຊື່ ແລະ ວັນທີ່','error');return;}

      const payload = { event_date:d, title:t, color:c };
      if (Number(editEventId) > 0) payload.event_id = Number(editEventId);

      const res = await apiPost(`${API}/calendar.php?action=save`, payload);
      if(!res?.success){toast(res?.error||'ບັນທຶກບໍ່ສຳເລັດ','error');return;}

      closeModal();
      toast(Number(editEventId) > 0 ? 'ແກ້ໄຂກິດຈະກຳສຳເລັດ' : 'ເພີ່ມກິດຈະກຳສຳເລັດ');
      await loadEventsFromDb(el);
    };
  };

  window.deleteEvent = async function(eventId) {
    if (!Number(eventId)) return;
    if (!(await awaitConfirm('ຢືນຢັນການລົບກິດຈະກຳນີ້?'))) return;

    const res = await apiPost(`${API}/calendar.php?action=delete`, { event_id: Number(eventId) });
    if(!res?.success){toast(res?.error||'ລົບບໍ່ສຳເລັດ','error');return;}

    toast('ລົບກິດຈະກຳສຳເລັດ');
    await loadEventsFromDb(el);
  };
}
