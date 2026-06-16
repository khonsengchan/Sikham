// views/scores.js  — ຕາຕະລາງ ບັນທຶກຄະແນນ  (Grade Matrix View)ຄະແນນລວມ
// ─────────────────────────────────────────────────────────────────────────────

let classesCache   = [];
let activeTab      = 'matrix';   // 'matrix' | 'class_rank' | 'student_rank'
let rankingsCache  = { classes: [], students: [] };

let matrixFilters = {
  class_id      : '',
  level_group   : 'ທັງໝົດ',
  academic_year : currentAcademicYear(),
  term          : 'ເທີມ 1',
  exam_type     : 'ປະຈຳເດືອນ 9',
};

let matrixData = { subjects: [], rows: [] };  // loaded from API

const DEFAULT_EXAM_TYPES = [
  'ປະຈຳເດືອນ 9', 'ປະຈຳເດືອນ 10', 'ປະຈຳເດືອນ 11', 'ປະຈຳເດືອນ 12',
  'ພາກຮຽນ 1',
  'ປະຈຳເດືອນ 2', 'ປະຈຳເດືອນ 3', 'ປະຈຳເດືອນ 4', 'ປະຈຳເດືອນ 5',
  'ພາກຮຽນ 2',
  'ກວດກາຍ່ອຍ', 'ວຽກບ້ານ', 'ກິດຈະກຳ'
];

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════
export async function render(el, perm = 'full') {
  const classes = await apiFetch(`${API}/classes.php?action=list`);
  classesCache  = Array.isArray(classes) ? classes : [];

  // Auto-select first class if none chosen
  if (!matrixFilters.class_id && classesCache.length > 0) {
    matrixFilters.class_id = classesCache[0].class_id;
  }

  await loadAll();
  drawPage(el, perm);
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LOADERS
// ═══════════════════════════════════════════════════════════════════════════
async function loadAll() {
  await Promise.all([loadMatrix(), loadRankings()]);
}

async function loadMatrix() {
  const qs = matrixQuery();
  const data = await apiFetch(`${API}/scores.php?action=matrix&${qs}`);
  if (data && !data.error) {
    matrixData = data;
  } else {
    matrixData = { subjects: [], rows: [] };
  }
}

async function loadRankings() {
  const qs = matrixQuery();
  const r = await apiFetch(`${API}/scores.php?action=rankings&${qs}`);
  rankingsCache = (r && !r.error) ? r : { classes: [], students: [] };
}

function matrixQuery() {
  const q = new URLSearchParams();
  if (matrixFilters.class_id)     q.set('class_id',      matrixFilters.class_id);
  else if (matrixFilters.level_group && matrixFilters.level_group !== 'ທັງໝົດ') q.set('level_group', matrixFilters.level_group);
  if (matrixFilters.academic_year) q.set('academic_year', matrixFilters.academic_year);
  if (matrixFilters.term)          q.set('term',          matrixFilters.term);
  if (matrixFilters.exam_type)     q.set('exam_type',     matrixFilters.exam_type);
  return q.toString();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DRAW
// ═══════════════════════════════════════════════════════════════════════════
function drawPage(el, perm) {
  const canEdit = perm === 'full' || perm === 'limited';

  el.innerHTML = `
    <!-- ── PAGE HEADER ── -->
    <div class="page-header" style="justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <h2 class="page-title" style="margin:0 0 2px 0;"><i class="fas fa-table" style="color:var(--accent-blue);margin-right:8px;"></i>ຕາຕະລາງ ບັນທຶກຄະແນນ</h2>
        <p style="margin:0;font-size:13px;color:var(--text-muted);">ສະແດງຄະແນນຕາມຫ້ອງ ແລະ ວິຊາ — Grade Score Matrix</p>
      </div>
      ${canEdit
        ? `<button class="btn btn-primary" onclick="openAddScoreModal()">
             <i class="fas fa-plus"></i> ເພີ່ມ / ແກ້ໄຂ ຄະແນນ
           </button>`
        : `<span class="badge badge-blue"><i class="fas fa-eye"></i> ເບິ່ງໄດ້ຢ່າງດຽວ</span>`}
    </div>

    <!-- ── FILTERS ── -->
    <div class="card" style="margin-bottom:14px;">
      <div class="card-body">
        <div class="form-row" style="align-items:flex-end;flex-wrap:wrap;gap:10px;">
          <!-- Class selector -->
          <div class="form-group" style="min-width:200px;flex:2;">
            <label class="form-label"><i class="fas fa-door-open" style="color:var(--accent-blue);margin-right:4px;"></i>ເລືອກຫ້ອງຮຽນ</label>
            <select class="form-control" id="mf-class" onchange="onClassChange()">
              <option value="">-- ທຸກຫ້ອງ --</option>
              ${classesCache.map(c => `<option value="${c.class_id}" ${String(matrixFilters.class_id) === String(c.class_id) ? 'selected' : ''}>${escHtml(c.class_name)}</option>`).join('')}
            </select>
          </div>
          <!-- Academic year -->
          <div class="form-group" style="min-width:130px;flex:1;">
            <label class="form-label">ສົກຮຽນ</label>
            <input class="form-control" id="mf-year" value="${escAttr(matrixFilters.academic_year)}" placeholder="2025-2026">
          </div>
          <!-- Term -->
          <div class="form-group" style="min-width:120px;flex:1;">
            <label class="form-label">ເທີມ</label>
            <input class="form-control" id="mf-term" value="${escAttr(matrixFilters.term)}" placeholder="ເທີມ 1">
          </div>
          <!-- Exam type -->
          <div class="form-group" style="min-width:160px;flex:1;">
            <label class="form-label">ປະເພດ</label>
            <input class="form-control" id="mf-exam" list="mf-exam-list"
                   value="${escAttr(matrixFilters.exam_type)}" placeholder="ທຸກປະເພດ">
            <datalist id="mf-exam-list">
              ${DEFAULT_EXAM_TYPES.map(t => `<option value="${escAttr(t)}"></option>`).join('')}
            </datalist>
          </div>
          <button class="btn btn-primary" style="height:38px;" onclick="applyMatrixFilters()">
            <i class="fas fa-search"></i> ໂຫຼດ
          </button>
          <button class="btn btn-secondary" style="height:38px;margin-left:auto;border-color:var(--accent-blue);color:var(--accent-blue);" onclick="printScores()">
            <i class="fas fa-print"></i> ປຣິ້ນລາຍງານ
          </button>
        </div>
      </div>
    </div>

    <!-- ── TABS & LEVEL FILTER ── -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
      ${tabBtn('matrix',       'ຕາຕະລາງຄະແນນ',   'fa-table')}
      ${tabBtn('class_rank',   'ອັນດັບຫ້ອງ',       'fa-door-open')}
      ${tabBtn('student_rank', 'ອັນດັບໂຮງຮຽນ',    'fa-trophy')}
      
      ${!matrixFilters.class_id && activeTab === 'matrix' ? `
        <div style="margin-left:auto;display:flex;gap:6px;">
          <span style="font-size:12px;color:var(--text-muted);margin-right:4px;display:flex;align-items:center;">ເລືອກຫຼັກສູດ:</span>
          ${['ທັງໝົດ', 'ອະນຸບານ', 'ປ.1 - ປ.3', 'ປ.4 - ປ.5'].map(lvl => `
            <button class="btn ${matrixFilters.level_group === lvl ? 'btn-primary' : 'btn-secondary'} btn-sm"
                    style="border-radius:20px;padding:2px 12px;font-size:12px;"
                    onclick="setLevelGroupFilter('${lvl}')">
              ${lvl}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <!-- ── CONTENT CARD ── -->
    <div class="card">
      <div class="card-body" style="padding:0 0 8px 0;">
        ${activeTab === 'matrix'       ? renderMatrix(canEdit)       : ''}
        ${activeTab === 'class_rank'   ? renderClassRank()            : ''}
        ${activeTab === 'student_rank' ? renderStudentRank()          : ''}
      </div>
    </div>
  `;

  /* ── attach event handlers ── */
  window.applyMatrixFilters = async () => {
    matrixFilters = {
      class_id      : document.getElementById('mf-class').value,
      academic_year : document.getElementById('mf-year').value.trim(),
      term          : document.getElementById('mf-term').value.trim(),
      exam_type     : document.getElementById('mf-exam').value.trim(),
    };
    el.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>ກຳລັງໂຫຼດ...</p></div>';
    await loadAll();
    drawPage(el, perm);
  };

  window.switchScoreTab = async (tab) => {
    activeTab = tab;
    drawPage(el, perm);
  };

  window.setLevelGroupFilter = async (lvl) => {
    matrixFilters.level_group = lvl;
    el.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>ກຳລັງໂຫຼດ...</p></div>';
    await loadAll();
    drawPage(el, perm);
  };

  window.onClassChange = () => {
    // Just update the filter value but don't reload yet (user clicks "ໂຫຼດ")
    matrixFilters.class_id = document.getElementById('mf-class').value;
  };

  if (canEdit) {
    window.openAddScoreModal    = () => openAddScoreModal(el, perm);
    window.openEditStudentScore = (studentId, subject) => openEditStudentScore(studentId, subject, el, perm);
    
    window.editCellInline = async (td, studentId, subject, currentScore, maxScore) => {
      if (td.querySelector('input')) return; // already editing
      
      const originalHtml = td.innerHTML;
      const originalTitle = td.title;
      td.title = ''; // remove tooltip while editing
      
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 0;
      input.max = maxScore;
      input.step = 0.5;
      input.value = currentScore !== null ? currentScore : '';
      input.style.width = '100%';
      input.style.minWidth = '50px';
      input.style.boxSizing = 'border-box';
      input.style.textAlign = 'center';
      input.style.padding = '4px 2px';
      input.style.border = '2px solid var(--accent-blue)';
      input.style.borderRadius = '4px';
      input.style.outline = 'none';
      input.style.fontSize = '14px';
      input.style.fontWeight = '700';
      
      td.innerHTML = '';
      td.appendChild(input);
      input.focus();
      input.select();
      
      let isSaving = false;
      const finishEdit = async () => {
        if (isSaving) return;
        isSaving = true;
        const newVal = input.value.trim();
        
        // if user cleared the input, maybe they want to delete? Currently, we just ignore empty (don't delete for now, require modal to delete)
        if (newVal === '' || (currentScore !== null && Number(newVal) === Number(currentScore))) {
          td.innerHTML = originalHtml;
          td.title = originalTitle;
          return;
        }
        
        const numVal = Number(newVal);
        if (!Number.isFinite(numVal) || numVal < 0 || numVal > maxScore) {
          toast('ຄະແນນຕ້ອງຢູ່ລະຫວ່າງ 0 ຫາ ' + maxScore, 'error');
          td.innerHTML = originalHtml;
          td.title = originalTitle;
          return;
        }
        
        // Save
        input.disabled = true;
        input.style.opacity = '0.5';
        
        const qs = new URLSearchParams({
          class_id      : matrixFilters.class_id      || '',
          academic_year : matrixFilters.academic_year || '',
          term          : matrixFilters.term          || '',
          exam_type     : matrixFilters.exam_type     || '',
          student_id    : studentId,
          subject       : subject,
        });
        const scoresResp = await apiFetch(`${API}/scores.php?action=list&${qs}`);
        const existing = Array.isArray(scoresResp) && scoresResp.length ? scoresResp[0] : null;
        
        const data = {
          score_id      : existing ? existing.score_id : '',
          student_id    : studentId,
          subject       : subject,
          academic_year : existing ? existing.academic_year : matrixFilters.academic_year,
          term          : existing ? existing.term : matrixFilters.term,
          exam_type     : existing ? existing.exam_type : (matrixFilters.exam_type || 'ປະຈຳເດືອນ 9'),
          score         : numVal,
          max_score     : existing ? existing.max_score : maxScore,
          score_date    : existing ? existing.score_date : new Date().toISOString().slice(0,10),
          notes         : existing ? existing.notes : ''
        };
        
        const r = await apiPost(`${API}/scores.php?action=save`, data);
        if (r.success) {
          toast('ບັນທຶກແລ້ວ', 'success');
          await loadAll();
          drawPage(el, perm);
        } else {
          toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
          td.innerHTML = originalHtml;
          td.title = originalTitle;
        }
      };
      
      input.addEventListener('blur', finishEdit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finishEdit();
        if (e.key === 'Escape') {
          isSaving = true;
          td.innerHTML = originalHtml;
          td.title = originalTitle;
        }
      });
    };
  }

  // ─── Print Functionality ────────────────
  window.printScores = async () => {
    toast('ກຳລັງກຽມຂໍ້ມູນປຣິ້ນ...', 'info');
    const toPrint = [];
    
    // If one class selected
    if (matrixFilters.class_id) {
      const className = classesCache.find(c => String(c.class_id) === String(matrixFilters.class_id))?.class_name || 'ບໍ່ພົບຊື່ຫ້ອງ';
      toPrint.push({ class_name: className, subjects: matrixData.subjects, rows: matrixData.rows });
    } else {
      // Fetch all classes one by one to ensure proper separation
      for (const c of classesCache) {
        const qs = new URLSearchParams({
          class_id: c.class_id,
          academic_year: matrixFilters.academic_year,
          term: matrixFilters.term,
          exam_type: matrixFilters.exam_type
        }).toString();
        const data = await apiFetch(`${API}/scores.php?action=matrix&${qs}`);
        if (data && data.rows && data.rows.length > 0) {
          toPrint.push({ class_name: c.class_name, subjects: data.subjects, rows: data.rows });
        }
      }
    }

    if (toPrint.length === 0) {
      toast('ບໍ່ມີຂໍ້ມູນຄະແນນສຳລັບການປຣິ້ນ', 'error');
      return;
    }

    const yearLabel = matrixFilters.academic_year || '-';
    const termLabel = matrixFilters.term || '-';
    // User requested "ປະຈຳເດືອນໃດປີໃດ" -> we show it in Exam Type or Month
    const examLabel = matrixFilters.exam_type || 'ລວມທຸກປະເພດ';

    let printHtml = `
      <html>
      <head>
        <title>ໃບບັນທຶກຄະແນນນັກຮຽນ</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { 
            background: white; color: black; padding: 0; margin: 0;
            font-family: 'Phetsarath OT', sans-serif; font-size: 12px; 
          }
          .print-page { page-break-after: always; padding: 15px; }
          .print-page:last-child { page-break-after: auto; }
          .print-header { text-align: center; margin-bottom: 20px; line-height: 1.5; }
          .print-header h1 { font-size: 22px; margin: 0 0 5px 0; }
          .print-header h2 { font-size: 18px; margin: 0 0 5px 0; font-weight: normal; }
          .print-header p { margin: 0; font-size: 14px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 8px 6px; text-align: center; font-size: 13px; }
          th { background-color: #f4f4f4; font-weight: bold; }
          .text-left { text-align: left; }
          .score-cell { font-weight: bold; }
          .total-cell { font-weight: bold; background-color: #f9f9f9; }
          .signature-box { margin-top: 40px; display: flex; justify-content: space-around; padding: 0 20px; }
          .signature-box p { font-size: 14px; margin: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { background-color: #e5e5e5 !important; }
          }
        </style>
      </head>
      <body>
    `;

    for (const page of toPrint) {
      printHtml += `
        <div class="print-page">
          <div class="print-header">
            <h1>ໃບບັນທຶກຄະແນນນັກຮຽນ</h1>
            <h2>ຫ້ອງ: <strong>${escHtml(page.class_name)}</strong></h2>
            <p>ປະຈຳ: <strong>${escHtml(examLabel)}</strong> | ສົກຮຽນ: <strong>${escHtml(yearLabel)}</strong> | ເທີມ: <strong>${escHtml(termLabel)}</strong></p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">ລຳດັບ</th>
                <th class="text-left" style="width: 200px;">ຊື່ ແລະ ນາມສະກຸນ</th>
                ${page.subjects.map(s => `<th>${escHtml(s)}</th>`).join('')}
                <th style="width: 60px;">ລວມ</th>
                <th style="width: 60px;">ສະເລ່ຍ%</th>
                <th style="width: 50px;">ຈັດທີ່</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const pRows = page.rows;
                pRows.forEach(r => {
                  let sumPct = 0; let count = 0;
                  page.subjects.forEach(s => {
                    const sc = r.scores[s];
                    if (sc && sc.score !== null && sc.max_score > 0) {
                      sumPct += (parseFloat(sc.score) / parseFloat(sc.max_score)) * 100; count++;
                    }
                  });
                  r.average = count > 0 ? (sumPct / count) : 0;
                });
                const sRows = [...pRows].sort((a, b) => b.total - a.total);
                let cRank = 1, pTotal = null;
                sRows.forEach((r, idx) => {
                  if (r.total !== pTotal) cRank = idx + 1;
                  r.rank = r.total > 0 ? cRank : '-';
                  pTotal = r.total;
                });
                return pRows.map((r, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td class="text-left">${escHtml(r.full_name_lao)}</td>
                    ${page.subjects.map(s => {
                      const sc = r.scores[s];
                      if (sc && sc.score !== null) {
                        return `<td class="score-cell">${Number(sc.score)}</td>`;
                      }
                      return `<td></td>`;
                    }).join('')}
                    <td class="total-cell">${r.total > 0 ? Number(r.total) : ''}</td>
                    <td>${r.average > 0 ? Number(r.average).toFixed(2) + '%' : ''}</td>
                    <td>${r.rank !== '-' ? r.rank : ''}</td>
                  </tr>
                `).join('');
              })()}
            </tbody>
          </table>
          
          <div class="signature-box">
            <div style="text-align: center;">
              <p><strong>ອຳນວຍການໂຮງຮຽນ</strong></p>
              <br><br><br>
              <p>.......................................</p>
            </div>
            <div style="text-align: center;">
              <p><strong>ຄູປະຈຳຫ້ອງ</strong></p>
              <br><br><br>
              <p>.......................................</p>
            </div>
          </div>
        </div>
      `;
    }

    printHtml += `
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) {
      toast('ບໍ່ສາມາດເປີດໜ້າຕ່າງປຣິ້ນໄດ້ ກະລຸນາອະນຸຍາດ Pop-ups', 'error');
      return;
    }
    win.document.write(printHtml);
    win.document.close();
    
    // Automatically trigger print dialog
    setTimeout(() => {
      win.print();
    }, 500);
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MATRIX TABLE  (ຕາຕະລາງ ບັນທຶກຄະແນນ)
// ═══════════════════════════════════════════════════════════════════════════
function renderMatrix(canEdit) {
  const subjects = matrixData.subjects || [];
  const rows     = matrixData.rows     || [];

  // Determine class name for header title
  const selClass = classesCache.find(c => String(c.class_id) === String(matrixFilters.class_id));
  const className = selClass ? selClass.class_name : 'ທຸກຫ້ອງ';
  const yearLabel = matrixFilters.academic_year || '-';
  const termLabel = matrixFilters.term          || '-';
  const examLabel = matrixFilters.exam_type     || 'ທຸກປະເພດ';

  if (!subjects.length && !rows.length) {
    return `
      <div class="empty-state" style="padding:48px 24px;">
        <div class="empty-state-icon"><i class="fas fa-table" style="color:var(--accent-blue);opacity:.3;"></i></div>
        <h3>ຍັງບໍ່ມີຂໍ້ມູນ</h3>
        <p style="color:var(--text-muted);">
          ກະລຸນາໃສ່ວິຊາຮຽນໃນຕາລາງຮຽນຂອງຫ້ອງ "${className}" ກ່ອນ<br>
          ຫຼື ເລືອກຫ້ອງອື່ນ ແລ້ວກົດ "ໂຫຼດ"
        </p>
      </div>`;
  }

  /* subjects.length > 0 but rows empty means class has no students */
  if (!rows.length) {
    return `
      <div class="empty-state" style="padding:48px 24px;">
        <div class="empty-state-icon"><i class="fas fa-user-graduate" style="opacity:.3;"></i></div>
        <h3>ບໍ່ມີນັກຮຽນໃນຫ້ອງ "${className}"</h3>
      </div>`;
  }

  // Calculate average percentage and rank for each row
  rows.forEach(r => {
    let sumPct = 0;
    let count = 0;
    subjects.forEach(s => {
      const sc = r.scores[s];
      if (sc && sc.score !== null && sc.max_score > 0) {
        sumPct += (parseFloat(sc.score) / parseFloat(sc.max_score)) * 100;
        count++;
      }
    });
    r.average = count > 0 ? (sumPct / count) : 0;
  });

  const sortedRows = [...rows].sort((a, b) => b.total - a.total);
  let currentRank = 1;
  let previousTotal = null;
  sortedRows.forEach((r, idx) => {
    if (r.total !== previousTotal) {
      currentRank = idx + 1;
    }
    r.rank = r.total > 0 ? currentRank : '-';
    previousTotal = r.total;
  });

  const colCount = subjects.length + 5; // no + name + subjects + total + avg + rank

  let html = `
    <!-- ── Title banner ── -->
    <div style="padding:16px 20px 8px;border-bottom:2px solid var(--border);">
      <div style="font-size:16px;font-weight:700;color:var(--text-primary);">
        ຕາຕະລາງ ບັນທຶກຄະແນນ
        <span class="badge badge-blue" style="margin-left:8px;">${escHtml(className)}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">
        ສົກຮຽນ: ${escHtml(yearLabel)} &nbsp;|&nbsp; ເທີມ: ${escHtml(termLabel)} &nbsp;|&nbsp; ປະເພດ: ${escHtml(examLabel)}
      </div>
    </div>

    <!-- ── Matrix Table ── -->
    <div class="table-responsive" style="overflow-x:auto;">
      <table class="score-matrix-table" style="
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      ">
        <thead>
          <tr style="background:linear-gradient(135deg,var(--accent-blue),#2563eb);color:#fff;">
            <th class="smt-th" style="width:44px;text-align:center;">ລຳດັບ</th>
            <th class="smt-th" style="min-width:180px;text-align:left;">ຊື່ ແລະ ນາມສະກຸນ</th>
            ${subjects.map(s => `
              <th class="smt-th smt-subj-col" title="${escAttr(s)}" style="min-width:70px;text-align:center;">
                ${escHtml(s)}
              </th>`).join('')}
            <th class="smt-th" style="min-width:72px;text-align:center;background:rgba(0,0,0,.12);color:#fff;">ຄະແນນລວມ</th>
            <th class="smt-th" style="min-width:72px;text-align:center;background:rgba(0,0,0,.12);color:#fff;">ສະເລ່ຍ%</th>
            <th class="smt-th" style="min-width:50px;text-align:center;background:rgba(0,0,0,.12);color:#fff;">ຈັດທີ່</th>
          </tr>
          <!-- max score row -->
          <tr style="background:#eff6ff;border-bottom:2px solid #bfdbfe;">
            <td class="smt-td" style="text-align:center;font-size:10px;color:#6b7280;">ຄ.ເຕັມ</td>
            <td class="smt-td" style="font-size:11px;color:#6b7280;font-style:italic;">— ຄະແນນເຕັມ —</td>
            ${subjects.map(s => {
              // try to find max_score from any row
              const sample = rows.find(r => r.scores[s]);
              const mx = sample ? sample.scores[s].max_score : '—';
              return `<td class="smt-td" style="text-align:center;font-size:11px;color:#2563eb;font-weight:600;">${mx}</td>`;
            }).join('')}
            <td class="smt-td" style="text-align:center;font-size:11px;color:#6b7280;">—</td>
            <td class="smt-td" style="text-align:center;font-size:11px;color:#6b7280;">—</td>
            <td class="smt-td" style="text-align:center;font-size:11px;color:#6b7280;">—</td>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r, idx) => {
            const isEven = idx % 2 === 0;
            const bg     = isEven ? '#fff' : '#f8fafc';
            return `
            <tr class="smt-row" style="background:${bg};" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='${bg}'">
              <td class="smt-td" style="text-align:center;font-weight:600;color:#374151;">${r.no}</td>
              <td class="smt-td">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="student-avatar ${r.gender === 'ຊາຍ' ? 'boy' : ''}" style="width:28px;height:28px;font-size:11px;flex-shrink:0;">
                    ${(r.full_name_lao || 'ນ')[0]}
                  </div>
                  <div>
                    <div style="font-weight:600;color:var(--text-primary);line-height:1.2;">${escHtml(r.full_name_lao)}</div>
                    <div style="font-size:10px;color:var(--text-muted);">${escHtml(r.student_code)}</div>
                  </div>
                </div>
              </td>
              ${subjects.map(s => {
                const sc = r.scores[s];
                const hasScore = sc !== null && sc !== undefined;
                const scoreVal = hasScore ? parseFloat(sc.score) : null;
                const maxVal   = hasScore ? parseFloat(sc.max_score) : null;
                let cellContent, cellStyle;
                if (hasScore) {
                  const pct = maxVal > 0 ? (scoreVal / maxVal) * 100 : 0;
                  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#ea580c' : '#dc2626';
                  cellContent = `<span style="font-weight:700;color:${color};">${numFmt(scoreVal)}</span>`;
                  cellStyle   = `background:${pct>=80?'#f0fdf4':pct>=50?'#fff7ed':'#fef2f2'};`;
                } else {
                  cellContent = `<span style="color:#d1d5db;">—</span>`;
                  cellStyle   = '';
                }
                const safeScoreVal = hasScore ? scoreVal : null;
                const clickAttr = canEdit
                  ? `ondblclick="openEditStudentScore(${r.student_id}, ${jsStrHtml(s)})" onclick="editCellInline(this, ${r.student_id}, ${jsStrHtml(s)}, ${safeScoreVal}, ${maxVal || 10})" style="${cellStyle}cursor:pointer;" title="ຄລິກພິມຄະແນນ (ດັບເບິລຄລິກເພື່ອແກ້ໄຂລະອຽດ)"`
                  : `style="${cellStyle}"`;
                return `<td class="smt-td smt-score-cell" ${clickAttr}>${cellContent}</td>`;
              }).join('')}
              <!-- Total -->
              <td class="smt-td" style="text-align:center;font-weight:700;font-size:14px;
                background:${r.total > 0 ? '#f0fdf4' : '#f9fafb'};
                color:${r.total > 0 ? '#16a34a' : '#9ca3af'};">
                ${r.total > 0 ? numFmt(r.total) : '—'}
              </td>
              <!-- Average -->
              <td class="smt-td" style="text-align:center;font-weight:600;font-size:13px;
                background:${r.average > 0 ? '#f0fdf4' : '#f9fafb'};
                color:${r.average > 0 ? '#16a34a' : '#9ca3af'};">
                ${r.average > 0 ? numFmt(r.average) + '%' : '—'}
              </td>
              <!-- Rank -->
              <td class="smt-td" style="text-align:center;font-weight:700;font-size:14px;
                color:#2563eb;">
                ${r.rank}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- ── Legend ── -->
    <div style="padding:10px 20px;display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:var(--text-muted);border-top:1px solid var(--border);">
      <span>🟢 ≥80% ດີ</span>
      <span>🟠 50–79% ພໍໃຊ້</span>
      <span>🔴 &lt;50% ຕ້ອງປັບປຸງ</span>
      ${canEdit ? '<span style="margin-left:auto;"><i class="fas fa-mouse-pointer"></i> ຄລິກຊ່ອງຄະແນນພິມໄດ້ເລີຍ / ດັບເບິລຄລິກເພື່ອເປີດໜ້າແກ້ໄຂ</span>' : ''}
    </div>
  `;

  return html;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASS RANKINGS TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderClassRank() {
  const rows = rankingsCache.classes || [];
  if (!rows.length) return emptyState('fa-door-open', 'ບໍ່ມີຂໍ້ມູນອັນດັບຫ້ອງ', 'ເພີ່ມຄະແນນກ່ອນ');
  return `<div class="table-responsive"><table>
    <thead><tr>
      <th>ອັນດັບ</th><th>ຫ້ອງ</th><th>ນັກຮຽນ</th>
      <th>ລາຍການ</th><th>ສະເລ່ຍ%</th><th>ຄະແນນລວມ</th>
    </tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${rankBadge(r.rank_no)}</td>
      <td><strong>${escHtml(r.class_name||'-')}</strong>
        <div style="font-size:11px;color:var(--text-muted)">${escHtml(r.level||'')}</div></td>
      <td>${numFmt(r.student_count)}</td>
      <td>${numFmt(r.score_count)}</td>
      <td>${pctBadge(r.average_percent)}</td>
      <td><strong>${numFmt(r.total_score)}</strong></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT RANKINGS TAB
// ═══════════════════════════════════════════════════════════════════════════
function renderStudentRank() {
  const rows = rankingsCache.students || [];
  if (!rows.length) return emptyState('fa-trophy', 'ບໍ່ມີຂໍ້ມູນອັນດັບນັກຮຽນ', 'ເພີ່ມຄະແນນກ່ອນ');
  return `<div class="table-responsive"><table>
    <thead><tr>
      <th>ອັນດັບ</th><th>ນັກຮຽນ</th><th>ຫ້ອງ</th>
      <th>ລາຍການ</th><th>ສະເລ່ຍ%</th><th>ຄະແນນລວມ</th>
    </tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${rankBadge(r.rank_no)}</td>
      <td><div class="student-cell">
        <div class="student-avatar">${(r.full_name_lao||'ນ')[0]}</div>
        <div>
          <div class="student-name">${escHtml(r.full_name_lao)}</div>
          <div class="student-code">${escHtml(r.student_code)}</div>
        </div>
      </div></td>
      <td>${escHtml(r.class_name||'-')}</td>
      <td>${numFmt(r.score_count)}</td>
      <td>${pctBadge(r.average_percent)}</td>
      <td><strong>${numFmt(r.total_score)}</strong></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODALS — Add / Edit score
// ═══════════════════════════════════════════════════════════════════════════
async function openAddScoreModal(el, perm) {
  // Load students of selected class
  const students = await apiFetch(`${API}/students.php?action=list`);
  const studs    = Array.isArray(students) ? students : [];
  const filtStuds = matrixFilters.class_id
    ? studs.filter(s => String(s.class_id) === String(matrixFilters.class_id))
    : studs;

  // Load subjects for class
  const qs = matrixFilters.class_id ? `class_id=${matrixFilters.class_id}` : '';
  const subjectsArr = await apiFetch(`${API}/scores.php?action=subjects_by_class&${qs}`);
  const subjects = Array.isArray(subjectsArr) ? subjectsArr : [];

  const studOpts = filtStuds.map(s =>
    `<option value="${s.student_id}">${escHtml(s.full_name_lao)} — ${escHtml(s.student_code)} (${escHtml(s.class_name||'-')})</option>`
  ).join('');

  const subjOpts = subjects.map(s =>
    `<option value="${escAttr(s)}">${escHtml(s)}</option>`
  ).join('');

  openModal(`<div class="modal">
    <div class="modal-header">
      <h2 class="modal-title"><i class="fas fa-plus-circle"></i> ເພີ່ມ / ແກ້ໄຂ ຄະແນນ</h2>
      <span class="modal-close" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <input type="hidden" id="sc-id" value="">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ນັກຮຽນ *</label>
          <select class="form-control" id="sc-student">
            <option value="">-- ເລືອກນັກຮຽນ --</option>${studOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ວິຊາ *</label>
          <input class="form-control" id="sc-subject" list="sc-subject-list" placeholder="-- ພິມ ຫຼື ເລືອກວິຊາ --">
          <datalist id="sc-subject-list">
            ${subjOpts}
          </datalist>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ສົກຮຽນ *</label>
          <input class="form-control" id="sc-year" value="${escAttr(matrixFilters.academic_year)}" placeholder="2025-2026">
        </div>
        <div class="form-group">
          <label class="form-label">ເທີມ *</label>
          <input class="form-control" id="sc-term" value="${escAttr(matrixFilters.term)}" placeholder="ເທີມ 1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ປະເພດ *</label>
          <input class="form-control" id="sc-exam" list="sc-exam-list"
                 value="${escAttr(matrixFilters.exam_type || 'ກວດກາຍ່ອຍ')}">
          <datalist id="sc-exam-list">
            ${DEFAULT_EXAM_TYPES.map(t => `<option value="${escAttr(t)}"></option>`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label class="form-label">ວັນທີ່</label>
          <input class="form-control" type="date" id="sc-date" value="${new Date().toISOString().slice(0,10)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ຄະແນນ *</label>
          <input class="form-control" type="number" min="0" step="0.5" id="sc-score" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">ຄະແນນເຕັມ *</label>
          <input class="form-control" type="number" min="1" step="0.5" id="sc-max" value="10">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">ໝາຍເຫດ</label>
        <textarea class="form-control" id="sc-notes" placeholder="ໝາຍເຫດ (ຖ້າມີ)" rows="2"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveScore()">
        <i class="fas fa-save"></i> ບັນທຶກ
      </button>
    </div>
  </div>`);

  window.saveScore = async () => {
    const data = {
      score_id      : document.getElementById('sc-id').value,
      student_id    : document.getElementById('sc-student').value,
      subject       : document.getElementById('sc-subject').value,
      academic_year : document.getElementById('sc-year').value.trim(),
      term          : document.getElementById('sc-term').value.trim(),
      exam_type     : document.getElementById('sc-exam').value.trim(),
      score         : document.getElementById('sc-score').value,
      max_score     : document.getElementById('sc-max').value,
      score_date    : document.getElementById('sc-date').value,
      notes         : document.getElementById('sc-notes').value.trim(),
    };
    if (!data.student_id || !data.subject || !data.academic_year || !data.term || !data.exam_type) {
      toast('ກະລຸນາໃສ່ຂໍ້ມູນທີ່ມີ * ໃຫ້ຄົບ', 'error');
      return;
    }
    const sc  = Number(data.score);
    const mx  = Number(data.max_score);
    if (!Number.isFinite(sc) || !Number.isFinite(mx) || mx <= 0 || sc < 0 || sc > mx) {
      toast('ຄະແນນຕ້ອງຢູ່ລະຫວ່າງ 0 ຫາຄະແນນເຕັມ', 'error');
      return;
    }
    const r = await apiPost(`${API}/scores.php?action=save`, data);
    if (r.success) {
      closeModal();
      toast('ບັນທຶກຄະແນນສຳເລັດ ✓');
      await loadAll();
      drawPage(el, perm);
    } else {
      toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
    }
  };
}

// ─── open edit modal for a specific student + subject cell ────────────────
async function openEditStudentScore(studentId, subject, el, perm) {
  // Try to find existing score
  const qs = new URLSearchParams({
    class_id      : matrixFilters.class_id      || '',
    academic_year : matrixFilters.academic_year || '',
    term          : matrixFilters.term          || '',
    exam_type     : matrixFilters.exam_type     || '',
    student_id    : studentId,
    subject       : subject,
  });
  const scores = await apiFetch(`${API}/scores.php?action=list&${qs}`);
  const existing = Array.isArray(scores) && scores.length ? scores[0] : null;

  const studentRow = (matrixData.rows || []).find(r => String(r.student_id) === String(studentId));
  const studentName = studentRow ? studentRow.full_name_lao : '';

  // Load subjects for this class
  const subjQs = matrixFilters.class_id ? `class_id=${matrixFilters.class_id}` : '';
  const subjectsArr = await apiFetch(`${API}/scores.php?action=subjects_by_class&${subjQs}`);
  const subjects = Array.isArray(subjectsArr) ? subjectsArr : [];

  openModal(`<div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">
        <i class="fas fa-edit" style="color:var(--accent-blue);"></i>
        ແກ້ໄຂຄະແນນ — ${escHtml(studentName)}
      </h2>
      <span class="modal-close" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <input type="hidden" id="sc-id" value="${existing ? existing.score_id : ''}">
      <input type="hidden" id="sc-student" value="${studentId}">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ວິຊາ *</label>
          <input class="form-control" id="sc-subject" list="sc-subject-list-edit" value="${escAttr(subject)}">
          <datalist id="sc-subject-list-edit">
            ${subjects.map(s => `<option value="${escAttr(s)}"></option>`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label class="form-label">ສົກຮຽນ</label>
          <input class="form-control" id="sc-year" value="${escAttr(existing ? existing.academic_year : matrixFilters.academic_year)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ເທີມ</label>
          <input class="form-control" id="sc-term" value="${escAttr(existing ? existing.term : matrixFilters.term)}">
        </div>
        <div class="form-group">
          <label class="form-label">ປະເພດ</label>
          <input class="form-control" id="sc-exam" list="sc-exam-list2"
                 value="${escAttr(existing ? existing.exam_type : matrixFilters.exam_type || 'ປະຈຳເດືອນ 9')}">
          <datalist id="sc-exam-list2">
            ${DEFAULT_EXAM_TYPES.map(t => `<option value="${escAttr(t)}"></option>`).join('')}
          </datalist>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ຄະແນນ *</label>
          <input class="form-control" type="number" min="0" step="0.5" id="sc-score"
                 value="${existing ? existing.score : ''}" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">ຄະແນນເຕັມ</label>
          <input class="form-control" type="number" min="1" step="0.5" id="sc-max"
                 value="${existing ? existing.max_score : '10'}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ວັນທີ່</label>
          <input class="form-control" type="date" id="sc-date"
                 value="${existing ? (existing.score_date||new Date().toISOString().slice(0,10)) : new Date().toISOString().slice(0,10)}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">ໝາຍເຫດ</label>
        <textarea class="form-control" id="sc-notes" rows="2">${escHtml(existing ? (existing.notes||'') : '')}</textarea>
      </div>
      ${existing ? `<div style="margin-top:4px;text-align:right;">
        <button class="btn btn-danger btn-sm" onclick="deleteScoreEntry(${existing.score_id})">
          <i class="fas fa-trash"></i> ລົບຄະແນນນີ້
        </button>
      </div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveScore()">
        <i class="fas fa-save"></i> ບັນທຶກ
      </button>
    </div>
  </div>`);

  window.saveScore = async () => {
    const data = {
      score_id      : document.getElementById('sc-id').value,
      student_id    : document.getElementById('sc-student').value,
      subject       : document.getElementById('sc-subject').value,
      academic_year : document.getElementById('sc-year').value.trim(),
      term          : document.getElementById('sc-term').value.trim(),
      exam_type     : document.getElementById('sc-exam').value.trim(),
      score         : document.getElementById('sc-score').value,
      max_score     : document.getElementById('sc-max').value,
      score_date    : document.getElementById('sc-date').value,
      notes         : document.getElementById('sc-notes').value.trim(),
    };
    if (!data.student_id || !data.subject || !data.academic_year || !data.term || !data.exam_type) {
      toast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ', 'error');
      return;
    }
    const sc  = Number(data.score);
    const mx  = Number(data.max_score);
    if (!Number.isFinite(sc) || !Number.isFinite(mx) || mx <= 0 || sc < 0 || sc > mx) {
      toast('ຄະແນນຕ້ອງຢູ່ລະຫວ່າງ 0 ຫາຄະແນນເຕັມ', 'error');
      return;
    }
    const r = await apiPost(`${API}/scores.php?action=save`, data);
    if (r.success) {
      closeModal();
      toast('ບັນທຶກຄະແນນສຳເລັດ ✓');
      await loadAll();
      drawPage(el, perm);
    } else {
      toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
    }
  };

  window.deleteScoreEntry = async (scoreId) => {
    if (!(await awaitConfirm('ຢືນຢັນການລົບ', 'ຕ້ອງການລົບຄະແນນນີ້ແທ້ບໍ?'))) return;
    const r = await apiPost(`${API}/scores.php?action=delete`, { score_id: scoreId });
    if (r.success) {
      closeModal();
      toast('ລົບຄະແນນສຳເລັດ');
      await loadAll();
      drawPage(el, perm);
    } else {
      toast(r.error || 'ເກີດຂໍ້ຜິດພາດ', 'error');
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function tabBtn(tab, label, icon) {
  const active = activeTab === tab;
  return `<button class="btn ${active ? 'btn-primary' : 'btn-secondary'} btn-sm"
                  onclick="switchScoreTab('${tab}')">
    <i class="fas ${icon}"></i> ${label}
  </button>`;
}

function pctBadge(v) {
  const n   = Number(v || 0);
  const cls = n >= 80 ? 'badge-green' : n >= 50 ? 'badge-orange' : 'badge-red';
  return `<span class="badge ${cls}">${n.toFixed(2)}%</span>`;
}

function rankBadge(rank) {
  const n   = Number(rank);
  const cls = n === 1 ? 'badge-green' : n <= 3 ? 'badge-orange' : 'badge-gray';
  return `<span class="badge ${cls}">#${rank}</span>`;
}

function emptyState(icon, title, sub = '') {
  return `<div class="empty-state" style="padding:48px 24px;">
    <div class="empty-state-icon"><i class="fas ${icon}" style="opacity:.3;"></i></div>
    <h3>${title}</h3>${sub ? `<p style="color:var(--text-muted);">${sub}</p>` : ''}
  </div>`;
}

function currentAcademicYear() {
  const now = new Date();
  const y   = now.getFullYear();
  return now.getMonth() >= 5 ? `${y}-${y+1}` : `${y-1}-${y}`;
}

function escHtml(v) {
  return String(v ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escAttr(v) { return escHtml(v); }
function jsStr(v)   { return JSON.stringify(String(v ?? '')).replace(/</g,'\\u003c'); }
function jsStrHtml(v) { return JSON.stringify(String(v ?? '')).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'); }
