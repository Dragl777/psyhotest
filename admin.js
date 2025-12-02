const PASSWORD = "12345"; // простой пароль
const SHEET_URL = "https://opensheet.elk.sh/12r3Mnd4q3VuxJ2gVFzOrWLSEL8XK8LtcZDziZYDvFP4/Ответы+на+форму+(1)";

let allData = [];

// Login
document.getElementById("loginBtn").addEventListener("click", ()=>{
  const val = document.getElementById("adminPass").value;
  if(val === PASSWORD){
    document.getElementById("loginBox").style.display="none";
    document.getElementById("panel").style.display="block";
    fetchData();
  } else {
    document.getElementById("loginError").style.display="block";
  }
});

// Fetch JSON
async function fetchData(){
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();
    allData = data.map(item => {
      const answers = JSON.parse(item.answers);
      const scores = JSON.parse(item.scores);
      const leadingTypes = JSON.parse(item.leadingTypes);
      return {...item, answers, scores, leadingTypes};
    });
    renderTable();
    renderCharts();
  } catch(e){
    console.error("Ошибка загрузки:", e);
  }
}

// Таблица
function renderTable(){
  const body = document.getElementById("resultsBody");
  body.innerHTML = "";

  if(allData.length===0) return;

  // Заголовки
  const headerRow = document.getElementById("tableHeader");
  headerRow.innerHTML = "";
  const first = allData[0];
  const questionKeys = Object.keys(first.answers);
  headerRow.innerHTML += "<th>Время</th><th>User ID</th>";
  questionKeys.forEach(q=> headerRow.innerHTML += `<th>${q}</th>`);
  Object.keys(first.scores).forEach(s=> headerRow.innerHTML += `<th>${s}</th>`);
  headerRow.innerHTML += "<th>Главный тип</th>";

  // Строки
  allData.forEach(row=>{
    let tr = "<tr>";
    tr += `<td>${row["Отметка времени"]}</td>`;
    tr += `<td>${row.user_id}</td>`;
    questionKeys.forEach(q=> tr+=`<td>${row.answers[q]}</td>`);
    Object.keys(row.scores).forEach(s=> tr+=`<td>${row.scores[s]}</td>`);
    tr += `<td>${row.leadingTypes.join(", ")}</td>`;
    tr+="</tr>";
    body.innerHTML += tr;
  });
}

// Экспорт XLSX
document.getElementById("xlsxBtn").addEventListener("click", ()=>{
  const wb = XLSX.utils.book_new();
  const wsData = [];

  // Заголовки
  const headerRow = [];
  const first = allData[0];
  headerRow.push("Время","User ID");
  Object.keys(first.answers).forEach(q=>headerRow.push(q));
  Object.keys(first.scores).forEach(s=>headerRow.push(s));
  headerRow.push("Главный тип");
  wsData.push(headerRow);

  // Данные
  allData.forEach(row=>{
    const rowData = [];
    rowData.push(row["Отметка времени"], row.user_id);
    Object.keys(row.answers).forEach(q=>rowData.push(row.answers[q]));
    Object.keys(row.scores).forEach(s=>rowData.push(row.scores[s]));
    rowData.push(row.leadingTypes.join(", "));
    wsData.push(rowData);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  XLSX.writeFile(wb, "results.xlsx");
});

// Charts
let pieChart, lineChart;
function renderCharts(){
  // Pie: суммарные баллы по типам
  const sumScores = {};
  allData.forEach(r=> {
    for(const t in r.scores){
      sumScores[t] = (sumScores[t]||0) + r.scores[t];
    }
  });
  const ctxPie = document.getElementById("pieChart").getContext("2d");
  if(pieChart) pieChart.destroy();
  pieChart = new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: Object.keys(sumScores),
      datasets:[{data:Object.values(sumScores), backgroundColor:["#4b6bff","#ff6b6b","#6bcf6b","#ffc36b","#9b6bff","#ff6bcf"]}]
    }
  });

  // Line: динамика по времени (кол-во записей в день)
  const counts = {};
  allData.forEach(r=>{
    const d = r["Отметка времени"].split(" ")[0];
    counts[d] = (counts[d]||0)+1;
  });
  const ctxLine = document.getElementById("lineChart").getContext("2d");
  if(lineChart) lineChart.destroy();
  lineChart = new Chart(ctxLine, {
    type: "line",
    data: {
      labels: Object.keys(counts),
      datasets:[{label:"Прохождения", data:Object.values(counts), borderColor:"#4b6bff", fill:false}]
    }
  });
}
