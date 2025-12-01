// ===========================
// 1. Supabase
// ===========================
const supabaseUrl = 'https://wpqmvozpgamlwdhnfehy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcW12b3pwZ2FtbHdkaG5mZWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTA5NzUsImV4cCI6MjA4MDE4Njk3NX0.t_OuvNIMkgchzw79PCAvVrsF7x21XD0fgQVerBxYDVc';
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

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
    // Финальный экран
    const scores = {};
    categories.forEach(c=>scores[c.id]=0);
    all.forEach(item=>{scores[item.catId]+=(answers[item.id]||1);});
    const max = Math.max(...Object.values(scores));
    const leadingTypes = Object.keys(scores).filter(k=>scores[k]===max);

    // Анонимный user_id
    const userId = 'user_' + Math.random().toString(36).substr(2,9);

    // Сохраняем в Supabase
    try{
      const {data,error}=await supabase.from('results').insert([{
        user_id:userId,
        answers,
        scores,
        leadingTypes,
        created_at:new Date().toISOString()
      }]);
      if(error) throw error;
      console.log('Сохранено:', data);
    } catch(err){console.error('Ошибка:',err);}
    
    // Показ модального окна с графиком
    showResultModal(scores,leadingTypes);
  }
});

// ===========================
// 6. Модальное окно с результатом
// ===========================
function showResultModal(scores,leadingTypes){
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
// 7. Инициализация
// ===========================
showQuestion(currentIndex);
