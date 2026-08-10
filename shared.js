/* shared.js — data loader, nav, countdown, helpers */

/* ── Data loading ─────────────────────────────────────────── */
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function loadAll() {
  const base = getBase();
  const [event, schedule, rooms, cars] = await Promise.all([
    loadJSON(base + 'data/event.json'),
    loadJSON(base + 'data/schedule.json'),
    loadJSON(base + 'data/rooms.json'),
    loadJSON(base + 'data/cars.json'),
  ]);
  return { event, schedule, rooms: rooms.rooms, cars: cars.cars };
}

function getBase() {
  const inPages = location.pathname.includes('/pages/');
  return inPages ? '../' : './';
}

/* ── People lookup ───────────────────────────────────────── */
function buildPeopleMap(people) {
  return Object.fromEntries(people.map(p => [p.id, p]));
}

function personChip(person) {
  if (!person) return '';
  return `<span class="person-chip"><span class="avatar">${person.emoji}</span>${person.name}</span>`;
}

/* ── Navigation ──────────────────────────────────────────── */
const NAV_LINKS = [
  { href: 'index.html',          label: 'Home'      },
  { href: 'pages/schedule.html', label: 'Schedule'  },
  { href: 'pages/rooms.html',    label: 'Rooms'     },
  { href: 'pages/cars.html',     label: 'Transport' },
  { href: 'pages/meals.html',    label: 'Meals'     },
];

function renderNav(eventName) {
  const inPages = location.pathname.includes('/pages/');
  const prefix  = inPages ? '../' : '';

  const links = NAV_LINKS.map(l => {
    const href = prefix + l.href;
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    const linkPage    = l.href.split('/').pop();
    const active = currentPage === linkPage ||
                   (linkPage === 'index.html' && (currentPage === '' || currentPage === '/'));
    return `<li><a href="${href}"${active ? ' class="active"' : ''}>${l.label}</a></li>`;
  }).join('');

  // Session pill in nav
  let sessionPill = '';
  try {
    const session = JSON.parse(localStorage.getItem('tb_user'));
    if (session) {
      sessionPill = `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px 4px 6px;background:rgba(13,148,136,0.08);border:1px solid rgba(13,148,136,0.2);border-radius:99px;font-size:0.8rem;font-weight:600;color:var(--c-teal-dim);margin-left:var(--sp-s)">
        <span style="font-size:1rem">${session.emoji}</span>${session.name.split(' ')[0]}
      </span>`;
    } else {
      sessionPill = `<a href="${prefix}pages/register.html" style="margin-left:var(--sp-s);padding:6px 14px;background:var(--g-accent);color:#fff;border-radius:var(--r-s);font-weight:700;font-size:0.8rem;white-space:nowrap">Register</a>`;
    }
  } catch { /* ignore */ }

  document.getElementById('nav-placeholder').innerHTML = `
    <nav class="nav">
      <span class="nav__brand">${eventName || 'Teambuilding'}</span>
      <ul class="nav__links" id="nav-links">${links}</ul>
      ${sessionPill}
      <button class="nav__hamburger" id="nav-hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </nav>`;

  document.getElementById('nav-hamburger').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
  });
}

/* ── Countdown ───────────────────────────────────────────── */
function startCountdown(targetDateStr, containerId) {
  const target = new Date(targetDateStr).getTime();

  function update() {
    const now  = Date.now();
    const diff = target - now;
    const el   = document.getElementById(containerId);
    if (!el) return;

    if (diff <= 0) {
      el.innerHTML = `<span class="badge badge--teal" style="font-size:1rem">🎉 It's happening now!</span>`;
      return;
    }

    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000)  / 60000);
    const seconds = Math.floor((diff % 60000)    / 1000);

    el.innerHTML = [
      { n: days,    l: 'Days'    },
      { n: hours,   l: 'Hours'   },
      { n: minutes, l: 'Minutes' },
      { n: seconds, l: 'Seconds' },
    ].map(u => `
      <div class="countdown__unit">
        <span class="countdown__num">${String(u.n).padStart(2,'0')}</span>
        <span class="countdown__label">${u.l}</span>
      </div>`).join('');
  }

  update();
  setInterval(update, 1000);
}

/* ── Badge helpers ───────────────────────────────────────── */
const DIET_ICONS = { meat: '🍖', fish: '🐟', vegetarian: '🥗', vegan: '🌱' };

function dietBadge(diet) {
  const icon = DIET_ICONS[diet] || '';
  return `<span class="badge badge--${diet}">${icon} ${cap(diet)}</span>`;
}

function allergyTags(allergies) {
  if (!allergies || !allergies.length) return '';
  return allergies.map(a => `<span class="allergy-tag">⚠ ${a}</span>`).join('');
}

/* ── Misc helpers ────────────────────────────────────────── */
function cap(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function renderFooter() {
  const el = document.getElementById('footer-placeholder');
  if (el) el.innerHTML = `<footer class="footer">Made with ❤️ for the team</footer>`;
}
