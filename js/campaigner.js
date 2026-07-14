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

  var play = function () {
    clear();
    playing = true;
    items.forEach(function (el) { el.classList.remove('show'); });
    body.scrollTop = 0;

    var i = 0;
    var step = function () {
      if (i >= items.length) { playing = false; return; }
      var el = items[i++];
      el.classList.add('show');

      /* גוללים אל ההודעה האחרונה *שהוצגה*, ולא אל scrollHeight.
         ההודעות שטרם הגיע תורן הן opacity:0 אבל עדיין תופסות מקום בפריסה,
         אז scrollHeight כולל אותן - וגלילה אליו קופצת אל אזור ריק ומשאירה
         את השיחה האמיתית מעל הקיפול. */
      var bottom = el.offsetTop + el.offsetHeight;
      body.scrollTop = Math.max(0, bottom - body.clientHeight);

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
