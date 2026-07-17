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
     .sol ו-.steps מקבלים 'in' בעצמם כי הרצפים הפנימיים שלהם
     (הפעימה שנוסעת במסילה) תלויים בו. */
  var revealed = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealed.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .sol, .steps').forEach(function (el) {
    revealed.observe(el);
  });

  /* ============ ה-rig: אותו שלד, התהליך שלך ============
     שלושה תאים קבועים שהתוכן שלהם מתחלף בין חמישה תהליכים מעולמות שונים.
     המקור היחיד לאמת הוא ה-<ol class="rig-list"> שב-HTML - בלי JS היא פשוט
     רשימה קריאה, ואין כאן שום תוכן שנולד ב-JS. */
  var rig = document.getElementById('rig');
  if (rig) {
    var slots = rig.querySelectorAll('.rig-slot');
    var dots = rig.querySelector('.rig-dots');
    var recipes = Array.prototype.map.call(rig.querySelectorAll('.rig-list li'), function (li) {
      return Array.prototype.map.call(li.children, function (s) { return s.textContent; });
    });

    if (recipes.length && slots.length === 3) {
      var paint = function (n) {
        slots.forEach(function (slot, k) {
          slot.querySelector('.rig-v').textContent = recipes[n][k];
        });
        Array.prototype.forEach.call(dots.children, function (dot, k) {
          dot.classList.toggle('on', k === n);
        });
      };

      recipes.forEach(function () { dots.appendChild(document.createElement('i')); });
      paint(0);

      /* מי שביקש פחות תנועה מקבל את הרשימה המלאה, לא קרוסלה שרצה */
      if (!reduce) {
        var at = 0;
        var cycle = function () {
          at = (at + 1) % recipes.length;
          /* התאים מתחלפים במדרגות, כך שנראה כאילו הנתונים זורמים דרכם */
          slots.forEach(function (slot, k) {
            setTimeout(function () { slot.classList.add('swap'); }, k * 90);
          });
          setTimeout(function () {
            paint(at);
            slots.forEach(function (slot) { slot.classList.remove('swap'); });
          }, 340);
        };

        /* מתחיל רק כשהכרטיס מול העיניים */
        var rigSeen = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          rigSeen.disconnect();
          setInterval(cycle, 2900);
        }, { threshold: 0.4 });
        rigSeen.observe(rig);
      }
    }
  }

  /* ============ היומן החי (Cal.com) ============
     ה-embed הוא כ-80 בקשות. לכן הוא לא נטען עם העמוד אלא רק כשסקשן היומן
     מתקרב לפריים (או כשלוחצים על כפתור יומן) — מי שלא מגיע לתחתית לא משלם.

     ה-href החיצוני נשאר על כל הכפתורים ולא נמחק. הוא ה-fallback: בלי JS,
     בלחיצה אמצעית, או אם app.cal.com לא עונה — הכפתור עדיין קובע שיחה. */
  var calBox = document.getElementById('calInline');
  var book = document.getElementById('book');
  if (calBox && book) {
    var calLoaded = false;

    /* היומן יכול להיות גדור מאחורי שאלון (data-cal-gated): אז הוא לא נטען
       בגלילה אלא רק כשהשאלון נשלח — js/campaigner.js קורא ל-loadCal עם
       prefill (שם + סיכום התשובות שנכנסים להזמנה). */
    var gated = calBox.hasAttribute('data-cal-gated');

    var loadCal = function (prefill) {
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
        /* prefill (שם, notes) מוזרק מהשאלון ונכנס להזמנה יחד עם ה-layout */
        config: Object.assign({ layout: 'month_view' }, prefill || {})
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

    /* כשהיומן גדור מאחורי שאלון (data-cal-gated), js/campaigner.js אחראי
       לטעון אותו בסיום השאלון - עם prefill של השם וסיכום התשובות. */
    window.loadCalInline = loadCal;

    /* היומן נטען אך ורק אחרי לחיצה מפורשת של הגולש (בקשת עידו) - שום דבר
       לא נפתח לבד בגלילה. בעמוד שבו היומן גדור מאחורי שאלון אין כפתורי
       [data-cal] כלל (הם [data-lead]), אז מדלגים כאן על החיווטים.
       ה-href החיצוני נשאר תמיד: בלי JS / קליק אמצעי - נפתח cal.com בטאב. */
    if (!gated) {
      /* 1. כפתור "קביעת שיחת אפיון" שבסקשן היומן עצמו ([data-cal-out]) */
      document.querySelectorAll('[data-cal-out]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          document.querySelector('.cal').classList.add('cal-loading');
          loadCal();
        });
      });

      /* 2. כל כפתורי היומן בעמוד ([data-cal]) - טוענים וגם גוללים לסקשן */
      document.querySelectorAll('[data-cal]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          document.querySelector('.cal').classList.add('cal-loading');
          loadCal();
          book.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
      });
    }
  }

  /* ============ וואטסאפ צף ============
     שקט ולא דוחף: מופיע רק אחרי שעוברים את ה-hero, ונעלם כשסקשן
     היומן על המסך - שם ה-CTA הראשי לבדו. */
  var waFloat = document.getElementById('waFloat');
  if (waFloat) {
    var pastHero = false;
    var nearBook = false;
    var waSync = function () {
      waFloat.classList.toggle('on', pastHero && !nearBook);
    };
    var heroEl = document.querySelector('.hero');
    if (heroEl) {
      new IntersectionObserver(function (entries) {
        pastHero = !entries[0].isIntersecting;
        waSync();
      }, { threshold: 0.05 }).observe(heroEl);
    } else {
      pastHero = true;
      waSync();
    }
    var bookEl = document.getElementById('book');
    if (bookEl) {
      new IntersectionObserver(function (entries) {
        nearBook = entries[0].isIntersecting;
        waSync();
      }, { threshold: 0.12 }).observe(bookEl);
    }
  }

  /* חלון "מי אני" הוא :target טהור — נפתח ונסגר בלי JS.
     ה-JS רק משדרג: נועל את גלילת הרקע כשהוא פתוח, וסוגר ב-Esc. */
  var bio = document.getElementById('ido-bio');
  if (bio) {
    var syncBio = function () {
      var open = location.hash === '#ido-bio';
      document.documentElement.classList.toggle('bio-open', open);
    };
    window.addEventListener('hashchange', syncBio);
    syncBio();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && location.hash === '#ido-bio') {
        location.hash = 'about';
      }
    });
  }

})();
