/* Campaigner — נגן השיחה.
   הצ׳אט הוא ההבטחה של המוצר, אז הוא מנגן את עצמה: כל שורה נכנסת כשתורה מגיע,
   ומחוון ההקלדה מתחלף בהודעה שהוא הקליד.

   הכל כאן הוא שיפור בלבד. בלי JS השיחה פשוט מוצגת במלואה (ראה css/campaigner.css),
   ולכן אין כאן שום תוכן שנוצר מ-JS - רק תזמון. */
(function () {
  'use strict';

  var body = document.getElementById('chatBody');
  if (!body) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = Array.prototype.slice.call(body.children);
  var replay = document.getElementById('chatReplay');
  var hint = document.getElementById('chatHint');
  var timers = [];
  var playing = false;

  if (reduce) {
    items.forEach(function (el) { el.classList.add('show'); });
    return;
  }

  var clear = function () {
    timers.forEach(clearTimeout);
    timers = [];
  };

  var hideHint = function () {
    if (hint) hint.classList.remove('on');
  };

  /* רמז הגלילה נעלם ברגע שהמשתמש גולל בעצמו - הוא כבר הבין שאפשר */
  ['wheel', 'touchstart', 'pointerdown'].forEach(function (ev) {
    body.addEventListener(ev, hideHint, { passive: true });
  });

  var play = function () {
    clear();
    hideHint();
    playing = true;
    items.forEach(function (el) { el.classList.remove('show'); });
    body.scrollTop = 0;

    var i = 0;
    var step = function () {
      if (i >= items.length) {
        playing = false;
        /* השיחה הסתיימה והחלון מלא - מזמינים לגלול חזרה לקרוא את כולה.
           הריפוד מרים את ההודעה האחרונה מעל הצ'יפ, והגלילה מציגה אותה. */
        if (hint && body.scrollHeight > body.clientHeight + 10) {
          hint.classList.add('on');
          body.classList.add('hint-pad');
          body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
        }
        return;
      }
      var el = items[i++];
      el.classList.add('show');

      /* גוללים אל ההודעה האחרונה *שהוצגה*, ולא אל scrollHeight.
         ההודעות שטרם הגיע תורן הן opacity:0 אבל עדיין תופסות מקום בפריסה,
         אז scrollHeight כולל אותן - וגלילה אליו קופצת אל אזור ריק ומשאירה
         את השיחה האמיתית מעל הקיפול. */
      var bottom = el.offsetTop + el.offsetHeight;
      body.scrollTo({ top: Math.max(0, bottom - body.clientHeight), behavior: 'smooth' });

      var wait = parseInt(el.getAttribute('data-t'), 10) || 700;
      timers.push(setTimeout(function () {
        /* מחוון ההקלדה מפנה את מקומו להודעה שהוא הקליד */
        if (el.classList.contains('cg-typing')) el.classList.remove('show');
        step();
      }, wait));
    };
    step();
  };

  /* מתחיל רק כשהצ׳אט באמת מול העיניים */
  var seen = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    seen.disconnect();
    play();
  }, { threshold: 0.4 });
  seen.observe(body);

  if (replay) {
    replay.addEventListener('click', function () {
      if (playing) return;
      play();
    });
  }
})();

/* כותרת ה-hero: מילה מתחלפת עם אנימציית הקלדה ומחיקה.
   השורה הראשונה קבועה; המילה שמתחתיה מוקלדת אות-אות, נעצרת, נמחקת -
   והמילה הבאה נכנסת. שיפור בלבד: בלי JS או עם reduced-motion נשארת המילה
   הסטטית שב-HTML (ראה css/campaigner.css). */
(function () {
  'use strict';

  var el = document.getElementById('cgRotateWord');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var words = ['לידים', 'מכירות', 'המרות'];
  var typeSpeed = 95;   // הקלדת אות
  var eraseSpeed = 55;  // מחיקת אות
  var holdFull = 1600;  // השהיה כשהמילה שלמה
  var holdEmpty = 320;  // השהיה לפני המילה הבאה
  var startDelay = 900; // מתחיל אחרי אנימציית הכניסה של ה-hero

  var wi = 0;        // אינדקס המילה הנוכחית
  var ci = 0;        // כמה אותיות מוצגות
  var erasing = false;

  el.textContent = '';

  var tick = function () {
    var word = words[wi];

    if (!erasing) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) {
        erasing = true;
        setTimeout(tick, holdFull);
        return;
      }
      setTimeout(tick, typeSpeed);
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) {
        erasing = false;
        wi = (wi + 1) % words.length;
        setTimeout(tick, holdEmpty);
        return;
      }
      setTimeout(tick, eraseSpeed);
    }
  };

  setTimeout(tick, startDelay);
})();
