<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Тест на определение типа личности</title>
<style>
:root{--bg:#f5f7fb;--card:#fff;--accent:#4b6bff;--muted:#6b7280}
body{margin:0;font-family:Inter, Roboto, Helvetica, Arial, sans-serif;background:var(--bg);color:#111}
.wrap{max-width:980px;margin:28px auto;padding:20px}
.card{background:var(--card);border-radius:12px;padding:20px;box-shadow:0 6px 20px rgba(16,24,40,0.06)}
h1{margin:0 0 6px;font-size:20px}
p.lead{margin:0 0 16px;color:var(--muted);font-size:14px}
.question{padding:12px;border-radius:8px;border:1px solid #eef2ff;background:linear-gradient(180deg,#fff, #fbfdff);display:flex;gap:12px;align-items:center;margin-bottom:10px}
.q-text{flex:1}
.radios{display:flex;gap:6px}
.radios label{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid #e6eefc;cursor:pointer}
.radios input{display:none}
.radios input:checked + span{background:var(--accent);color:white;border-color:var(--accent)}
.controls{display:flex;gap:10px;align-items:center;margin-top:16px}
button{border:0;padding:10px 14px;border-radius:8px;cursor:pointer}
button.primary{background:var(--accent);color:white}
button.ghost{background:transparent;border:1px solid #d1d5db}
.results{margin-top:18px}
.result-box{padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e6eefc}
.scores{display:grid;grid-template-columns:1fr auto;gap:8px}
.muted{color:var(--muted);font-size:13px}
@media(max-width:720px){.radios{gap:4px}.radios label{width:32px;height:32px}}
</style>
</head>
<body>
<div class="wrap">
<div class="card">
<h1>Тест на определение типа личности</h1>
<p class="lead">Пожалуйста, оцените каждое утверждение по шкале от 1 (совершенно не характерно) до 5 (постоянно).</p>


<div id="questionsWrap" aria-live="polite"></div>


<div class="controls">
<button id="submitBtn" class="primary">Посчитать результат</button>
<button id="resetBtn" class="ghost">Сбросить ответы</button>
<div style="margin-left:auto" class="muted" id="progress">Готово: 0 / 30</div>
</div>


<div id="results" class="results" aria-live="polite"></div>


<p class="muted" style="margin-top:12px">Важно: это не медицинская диагностика. Для профессиональной оценки обратитесь к специалисту.</p>
</div>
</div>


<script>
// Категории и вопросы
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
</html>
