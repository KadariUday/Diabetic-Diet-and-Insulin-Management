// DiabCare+ Full-Stack JS
// Handles Auth, API calls, and Dynamic Content
document.addEventListener('DOMContentLoaded', () => {

  // --- CONFIG ---
  const API_URL = '/api'; // Uses relative path for production hosting

  // --- STATE ---
  let lastDietPlan = null; // Store last plan for printing

  // --- HELPERS ---
  const getToken = () => localStorage.getItem('diabcare_token');
  const getUserEmail = () => localStorage.getItem('diabcare_email');
  const isLoggedIn = () => !!getToken();

  // Show messages (for success/error) - Upgraded to Toast!
  const showMessage = (message, type = 'success') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    
    // Icon based on type
    const icon = type === 'error' 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // --- DYNAMIC CONTENT RENDERING ---

  // Render Header (for app pages)
  const renderHeader = () => {
    const header = document.getElementById('main-header');
    if (!header) return;

    const path = window.location.pathname.split('/').pop();

    // Links for logged-in users
    const navLinks = `
      <a href="dashboard.html" class="${path === 'dashboard.html' ? 'active' : ''}">Dashboard</a>
      <a href="diet.html" class="${path === 'diet.html' ? 'active' : ''}">Diet Planner</a>
      <a href="insulin.html" class="${path === 'insulin.html' ? 'active' : ''}">Insulin Calc</a>
      <a href="tips.html" class="${path === 'tips.html' ? 'active' : ''}">Health Tips</a>
      <a href="contact.html" class="${path === 'contact.html' ? 'active' : ''}">Contact</a>
      <button id="logout-button">Logout</button>
    `;

    header.innerHTML = `
      <div class="container header-inner">
        <a href="dashboard.html" class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.7-1.44.7 1.44H15.8"/></svg>
          DiabCare<span class="plus">+</span>
        </a>
        <nav class="nav">
          ${navLinks}
        </nav>
        <button class="burger" aria-label="Open menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>
    `;

    // Add logout functionality
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);

    // Add mobile menu toggle
    setupMobileMenu();
  };

  // Render Footer (for app pages)
  const renderFooter = () => {
    const footer = document.getElementById('main-footer');
    if (!footer) return;
    const year = new Date().getFullYear();

    footer.innerHTML = `
      <div class="container">
        <div class="footer-inner">
          <div>
            <strong>DiabCare+</strong>
            <br>
            <small class="muted">Educational tool — not medical advice.</small>
          </div>
          <div class="footer-links">
            <a href="dashboard.html">Dashboard</a>
            <a href="diet.html">Diet Planner</a>
            <a href="tips.html">Health Tips</a>
          </div>
        </div>
        <div class="footer-bottom">
          <small>© ${year} DiabCare+. Full-Stack Version.</small>
        </div>
      </div>
    `;
  };

  // --- AUTHENTICATION & ROUTING ---

  const handleSignup = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed.');
      }

      showMessage('Signup successful! Please log in.', 'success');
      setTimeout(() => window.location.href = 'index.html', 2000);

    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      // Save token and user info
      localStorage.setItem('diabcare_token', data.token);
      localStorage.setItem('diabcare_email', data.email);

      showMessage('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1500);

    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('diabcare_token');
    localStorage.removeItem('diabcare_email');
    window.location.href = 'index.html'; // Redirect to login page
  };

  // Protect routes that require login
  const protectRoute = () => {
    if (!isLoggedIn()) {
      window.location.href = 'index.html'; // Redirect to login page
    }
  };

  // Redirect auth pages if already logged in
  const redirectIfLoggedIn = () => {
    if (isLoggedIn()) {
      window.location.href = 'dashboard.html';
    }
  };

  // --- PAGE-SPECIFIC LOGIC ---

  // Dashboard Chart (moved from old home)
  const initDashboardChart = () => {
    try {
      const ctx = document.getElementById('miniChart');
      if (ctx) {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = [120, 135, 128, 140, 130, 125, 118];
        new Chart(ctx, {
          type: 'line',
          data: {
            labels, datasets: [{
              label: 'Glucose',
              data,
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              backgroundColor: 'rgba(11, 116, 255, 0.1)',
              borderColor: 'rgba(11, 116, 255, 1)'
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
          }
        });
      }
    } catch (e) { console.log('Chart load failed', e); }
  };

  // Tips Page
  const initTips = () => {
    const tips = [
      "Walk 10–20 minutes after meals to help control blood sugar.",
      "Prefer whole grains and high-fiber foods to slow glucose rise.",
      "Stay hydrated — water helps regulate glucose levels.",
      "Check feet daily for cuts or sores; diabetes affects circulation.",
      "Carry a fast-acting sugar source for hypoglycemia emergencies."
    ];
    let tipIndex = 0;
    const tipTextEl = document.getElementById('tipText');
    if (tipTextEl) {
      function showTip(i) { tipTextEl.textContent = tips[i]; }
      showTip(tipIndex);

      const prev = document.getElementById('prevTip'), next = document.getElementById('nextTip');
      if (prev) prev.addEventListener('click', () => {
        tipIndex = (tipIndex - 1 + tips.length) % tips.length;
        showTip(tipIndex);
      });
      if (next) next.addEventListener('click', () => {
        tipIndex = (tipIndex + 1) % tips.length;
        showTip(tipIndex);
      });
    }
  };

  // Diet Planner
  const initDietPlanner = () => {
    const dietForm = document.getElementById('dietForm');
    if (dietForm) {
      dietForm.addEventListener('submit', async (e) => {
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
          { meal: 'Breakfast', kcal: breakfast, carbs: Math.round(breakfast * 0.45 / 4) },
          { meal: 'Lunch', kcal: lunch, carbs: Math.round(lunch * 0.45 / 4) },
          { meal: 'Dinner', kcal: dinner, carbs: Math.round(dinner * 0.45 / 4) },
          { meal: 'Snacks', kcal: snacks, carbs: Math.round(snacks * 0.45 / 4) }
        ];

        const mealsDiv = document.getElementById('meals');
        mealsDiv.innerHTML = '';
        mealList.forEach(m => {
          const el = document.createElement('div');
          el.className = 'card';
          el.innerHTML = `<h4>${m.meal} — ${m.kcal} kcal</h4>
                          <p>Suggested carbs: <strong>${m.carbs} g</strong></p>
                          <ul>${sampleMealOptions(m.meal).map(i => `<li>${i}</li>`).join('')}</ul>`;
          mealsDiv.appendChild(el);
        });

        document.getElementById('dietResult').classList.remove('hidden');
        lastDietPlan = { age, weight, glucose, calories, mealList };

        // --- API Call to Save ---
        try {
          const res = await fetch(`${API_URL}/diet/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ age, weight, glucose, activity, calories, mealList })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to save plan.');
          showMessage('Diet plan saved to your dashboard!', 'success');
        } catch (err) {
          showMessage(err.message, 'error');
        }
      });
    }

    // Download printable diet report (local data only)
    const dlDiet = document.getElementById('downloadDiet');
    if (dlDiet) {
      dlDiet.addEventListener('click', () => {
        const p = lastDietPlan;
        if (!p) {
          showMessage('Please generate a plan first.', 'error');
          return;
        }
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>Diet Report</title><style>body{font-family:Arial;padding:20px}h1{color:#0b74ff}h3{border-bottom:1px solid #eee;padding-bottom:5px}ul{line-height:1.6}</style></head><body>`);
        w.document.write(`<h1>DiabCare+ — Diet Report</h1><p>Age: ${p.age}, Weight: ${p.weight} kg, Glucose: ${p.glucose} mg/dL</p>`);
        w.document.write(`<p>Estimated Calories: <strong>${p.calories} kcal</strong></p><h3>Meals</h3><ul>`);
        p.mealList.forEach(m => w.document.write(`<li><strong>${m.meal}</strong>: ${m.kcal} kcal — ~${m.carbs} g carbs</li>`));
        w.document.write(`</ul><p style="margin-top: 20px;"><em>Note: This is an educational tool only. Consult a registered dietitian for personalized medical advice.</em></p></body></html>`);
        w.document.close();
        w.print();
      });
    }
  };

  function sampleMealOptions(meal) {
    if (meal === 'Breakfast') return ['Oats + milk (small)', '1 boiled egg', '1 small fruit'];
    if (meal === 'Lunch') return ['1 cup brown rice / 2 rotis', 'Grilled curry', 'Salad'];
    if (meal === 'Dinner') return ['2 rotis or millet', 'Dal / lean protein', 'Yogurt'];
    return ['Handful of nuts', 'Veg sticks'];
  }

  // Insulin Calculator
  const initInsulinCalc = () => {
    const insulinForm = document.getElementById('insulinForm');
    if (insulinForm) {
      insulinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const curBG = Number(document.getElementById('curBG').value);
        const carbs = Number(document.getElementById('carbs').value);
        const targetBG = Number(document.getElementById('targetBG').value);
        const isf = Number(document.getElementById('isf').value);
        const icr = Number(document.getElementById('icr').value);

        const correction = (curBG - targetBG) / isf;
        const carbDose = carbs / icr;
        let totalDose = correction + carbDose;
        totalDose = Math.max(0, Math.round(totalDose * 10) / 10);

        document.getElementById('doseText').innerHTML = `Correction: <strong>${(Math.round(correction * 10) / 10).toFixed(1)} U</strong><br/>Carb: <strong>${(Math.round(carbDose * 10) / 10).toFixed(1)} U</strong><br/><strong>Total: ${totalDose.toFixed(1)} U</strong>`;
        document.getElementById('insulinResult').classList.remove('hidden');

        // --- API Call to Save ---
        try {
          const res = await fetch(`${API_URL}/insulin/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ curBG, carbs, targetBG, isf, icr, totalDose })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to save dose.');
          showMessage('Dose calculation saved to your dashboard!', 'success');
        } catch (err) {
          showMessage(err.message, 'error');
        }
      });
    }
    const clearIns = document.getElementById('clearInsulin');
    if (clearIns) clearIns.addEventListener('click', () => {
      document.getElementById('insulinForm').reset();
      document.getElementById('insulinResult').classList.add('hidden');
      document.getElementById('message-box').classList.add('hidden');
    });
  };

  // Contact Form
  const initContactForm = () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('cname').value.trim();
        const email = document.getElementById('cemail').value.trim();
        const message = document.getElementById('cmessage').value.trim();
        const token = getToken();

        try {
          const res = await fetch(`${API_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message, token }) // Send token if available
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to send message.');

          document.getElementById('contactForm').reset();
          showMessage('Thank you! Your message has been received.', 'success');

        } catch (err) {
          showMessage(err.message, 'error');
        }
      });
    }
  };

  // Dashboard Data Loading
  const initDashboard = async () => {
    const welcome = document.getElementById('welcome-message');
    if (welcome) welcome.textContent = `Welcome, ${getUserEmail()}!`;

    try {
      // Fetch Diet History
      const dietRes = await fetch(`${API_URL}/diet/history`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!dietRes.ok) throw new Error('Could not load diet history.');
      const dietPlans = await dietRes.json();
      const dietDiv = document.getElementById('diet-history');
      if (dietPlans.length > 0) {
        dietDiv.innerHTML = dietPlans.map((plan, index) => `
          <div class="history-card" style="animation-delay: ${index * 0.1}s">
            <h3>${plan.calories} kcal Plan</h3>
            <p><strong>Weight:</strong> ${plan.weight} kg | <strong>Glucose:</strong> ${plan.glucose} mg/dL</p>
            <p><strong>Meals:</strong> ${plan.mealList.length} | <strong>Activity:</strong> ${plan.activity}</p>
            <p class="date">${new Date(plan.createdAt).toLocaleString()}</p>
          </div>
        `).join('');
      } // 'else' retains the default "No plans" message

      // Fetch Insulin History
      const insulinRes = await fetch(`${API_URL}/insulin/history`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!insulinRes.ok) throw new Error('Could not load insulin history.');
      const insulinDoses = await insulinRes.json();
      const insulinDiv = document.getElementById('insulin-history');
      if (insulinDoses.length > 0) {
        insulinDiv.innerHTML = insulinDoses.map((dose, index) => `
          <div class="history-card" style="animation-delay: ${index * 0.1}s">
            <h3>${dose.totalDose.toFixed(1)} U Total Dose</h3>
            <p><strong>Glucose:</strong> ${dose.curBG} mg/dL | <strong>Carbs:</strong> ${dose.carbs} g</p>
            <p><strong>ISF:</strong> ${dose.isf} | <strong>ICR:</strong> ${dose.icr}</p>
            <p class="date">${new Date(dose.createdAt).toLocaleString()}</p>
          </div>
        `).join('');
      } // 'else' retains the default "No doses" message

    } catch (err) {
      showMessage(err.message, 'error');
    }

    // AI Suggestion Logic
    const suggestBtn = document.getElementById('get-suggestion-btn');
    if (suggestBtn) {
      suggestBtn.addEventListener('click', async () => {
        const resultDiv = document.getElementById('ai-result');
        const contentDiv = document.getElementById('ai-content');
        const loadingDiv = document.getElementById('ai-loading');

        // Try to get latest data from history if available, else prompt user
        // For simplicity reusing the first plan's data or defaults if empty
        // In a real app we might ask for fresh input
        let dataToUse = { glucose: 100, weight: 70, activity: 1.2 };

        // Check diet history for latest data
        try {
          const dRes = await fetch(`${API_URL}/diet/history`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
          const dData = await dRes.json();
          if (dData && dData.length > 0) {
            dataToUse = dData[0]; // Use latest
          }
        } catch (e) { }

        resultDiv.classList.remove('hidden');
        loadingDiv.classList.remove('hidden');
        contentDiv.textContent = '';
        suggestBtn.disabled = true;

        try {
          const res = await fetch(`${API_URL}/suggest-food`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
              glucose: dataToUse.glucose,
              weight: dataToUse.weight,
              activity: dataToUse.activity
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'AI request failed');

          contentDiv.textContent = data.suggestion;
        } catch (err) {
          contentDiv.textContent = 'Error: ' + err.message;
        } finally {
          loadingDiv.classList.add('hidden');
          suggestBtn.disabled = false;
        }
      });
    }
  };

  // --- Mobile Menu ---
  const setupMobileMenu = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav');

    if (burger && nav) {
      burger.addEventListener('click', () => {
        nav.classList.toggle('active-nav');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!burger.contains(e.target) && !nav.contains(e.target)) {
          nav.classList.remove('active-nav');
        }
      });
    }
  };

  // Range Slider Sync Logic
  const setupRangeSliders = () => {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      // Find the sibling element that displays the value
      const display = slider.parentElement.querySelector('.range-value');
      if (display) {
        // Initial setup
        display.textContent = slider.value;
        // Update on input
        slider.addEventListener('input', () => {
          display.textContent = slider.value;
        });
      }
    });
  };

  // --- INITIALIZATION ---
  
  // Try to render header and footer
  renderHeader();
  renderFooter();
  setupRangeSliders();

  // Get current page to run specific logic
  const page = window.location.pathname.split('/').pop();
  const isAuthPage = (page === 'index.html' || page === '' || page === 'signup.html');

  if (isAuthPage) {
    redirectIfLoggedIn(); // If logged in, go to dashboard
    if (page === 'index.html' || page === '') {
      document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    }
    if (page === 'signup.html') {
      document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    }
  } else {
    // These are protected pages
    protectRoute(); // If not logged in, go to login
    renderHeader(); // Render nav bar
    renderFooter(); // Render footer

    if (page === 'dashboard.html') {
      initDashboard();
      initDashboardChart();
    }
    if (page === 'tips.html') {
      initTips();
    }
    if (page === 'diet.html') {
      initDietPlanner();
    }
    if (page === 'insulin.html') {
      initInsulinCalc();
    }
    if (page === 'contact.html') {
      initContactForm();
    }
  }

  // Initialize icons
  // This must run after all content (dynamic or static) is on the page
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

});

