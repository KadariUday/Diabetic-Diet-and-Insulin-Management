
// Enhanced JS for DiabCare+
// Shared functions: menu, year, tips, diet, insulin, chart, download report
document.addEventListener('DOMContentLoaded', () => {
  // Set year
  const year = new Date().getFullYear();
  ['year','year2','year3','year4','year5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = year;
  });

  // Mobile menu
  const burger = document.querySelector('.burger');
  if (burger){
    burger.addEventListener('click', () => {
      const nav = document.querySelector('.nav');
      nav.style.display = (nav.style.display === 'flex') ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.background = 'white';
      nav.style.padding = '10px';
      nav.style.borderRadius = '8px';
      nav.style.boxShadow = '0 8px 30px rgba(12,34,68,0.06)';
    });
  }

  // Mini chart on home
  try {
    const ctx = document.getElementById('miniChart');
    if (ctx){
      const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const data = [120, 135, 128, 140, 130, 125, 118];
      new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Glucose', data, fill: true, tension:0.3, pointRadius:3 }] },
        options: { plugins:{legend:{display:false}}, scales:{y:{beginAtZero:false}} }
      });
    }
  } catch (e){ console.log('Chart load failed', e); }

  // Tips rotation (used on tips page)
  const tips = [
    "Walk 10–20 minutes after meals to help control blood sugar.",
    "Prefer whole grains and high-fiber foods to slow glucose rise.",
    "Stay hydrated — water helps regulate glucose levels.",
    "Check feet daily for cuts or sores; diabetes affects circulation.",
    "Carry a fast-acting sugar source for hypoglycemia emergencies."
  ];
  let tipIndex = 0;
  const tipTextEl = document.getElementById('tipText');
  if (tipTextEl){
    function showTip(i){ tipTextEl.textContent = tips[i]; }
    showTip(tipIndex);
    let tipInterval = setInterval(() => { tipIndex = (tipIndex+1)%tips.length; showTip(tipIndex); }, 6000);
    const prev = document.getElementById('prevTip'), next = document.getElementById('nextTip');
    if (prev) prev.addEventListener('click', ()=>{ tipIndex=(tipIndex-1+tips.length)%tips.length; showTip(tipIndex); clearInterval(tipInterval); });
    if (next) next.addEventListener('click', ()=>{ tipIndex=(tipIndex+1)%tips.length; showTip(tipIndex); clearInterval(tipInterval); });
  }

  // Diet planner logic
  const dietForm = document.getElementById('dietForm');
  if (dietForm){
    dietForm.addEventListener('submit', e => {
      e.preventDefault();
      const age = Number(document.getElementById('age').value);
      const weight = Number(document.getElementById('weight').value);
      const glucose = Number(document.getElementById('glucose').value);
      const activity = Number(document.getElementById('activity').value);

      const calories = Math.round(weight * 24 * activity);
      const breakfast = Math.round(calories * 0.28);
      const lunch = Math.round(calories * 0.36);
      const dinner = Math.round(calories * 0.24);
      const snacks = Math.round(calories * 0.12);

      const summary = `Estimated daily calories: <strong>${calories} kcal</strong>. Distribution — Breakfast ${breakfast} kcal, Lunch ${lunch} kcal, Dinner ${dinner} kcal, Snacks ${snacks} kcal. (Glucose: ${glucose} mg/dL)`;
      document.getElementById('summary').innerHTML = summary;

      const mealList = [
        {meal:'Breakfast', kcal:breakfast, carbs:Math.round(breakfast*0.45/4)},
        {meal:'Lunch', kcal:lunch, carbs:Math.round(lunch*0.45/4)},
        {meal:'Dinner', kcal:dinner, carbs:Math.round(dinner*0.45/4)},
        {meal:'Snacks', kcal:snacks, carbs:Math.round(snacks*0.45/4)}
      ];

      const mealsDiv = document.getElementById('meals');
      mealsDiv.innerHTML = '';
      mealList.forEach(m => {
        const el = document.createElement('div');
        el.className = 'card';
        el.style.padding = '12px';
        el.innerHTML = `<h4 style="margin:0 0 6px">${m.meal} — ${m.kcal} kcal</h4>
                        <p style="margin:0 0 8px">Suggested carbs: <strong>${m.carbs} g</strong></p>
                        <ul style="margin:0 0 0 18px">${sampleMealOptions(m.meal).map(i=>`<li>${i}</li>`).join('')}</ul>`;
        mealsDiv.appendChild(el);
      });

      document.getElementById('dietResult').classList.remove('hidden');
      // show download content by preparing simple printable content
      window.lastDietPlan = { age, weight, glucose, calories, mealList };
      setTimeout(()=> window.scrollTo({top: document.getElementById('dietResult').offsetTop - 20, behavior:'smooth'}),200);
    });
  }

  // Download printable diet report (opens print dialog)
  const dlDiet = document.getElementById('downloadDiet');
  if (dlDiet){
    dlDiet.addEventListener('click', () => {
      const p = window.lastDietPlan;
      if (!p) return alert('Generate the plan first.');
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>Diet Report</title><style>body{font-family:Arial;padding:20px}h1{color:#0b74ff}</style></head><body>`);
      w.document.write(`<h1>DiabCare+ — Diet Report</h1><p>Age: ${p.age}, Weight: ${p.weight} kg, Glucose: ${p.glucose} mg/dL</p>`);
      w.document.write(`<p>Estimated Calories: ${p.calories} kcal</p><h3>Meals</h3><ul>`);
      p.mealList.forEach(m=> w.document.write(`<li><strong>${m.meal}</strong>: ${m.kcal} kcal — ~${m.carbs} g carbs</li>`));
      w.document.write(`</ul><p>Note: Educational tool only.</p></body></html>`);
      w.document.close();
      w.print();
    });
  }

  function sampleMealOptions(meal){
    if (meal==='Breakfast') return ['Oats + milk (small)', '1 boiled egg', '1 small fruit'];
    if (meal==='Lunch') return ['1 cup brown rice / 2 rotis', 'Grilled curry', 'Salad'];
    if (meal==='Dinner') return ['2 rotis or millet', 'Dal / lean protein', 'Yogurt'];
    return ['Handful of nuts', 'Veg sticks'];
  }

  // Insulin calculator logic
  const insulinForm = document.getElementById('insulinForm');
  if (insulinForm){
    insulinForm.addEventListener('submit', e => {
      e.preventDefault();
      const curBG = Number(document.getElementById('curBG').value);
      const carbs = Number(document.getElementById('carbs').value);
      const targetBG = Number(document.getElementById('targetBG').value);
      const isf = Number(document.getElementById('isf').value);
      const icr = Number(document.getElementById('icr').value);

      const correction = (curBG - targetBG) / isf;
      const carbDose = carbs / icr;
      let total = correction + carbDose;
      total = Math.max(0, Math.round(total*10)/10);

      document.getElementById('doseText').innerHTML = `Correction: <strong>${(Math.round(correction*10)/10).toFixed(1)} U</strong><br/>Carb: <strong>${(Math.round(carbDose*10)/10).toFixed(1)} U</strong><br/><strong>Total: ${total.toFixed(1)} U</strong>`;
      document.getElementById('insulinResult').classList.remove('hidden');
      setTimeout(()=> window.scrollTo({top: document.getElementById('insulinResult').offsetTop - 20, behavior:'smooth'}),200);
    });
  }
  const clearIns = document.getElementById('clearInsulin');
  if (clearIns) clearIns.addEventListener('click', ()=>{ document.getElementById('insulinForm').reset(); document.getElementById('insulinResult').classList.add('hidden'); });

  // Contact form local save
  const contactForm = document.getElementById('contactForm');
  if (contactForm){
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('cname').value.trim();
      const email = document.getElementById('cemail').value.trim();
      const message = document.getElementById('cmessage').value.trim();
      const saved = JSON.parse(localStorage.getItem('diabcare_contacts')||'[]');
      saved.push({name,email,message,at:new Date().toISOString()});
      localStorage.setItem('diabcare_contacts', JSON.stringify(saved));
      document.getElementById('contactForm').reset();
      const savedEl = document.getElementById('contactSaved'); if (savedEl) savedEl.classList.remove('hidden');
      setTimeout(()=> window.scrollTo({top: document.getElementById('contactSaved').offsetTop - 20, behavior:'smooth'}),200);
    });
  }

});
