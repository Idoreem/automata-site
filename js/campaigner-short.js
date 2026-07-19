/* ============ טופס קצר: שם פרטי + טלפון ============
   גרסת ההרשמה ה"מהירה". שני שדות, שליחה אחת. ברגע השליחה:
   1) הליד נשלח ל-CRM (ref=campaigner-short) — קורה תמיד, לפני ומבלי תלות ב-Cal.
   2) נחשף היומן כבונוס לא-חובה (בדיוק כמו בשאלון המלא).
   כולו שיפור JS: בלי JS הטופס מוסתר והיומן מוצג ישירות (ראה css/campaigner.css). */
(function () {
  'use strict';

  var form = document.getElementById('leadFormShort');
  if (!form) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var section = document.getElementById('book');
  var nameInput = document.getElementById('lsName');
  var phoneInput = document.getElementById('lsPhone');
  var phoneErr = document.getElementById('lsPhoneErr');
  var submitBtn = document.getElementById('lsSubmit');
  var thanks = document.getElementById('leadThanks');
  var done = false;

  var digits = function (s) { return (s || '').replace(/\D/g, ''); };
  var validName = function () { return nameInput.value.trim().length > 0; };
  var validPhone = function () { var d = digits(phoneInput.value); return d.length >= 9 && d.length <= 10; };
  var refresh = function () { submitBtn.disabled = !(validName() && validPhone()); };

  nameInput.addEventListener('input', refresh);
  phoneInput.addEventListener('input', function () {
    var d = digits(phoneInput.value);
    if (phoneInput.value !== d) phoneInput.value = d;   // ספרות בלבד
    phoneErr.hidden = true;
    refresh();
  });
  [nameInput, phoneInput].forEach(function (inp) {
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  });

  function submit() {
    if (done) return;
    if (!validName()) { nameInput.focus(); return; }
    if (!validPhone()) { phoneErr.hidden = false; phoneInput.focus(); return; }
    done = true;

    var name = nameInput.value.trim();
    var phone = digits(phoneInput.value);

    /* הליד נשלח ל-CRM תמיד — לפני היומן ובלי תלות בו */
    if (window.sendLeadToCRM) {
      window.sendLeadToCRM({ firstName: name, phone: phone, ref: 'campaigner-short' });
    }

    if (section) section.classList.add('lead-done');

    if (thanks) {
      /* DOM ולא innerHTML — השם הוא קלט משתמש */
      thanks.textContent = '';
      thanks.appendChild(document.createTextNode(name ? 'תודה, ' : 'תודה! '));
      if (name) {
        var b = document.createElement('b');
        b.textContent = name;
        thanks.appendChild(b);
        thanks.appendChild(document.createTextNode('! '));
      }
      thanks.appendChild(document.createTextNode('קיבלנו את הפרטים, נחזור אליך בהקדם. רוצה כבר לתפוס זמן? בחר מהיומן.'));
      thanks.hidden = false;
      thanks.classList.add('in');
    }

    var calBox = document.querySelector('.cal');
    if (calBox) calBox.classList.add('cal-loading');
    if (window.loadCalInline) window.loadCalInline({ name: name });

    var target = calBox || section;
    if (target) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
  submitBtn.addEventListener('click', function (e) { e.preventDefault(); submit(); });

  /* כפתורי "קביעת שיחה" (data-lead) גוללים לטופס וממקדים בשדה הראשון.
     בעמוד הזה אין את השאלון (#leadForm), אז ה-IIFE שלו ב-campaigner.js יוצא
     מוקדם ולא מחווט את הכפתורים — לכן מחווטים אותם כאן. */
  document.querySelectorAll('[data-lead]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (section) section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (!done) setTimeout(function () {
        try { nameInput.focus({ preventScroll: true }); } catch (_) { nameInput.focus(); }
      }, reduce ? 0 : 480);
    });
  });

  refresh();
})();
