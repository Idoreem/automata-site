/* ============================================================
   Vercel Serverless Function — קליטת ליד מטופס /campaigner.

   הטופס שולח לכאן (POST /api/lead) בלי הטוקן. הפונקציה מזריקה את
   process.env.CRM_LEAD_TOKEN (מוגדר ב-Vercel) ומעבירה את הבקשה ל-CRM,
   כך שהטוקן הסודי לעולם לא נחשף בדפדפן.

   הגדרת הטוקן: Vercel → הפרויקט → Settings → Environment Variables →
   CRM_LEAD_TOKEN (הערך מגיע מה-CRM: הגדרות ← אינטגרציות ←
   "קליטת לידים מהאתר" → "טוקן סודי"). לאחר הוספה — צריך Redeploy.
   ============================================================ */
const CRM_ENDPOINT = 'https://maor-s-crm.vercel.app/api/webhooks/leads';

module.exports = async (req, res) => {
  // אבחון זמני: GET מחזיר נוכחות משתני סביבה (בלי ערכים) כדי לוודא שהמשתנה
  // הגיע לסביבת Production. יוסר מיד אחרי הבדיקה.
  if (req.method === 'GET') {
    return res.status(200).json({
      debug: true,
      node: process.version,
      has_crm: !!process.env.crm,
      has_CRM_LEAD_TOKEN: !!process.env.CRM_LEAD_TOKEN,
      has_CRM: !!process.env.CRM,
      crm_len: (process.env.crm || '').length
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // משתנה הסביבה הוגדר ב-Vercel בשם crm; תומכים גם בשמות חלופיים ליתר ביטחון.
  const token = process.env.crm || process.env.CRM_LEAD_TOKEN || process.env.CRM;
  if (!token) {
    // הטוקן עוד לא הוגדר ב-Vercel. מחזירים שגיאה ברורה; הלקוח fire-and-forget
    // ולכן זה לא שובר את חוויית המשתמש.
    return res.status(500).json({ ok: false, error: 'missing_crm_token' });
  }

  // ב-@vercel/node עם Content-Type application/json הגוף כבר מפוענח לאובייקט,
  // אבל מגנים גם על מקרה של מחרוזת.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch (e) {
      return res.status(400).json({ ok: false, error: 'invalid_json' });
    }
  }
  body = body || {};

  const firstName = String(body.firstName || '').trim();
  const phone = String(body.phone || '').trim();
  if (!firstName || !phone) {
    return res.status(400).json({ ok: false, error: 'missing_required' });
  }

  const payload = {
    token: token,
    firstName: firstName,
    phone: phone,
    source: body.source || 'אתר קמפיינר',
    ref: body.ref || 'campaigner',
    answers: Array.isArray(body.answers) ? body.answers : []
  };

  try {
    const r = await fetch(CRM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'crm_unreachable' });
  }
};
