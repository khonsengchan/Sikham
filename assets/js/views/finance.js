// views/finance.js
export async function render(el, perm='full') {
  const [summary, cats] = await Promise.all([
    apiFetch(`${API}/finance.php?action=summary`),
    apiFetch(`${API}/finance.php?action=categories`),
  ]);
  const txns = await apiFetch(`${API}/finance.php?action=list`);
  drawPage(el, summary, txns, cats, perm);
}

function drawPage(el, sum, txns, cats, perm='full') {
  const canEdit = perm === 'full';
  const canAdd = perm === 'full' || perm === 'limited';
  const { income = 0, expense = 0, profit = 0, overdue = 0, pending = 0 } = sum || {};

  const isTuition = (catName) => (catName || '').includes('ຄ່າຮຽນ') || (catName || '').includes('ຄ່າເທີມ');
  const tuitionTxns = txns.filter(t => isTuition(t.category_name));
  const generalTxns = txns.filter(t => !isTuition(t.category_name));

  const renderTabGroup = (txnsList, typePrefix) => {
    if (typePrefix === 'general') {
      return `
        <div id="main-section-${typePrefix}" style="display: none;">
          <div id="status-section-${typePrefix}-all" style="display: block;">
            ${renderStatusSection('general', txnsList, cats, canEdit, canAdd, 'ລາຍການທົ່ວໄປ', typePrefix)}
          </div>
        </div>
      `;
    }

    const paidTxns = txnsList.filter(t => t.status === 'paid');
    const pendingTxns = txnsList.filter(t => t.status === 'pending');
    const overdueTxns = txnsList.filter(t => t.status === 'overdue');

    return `
      <div id="main-section-${typePrefix}" style="display: ${typePrefix === 'tuition' ? 'block' : 'none'};">
        <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 0;">
          <button id="tab-btn-${typePrefix}-pending" class="btn" onclick="switchFinTab('${typePrefix}', 'pending')" style="padding: 12px 24px; font-size: 14px; font-weight: 600; background: transparent; border: none; border-bottom: 3px solid var(--accent-blue); color: var(--accent-blue); border-radius: 0; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
            <i class="fas fa-clock"></i> ລໍຖ້າຊຳລະ 
            <span style="background: var(--accent-blue-light); color: var(--accent-blue); padding: 2px 8px; border-radius: 12px; font-size: 11px;">${pendingTxns.length}</span>
          </button>
          <button id="tab-btn-${typePrefix}-overdue" class="btn" onclick="switchFinTab('${typePrefix}', 'overdue')" style="padding: 12px 24px; font-size: 14px; font-weight: 600; background: transparent; border: none; border-bottom: 3px solid transparent; color: var(--text-secondary); border-radius: 0; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
            <i class="fas fa-exclamation-circle"></i> ຄ້າງຊຳລະ 
            <span style="background: #f1f5f9; color: var(--text-secondary); padding: 2px 8px; border-radius: 12px; font-size: 11px;">${overdueTxns.length}</span>
          </button>
          <button id="tab-btn-${typePrefix}-paid" class="btn" onclick="switchFinTab('${typePrefix}', 'paid')" style="padding: 12px 24px; font-size: 14px; font-weight: 600; background: transparent; border: none; border-bottom: 3px solid transparent; color: var(--text-secondary); border-radius: 0; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
            <i class="fas fa-check-circle"></i> ຊຳລະແລ້ວ 
            <span style="background: #f1f5f9; color: var(--text-secondary); padding: 2px 8px; border-radius: 12px; font-size: 11px;">${paidTxns.length}</span>
          </button>
        </div>
        <div id="status-section-${typePrefix}-pending" style="display: block;">
          ${renderStatusSection('pending', pendingTxns, cats, canEdit, canAdd, 'ລໍຖ້າຊຳລະ', typePrefix)}
        </div>
        <div id="status-section-${typePrefix}-overdue" style="display: none;">
          ${renderStatusSection('overdue', overdueTxns, cats, canEdit, canAdd, 'ຄ້າງຊຳລະ', typePrefix)}
        </div>
        <div id="status-section-${typePrefix}-paid" style="display: none;">
          ${renderStatusSection('paid', paidTxns, cats, canEdit, canAdd, 'ຊຳລະແລ້ວ', typePrefix)}
        </div>
      </div>
    `;
  };

  el.innerHTML = `
    <div class="page-shell fade-up">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 56px; height: 56px; background: var(--accent-blue-light); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--accent-blue); font-size: 24px;">
            <i class="fas fa-chart-line"></i>
          </div>
          <div>
            <h2 class="page-title" style="margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px;">ການເງິນໂຮງຮຽນ</h2>
            <p style="margin: 2px 0 0 0; color: var(--text-secondary); font-size: 13px;">ສະຫຼຸບທາງການເງິນ</p>
          </div>
        </div>
        ${canAdd ? `
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" onclick="openTuitionModal()" style="padding: 10px 20px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <i class="fas fa-graduation-cap"></i> ເພີ່ມຄ່າເທີມ
          </button>
          <button class="btn btn-secondary" onclick="openFinModal()" style="padding: 10px 20px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background: white; border: 1px solid var(--border); color: var(--text-primary);">
            <i class="fas fa-plus"></i> ເພີ່ມລາຍການທົ່ວໄປ
          </button>
        </div>
        ` : ''}
      </div>

      <!-- Financial Summary Cards Grid using system CSS -->
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-info" style="flex: 1;">
            <div class="stat-label">ລາຍຮັບ</div>
            <div class="stat-value" style="color: #10b981;">${numFmt(income)}</div>
          </div>
          <div class="stat-icon green">
            <i class="fas fa-arrow-down"></i>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info" style="flex: 1;">
            <div class="stat-label">ລາຍຈ່າຍ</div>
            <div class="stat-value" style="color: #ef4444;">${numFmt(expense)}</div>
          </div>
          <div class="stat-icon red">
            <i class="fas fa-arrow-up"></i>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info" style="flex: 1;">
            <div class="stat-label">ຍອດເຫຼືອ</div>
            <div class="stat-value" style="color: ${profit >= 0 ? '#3b82f6' : '#ef4444'};">${numFmt(profit)}</div>
          </div>
          <div class="stat-icon ${profit >= 0 ? 'blue' : 'red'}">
            <i class="fas fa-chart-pie"></i>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="scrollToStatus('overdue')">
          <div class="stat-info" style="flex: 1;">
            <div class="stat-label">ຄ້າງຊຳລະ</div>
            <div class="stat-value" style="color: #f97316;">${numFmt(overdue)}</div>
          </div>
          <div class="stat-icon orange">
            <i class="fas fa-hourglass-end"></i>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="scrollToStatus('pending')">
          <div class="stat-info" style="flex: 1;">
            <div class="stat-label">ລໍຖ້າ</div>
            <div class="stat-value" style="color: #3b82f6;">${numFmt(pending)}</div>
          </div>
          <div class="stat-icon blue">
            <i class="fas fa-clock"></i>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <button id="main-tab-btn-tuition" class="btn" onclick="switchMainFinTab('tuition')" style="padding: 10px 24px; font-size: 15px; font-weight: 600; background: var(--accent-blue); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <i class="fas fa-graduation-cap"></i> ລາຍງານຄ່າເທີມ
        </button>
        <button id="main-tab-btn-general" class="btn" onclick="switchMainFinTab('general')" style="padding: 10px 24px; font-size: 15px; font-weight: 600; background: white; color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px;">
          <i class="fas fa-wallet"></i> ລາຍງານທົ່ວໄປ
        </button>
      </div>

      ${renderTabGroup(tuitionTxns, 'tuition')}
      ${renderTabGroup(generalTxns, 'general')}

    </div>`;

  if (canAdd) {
    window.openFinModal = (id) => _openModal(id, txns, cats);
    window.openTuitionModal = (id) => _openTuitionModal(id, txns, cats);
  }
  if (canEdit) window.deleteTx = (id) => _delete(id);

  window.currentMainFinTab = 'tuition';
  
  window.switchMainFinTab = (tabId) => {
    window.currentMainFinTab = tabId;
    ['tuition', 'general'].forEach(id => {
      const section = document.getElementById(`main-section-${id}`);
      const btn = document.getElementById(`main-tab-btn-${id}`);
      if (section && btn) {
        if (id === tabId) {
          section.style.display = 'block';
          btn.style.background = 'var(--accent-blue)';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
          section.style.display = 'none';
          btn.style.background = 'white';
          btn.style.color = 'var(--text-primary)';
          btn.style.border = '1px solid var(--border)';
          btn.style.boxShadow = 'none';
        }
      }
    });
  };

  window.switchFinTab = (typePrefix, tabId) => {
    ['paid', 'pending', 'overdue'].forEach(id => {
      const section = document.getElementById(`status-section-${typePrefix}-${id}`);
      const btn = document.getElementById(`tab-btn-${typePrefix}-${id}`);
      if (section && btn) {
        if (id === tabId) {
          section.style.display = 'block';
          btn.style.borderBottom = '3px solid var(--accent-blue)';
          btn.style.color = 'var(--accent-blue)';
          const span = btn.querySelector('span');
          if (span) {
            span.style.background = 'var(--accent-blue-light)';
            span.style.color = 'var(--accent-blue)';
          }
        } else {
          section.style.display = 'none';
          btn.style.borderBottom = '3px solid transparent';
          btn.style.color = 'var(--text-secondary)';
          const span = btn.querySelector('span');
          if (span) {
            span.style.background = '#f1f5f9';
            span.style.color = 'var(--text-secondary)';
          }
        }
      }
    });
  };

  window.scrollToStatus = (status) => {
    window.switchFinTab(window.currentMainFinTab, status);
    const el = document.getElementById(`tab-btn-${window.currentMainFinTab}-${status}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  window.updateStatus = (txId, newStatus) => _updateStatus(txId, newStatus, txns);
}

function renderStatusSection(status, txns, cats, canEdit, canAdd, title, typePrefix) {
  const statusColors = {
    paid: { bg: '#d1fae5', text: '#047857', border: '#86efac', icon: 'fa-check-circle' },
    pending: { bg: '#dbeafe', text: '#2563eb', border: '#60a5fa', icon: 'fa-clock' },
    overdue: { bg: '#fef3c7', text: '#d97706', border: '#fde68a', icon: 'fa-exclamation-circle' },
    general: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', icon: 'fa-list' }
  };
  const color = statusColors[status];
  const count = txns.length;
  const totalAmount = txns.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return `
    <div id="status-${status}" class="card" style="overflow: hidden; margin-bottom: 20px;">
      <div style="padding: 16px 20px; background: linear-gradient(135deg, ${color.bg} 0%, ${color.border} 100%); display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <i class="fas ${color.icon}" style="color: ${color.text}; font-size: 20px;"></i>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${color.text};">${title}</h3>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: ${color.text}; opacity: 0.7;">${count} ລາຍການ • ລວມ: ${numFmt(totalAmount)} ກີບ</p>
          </div>
        </div>
        ${canAdd ? `<button class="btn btn-sm" style="background: ${color.text}; color: white; border: none;" onclick="${typePrefix === 'tuition' ? 'openTuitionModal()' : 'openFinModal()'}"><i class="fas fa-plus"></i></button>` : ''}
      </div>
      
      <div class="table-responsive" style="max-height: 500px; overflow-y: auto; border-top: 1px solid var(--border);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="position: sticky; top: 0; z-index: 10; background: #f9fafb; box-shadow: inset 0 -2px 0 var(--border), 0 2px 4px rgba(0,0,0,0.05);">
            <tr>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ລາຍການ</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ໝວດ</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ປະເພດ</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ຈຳນວນ</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ນັກຮຽນ</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${status === 'paid' ? 'ວັນທີ່ຊຳລະ' : 'ວັນທີ່ລົງບັນຊີ'}</th>
              ${(status !== 'paid' && status !== 'general') ? `<th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ວັນກຳນົດຈ່າຍ</th>` : ''}
              ${canEdit ? '<th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-secondary); font-size: 13px;">ຈັດການ</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${txns.length ? txns.map((t, idx) => `
              <tr style="border-bottom: 1px solid var(--border); ${idx % 2 === 0 ? 'background: #f9fafb;' : ''} transition: background-color 0.2s;">
                <td style="padding: 12px; font-weight: 500;">${t.title}</td>
                <td style="padding: 12px; font-size: 13px; color: var(--text-secondary);">${t.category_name || '-'}</td>
                <td style="padding: 12px; text-align: center;">
                  ${t.type === 'income' 
                    ? '<span style="background: #d1fae5; color: #047857; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;"><i class="fas fa-arrow-down"></i> ຮັບ</span>'
                    : '<span style="background: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;"><i class="fas fa-arrow-up"></i> ຈ່າຍ</span>'}
                </td>
                <td style="padding: 12px; text-align: right; font-weight: 500; color: ${t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)'};">${numFmt(t.amount)}</td>
                <td style="padding: 12px; font-size: 13px; color: var(--text-secondary);">${t.student_name || '-'}</td>
                <td style="padding: 12px; font-size: 13px; color: var(--text-secondary);">${fmtDate(t.tx_date)}</td>
                ${(status !== 'paid' && status !== 'general') ? `<td style="padding: 12px; font-size: 13px; color: var(--text-secondary);">${fmtDate(t.due_date)}</td>` : ''}
                ${canEdit ? `
                  <td style="padding: 12px; text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                      ${t.status !== 'paid' ? `
                        <button class="btn btn-success btn-sm btn-icon" onclick="updateStatus(${t.tx_id}, 'paid')" title="ໝາຍວ່າຊຳລະແລ້ວ">
                          <i class="fas fa-check"></i>
                        </button>
                      ` : ''}
                      <button class="btn btn-secondary btn-sm btn-icon" onclick="${typePrefix === 'tuition' ? `openTuitionModal(${t.tx_id})` : `openFinModal(${t.tx_id})`}" title="ແກ້ໄຂ">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-danger btn-sm btn-icon" onclick="deleteTx(${t.tx_id})" title="ລົບ">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                ` : ''}
              </tr>
            `).join('') : `
              <tr>
                <td colspan="${canEdit ? (status === 'paid' || status === 'general' ? 7 : 8) : (status === 'paid' || status === 'general' ? 6 : 7)}" style="padding: 40px; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 32px; margin-bottom: 8px;"><i class="fas fa-inbox" style="color: var(--text-muted);"></i></div>
                  <div>ຍັງບໍ່ມີລາຍການ</div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function _openModal(id, txns, cats) {
  let t = id ? txns.find(x=>x.tx_id==id)||{} : {};
  const students = await apiFetch(`${API}/students.php?action=list`);
  const uniqueCats = [...new Map(cats.map(c => [c.cat_id, c])).values()];
  const isTuition = (catName) => (catName || '').includes('ຄ່າຮຽນ') || (catName || '').includes('ຄ່າເທີມ');
  const generalCats = uniqueCats.filter(c => !isTuition(c.name));
  const catOpts = generalCats.map(c=>`<option value="${c.cat_id}" ${t.category_id==c.cat_id?'selected':''}>[${c.type==='income'?'ຮັບ':'ຈ່າຍ'}] ${c.name}</option>`).join('');
  const stuOpts = students.map(s=>`<option value="${s.student_id}" ${t.student_id==s.student_id?'selected':''}>${s.full_name_lao}</option>`).join('');
  openModal(`<div class="modal">
    <div class="modal-header"><h2 class="modal-title">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ລາຍການ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <input type="hidden" id="f-tid" value="${t.tx_id||''}">
      <div class="form-group"><label class="form-label">ຫົວຂໍ້ *</label><input class="form-control" id="f-title" value="${t.title||''}" placeholder="ລາຍລະອຽດ"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຈຳນວນ (ກີບ) *</label><input class="form-control" type="number" id="f-amount" value="${t.amount||''}" placeholder="0"></div>
        <div class="form-group"><label class="form-label">ປະເພດ *</label><select class="form-control" id="f-type">
          <option value="income" ${t.type==='income'?'selected':''}>ລາຍຮັບ</option>
          <option value="expense" ${t.type==='expense'?'selected':''}>ລາຍຈ່າຍ</option>
        </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ສະຖານະ</label><select class="form-control" id="f-status">
          <option value="pending" ${t.status==='pending'?'selected':''}>ລໍຖ້າ</option>
          <option value="paid" ${t.status==='paid'?'selected':''}>ຊຳລະແລ້ວ</option>
          <option value="overdue" ${t.status==='overdue'?'selected':''}>ຄ້າງ</option>
        </select></div>
        <div class="form-group"><label class="form-label">ໝວດ</label><select class="form-control" id="f-cat"><option value="">-- ເລືອກ --</option>${catOpts}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ວັນຄົບກຳໜົດ</label><input class="form-control" type="date" id="f-due" value="${t.due_date||''}"></div>
        <div class="form-group"><label class="form-label">ວັນທີ່ຊຳລະ</label><input class="form-control" type="date" id="f-txdate" value="${t.tx_date||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">ນັກຮຽນ (ຖ້າມີ)</label><select class="form-control" id="f-stu"><option value="">-- ບໍ່ລະບຸ --</option>${stuOpts}</select></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveTx()"><i class="fas fa-save"></i> ບັນທຶກ</button>
    </div>
  </div>`);
}

async function _openTuitionModal(id, txns, cats) {
  let t = id ? txns.find(x=>x.tx_id==id)||{} : {};
  const classes = await apiFetch(`${API}/classes.php?action=list`);
  const uniqueCats = [...new Map(cats.map(c => [c.cat_id, c])).values()];
  const incomeCats = uniqueCats.filter(c => c.type === 'income');
  const tuitionCat = incomeCats.find(c => c.name.includes('ຄ່າຮຽນ') || c.name.includes('ຄ່າເທີມ')) || incomeCats[0];
  
  const catOpts = incomeCats.filter(c => c.name.includes('ຄ່າຮຽນ') || c.name.includes('ຄ່າເທີມ'))
                            .map(c=>`<option value="${c.cat_id}" ${(t.category_id==c.cat_id) || (tuitionCat && c.cat_id === tuitionCat.cat_id) ? 'selected' : ''}>[ຮັບ] ${c.name}</option>`).join('');

  window.allStudentsCache = await apiFetch(`${API}/students.php?action=list`);

  let studentClassId = '';
  if (t.student_id) {
    const stu = window.allStudentsCache.find(s => s.student_id == t.student_id);
    if (stu) studentClassId = stu.class_id;
  }

  const classOpts = classes.map(c=>`<option value="${c.class_id}" ${c.class_id == studentClassId ? 'selected' : ''}>${c.class_name}</option>`).join('');

  openModal(`<div class="modal" style="max-width: 600px;">
    <div class="modal-header"><h2 class="modal-title">${id ? 'ແກ້ໄຂຄ່າເທີມ' : 'ເພີ່ມຄ່າເທີມ'}</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <input type="hidden" id="t-tid" value="${t.tx_id||''}">
      <div class="form-group"><label class="form-label">ຫົວຂໍ້ *</label><input class="form-control" id="t-title" value="${t.title||'ຄ່າເທີມນັກຮຽນ'}" placeholder="ລາຍລະອຽດ"></div>
      
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຫ້ອງຮຽນ *</label>
          <select class="form-control" id="t-class" onchange="loadTuitionStudents(this.value)">
            <option value="">-- ເລືອກຫ້ອງຮຽນ --</option>
            ${classOpts}
          </select>
        </div>
        <div class="form-group"><label class="form-label">ນັກຮຽນ (ຊື່ ຫຼື ລະຫັດ) *</label>
          <input class="form-control" id="t-stu-search" list="t-stu-list" placeholder="-- ກະລຸນາເລືອກຫ້ອງຮຽນກ່ອນ --" ${!studentClassId ? 'disabled' : ''} oninput="handleStudentSearchInput()" autocomplete="off">
          <datalist id="t-stu-list"></datalist>
          <input type="hidden" id="t-stu" value="${t.student_id||''}">
        </div>
      </div>

      ${id ? `
        <div class="form-row">
          <div class="form-group"><label class="form-label">ຈຳນວນເງິນ (ກີບ) *</label>
            <input class="form-control" type="number" id="t-full-amount" value="${t.amount||''}" placeholder="0" oninput="calcTuitionBalance()">
            <input type="hidden" id="t-paid-amount" value="0">
          </div>
          <div class="form-group"><label class="form-label">ສະຖານະ</label>
            <select class="form-control" id="t-status">
              <option value="pending" ${t.status==='pending'?'selected':''}>ລໍຖ້າ</option>
              <option value="paid" ${t.status==='paid'?'selected':''}>ຊຳລະແລ້ວ</option>
              <option value="overdue" ${t.status==='overdue'?'selected':''}>ຄ້າງ</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">ໝວດ</label><select class="form-control" id="t-cat"><option value="">-- ເລືອກ --</option>${catOpts}</select></div>
      ` : `
        <div class="form-row">
          <div class="form-group"><label class="form-label">ຈຳນວນເງິນເຕັມ (ກີບ) *</label>
            <input class="form-control" type="number" id="t-full-amount" value="" placeholder="0" oninput="calcTuitionBalance()">
          </div>
          <div class="form-group"><label class="form-label">ຈຳນວນທີ່ຈ່າຍ (ກີບ) *</label>
            <input class="form-control" type="number" id="t-paid-amount" value="" placeholder="0" oninput="calcTuitionBalance()">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group"><label class="form-label">ຍັງຄ້າງຊຳລະ (ກີບ)</label>
            <input class="form-control" type="text" id="t-balance" value="0" readonly style="background-color: #f3f4f6; color: #ef4444; font-weight: bold;">
          </div>
          <div class="form-group"><label class="form-label">ໝວດ</label><select class="form-control" id="t-cat"><option value="">-- ເລືອກ --</option>${catOpts}</select></div>
        </div>
      `}

      <div class="form-row">
        <div class="form-group"><label class="form-label">ວັນທີ່ຊຳລະ / ລົງບັນຊີ</label><input class="form-control" type="date" id="t-txdate" value="${t.tx_date || new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group"><label class="form-label">ວັນທີ່ກຳນົດຊຳລະ (ສຳລັບຜູ້ຍັງຄ້າງ ຫຼື ລໍຖ້າ)</label><input class="form-control" type="date" id="t-duedate" value="${t.due_date || ''}"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveTuitionTx(${id ? 'true' : 'false'})"><i class="fas fa-save"></i> ບັນທຶກ</button>
    </div>
  </div>`);

  if (studentClassId) {
    loadTuitionStudents(studentClassId, t.student_id);
  }
}

window.loadTuitionStudents = function(classId, selectedStudentId = null) {
  const stuSearch = document.getElementById('t-stu-search');
  const stuList = document.getElementById('t-stu-list');
  const stuHidden = document.getElementById('t-stu');

  if (!classId) {
    stuSearch.placeholder = '-- ກະລຸນາເລືອກຫ້ອງຮຽນກ່ອນ --';
    stuSearch.disabled = true;
    stuSearch.value = '';
    stuList.innerHTML = '';
    stuHidden.value = '';
    return;
  }
  const filtered = window.allStudentsCache.filter(s => s.class_id == classId);
  if (filtered.length === 0) {
    stuSearch.placeholder = '-- ບໍ່ມີນັກຮຽນໃນຫ້ອງນີ້ --';
    stuSearch.disabled = true;
    stuSearch.value = '';
    stuList.innerHTML = '';
    stuHidden.value = '';
  } else {
    stuSearch.placeholder = 'ພິມຊື່ ຫຼື ລະຫັດນັກຮຽນ...';
    stuList.innerHTML = filtered.map(s => `<option data-id="${s.student_id}" value="${s.student_code ? s.student_code + ' - ' : ''}${s.full_name_lao}"></option>`).join('');
    stuSearch.disabled = false;
    
    if (selectedStudentId) {
      const selectedStu = filtered.find(s => s.student_id == selectedStudentId);
      if (selectedStu) {
        stuSearch.value = `${selectedStu.student_code ? selectedStu.student_code + ' - ' : ''}${selectedStu.full_name_lao}`;
        stuHidden.value = selectedStu.student_id;
      }
    } else {
      stuSearch.value = '';
      stuHidden.value = '';
    }
  }
}

window.handleStudentSearchInput = function() {
  const val = document.getElementById('t-stu-search').value;
  const list = document.getElementById('t-stu-list');
  const hidden = document.getElementById('t-stu');
  
  hidden.value = ''; 
  if (val) {
    const options = list.options;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value === val) {
        hidden.value = options[i].getAttribute('data-id');
        break;
      }
    }
  }
}

window.calcTuitionBalance = function() {
  const full = parseFloat(document.getElementById('t-full-amount').value) || 0;
  const paid = parseFloat(document.getElementById('t-paid-amount').value) || 0;
  let balance = full - paid;
  if (balance < 0) balance = 0;
  document.getElementById('t-balance').value = numFmt(balance);
}

window.saveTuitionTx = async function(isEdit) {
  const txId = document.getElementById('t-tid') ? document.getElementById('t-tid').value : '';
  const title = document.getElementById('t-title').value.trim();
  const studentId = document.getElementById('t-stu').value;
  const fullAmt = parseFloat(document.getElementById('t-full-amount').value) || 0;
  const paidAmt = document.getElementById('t-paid-amount') ? (parseFloat(document.getElementById('t-paid-amount').value) || 0) : 0;
  const catId = document.getElementById('t-cat').value;
  const txDate = document.getElementById('t-txdate').value;
  const dueDate = document.getElementById('t-duedate').value;

  if (!title || fullAmt <= 0 || !studentId) {
    toast('ຕ້ອງໃສ່ຫົວຂໍ້, ຈຳນວນເງິນ ແລະ ເລືອກນັກຮຽນ', 'error');
    return;
  }

  if (isEdit) {
    const status = document.getElementById('t-status') ? document.getElementById('t-status').value : 'pending';
    const r = await apiPost(`${API}/finance.php?action=save`, {
      tx_id: txId,
      title: title,
      amount: fullAmt,
      type: 'income',
      status: status,
      category_id: catId,
      tx_date: txDate,
      due_date: dueDate,
      student_id: studentId
    });
    if (r.success) {
      closeModal();
      toast('ແກ້ໄຂຄ່າເທີມສຳເລັດ');
      reloadCurrentPage();
    } else {
      toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
    }
    return;
  }

  const balance = Math.max(0, fullAmt - paidAmt);
  const txnsToSave = [];

  if (paidAmt === 0) {
    // Hasn't paid anything -> Pending
    txnsToSave.push({
      title: title + ' (ລໍຖ້າຊຳລະ)',
      amount: fullAmt,
      type: 'income',
      status: 'pending',
      category_id: catId,
      tx_date: txDate,
      due_date: dueDate,
      student_id: studentId
    });
  } else if (balance > 0) {
    // Paid partially -> 1 Paid, 1 Overdue
    txnsToSave.push({
      title: title + ' (ຈ່າຍບາງສ່ວນ)',
      amount: paidAmt,
      type: 'income',
      status: 'paid',
      category_id: catId,
      tx_date: txDate,
      due_date: '',
      student_id: studentId
    });
    txnsToSave.push({
      title: title + ' (ຄ້າງຊຳລະ)',
      amount: balance,
      type: 'income',
      status: 'overdue',
      category_id: catId,
      tx_date: txDate,
      due_date: dueDate, 
      student_id: studentId
    });
  } else {
    // Fully paid -> Paid
    txnsToSave.push({
      title: title,
      amount: fullAmt,
      type: 'income',
      status: 'paid',
      category_id: catId,
      tx_date: txDate,
      due_date: '',
      student_id: studentId
    });
  }

  if (txnsToSave.length === 0) {
    toast('ບໍ່ມີລາຍການບັນທຶກ', 'error'); return;
  }

  try {
    for (let t of txnsToSave) {
      const r = await apiPost(`${API}/finance.php?action=save`, t);
      if (!r.success) throw new Error(r.error || 'ເກີດຂໍ້ຜິດພາດ');
    }
    closeModal();
    toast('ບັນທຶກຄ່າເທີມສຳເລັດ');
    reloadCurrentPage();
  } catch (err) {
    toast(err.message, 'error');
  }
}


window.saveTx = async function() {
  const typeStr = document.getElementById('f-type').value;
  let amt = parseFloat(document.getElementById('f-amount').value) || 0;
  
  // Make expense naturally positive in DB for cleaner calculations or negative based on preference
  // Here we'll ensure the API gets a positive number since the SQL computes it based on type.
  amt = Math.abs(amt);

  const data = {
    tx_id: document.getElementById('f-tid').value,
    title: document.getElementById('f-title').value.trim(),
    amount: amt,
    type: typeStr,
    status: document.getElementById('f-status').value,
    category_id: document.getElementById('f-cat').value,
    due_date: document.getElementById('f-due').value,
    tx_date: document.getElementById('f-txdate').value,
    student_id: document.getElementById('f-stu').value,
  };
  if (!data.title || !data.amount) { toast('ຕ້ອງໃສ່ຫົວຂໍ້ ແລະ ຈຳນວນ','error'); return; }
  const r = await apiPost(`${API}/finance.php?action=save`, data);
  if (r.success) { closeModal(); toast('ບັນທຶກສຳເລັດ'); reloadCurrentPage(); }
  else toast(r.error||'ເກີດຂໍ້ຜິດພາດ','error');
};

async function _delete(id) {
  if (!(await awaitConfirm('ຢືນຢັນການລົບ', 'ລົບລາຍການນີ້?'))) return;
  const r = await apiPost(`${API}/finance.php?action=delete`, { tx_id: id });
  if (r.success) { toast('ລົບສຳເລັດ'); reloadCurrentPage(); }
  else toast('ເກີດຂໍ້ຜິດພາດ','error');
}

async function _updateStatus(txId, newStatus, txns) {
  const t = txns.find(x => x.tx_id == txId) || {};
  const cleanTitle = str => (str||'').replace(' (ຄ້າງຊຳລະ)', '').replace(' (ລໍຖ້າຊຳລະ)', '').replace(' (ຈ່າຍບາງສ່ວນ)', '').trim();
  const baseTitle = cleanTitle(t.title);

  if (newStatus === 'paid' && t.student_id) {
    const existingPaid = txns.find(x => 
      x.status === 'paid' && 
      x.student_id === t.student_id && 
      x.category_id === t.category_id &&
      x.tx_id !== txId &&
      cleanTitle(x.title) === baseTitle
    );

    if (existingPaid) {
      const mergedAmount = parseFloat(existingPaid.amount) + parseFloat(t.amount);
      const r1 = await apiPost(`${API}/finance.php?action=save`, {
        tx_id: existingPaid.tx_id,
        title: baseTitle,
        amount: mergedAmount,
        type: existingPaid.type,
        status: 'paid',
        category_id: existingPaid.category_id,
        due_date: existingPaid.due_date,
        tx_date: new Date().toISOString().split('T')[0],
        student_id: existingPaid.student_id
      });
      
      if (r1.success) {
        await apiPost(`${API}/finance.php?action=delete`, { tx_id: txId });
        toast('ອັບເດດ ແລະ ລວມຍອດສຳເລັດ');
        reloadCurrentPage();
        return;
      }
    }
  }

  const data = {
    tx_id: txId,
    title: baseTitle,
    amount: t.amount,
    type: t.type,
    status: newStatus,
    category_id: t.category_id,
    due_date: t.due_date,
    tx_date: t.tx_date || new Date().toISOString().split('T')[0],
    student_id: t.student_id,
  };
  const r = await apiPost(`${API}/finance.php?action=save`, data);
  if (r.success) {
    toast('ອັບເດດສະຖານະສຳເລັດ');
    reloadCurrentPage();
  } else {
    toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
  }
}

window.updateStatus = _updateStatus;

function statusBadge(s) {
  const m = {paid:'badge-green ຊຳລະແລ້ວ', pending:'badge-yellow ລໍຖ້າ', overdue:'badge-red ຄ້າງ'};
  const parts = (m[s]||`badge-gray ${s}`).split(' ');
  return `<span class="badge ${parts[0]}">${parts[1]}</span>`;
}
