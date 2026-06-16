// views/inventory.js
let inventoryData = [
  { id:1, name:'ກະດາດ A4', category:'ອຸປະກອນສຳນັກງານ', qty:15, unit:'ຣີມ', min:10, status:'ພໍດີ', price:25000 },
  { id:2, name:'ບິກ ມາກເກີ', category:'ອຸປະກອນຫ້ອງຮຽນ', qty:3, unit:'ກ່ອງ', min:5, status:'ໃກ້ໝົດ', price:15000 },
  { id:3, name:'ດິນສໍ', category:'ອຸປະກອນຫ້ອງຮຽນ', qty:200, unit:'ດ້າມ', min:50, status:'ພໍດີ', price:1500 },
  { id:4, name:'ສີສ້ອຍ', category:'ສິລະປະ', qty:12, unit:'ກ່ອງ', min:5, status:'ພໍດີ', price:45000 },
  { id:5, name:'ສາບູ ລ້າງມື', category:'ສຸຂະ​ຮັກສາ', qty:2, unit:'ຂວດ', min:10, status:'ໝົດ', price:18000 },
];

export async function render(el) {
  // Expose inventory for global notification checks
  window.getInventoryData = () => inventoryData;
  drawPage(el, inventoryData);
}

function drawPage(el, data) {
  const low = data.filter(i=>i.status!=='ພໍດີ').length;
  el.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">ວັດຖຸ & ສາງ (${data.length})</h2>
      <button class="btn btn-primary" onclick="openInvModal()"><i class="fas fa-plus"></i> ເພີ່ມລາຍການ</button>
    </div>
    ${low?`<div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <span>⚠️</span><span style="font-size:13px;font-weight:600;color:#854d0e">ມີ ${low} ລາຍການ ທີ່ຕ້ອງສັ່ງຊື້ (ໃກ້ໝົດ ຫຼື ໝົດ)</span>
    </div>`:''}
    <div class="card">
      <div class="table-responsive"><table><thead><tr>
        <th>ລາຍການ</th><th>ໝວດໝູ່</th><th>ຈຳນວນ</th><th>ຂັ້ນຕ່ຳ</th><th>ລາຄາ/ໜ່ວຍ</th><th>ສະຖານະ</th><th></th>
      </tr></thead><tbody>
      ${data.map(i=>`<tr>
        <td class="fw-bold">${i.name}</td>
        <td>${i.category}</td>
        <td>${i.qty} ${i.unit}</td>
        <td>${i.min} ${i.unit}</td>
        <td>${numFmt(i.price)} ກີບ</td>
        <td>${statusBadge(i.status)}</td>
        <td><div class="d-flex gap-8">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="openInvModal(${i.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteInv(${i.id})"><i class="fas fa-trash"></i></button>
        </div></td>
      </tr>`).join('')}
      </tbody></table></div>
    </div>`;

  window.openInvModal = (id) => _openModal(id);
  window.deleteInv = async (id) => {
    if(!(await awaitConfirm('ຢືນຢັນການລົບ', 'ລົບລາຍການນີ້?')))return;
    inventoryData = inventoryData.filter(i=>i.id!==id);
    drawPage(el, inventoryData); toast('ລົບສຳເລັດ');
  };
}

function _openModal(id) {
  const item = id ? inventoryData.find(i=>i.id===id)||{} : {};
  openModal(`<div class="modal">
    <div class="modal-header"><h2 class="modal-title">${id?'ແກ້ໄຂ':'ເພີ່ມ'}ວັດຖຸ</h2><span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">ຊື່ວັດຖຸ *</label><input class="form-control" id="i-name" value="${item.name||''}" placeholder="ຊື່..."></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ໝວດໝູ່</label><input class="form-control" id="i-cat" value="${item.category||''}" placeholder="ໝວດ..."></div>
        <div class="form-group"><label class="form-label">ຫົວໜ່ວຍ</label><input class="form-control" id="i-unit" value="${item.unit||''}" placeholder="ຫົວໜ່ວຍ"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ຈຳນວນ</label><input class="form-control" type="number" id="i-qty" value="${item.qty||0}" min="0"></div>
        <div class="form-group"><label class="form-label">ຂັ້ນຕ່ຳ</label><input class="form-control" type="number" id="i-min" value="${item.min||0}" min="0"></div>
      </div>
      <div class="form-group"><label class="form-label">ລາຄາ/ໜ່ວຍ (ກີບ)</label><input class="form-control" type="number" id="i-price" value="${item.price||0}" min="0"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">ຍົກເລີກ</button>
      <button class="btn btn-primary" onclick="saveInv(${id||0})"><i class="fas fa-save"></i> ບັນທຶກ</button>
    </div>
  </div>`);

  window.saveInv = function(id) {
    const n=document.getElementById('i-name').value.trim();
    if(!n){toast('ຕ້ອງໃສ່ຊື່','error');return;}
    const qty=parseInt(document.getElementById('i-qty').value)||0;
    const min=parseInt(document.getElementById('i-min').value)||0;
    const newItem = {
      id: id||Date.now(), name:n, category:document.getElementById('i-cat').value.trim(),
      unit:document.getElementById('i-unit').value.trim(), qty, min,
      price:parseInt(document.getElementById('i-price').value)||0,
      status: qty===0?'ໝົດ':qty<min?'ໃກ້ໝົດ':'ພໍດີ',
    };
    if(id) { const idx=inventoryData.findIndex(i=>i.id===id); inventoryData[idx]=newItem; }
    else inventoryData.push(newItem);
    closeModal(); toast('ບັນທຶກສຳເລັດ');
    const el = document.getElementById('page-content');
    drawPage(el, inventoryData);
  };
}

function statusBadge(s) {
  const m = {'ພໍດີ':'badge-green','ໃກ້ໝົດ':'badge-orange','ໝົດ':'badge-red'};
  return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
}
