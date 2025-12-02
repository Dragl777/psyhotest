const PASSWORD = "admin123"; // пароль
const SHEET_URL = "https://opensheet.elk.sh/12r3Mnd4q3VuxJ2gVFzOrWLSEL8XK8LtcZDziZYDvFP4/Ответы на форму (1)";

let dataAll = [];
let currentPage = 1;
let pageSize = 25;

// Типы на русском
const typeMap = {
  "hysteroid": "Истероидный",
  "narcissistic": "Нарциссический",
  "dependent": "Зависимый",
  "paranoid": "Параноидальный",
  "borderline": "Пограничный",
  "sociopathic": "Социопатический"
};

// Вопросы для каждого ключа
const questionMap = {
  "hysteroid_0": "Мне необходимо быть в центре внимания",
  "hysteroid_1": "Я люблю драматизировать события и ярко выражать эмоции",
  "hysteroid_2": "Я часто стараюсь произвести впечатление на окружающих",
  "hysteroid_3": "Мне важно получать восхищение от других людей",
  "hysteroid_4": "Я люблю быть объектом внимания и заботы",

  "narcissistic_0": "Я считаю, что мои интересы важнее интересов других",
  "narcissistic_1": "Мне быстро становится скучно, когда говорят о проблемах других людей",
  "narcissistic_2": "Я заслуживаю особого отношения",
  "narcissistic_3": "Мои потребности должны удовлетворяться в первую очередь",
  "narcissistic_4": "Я редко проявляю интерес к проблемам окружающих",

  "dependent_0": "Мне сложно принимать решения самостоятельно",
  "dependent_1": "Я постоянно нуждаюсь в поддержке и одобрении",
  "dependent_2": "Я боюсь остаться один/одна",
  "dependent_3": "Мне трудно противостоять другим людям",
  "dependent_4": "Я часто перекладываю ответственность на других",

  "paranoid_0": "Я постоянно подозреваю людей в нечестных намерениях",
  "paranoid_1": "Мне сложно доверять другим",
  "paranoid_2": "Я часто анализирую мотивы поведения окружающих",
  "paranoid_3": "Мне нужно знать все подробности о планах и действиях других",
  "paranoid_4": "Я часто ищу скрытый смысл в словах и поступках людей",

  "borderline_0": "Я часто испытываю резкие перепады настроения",
  "borderline_1": "Я боюсь быть отвергнутым/отвергнутой",
  "borderline_2": "Мои отношения с людьми нестабильны",
  "borderline_3": "Я склонен/склонна к импульсивным поступкам",
  "borderline_4": "Я иногда угрожаю самоповреждением, чтобы привлечь внимание",

  "sociopathic_0": "Я легко манипулирую людьми для достижения своих целей",
  "sociopathic_1": "Чувства других людей мало меня волнуют",
  "sociopathic_2": "Я могу нарушить правила, если это выгодно",
  "sociopathic_3": "Я быстро нахожу слабые места людей",
  "sociopathic_4": "Я не испытываю угрызений совести за свои поступки"
};

// Login
document.getElementById("loginBtn").addEventListener("click", () => {
  const val = document.getElementById("adminPass").value;
  if(val === PASSWORD){
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";
    loadData();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
});

// Обновление данных
document.getElementById("refreshBtn").addEventListener("click", loadData);
document.getElementById("pageSize").addEventListener("change", (e)=>{
  pageSize = Number(e.target.value);
  renderTable();
});

// Поиск и фильтр
document.getElementById("searchInput").addEventListener("input", renderTable);
document.getElementById("typeFilter").addEventListener("change", renderTable);

// XLSX экспорт
document.getElementById("xlsxBtn").addEventListener("click", ()=>{
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataAll.map(item=>{
    const answers = JSON.parse(item.answers);
    const obj = { "Дата": item["Отметка времени"], "User ID": item.user_id };
    Object.keys(answers).forEach(key=>{
      obj[questionMap[key]] = answers[key];
    });
    obj["Преобладающий тип"] = JSON.parse(item.leadingTypes).map(t=>typeMap[t]).join(", ");
    return obj;
  }));
  XLSX.utils.book_append_sheet(wb, ws, "Результаты");
  XLSX.writeFile(wb, "results.xlsx");
});

// Загрузка данных
async function loadData(){
  const res = await fetch(SHEET_URL);
  dataAll = await res.json();
  populateTypeFilter();
  currentPage = 1;
  renderTable();
  renderCharts();
}

// Таблица
function renderTable(){
  const tbody = document.getElementById("resultsBody");
  tbody.innerHTML = "";

  let filtered = dataAll.filter(item=>{
    const search = document.getElementById("searchInput").value.toLowerCase();
    const typeFilter = document.getElementById("typeFilter").value;
    const matchesSearch = item.user_id.toLowerCase().includes(search) || item["Отметка времени"].toLowerCase().includes(search);
    const matchesType = !typeFilter || JSON.parse(item.leadingTypes).includes(typeFilter);
    return matchesSearch && matchesType;
  });

  const total = filtered.length;
  const start = (currentPage-1)*pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start,end);

  pageData.forEach(item=>{
    const tr = document.createElement("tr");
    const answers = JSON.parse(item.answers);
    let answersText = "";
    Object.keys(answers).forEach(key=>{
      answersText += `${questionMap[key]}: ${answers[key]} \n`;
    });
    tr.innerHTML = `
      <td>${item["Отметка времени"]}</td>
      <td>${item.user_id}</td>
      <td><pre style="white-space: pre-wrap;">${answersText}</pre></td>
      <td>${JSON.parse(item.leadingTypes).map(t=>typeMap[t]).join(", ")}</td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(filtered.length);
  document.getElementById("showingInfo").textContent = `Показано ${start+1}-${Math.min(end,total)} из ${total}`;
}

// Пагинация
function renderPagination(total){
  const pages = Math.ceil(total/pageSize);
  const ul = document.getElementById("pagination");
  ul.innerHTML = "";

  for(let i=1;i<=pages;i++){
    const li = document.createElement("li");
    li.className = "page-item "+(i===currentPage?"active":"");
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click",(e)=>{
      e.preventDefault();
      currentPage = i;
      renderTable();
    });
    ul.appendChild(li);
  }
}

// Фильтр типов
function populateTypeFilter(){
  const select = document.getElementById("typeFilter");
  select.innerHTML = '<option value="">Все типы</option>';
  Object.keys(typeMap).forEach(k=>{
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = typeMap[k];
    select.appendChild(opt);
  });
}

// Графики
let pieChart,lineChart;
function renderCharts(){
  const typeCounts = { "hysteroid":0,"narcissistic":0,"dependent":0,"paranoid":0,"borderline":0,"sociopathic":0 };
  const dateCounts = {};

  dataAll.forEach(item=>{
    const types = JSON.parse(item.leadingTypes);
    types.forEach(t=>typeCounts[t]++);
    const date = item["Отметка времени"].split(" ")[0];
    if(!dateCounts[date]) dateCounts[date]=0;
    dateCounts[date]++;
  });

  // Pie chart
  const ctxPie = document.getElementById("pieChart").getContext("2d");
  if(pieChart) pieChart.destroy();
  pieChart = new Chart(ctxPie,{
    type:"pie",
    data:{
      labels:Object.keys(typeCounts).map(k=>typeMap[k]),
      datasets:[{
        data:Object.values(typeCounts),
        backgroundColor:["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40"]
      }]
    }
  });

  // Line chart
  const ctxLine = document.getElementById("lineChart").getContext("2d");
  if(lineChart) lineChart.destroy();
  const sortedDates = Object.keys(dateCounts).sort();
  lineChart = new Chart(ctxLine,{
    type:"line",
    data:{
      labels:sortedDates,
      datasets:[{
        label:"Кол-во прохождений",
        data:sortedDates.map(d=>dateCounts[d]),
        borderColor:"#36A2EB",
        fill:false
      }]
    }
  });
}
