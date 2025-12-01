// === Supabase setup ===
const supabaseUrl = 'https://wpqmvozpgamlwdhnfehy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcW12b3pwZ2FtbHdkaG5mZWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTA5NzUsImV4cCI6MjA4MDE4Njk3NX0.t_OuvNIMkgchzw79PCAvVrsF7x21XD0fgQVerBxYDVc';
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

// === Категории и вопросы ===
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
      'Я постоянно подозреваю людей в нечестных намерениях',
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

// === Подготовка вопросов ===
let all = [];
categories.forEach(cat => cat.questions.forEach((q, idx) => {
  all.push({ id: `${cat.id}_${idx}`, catId: cat.id, catTitle: cat.title, text: q });
}));

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
all = shuffle(all);

const questionsWrap = document.getElementById('questionsWrap');
const progressEl = document.getElementById('progress');

// === Рендер вопросов ===
all.forEach((item, idx) => {
  const q = document.createElement('div');
  q.className = 'question';
  q.innerHTML = `
    <div class="q-text"><strong>${idx + 1}. ${escapeHtml(item.text)}</strong><div class="muted">${item.catTitle}</div></div>
    <div class="radios" role="radiogroup" aria-label="Оценка для вопроса ${idx + 1}">
      ${[1,2,3,4,5].map(v => `
        <label title="${v}">
          <input type="radio" name="q_${idx}" value="${v}" ${v===1? 'checked': ''}>
          <span>${v}</span>
        </label>`).join('')}
    </div>
  `;
  questionsWrap.appendChild(q);
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s]));
}

// === Прогресс ===
function updateProgress() {
  const total = all.length;
  const filled = Array.from(document.querySelectorAll('.radios')).length;
  progressEl.textContent = `Готово: ${filled} / ${total}`;
}
updateProgress();

// === Подсчёт баллов ===
function calculateScores() {
  const scores = {};
  categories.forEach(c => scores[c.id] = 0);
  all.forEach((item, idx) => {
    const radios = document.getElementsByName(`q_${idx}`);
    let val = 1;
    for (const r of radios) { if(r.checked){ val = Number(r.value); break; } }
    scores[item.catId] += val;
  });
  return scores;
}

// === Интерпретация ===
function interpret(id) {
  const map = {
    hysteroid:'Склонность к яркому самовыражению, потребность в внимании и внешнем одобрении.',
    narcissistic:'Ориентация на собственные потребности и ожидание особого отношения.',
    dependent:'Повышенная зависимость от чужого мнения, страх самостоятельности.',
    paranoid:'Подозрительность, трудности с доверием к другим.',
    borderline:'Эмоциональная нестабильность, импульсивность и страх отвержения.',
    sociopathic:'Склонность к манипуляции и пренебрежение чувствами других.'
  };
  return map[id]||'';
}

// === Отображение результатов ===
function showResults() {
  const scores = calculateScores();
  const max = Math.max(...Object.values(scores));
  const winners = Object.keys(scores).filter(k=>scores[k]===max);
  const res = document.getElementById('results');
  let html = '<div class="result-box">';
  html += '<h3>Баллы по категориям:</h3><div class="scores">';
  categories.forEach(c => html += `<div>${c.title}</div><div><strong>${scores[c.id]}</strong></div>`);
  html += '</div>';
  html += '<hr style="margin:12px 0;border:none;border-top:1px solid #eef2ff">';
  if(winners.length===1){
    const win = winners[0];
    const title = categories.find(c=>c.id===win).title;
    html += `<h3>Преобладающий тип: <span style="color:var(--accent)">${title}</span></h3>`;
    html += `<p class="muted">${escapeHtml(interpret(win))}</p>`;
  } else {
    html += '<h3>Ничья между:</h3><ul>';
    winners.forEach(w => html += `<li>${categories.find(c=>c.id===w).title} — ${scores[w]} баллов</li>`);
    html += '</ul><p class="muted">Если ничья, у вас смешанные черты нескольких типов.</p>';
  }
  html += '</div>';
  res.innerHTML = html;
  res.scrollIntoView({behavior:'smooth', block:'start'});
}

// === Сбор ответов ===
function collectAnswers() {
  const answers = {};
  all.forEach((item, idx) => {
    const radios = document.getElementsByName(`q_${idx}`);
    for(const r of radios){ if(r.checked){ answers[item.id] = Number(r.value); break; } }
  });
  return answers;
}

// === События ===
document.addEventListener('change', ev => { if(ev.target && ev.target.matches('.radios input')) updateProgress(); });

document.getElementById('resetBtn').addEventListener('click', function(){
  document.querySelectorAll('.radios').forEach(group => { group.querySelectorAll('input').forEach(inp => inp.checked = (inp.value==='1')); });
  document.getElementById('results').innerHTML = '';
  updateProgress();
});

// === Сохранение и показ результатов ===
document.getElementById('submitBtn').addEventListener('click', async function() {
  const scores = calculateScores();
  const answers = collectAnswers();
  const max = Math.max(...Object.values(scores));
  const leadingTypes = Object.keys(scores).filter(k => scores[k]===max);

  try {
    const { data, error } = await supabase
      .from('results')
      .insert([{ scores, leadingTypes, answers, created_at: new Date().toISOString() }]);
    if(error) throw error;
    console.log('Результат сохранён:', data);
  } catch(err) {
    console.error('Ошибка сохранения в Supabase:', err);
  }

  showResults();
});
