const ADMIN_PASSWORD = "LETMEIN123";
const SHEET_ID = "12r3Mnd4q3VuxJ2gVFzOrWLSEL8XK8LtcZDziZYDvFP4";
const SHEET_NAME = "Ответы на форму (1)";

const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

// Внутренние
let rawRows = [];      // исходные строки (объекты)
let filtered = [];     // отфильтрованные
let currentPage = 1;
let pageSize = 25;
let currentSort = { col: 'date', dir: -1 }; // dir: 1 asc, -1 desc

// DOM
const loginBtn = document.getElementById('loginBtn');
const adminPass = document.getElementById('adminPass');
const loginError = document.getElementById('loginError');
const panel = document.getElementById('panel');
const loginBox = document.getElementById('loginBox');
const resultsBody = document.getElementById('resultsBody');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const pageSizeSelect = document.getElementById('pageSize');
const paginationEl = document.getElementById('pagination');
const showingInfo = document.getElementById('showingInfo');
const refreshBtn = document.getElementById('refreshBtn');
const csvBtn = document.getElementById('csvBtn');
const xlsxBtn = document.getElementById('xlsxBtn');
const pdfBtn = document.getElementById('pdfBtn');

const pieCtx = document.getElementById('pieChart').getContext('2d');
const lineCtx = document.getElementById('lineChart').getContext('2d');
let pieChart = null;
let lineChart = null;

loginBtn.onclick = () => {
  const pass = adminPass.value.trim();
  if (pass === ADMIN_PASSWORD) {
    loginBox.style.display = 'none';
    panel.style.display = 'block';
    loadData();
  } else {
    loginError.style.display = 'block';
    setTimeout(()=> loginError.style.display='none', 2500);
  }
};

refreshBtn.onclick = () => loadData();

searchInput.addEventListener('input', () => {
  currentPage = 1;
  applyFilters();
});

typeFilter.addEventListener('change', () => { currentPage = 1; applyFilters(); });
pageSizeSelect.addEventListener('change', () => { pageSize = Number(pageSizeSelect.value); currentPage = 1; renderTable(); });

// сортировка при клике по заголовку
document.querySelectorAll('#resultsTable thead th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.getAttribute('data-col');
    if (currentSort.col === col) currentSort.dir *= -1;
    else { currentSort.col = col; currentSort.dir = -1; }
    renderTable();
  });
});

// Загрузка данных из gviz
async function loadData() {
  try {
    const res = await fetch(GVIZ_URL);
    const txt = await res.text();

    // Извлекаем JSON из ответа gviz
    const m = txt.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!m) throw new Error('Не удалось распарсить ответ от Google Sheets (gviz)');

    const json = JSON.parse(m[1]);
    const rows = json.table.rows; // массив

    // Преобразуем в удобный массив объектов
    rawRows = rows.map(r => {
      const c = r.c || [];
      return {
        date: c[0] && c[0].v ? c[0].v : '',
        user_id: c[1] && c[1].v ? c[1].v : '',
        answers: c[2] && c[2].v ? c[2].v : '',
        scores: c[3] && c[3].v ? c[3].v : '',
        types: c[4] && c[4].v ? c[4].v : ''
      };
    });

    // Если столбцы содержат JSON-строки — попробуем распарсить их
    rawRows = rawRows.map(r => {
      try { r.answers_parsed = JSON.parse(r.answers); } catch(e) { r.answers_parsed = r.answers; }
      try { r.scores_parsed = typeof r.scores === 'string' ? JSON.parse(r.scores) : r.scores; } catch(e){ r.scores_parsed = r.scores; }
      try { r.types_parsed = typeof r.types === 'string' ? JSON.parse(r.types) : r.types; } catch(e){ r.types_parsed = r.types; }
      return r;
    });

    populateTypeFilter();
    currentPage = 1;
    applyFilters();
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
    alert('Ошибка при загрузке данных. Проверьте правильность SHEET_ID, SHEET_NAME и публичный доступ к таблице.');
  }
}

function populateTypeFilter(){
  // Собираем уникальные типы из колонок types_parsed (могут быть массивы)
  const set = new Set();
  rawRows.forEach(r => {
    const t = r.types_parsed;
    if (!t) return;
    if (Array.isArray(t)) t.forEach(x => set.add(String(x)));
    else set.add(String(t));
  });
  // Очистить
  typeFilter.innerHTML = '<option value="">Все типы</option>';
  Array.from(set).sort().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    typeFilter.appendChild(opt);
  });
}

function applyFilters(){
  const q = (searchInput.value || '').toLowerCase();
  const type = typeFilter.value;

  filtered = rawRows.filter(r => {
    if (type) {
      const types = r.types_parsed;
      const ok = (Array.isArray(types) && types.includes(type)) || (String(types) === String(type));
      if (!ok) return false;
    }
    if (!q) return true;

    // поиск по нескольким полям
    const hay = (String(r.user_id)+' '+String(r.answers)+' '+String(r.scores)+' '+String(r.types)+' '+String(r.date)).toLowerCase();
    return hay.indexOf(q) !== -1;
  });

  currentPage = 1;
  renderTable();
  drawCharts();
}

function renderTable(){
  // сортировка
  const arr = filtered.slice();
  arr.sort((a,b) => {
    const col = currentSort.col;
    const dir = currentSort.dir;
    let va = a[col] || '';
    let vb = b[col] || '';

    // special handling: scores (try numeric)
    if (col === 'scores') {
      // try sum of scores if parsed
      const suma = (a.scores_parsed && typeof a.scores_parsed === 'object') ? Object.values(a.scores_parsed).reduce((s,x)=>s+Number(x||0),0) : (Number(a.scores) || 0);
      const sumb = (b.scores_parsed && typeof b.scores_parsed === 'object') ? Object.values(b.scores_parsed).reduce((s,x)=>s+Number(x||0),0) : (Number(b.scores) || 0);
      return (suma - sumb) * dir;
    }

    // date handling
    if (col === 'date') {
      const da = Date.parse(va) || 0;
      const db = Date.parse(vb) || 0;
      return (da - db) * dir;
    }

    va = String(va).toLowerCase();
    vb = String(vb).toLowerCase();
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  // pagination
  const total = arr.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > pages) currentPage = pages;
  const start = (currentPage - 1) * pageSize;
  const visible = arr.slice(start, start + pageSize);

  // render rows
  resultsBody.innerHTML = '';
  visible.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.dataset.index = start + idx;
    tr.innerHTML = `
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(r.user_id)}</td>
      <td style="max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.answers)}</td>
      <td>${escapeHtml(r.scores)}</td>
      <td>${escapeHtml(r.types)}</td>
    `;
    tr.addEventListener('click', () => showDetail(start + idx));
    resultsBody.appendChild(tr);
  });

  // pagination UI
  renderPagination(pages);
  showingInfo.textContent = `Показано ${start+1}-${start+visible.length} из ${total}`;
  drawCharts();
}

function renderPagination(pages){
  paginationEl.innerHTML = '';
  const createPageItem = (p, label = null, disabled=false, active=false) => {
    const li = document.createElement('li');
    li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label || p;
    a.addEventListener('click', (ev) => { ev.preventDefault(); if (!disabled) { currentPage = p; renderTable(); }});
    li.appendChild(a);
    return li;
  };

  // prev
  paginationEl.appendChild(createPageItem(Math.max(1, currentPage-1), '‹', currentPage===1));

  // pages (smart compact)
  const maxShow = 7;
  let start = Math.max(1, currentPage - Math.floor(maxShow/2));
  let end = start + maxShow -1;
  if (end > pages) { end = pages; start = Math.max(1, end - maxShow +1); }

  for (let p=start; p<=end; p++){
    paginationEl.appendChild(createPageItem(p, p, false, p===currentPage));
  }

  // next
  paginationEl.appendChild(createPageItem(Math.min(pages, currentPage+1), '›', currentPage===pages));
}

// Детальная модальная карточка
function showDetail(idx){
  const r = filtered[idx];
  if(!r) return;
  document.getElementById('detailTitle').textContent = `User: ${r.user_id} — ${r.date}`;
  const pretty = {
    date: r.date,
    user_id: r.user_id,
    answers: r.answers_parsed,
    scores: r.scores_parsed,
    types: r.types_parsed
  };
  document.getElementById('detailBody').textContent = JSON.stringify(pretty, null, 2);
  const modal = new bootstrap.Modal(document.getElementById('detailModal'));
  modal.show();
}

// Charts: pie (types distribution) and line (by date)
function drawCharts(){
  // types counts
  const counts = {};
  filtered.forEach(r => {
    const t = r.types_parsed;
    if (!t) return;
    if (Array.isArray(t)) t.forEach(x => counts[String(x)] = (counts[String(x)]||0)+1);
    else counts[String(t)] = (counts[String(t)]||0)+1;
  });

  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: labels.map((_,i)=>`hsl(${i*60 % 360} 70% 50%)`) }] },
    options: { responsive:true }
  });

  // line chart: counts by date
  const dateCounts = {};
  filtered.forEach(r=>{
    const d = formatDateShort(r.date);
    dateCounts[d] = (dateCounts[d]||0)+1;
  });
  const dateLabels = Object.keys(dateCounts).sort((a,b)=> new Date(a)-new Date(b));
  const dateData = dateLabels.map(d=>dateCounts[d]);

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(lineCtx, {
    type: 'line',
    data: { labels: dateLabels, datasets: [{ label:'Прохождения', data: dateData, fill:false, borderColor:'rgb(13,110,253)' }] },
    options: { responsive:true }
  });
}

function formatDateShort(v){
  // Попробуем распознать разные форматы
  const d = new Date(v);
  if (!isNaN(d)) {
    return d.toLocaleDateString();
  }
  // иначе вернуть исходник
  return String(v).slice(0,10);
}

// Экспорт CSV
csvBtn.addEventListener('click', () => {
  const rows = filtered.map(r => [r.date, r.user_id, r.answers, typeof r.scores_parsed === 'object' ? JSON.stringify(r.scores_parsed) : r.scores, typeof r.types_parsed === 'object' ? JSON.stringify(r.types_parsed) : r.types]);
  const header = ['date','user_id','answers','scores','types'];
  const csv = [header, ...rows].map(r=>r.map(cell => `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// Экспорт XLSX
xlsxBtn.addEventListener('click', () => {
  const ws_data = [['date','user_id','answers','scores','types']];
  filtered.forEach(r => {
    ws_data.push([r.date, r.user_id, r.answers, typeof r.scores_parsed === 'object' ? JSON.stringify(r.scores_parsed) : r.scores, typeof r.types_parsed === 'object' ? JSON.stringify(r.types_parsed) : r.types]);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'results');
  XLSX.writeFile(wb, 'results.xlsx');
});

// Экспорт PDF (jsPDF + autotable)
pdfBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const head = [['date','user_id','answers','scores','types']];
  const body = filtered.map(r => [r.date, r.user_id, (r.answers||'').slice(0,80), typeof r.scores_parsed === 'object' ? JSON.stringify(r.scores_parsed) : r.scores, typeof r.types_parsed === 'object' ? JSON.stringify(r.types_parsed) : r.types]);
  doc.autoTable({ head, body, startY: 10, styles:{ fontSize:8 } });
  doc.save('results.pdf');
});

// утилиты
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[ch])); }
