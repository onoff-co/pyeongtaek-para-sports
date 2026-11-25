'use strict';

const menuButton = document.querySelector('[aria-controls="site-menu"]');
const siteMenu = document.getElementById('site-menu');

function setMenu(open, restoreFocus = false) {
  siteMenu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '전체 메뉴 닫기' : '전체 메뉴 열기');
  if (restoreFocus) menuButton.focus();
}

menuButton.hidden = false;
menuButton.addEventListener('click', () => setMenu(siteMenu.hidden));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !siteMenu.hidden) setMenu(false, true);
});
document.addEventListener('click', (event) => {
  if (!siteMenu.hidden && !siteMenu.contains(event.target) && !menuButton.contains(event.target)) {
    setMenu(false);
  }
});
siteMenu.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (link) setMenu(false, link.hash !== '' && link.origin === location.origin);
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
const moreLink = document.querySelector('[data-board-more]');

function selectTab(selected) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  }
  moreLink.href = selected.dataset.boardUrl;
  moreLink.textContent = selected.textContent + ' 더보기 +';
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    const targets = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    const selected = tabs[targets[event.key]];
    selectTab(selected);
    selected.focus();
  });
}

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const banners = {
  hero: {
    label: '배너',
    initial: 0,
    interval: 9000,
    slides: [
      ['hero-weightlifting.jpg', '2022 평택세계장애인역도 아시아·오세아니아 오픈선수권대회'],
      ['hero-06.jpg', '경기도어울림체육대회 단체 기념사진'],
      ['hero-03.jpg', '평택 장애인 축구 경기'],
      ['hero-07.jpg', '가맹경기단체 신규 이사 위촉장 전달식'],
    ],
  },
  poster: {
    label: '알림',
    initial: 3,
    interval: 11000,
    slides: [
      ['poster-101.png', '평택시 장애인 보치아 선수 모집 안내'],
      ['poster-104.png', '평택시 발달장애인 축구단 선수 모집 안내'],
      ['poster-105.jpg', '평택시 농아인축구단 선수 모집 안내'],
      ['poster-recruitment.jpg', '평택시장애인체육회 종목별 선수 상시 모집 안내'],
      ['poster-108.png', '2026 경기도 장애인생활체육 프로그램 안내'],
    ],
  },
};

function setupCarousel(region, { label, initial, interval, slides }) {
  const count = region.querySelector('[data-carousel-count]');
  const photo = region.querySelector('[data-carousel-image]');
  const caption = region.querySelector('[data-carousel-caption]');
  const announcement = region.querySelector('[data-carousel-announcement]');
  const playback = region.querySelector('[data-carousel-action="playback"]');
  let current = initial;
  let paused = motionPreference.matches;
  let visible = false;
  let timer;

  function show(index, announce = false) {
    current = (index + slides.length) % slides.length;
    const [file, description] = slides[current];
    const image = './assets/' + file;
    if (photo) {
      photo.src = image;
      photo.alt = description;
      count.textContent = (current + 1) + ' / ' + slides.length;
    } else {
      region.style.setProperty('--hero-image', 'url("' + image + '")');
      region.style.setProperty('--slide-progress', ((current + 1) * 100 / slides.length) + '%');
      count.textContent = String(current + 1).padStart(2, '0');
      caption.textContent = description;
    }
    if (announce) announcement.textContent = (current + 1) + ' / ' + slides.length + ' · ' + description;
  }

  function updateTimer() {
    clearInterval(timer);
    region.toggleAttribute('data-paused', paused);
    playback.setAttribute('aria-label', label + (paused ? ' 자동 전환 재생' : ' 자동 전환 일시정지'));
    if (!paused && visible && !document.hidden && !region.matches(':hover, :focus-within')) {
      timer = setInterval(() => show(current + 1), interval);
    }
  }

  region.addEventListener('click', (event) => {
    const action = event.target.closest('button[data-carousel-action]')?.dataset.carouselAction;
    if (!action) return;
    if (action === 'playback') {
      paused = !paused;
    } else {
      show(current + (action === 'previous' ? -1 : 1), true);
    }
    updateTimer();
  });
  for (const eventName of ['pointerenter', 'pointerleave', 'focusin', 'focusout']) {
    region.addEventListener(eventName, () => setTimeout(updateTimer, 0));
  }
  document.addEventListener('visibilitychange', updateTimer);
  motionPreference.addEventListener('change', (event) => {
    paused = event.matches;
    updateTimer();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateTimer();
  }, { threshold: 0.25 }).observe(region);
  show(initial);
  updateTimer();
}

for (const region of document.querySelectorAll('[data-carousel]')) {
  setupCarousel(region, banners[region.dataset.carousel]);
}

function updateApplicationStatuses() {
  const day = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  for (const listing of document.querySelectorAll('[data-deadline]')) {
    if (day <= listing.dataset.deadline) continue;
    const status = listing.querySelector('.st');
    const link = listing.querySelector('a.btn');
    status.className = 'st close';
    status.textContent = '접수 마감';
    if (link) {
      const closed = document.createElement('span');
      closed.className = 'btn off';
      closed.textContent = '마감';
      link.replaceWith(closed);
    }
  }
}

updateApplicationStatuses();
document.addEventListener('visibilitychange', updateApplicationStatuses);
