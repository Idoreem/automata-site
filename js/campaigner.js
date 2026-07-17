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
  var composer = document.getElementById('chatComposer');
  var inputBox = document.getElementById('chatInput');
  var inputTxt = document.getElementById('chatInputTxt');
  var send = document.getElementById('chatSend');
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

  var resetComposer = function () {
    if (!composer) return;
    inputTxt.textContent = '';
    composer.classList.remove('typing');
  };

  /* ההקלדה החיה: הטקסט של בעלת העסק נכתב אות-אות בשורת ההודעה,
     עם קצב אנושי קטן (מהירות משתנה), ואז "נשלח". */
  var typeInto = function (text, done) {
    composer.classList.add('typing');
    var j = 0;
    var tick = function () {
      j++;
      inputTxt.textContent = text.slice(0, j);
      /* אין גלילה אופקית: התיבה עוטפת לשורה חדשה (ראה .cg-input ב-CSS),
         כך שהטקסט נשאר בתוכה במקום להימשך שמאלה. */
      if (j >= text.length) { timers.push(setTimeout(done, 240)); return; }
      timers.push(setTimeout(tick, 30 + Math.random() * 42));
    };
    timers.push(setTimeout(tick, 160));
  };

  var sendNow = function () {
    send.classList.add('sent');
    timers.push(setTimeout(function () { send.classList.remove('sent'); }, 190));
    resetComposer();
  };

  /* רמז הגלילה נעלם ברגע שהמשתמש גולל בעצמו - הוא כבר הבין שאפשר */
  ['wheel', 'touchstart', 'pointerdown'].forEach(function (ev) {
    body.addEventListener(ev, hideHint, { passive: true });
  });

  var play = function () {
    clear();
    hideHint();
    resetComposer();
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

      var reveal = function () {
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

      /* הודעות בעלת העסק קודם מוקלדות חיות בשורת ההודעה ורק אז נשלחות.
         הטקסט נלקח מהבועה עצמה (הצומת הראשון, לפני שעת ה-meta) -
         אפס כפילות תוכן. */
      if (composer && el.classList.contains('out')) {
        var msg = (el.childNodes[0] && el.childNodes[0].textContent || '').trim();
        typeInto(msg, function () {
          sendNow();
          timers.push(setTimeout(reveal, 120));
        });
      } else {
        reveal();
      }
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

/* ============ שאלון הלידים ============
   נפתח מכל כפתור "קביעת שיחה" (data-lead), שואל שאלה אחרי שאלה, ורק בסיומו
   חושף את היומן. השם וסיכום התשובות מועברים ל-js/main.js כ-prefill ונכנסים
   להזמנה ב-Cal. כולו שיפור JS: בלי JS השאלון מוסתר והיומן מוצג ישירות
   (ראה css/campaigner.css), כך שתמיד אפשר לקבוע שיחה. */
(function () {
  'use strict';

  var form = document.getElementById('leadForm');
  if (!form) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var section = document.getElementById('book');

  var backBtn = document.getElementById('lfBack');
  var nextBtn = document.getElementById('lfNext');
  var progFill = document.getElementById('lfProgFill');
  var counter = document.getElementById('lfCount');
  var greet = document.getElementById('lfGreet');
  var nameInput = document.getElementById('lfName');
  var reasonInput = document.getElementById('lfReason');
  var phoneInput = document.getElementById('lfPhone');
  var phoneErr = document.getElementById('lfPhoneErr');
  var thanks = document.getElementById('leadThanks');

  /* 'pick' נפתר ל-'who' (ענף "כן") או 'why' (ענף "לא"). התהליך תמיד 5 שלבים. */
  var FLOW = ['name', 'active', 'pick', 'reason', 'phone'];
  var pos = 0;
  var branch = null;   // 'yes' | 'no'
  var done = false;
  var data = {};       // firstName, active, who/whoOther, why/whyOther, reason, phone

  var digits = function (s) { return (s || '').replace(/\D/g, ''); };
  var stepKey = function (p) {
    var k = FLOW[p];
    return k === 'pick' ? (branch === 'no' ? 'why' : 'who') : k;
  };
  var stepEl = function (key) { return form.querySelector('.lf-step[data-step="' + key + '"]'); };

  /* ----- ולידציה לכל שלב ----- */
  var valid = function (key) {
    if (key === 'name') return nameInput.value.trim().length > 0;
    if (key === 'active') return !!data.active;
    if (key === 'who' || key === 'why') {
      var v = data[key];
      if (!v) return false;
      return v === 'אחר' ? (data[key + 'Other'] || '').trim().length > 0 : true;
    }
    if (key === 'reason') return reasonInput.value.trim().length > 0;
    if (key === 'phone') { var d = digits(phoneInput.value); return d.length >= 9 && d.length <= 10; }
    return true;
  };

  var refreshNext = function () { nextBtn.disabled = !valid(stepKey(pos)); };

  var focusStep = function (key) {
    var el = stepEl(key);
    if (!el) return;
    var target = el.querySelector('.lf-input:not([hidden])') || el.querySelector('.lf-opt');
    if (!target) return;
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  };

  var show = function (p, focus) {
    pos = Math.max(0, Math.min(p, FLOW.length - 1));
    var key = stepKey(pos);
    Array.prototype.forEach.call(form.querySelectorAll('.lf-step'), function (s) {
      s.classList.toggle('on', s.getAttribute('data-step') === key);
    });
    progFill.style.width = ((pos + 1) / FLOW.length * 100) + '%';
    counter.textContent = (pos + 1) + ' / ' + FLOW.length;
    backBtn.hidden = pos === 0;
    nextBtn.textContent = key === 'phone' ? 'קביעת פגישה' : 'המשך';
    if (data.firstName && pos > 0) {
      greet.textContent = 'נעים להכיר, ' + data.firstName + ' 👋';
      greet.hidden = false;
    } else {
      greet.hidden = true;
    }
    refreshNext();
    if (focus) setTimeout(function () { focusStep(key); }, 50);
  };

  /* מנקה את שלב "מי מריץ / למה לא" כשמחליפים בין כן/לא */
  var clearPick = function () {
    ['who', 'why'].forEach(function (k) {
      delete data[k];
      delete data[k + 'Other'];
      var el = stepEl(k);
      if (!el) return;
      Array.prototype.forEach.call(el.querySelectorAll('.lf-opt'), function (o) { o.classList.remove('sel'); });
      var of = el.querySelector('.lf-otherfield');
      if (of) { of.hidden = true; of.value = ''; }
    });
  };

  var goNext = function () {
    var key = stepKey(pos);
    if (!valid(key)) {
      if (key === 'phone') { phoneErr.hidden = false; phoneInput.focus(); }
      return;
    }
    if (key === 'name') data.firstName = nameInput.value.trim();
    if (key === 'reason') data.reason = reasonInput.value.trim();
    if (key === 'phone') { data.phone = digits(phoneInput.value); finish(); return; }
    show(pos + 1, true);
  };

  var goBack = function () {
    if (pos === 0) return;
    phoneErr.hidden = true;
    show(pos - 1, true);
  };

  /* בחירה מרשימת אפשרויות: בחירה רגילה מקדמת אוטומטית; "אחר" פותח שדה טקסט */
  Array.prototype.forEach.call(form.querySelectorAll('.lf-opts'), function (group) {
    var stepDiv = group.closest('.lf-step');
    var key = stepDiv.getAttribute('data-step');
    var other = stepDiv.querySelector('.lf-otherfield');

    group.addEventListener('click', function (e) {
      var opt = e.target.closest('.lf-opt');
      if (!opt) return;
      Array.prototype.forEach.call(group.querySelectorAll('.lf-opt'), function (o) {
        o.classList.toggle('sel', o === opt);
      });
      var val = opt.getAttribute('data-value');
      var isOther = opt.hasAttribute('data-other');

      if (key === 'active') {
        var nb = opt.getAttribute('data-branch');
        if (nb !== branch) { branch = nb; clearPick(); }
        data.active = val;
      } else {
        data[key] = val;
      }

      if (other) {
        if (isOther) {
          other.hidden = false;
          data[key + 'Other'] = other.value.trim();
          refreshNext();
          setTimeout(function () { other.focus(); }, 40);
          return;   // מחכים לטקסט + "המשך", בלי קידום אוטומטי
        }
        other.hidden = true;
        other.value = '';
        delete data[key + 'Other'];
      }

      refreshNext();
      if (reduce) show(pos + 1, true);
      else setTimeout(function () { show(pos + 1, true); }, 220);
    });
  });

  /* שדות ה"אחר" */
  Array.prototype.forEach.call(form.querySelectorAll('.lf-otherfield'), function (of) {
    var key = of.closest('.lf-step').getAttribute('data-step');
    of.addEventListener('input', function () { data[key + 'Other'] = of.value.trim(); refreshNext(); });
    of.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); goNext(); } });
  });

  /* שדות טקסט */
  nameInput.addEventListener('input', refreshNext);
  nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); goNext(); } });
  reasonInput.addEventListener('input', refreshNext);
  phoneInput.addEventListener('input', function () {
    var d = digits(phoneInput.value);
    if (phoneInput.value !== d) phoneInput.value = d;   // ספרות בלבד
    phoneErr.hidden = true;
    refreshNext();
  });
  phoneInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); goNext(); } });

  nextBtn.addEventListener('click', goNext);
  backBtn.addEventListener('click', goBack);

  /* סיום: בונים סיכום, חושפים את היומן וגוללים אליו */
  var answer = function (key) {
    if (data[key] === 'אחר') return (data[key + 'Other'] || 'אחר').trim();
    return data[key] || '-';
  };

  /* שולח את הליד ל-CRM דרך /api/lead (route בצד שרת שמזריק את הטוקן הסודי,
     כך שהוא לא נחשף בדפדפן). fire-and-forget: לא חוסם ולא משבש את המעבר
     ליומן, וכשל בשליחה לא שובר את חוויית המשתמש. */
  function sendLead() {
    if (!data.phone) return;   // בלי טלפון לא שולחים

    var answers = [];
    if (data.active) answers.push({ question: 'יש קמפיין פעיל?', answer: data.active === 'כן' });
    if (branch === 'yes') answers.push({ question: 'מי מנהל את הקמפיין?', answer: answer('who') });
    if (branch === 'no') answers.push({ question: 'למה אין קמפיין פעיל?', answer: answer('why') });
    if (data.reason) answers.push({ question: 'למה AI?', answer: data.reason });

    var ref = 'campaigner';
    try { ref = new URLSearchParams(location.search).get('ref') || 'campaigner'; } catch (e) {}

    try {
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          firstName: data.firstName || '',
          phone: data.phone,
          source: 'אתר קמפיינר',
          ref: ref,
          answers: answers
        })
      }).catch(function () {});
    } catch (e) {}
  }

  function finish() {
    if (done) return;
    done = true;

    sendLead();

    var name = data.firstName || '';
    var lines = [
      'שם: ' + name,
      'קמפיין ממומן פעיל היום: ' + (data.active || '-')
    ];
    if (branch === 'yes') lines.push('מי מריץ את הקמפיין: ' + answer('who'));
    if (branch === 'no') lines.push('למה אין קמפיין פעיל: ' + answer('why'));
    lines.push('למה רוצה סוכן AI: ' + (data.reason || '-'));
    lines.push('טלפון: ' + (data.phone || '-'));

    if (section) section.classList.add('lead-done');

    if (thanks) {
      /* בונים עם DOM (ולא innerHTML) כדי שהשם — קלט משתמש — לא יורץ כ-HTML */
      thanks.textContent = '';
      thanks.appendChild(document.createTextNode(name ? 'תודה, ' : 'תודה! '));
      if (name) {
        var b = document.createElement('b');
        b.textContent = name;
        thanks.appendChild(b);
        thanks.appendChild(document.createTextNode('! '));
      }
      thanks.appendChild(document.createTextNode('נשאר רק לבחור מועד שנוח לך.'));
      thanks.hidden = false;
      thanks.classList.add('in');
    }

    var calBox = document.querySelector('.cal');
    if (calBox) calBox.classList.add('cal-loading');   // מעמעם את כפתור ה-fallback בזמן שהיומן נטען
    if (window.loadCalInline) window.loadCalInline({ name: name, notes: lines.join('\n') });

    var target = calBox || section;
    if (target) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }

  /* כפתורי "קביעת שיחה" (data-lead) גוללים לשאלון ופותחים אותו.
     טאב חדש רק אם המשתמש ביקש במפורש (Cmd/Ctrl/גלגלת) — אז ה-href הרגיל
     (היומן החיצוני) עדיין עובד כ-fallback. */
  document.querySelectorAll('[data-lead]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (section) section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (!done) setTimeout(function () { focusStep(stepKey(pos)); }, reduce ? 0 : 480);
    });
  });

  show(0, false);
})();

/* ============ חשיפה מדורגת: רשימת "למי מתאים" ============
   כל שורה נכנסת כשהיא מגיעה לפריים, ושורות שמופיעות יחד נכנסות במדרגות
   (מלמעלה למטה) - כדי שזה לא ייפול הכל בבת אחת. בלי JS / reduced-motion
   הכל פשוט גלוי (ראה css/campaigner.css). */
(function () {
  'use strict';

  var items = Array.prototype.slice.call(document.querySelectorAll('.fit-item'));
  if (!items.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    /* שורות שנחשפות באותו רגע - ממיינים לפי מיקום אנכי ומדרגים ביניהן.
       שורה שנכנסת לבדה (בגלילה) נחשפת מיד, בלי השהיה. */
    var vis = entries.filter(function (e) { return e.isIntersecting; })
                     .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
    vis.forEach(function (e, i) {
      var el = e.target;
      io.unobserve(el);
      setTimeout(function () { el.classList.add('in'); }, i * 95);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  items.forEach(function (el) { io.observe(el); });
})();
