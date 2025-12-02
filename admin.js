// --- ПАРОЛЬ ---
const ADMIN_PASSWORD = "admin123"; // пароль для входа

document.getElementById("loginBtn").addEventListener("click", () => {
  const val = document.getElementById("adminPass").value;
  if(val === ADMIN_PASSWORD){
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";
    loadData();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
});

// --- Вопросы ---
const questions = [
  "Мне необходимо быть в центре внимания","Я люблю драматизировать события и ярко выражать эмоции","Я часто стараюсь произвести впечатление на окружающих","Мне важно получать восхищение от других людей","Я люблю быть объектом внимания и заботы",
  "Я считаю, что мои интересы важнее интересов других","Мне быстро становится скучно, когда говорят о проблемах других людей","Я заслуживаю особого отношения","Мои потребности должны удовлетворяться в первую очередь","Я редко проявляю интерес к проблемам окружающих",
  "Мне сложно принимать решения самостоятельно","Я постоянно нуждаюсь в поддержке и одобрении","Я боюсь остаться один/одна","Мне трудно противостоять другим людям","Я часто перекладываю ответственность на других",
  "Я постоянно подозреваю людей в нечестных намерениях","Мне сложно доверять другим","Я часто анализирую мотивы поведения окружающих","Мне нужно знать все подробности о планах и действиях других","Я часто ищу скрытый смысл в словах и поступках людей",
  "Я часто испытываю резкие перепады настроения","Я боюсь быть отвергнутым/отвергнутой","Мои отношения с людьми нестабильны","Я склонен к импульсивным поступкам","Я иногда угрожаю самоповреждением, чтобы привлечь внимание",
  "Я легко манипулирую людьми для достижения своих целей","Чувства других людей мало меня волнуют","Я могу нарушить правила, если это выгодно","Я быстро нахожу слабые места людей","Я не испытываю угрызений совести за свои поступки"
];

const typeKeys = ["hysteroid","narcissistic","dependent","paranoid","borderline","sociopathic"];
let resultsData = [];

// --- Загрузка данных с OpenSheet ---
async function loadData(){
  const url = "https://opensheet.elk.sh/12r3Mnd4q3VuxJ2gVFzOrWLSEL8XK8LtcZDziZYDvFP4/Ответы на форму (1)";
  const res = await fetch(url);
  resultsData = await res.json();
  renderTable();
  renderCharts();
}

// --- Таблица ---
function renderTable(){
  const tbody = document.getElementById("resultsBody");
  tbody.innerHTML = "";

  // Шапка
  const thead = document.getElementById("tableHead");
  thead.innerHTML = "<th>Дата</th><th>User ID</th>";
  questions.forEach(q => thead.innerHTML += `<th>${q}</th>`);
  typeKeys.forEach(t => thead.innerHTML += `<th>${t}</th>`);

  resultsData.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row["Отметка времени"]}</td><td>${row["user_id"]}</td>`;
    const answers = JSON.parse(row.answers);
    questions.forEach((q,i)=>{
      const key = Object.keys(answers)[i];
      tr.innerHTML += `<td>${answers[key]}</td>`;
    });
    const scores = JSON.parse(row.scores);
    typeKeys.forEach(t=>{
      tr.innerHTML += `<td>${scores[t]}</td>`;
    });
    tbody.appendChild(tr);
  });
}

// --- Графики ---
function renderCharts(){
  const ctxPie = document.getElementById("pieChart").getContext("2d");
  const ctxLine = document.getElementById("lineChart").getContext("2d");

  // Pie — количество пользователей по ведущему типу
  const countTypes = {};
  typeKeys.forEach(t=>countTypes[t]=0);
  resultsData.forEach(r=>{
    const leading = JSON.parse(r.leadingTypes);
    leading.forEach(t=>{ if(countTypes[t]!==undefined) countTypes[t]++; });
  });
  new Chart(ctxPie,{
    type:"pie",
    data:{
      labels:typeKeys,
      datasets:[{data:typeKeys.map(t=>countTypes[t]),backgroundColor:["#4b6bff","#ff6b6b","#ffa94d","#51cf66","#f06595","#7950f2"]}]
    }
  });

  // Line — динамика
  const dates = resultsData.map(r=>r["Отметка времени"]);
  new Chart(ctxLine,{
    type:"line",
    data:{
      labels:dates,
      datasets:[{
        label:"Прохождения",
        data:resultsData.map(_=>1),
        borderColor:"#4b6bff",
        backgroundColor:"rgba(75,107,255,0.2)",
        fill:true,
        tension:0.3
      }]
    }
  });
}

// --- Экспорт XLSX ---
document.getElementById("xlsxBtn").addEventListener("click",()=>{
  const wb = XLSX.utils.book_new();
  const ws_data = [];
  ws_data.push(["Дата","User ID",...questions,...typeKeys]);
  resultsData.forEach(r=>{
    const row = [r["Отметка времени"],r.user_id];
    const answers = JSON.parse(r.answers);
    questions.forEach((q,i)=>row.push(answers[Object.keys(answers)[i]]));
    const scores = JSON.parse(r.scores);
    typeKeys.forEach(t=>row.push(scores[t]));
    ws_data.push(row);
  });
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Результаты");
  XLSX.writeFile(wb,"results.xlsx");
});
