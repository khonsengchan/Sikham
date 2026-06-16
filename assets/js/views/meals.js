// views/meals.js
const DAYS = ['ຈັນ','ອັງຄານ','ພຸດ','ພະຫັດ','ສຸກ'];
const TIMES = ['ອາຫານເຊົ້າ','ອາຫານວ່າງເຊົ້າ','ອາຫານທ່ຽງ','ອາຫານວ່າງບ່າຍ'];
const ICONS = { 'ອາຫານເຊົ້າ':'🌅', 'ອາຫານວ່າງເຊົ້າ':'🥐', 'ອາຫານທ່ຽງ':'🍱', 'ອາຫານວ່າງບ່າຍ':'🧃' };
const TIME_COLORS = { 'ອາຫານເຊົ້າ':'#fef3c7', 'ອາຫານວ່າງເຊົ້າ':'#e0e7ff', 'ອາຫານທ່ຽງ':'#dcfce7', 'ອາຫານວ່າງບ່າຍ':'#fae8ff' };
let currentPerm = 'full';

export async function render(el, perm='full') {
  currentPerm = perm;
  const monday = getMonday(new Date()).toISOString().split('T')[0];
  loadWeek(el, monday);
}

function getMonday(d) {
  const day = d.getDay(), diff = d.getDate() - day + (day===0?-6:1);
  return new Date(d.setDate(diff));
}

async function loadWeek(el, monday) {
  const canEdit = currentPerm === 'full';
  const meals = await apiFetch(`${API}/meals.php?action=list&week=${monday}`);
  const map = {};
  meals.forEach(m => { map[m.day_of_week+m.meal_time] = m; });

  const nextMon = new Date(monday); nextMon.setDate(nextMon.getDate()+7);
  const prevMon = new Date(monday); prevMon.setDate(prevMon.getDate()-7);

  // Modern Styles specific to this view
  const styleHtml = `
    <style>
      .meals-board {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        overflow-x: auto;
        padding-bottom: 12px;
      }
      @media(max-width: 1024px) { .meals-board { grid-template-columns: repeat(5, minmax(220px, 1fr)); } }
      .meal-col {
        background: #f8fafc;
        border-radius: 16px;
        padding: 16px;
        border: 1px solid var(--border);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
      }
      .meal-col-header {
        font-weight: 800;
        font-size: 16px;
        text-align: center;
        padding-bottom: 12px;
        border-bottom: 2px dashed #cbd5e1;
        margin-bottom: 16px;
        color: var(--text-primary);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
      }
      .meal-card {
        background: #fff;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        border: 1px solid var(--border);
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .meal-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.08);
      }
      .meal-card.empty {
        background: transparent;
        border: 2px dashed #cbd5e1;
        box-shadow: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        cursor: pointer;
      }
      .meal-card.empty:hover {
        background: #fff;
        border-color: var(--accent-blue);
      }
      .meal-time-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        align-self: flex-start;
      }
      .meal-desc {
        font-size: 13.5px;
        color: var(--text-primary);
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .meal-actions {
        display: flex;
        gap: 6px;
        margin-top: auto;
        padding-top: 8px;
        border-top: 1px solid #f1f5f9;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .meal-card:hover .meal-actions { opacity: 1; }
      @media(max-width: 768px) { .meal-actions { opacity: 1; } }
      
      .btn-meal-action {
        flex: 1;
        padding: 6px;
        border: none;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
        transition: background 0.2s;
      }
      .btn-edit-meal { background: #eff6ff; color: #1d4ed8; }
      .btn-edit-meal:hover { background: #dbeafe; }
      .btn-del-meal { background: #fef2f2; color: #b91c1c; }
      .btn-del-meal:hover { background: #fee2e2; }
    </style>
  `;

  // Parse monday date for header display
  const mDate = new Date(monday);
  const weekDates = DAYS.map((d, i) => {
    const dt = new Date(mDate);
    dt.setDate(dt.getDate() + i);
    return `${dt.getDate()}/${dt.getMonth()+1}`;
  });

  let columnsHtml = '';
  DAYS.forEach((d, i) => {
    let cardsHtml = '';
    TIMES.forEach(t => {
      const m = map[d+t];
      const icon = ICONS[t] || '🍽️';
      const tColor = TIME_COLORS[t] || '#f1f5f9';
      
      if (m) {
        cardsHtml += `
          <div class="meal-card">
            <div class="meal-time-badge" style="background:${tColor};">
              <span style="font-size:14px">${icon}</span> ${t}
            </div>
            <div class="meal-desc">${m.menu_description}</div>
            ${canEdit ? `
              <div class="meal-actions">
                <button class="btn-meal-action btn-edit-meal" onclick="openMealModal('${d}','${t}','${monday}',${m.meal_id},'${m.menu_description.replace(/'/g,"\\'").replace(/\n/g,"\\n")}')">
                  <i class="fas fa-edit"></i> ແກ້ໄຂ
                </button>
                <button class="btn-meal-action btn-del-meal" onclick="deleteMeal(${m.meal_id},'${monday}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        cardsHtml += `
          <div class="meal-card empty" ${canEdit ? `onclick="openMealModal('${d}','${t}','${monday}',0,'')"` : ''}>
            <div style="font-size:24px;opacity:0.5;margin-bottom:4px">${icon}</div>
            <span style="color:var(--text-muted);font-size:12px;font-weight:500;">
              ${t}<br>
              ${canEdit ? '<span style="color:var(--accent-blue)"><i class="fas fa-plus"></i> ເພີ່ມລາຍການ</span>' : 'ຍັງບໍ່ໄດ້ກຳໜົດ'}
            </span>
          </div>
        `;
      }
    });

    columnsHtml += `
      <div class="meal-col">
        <div class="meal-col-header">
          <span>${d}</span>
          <span style="font-size:12px;font-weight:600;color:var(--text-muted);background:#fff;padding:2px 8px;border-radius:12px;border:1px solid var(--border)">${weekDates[i]}</span>
        </div>
        ${cardsHtml}
      </div>
    `;
  });

  el.innerHTML = `
    ${styleHtml}
    <div class="page-header" style="background:linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; border-radius: 16px; color: white; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(59,130,246,0.3);">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="background:rgba(255,255,255,0.2); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">🍽️</div>
        <div>
          <h2 class="page-title" style="color:white; margin:0; font-size:22px; text-shadow:0 1px 2px rgba(0,0,0,0.2);">ລາຍການອາຫານ ປະຈຳອາທິດ</h2>
          <p style="margin:4px 0 0 0; font-size:13px; color:#bfdbfe;">ຈັດການເມນູອາຫານເຊົ້າ, ວ່າງ ແລະ ທ່ຽງ ສຳລັບນັກຮຽນ</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center; background:rgba(0,0,0,0.2); padding:6px 12px; border-radius:20px;">
        ${!canEdit ? `<span class="badge badge-yellow" style="margin-right:8px;border:none"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>` : ''}
        <button class="btn btn-secondary btn-sm" style="background:rgba(255,255,255,0.1);border:none;color:white" onclick="loadMealsWeek('${prevMon.toISOString().split('T')[0]}')"><i class="fas fa-chevron-left"></i></button>
        <span style="font-size:14px;font-weight:700;color:#fff;min-width:100px;text-align:center;">${fmtDate(monday)}</span>
        <button class="btn btn-secondary btn-sm" style="background:rgba(255,255,255,0.1);border:none;color:white" onclick="loadMealsWeek('${nextMon.toISOString().split('T')[0]}')"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
    
    <div class="meals-board">
      ${columnsHtml}
    </div>
  `;

  window.loadMealsWeek = (w) => loadWeek(el, w);
  if (canEdit) {
    window.openMealModal = (day, time, week, id, desc) => _openModal(day, time, week, id, desc, el);
    window.deleteMeal = async (id, week) => {
      // Prevent event bubbling if clicked from a wrapper
      if(window.event) window.event.stopPropagation();
      if (!(await awaitConfirm('ຢືນຢັນການລົບ', 'ຕ້ອງການລຶບລາຍການອາຫານນີ້ແທ້ບໍ່?'))) return;
      await apiPost(`${API}/meals.php?action=delete`, { meal_id: id });
      toast('ລຶບສຳເລັດແລ້ວ', 'success'); loadWeek(el, week);
    };
  }
}

function _openModal(day, time, week, id, desc, el) {
  // Prevent event bubbling
  if(window.event) window.event.stopPropagation();
  
  const icon = ICONS[time] || '🍽️';
  openModal(`<div class="modal" style="max-width: 500px;">
    <div class="modal-header" style="background:#f8fafc;border-bottom:1px solid var(--border)">
      <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:24px">${icon}</span>
        <div>
          <div style="font-size:16px;font-weight:800;color:var(--text-primary)">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ເມນູອາຫານ</div>
          <div style="font-size:12px;font-weight:500;color:var(--text-secondary);margin-top:2px;">ວັນ${day} • ${time}</div>
        </div>
      </h2>
      <span class="modal-close" style="background:#e2e8f0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body" style="padding:24px;">
      <input type="hidden" id="f-mid" value="${id}">
      <input type="hidden" id="f-day" value="${day}">
      <input type="hidden" id="f-time" value="${time}">
      <input type="hidden" id="f-week" value="${week}">
      
      <div class="form-group">
        <label class="form-label" style="font-weight:700;color:var(--text-primary);">ລາຍການອາຫານ (ສ່ວນປະກອບ) <span style="color:var(--accent-red)">*</span></label>
        <textarea class="form-control" id="f-mdesc" rows="5" style="resize:none;font-size:14px;padding:12px;border-radius:12px;" placeholder="ຕົວຢ່າງ:
- ເຂົ້າປຽກໄກ່
- ນົມສົດ 1 ກ່ອງ
- ໝາກກ້ວຍ 1 ໜ່ວຍ">${desc}</textarea>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">
          <i class="fas fa-lightbulb" style="color:var(--accent-yellow)"></i> ພິມລາຍລະອຽດແຕ່ລະແຖວເພື່ອໃຫ້ອ່ານງ່າຍ
        </div>
      </div>
    </div>
    <div class="modal-footer" style="background:#f8fafc;border-top:1px solid var(--border);padding:16px 24px;">
      <button class="btn btn-secondary" style="border-radius:8px;font-weight:600;" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" style="border-radius:8px;font-weight:600;display:flex;align-items:center;gap:6px;" onclick="saveMeal()">
        <i class="fas fa-save"></i> ບັນທຶກລາຍການ
      </button>
    </div>
  </div>`);

  window.saveMeal = async function() {
    const data = {
      meal_id: document.getElementById('f-mid').value,
      day_of_week: document.getElementById('f-day').value,
      meal_time: document.getElementById('f-time').value,
      menu_description: document.getElementById('f-mdesc').value.trim(),
      week_date: document.getElementById('f-week').value,
    };
    if (!data.menu_description) { toast('ກະລຸນາປ້ອນລາຍການອາຫານ','error'); return; }
    const r = await apiPost(`${API}/meals.php?action=save`, data);
    if (r.success) { closeModal(); toast('ບັນທຶກສຳເລັດແລ້ວ', 'success'); loadWeek(el, data.week_date); }
    else toast('ເກີດຂໍ້ຜິດພາດ','error');
  };
}
