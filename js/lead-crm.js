/* Campaigner — שליחת ליד ל-CRM.
   כל טופס בעמוד קורא ל-window.sendLeadToCRM(...) בשליחה הסופית (כשכבר יש טלפון).
   השליחה היא fire-and-forget: לא חוסמת את המשתמש, לא מעכבת ניווט/יומן, ולעולם
   לא שוברת את החוויה אם הרשת נופלת. הפרטים נכנסים ל-CRM תמיד — בין אם המשתמש
   ממשיך לקבוע פגישה ובין אם לא. */
(function () {
  'use strict';

  var ENDPOINT = 'https://maor-s-crm.vercel.app/api/webhooks/leads';
  /* מזהה המקור של הטופס (טוקן ציבורי של ה-webhook, נועד לצד-לקוח). לא לשנות. */
  var TOKEN = 'lead_6df41e0f263e591c83811638cc8e55a95ad551ea793d9c10';

  /* ref: קודם מ-?ref= בכתובת (כדי שאפשר יהיה לתייג לפי מודעה), אחרת מזהה הדף */
  var resolveRef = function (fallback) {
    try {
      var r = new URLSearchParams(location.search).get('ref');
      if (r) return r.slice(0, 120);
    } catch (e) {}
    return (fallback || 'campaigner').slice(0, 120);
  };

  var clip = function (v, n) { return String(v == null ? '' : v).slice(0, n); };

  /* fields: { firstName, phone, lastName?, email?, company?, website?, note?, ref?, answers?:[{question,answer}] } */
  window.sendLeadToCRM = function (fields) {
    if (!fields || !fields.firstName || !fields.phone) return;

    var payload = {
      token: TOKEN,
      firstName: clip(fields.firstName, 100),
      phone: clip(fields.phone, 40)
    };
    if (fields.lastName) payload.lastName = clip(fields.lastName, 100);
    if (fields.email)    payload.email    = clip(fields.email, 200);
    if (fields.company)  payload.company  = clip(fields.company, 200);
    if (fields.website)  payload.website  = clip(fields.website, 300);
    if (fields.note)     payload.note     = clip(fields.note, 5000);
    payload.ref = resolveRef(fields.ref);

    if (fields.answers && fields.answers.length) {
      var answers = fields.answers
        .filter(function (a) { return a && a.question && a.answer !== '' && a.answer != null; })
        .slice(0, 50)
        .map(function (a) { return { question: clip(a.question, 500), answer: a.answer }; });
      if (answers.length) payload.answers = answers;
    }

    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true   /* שהבקשה תסתיים גם אם המשתמש ממשיך לנווט מיד */
      }).catch(function () {});
    } catch (e) {}
  };
})();
