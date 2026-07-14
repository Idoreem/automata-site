/* Automata — התנהגות העמוד.
   שים לב: קישורי היומן והוואטסאפ יושבים ישירות ב-index.html (על תגיות <a>).
   הם לא מוזרקים מכאן יותר — כדי שכל כפתור בעמוד יעבוד גם אם ה-JS נופל. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* שנה נוכחית בפוטר */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ניווט — רקע כשגוללים */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* תפריט מובייל */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    var setMenu = function (open) {
      navLinks.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setMenu(!navLinks.classList.contains('open'));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* פס הסיגנל שיורד עם הגלילה */
  var rail = document.getElementById('railFill');
  if (rail && !reduce) {
    var ticking = false;
    var drawRail = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      rail.style.height = (p * 100) + 'vh';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(drawRail);
    }, { passive: true });
    window.addEventListener('resize', drawRail, { passive: true });
    drawRail();
  }

  /* מדרגת ההשהיה של הצ׳יפים — נקבעת מהמיקום, לא מוקשחת ב-CSS */
  document.querySelectorAll('.chips').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  /* חשיפה בגלילה.
     .console ו-.sol מקבלים 'in' בעצמם כי הרצפים הפנימיים שלהם
     (שורות הקונסולה, בועות הצ׳אט) תלויים בו. */
  var revealed = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealed.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .console, .sol').forEach(function (el) {
    revealed.observe(el);
  });

  /* ============ היומן החי (Cal.com) ============
     ה-embed הוא כ-80 בקשות. לכן הוא לא נטען עם העמוד אלא רק כשסקשן היומן
     מתקרב לפריים (או כשלוחצים על כפתור יומן) — מי שלא מגיע לתחתית לא משלם.

     ה-href החיצוני נשאר על כל הכפתורים ולא נמחק. הוא ה-fallback: בלי JS,
     בלחיצה אמצעית, או אם app.cal.com לא עונה — הכפתור עדיין קובע שיחה. */
  var calBox = document.getElementById('calInline');
  var book = document.getElementById('book');
  if (calBox && book) {
    var calLoaded = false;

    var loadCal = function () {
      if (calLoaded) return;
      calLoaded = true;

      /* ה-loader הרשמי של Cal */
      (function (C, A, L) {
        var p = function (a, ar) { a.q.push(ar); };
        var d = C.document;
        C.Cal = C.Cal || function () {
          var cal = C.Cal, ar = arguments;
          if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
          if (ar[0] === L) {
            var api = function () { p(api, arguments); };
            var ns = ar[1];
            api.q = api.q || [];
            if (typeof ns === 'string') { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ['initNamespace', ns]); }
            else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
      })(window, 'https://app.cal.com/embed/embed.js', 'init');

      Cal('init', 'book', { origin: 'https://app.cal.com' });
      Cal.ns.book('inline', {
        elementOrSelector: '#calInline',
        calLink: 'ido-reem/שיחת-אפיון-לעסק-שלך',
        config: { layout: 'month_view' }
      });
      /* היומן יושב על משטח הקונסולה, אז הוא לובש את אותם צבעים */
      Cal.ns.book('ui', {
        theme: 'dark',
        cssVarsPerTheme: { dark: { 'cal-brand': '#FF6B35' } },
        hideEventTypeDetails: false,
        layout: 'month_view'
      });
      /* הכפתור מפנה את מקומו רק כשהיומן באמת על המסך */
      Cal.ns.book('on', {
        action: 'linkReady',
        callback: function () { document.querySelector('.cal').classList.add('cal-ready'); }
      });
    };

    var calObs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      calObs.disconnect();
      loadCal();
    }, { rootMargin: '400px' });
    calObs.observe(calBox);

    /* כפתורי היומן בעמוד גוללים ליומן במקום להעיף את המשתמש לאתר אחר.
       פותחים בטאב חדש רק אם המשתמש ביקש זאת במפורש (Cmd/Ctrl/גלגלת). */
    document.querySelectorAll('[data-cal]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        loadCal();
        book.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* כרטיס הכאב הראשון: הטיימר שמטפס על הודעה שאף אחד לא ענה עליה.
     מתחיל לרוץ רק כשהכרטיס נכנס לפריים. */
  var waited = document.getElementById('waited');
  if (waited && !reduce) {
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    var seconds = 9 * 3600 + 47 * 60 + 12;
    var started = false;
    var waitObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || started) return;
        started = true;
        waitObserver.disconnect();
        setInterval(function () {
          seconds++;
          waited.textContent =
            pad(Math.floor(seconds / 3600)) + ':' +
            pad(Math.floor(seconds / 60) % 60) + ':' +
            pad(seconds % 60);
        }, 1000);
      });
    }, { threshold: 0.4 });
    waitObserver.observe(waited);
  }

})();
