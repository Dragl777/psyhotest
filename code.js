// ===========================
// 1. Google Forms URL
// ===========================
const FORM_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSe8mCTEix6iMEr6ulaBLIx-4SUkae4bOMVK4-abO4GwbKpG1A/formResponse"; 
// Пример: https://docs.google.com/forms/d/e/ВАШ_FORM_ID/formResponse
// Не забудьте заменить на ваш URL формы

// ===========================
// 2. Категории и вопросы
// ===========================
const categories = [
  { id: 'hysteroid', title: 'Истероидный тип', questions: [
      'Мне необходимо быть в центре внимания',
      'Я люблю драматизировать события и ярко выражать эмоции',
      'Я часто стараюсь произвести впечатление на окружающих',
      'Мне важно получать восхищение от других людей',
      'Я люблю быть объектом внимания и заботы'
  ]},
  { id: 'narcissistic', title: 'Нарциссический тип', questions: [
      'Я считаю, что мои интересы важнее интересов других',
      'Мне быстро становится скучно, когда говорят о проблемах других людей',
      'Я заслуживаю особого отношения',
      'Мои потребности должны удовлетворяться в первую очередь',
      'Я редко проявляю интерес к проблемам окружающих'
  ]},
  { id: 'dependent', title: 'Зависимый тип', questions: [
      'Мне сложно принимать решения самостоятельно',
      'Я постоянно нуждаюсь в поддержке и одобрении',
      'Я боюсь остаться один/одна',
      'Мне трудно противостоять другим людям',
      'Я часто перекладываю ответственность на других'
  ]},
  { id: 'paranoid', title: 'Параноидальный тип', questions: [
      'Я постоянно подозрева́ю людей в нечестных намерениях',
      'Мне сложно доверять другим',
      'Я часто анализирую мотивы поведения окружающих',
      'Мне нужно знать все подробности о планах и действиях других',
      'Я часто ищу скрытый смысл в словах и поступках людей'
  ]},
  { id: 'borderline', title: 'Пограничный тип', questions: [
      'Я часто испытываю резкие перепады настроения',
      'Я боюсь быть отвергнутым/отвергнутой',
      'Мои отношения с людьми нестабильны',
      'Я склонен/склонна к импульсивным поступкам',
      'Я иногда угрожаю самоповреждением, чтобы привлечь внимание'
  ]},
  { id: 'sociopathic', title: 'Социопатический тип', questions: [
      'Я легко манипулирую людьми для достижения своих целей',
      'Чувства других людей мало меня волнуют',
      'Я могу нарушить правила, если это выгодно',
      'Я быстро нахожу слабые места людей',
      'Я не испытываю угрызений совести за свои поступки'
  ]}
];

// ===========================
// 3. Сбор всех вопросов
// ===========================
let all = [];
categories.forEach(cat => cat.questions.forEach((q, idx) => {
  all.push({ id: `${cat.id}_${idx}`, catId: cat.id, catTitle: cat.title, text: q });
}));

// Перемешивание
function shuffle(array) { const a = array.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;}
all = shuffle(all);

// ===========================
// 4. Пошаговый интерфейс
// ===========================
let currentIndex = 0;
let answers = {};

const questionWrap = document.getElementById('questionWrap');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');

function showQuestion(idx){
  const item = all[idx];
  questionWrap.innerHTML = `
    <div class="mb-2"><strong>${idx+1}. ${item.text}</strong><div class="text-muted">${item.catTitle}</div></div>
    <div class="radios btn-group">
      ${[1,2,3,4,5].map(v=>`
        <label class="btn btn-outline-primary">
          <input type="radio" name="q" value="${v}" ${answers[item.id]==v?'checked':''}>
          <span>${v}</span>
        </label>`).join('')}
    </div>
  `;
  prevBtn.disabled = idx===0;
  nextBtn.textContent = idx===all.length-1 ? 'Посчитать результат' : 'Вперед';
  updateProgress();
}

function updateProgress(){
  progressBar.style.width = `${((currentIndex+1)/all.length)*100}%`;
  progressBar.textContent = `${currentIndex+1}/${all.length}`;
}

// ===========================
// 5. События кнопок
// ===========================
questionWrap.addEventListener('change', e=>{
  if(e.target && e.target.matches('input[type="radio"]')){
    answers[all[currentIndex].id] = Number(e.target.value);
  }
});

prevBtn.addEventListener('click', ()=>{
  if(currentIndex>0){currentIndex--; showQuestion(currentIndex);}
});

nextBtn.addEventListener('click', async ()=>{
  if(currentIndex<all.length-1){currentIndex++; showQuestion(currentIndex);}
  else {
    // Подсчёт баллов
    const scores = {};
    categories.forEach(c=>scores[c.id]=0);
    all.forEach(item=>{scores[item.catId]+=(answers[item.id]||1);});
    const max = Math.max(...Object.values(scores));
    const leadingTypes = Object.keys(scores).filter(k=>scores[k]===max);

    // Анонимный user_id
    const userId = 'user_' + Math.random().toString(36).substr(2,9);

    // Отправка в Google Forms
    sendToGoogleForm(userId, answers, scores, leadingTypes);

    // Показ модального окна с результатом
    showResultModal(scores, leadingTypes);
  }
});

// ===========================
// 6. Отправка в Google Forms
// ===========================
async function sendToGoogleForm(userId, answers, scores, leadingTypes){
  const formData = new URLSearchParams();
  // entry.XXXXX замените на свои ID полей из Google Form
  formData.append("entry.1110395449", userId);
  formData.append("entry.1475973910", JSON.stringify(answers));
  formData.append("entry.991662572", JSON.stringify(scores));
  formData.append("entry.2078897175", JSON.stringify(leadingTypes));

  try {
    await fetch(FORM_URL, { method:"POST", mode:"no-cors", body: formData });
    console.log("Результат отправлен в Google Forms");
  } catch(err) {
    console.error("Ошибка при отправке:", err);
  }
}

// ===========================
// 7. Модальное окно с результатом
// ===========================
function showResultModal(scores, leadingTypes){
  const ctx = document.getElementById('resultChart').getContext('2d');
  new Chart(ctx,{type:'bar',data:{
    labels:categories.map(c=>c.title),
    datasets:[{label:'Баллы',data:categories.map(c=>scores[c.id]),backgroundColor:'rgba(13,110,253,0.7)'}]
  },options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}}}});
  
  document.getElementById('leadingType').innerHTML=`<h5>Преобладающий тип: ${leadingTypes.map(t=>categories.find(c=>c.id===t).title).join(', ')}</h5>`;
  
  const modal = new bootstrap.Modal(document.getElementById('resultModal'));
  modal.show();
}

// ===========================
// 8. Инициализация
// ===========================
showQuestion(currentIndex);

