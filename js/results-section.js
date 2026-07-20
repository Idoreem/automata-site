/* ============================================================
   קומפוננטה משותפת: "תוצאות שהבאנו ללקוחות מרוצים".

   מקור אמת יחיד לשני העמודים (הבית + הקמפיינר) - כל עריכה כאן
   משנה את שניהם. מרנדר ל-light DOM כדי ש-css/style.css יחול,
   ו-js/main.js אוסף את ה-.reveal כרגיל (לכן חובה לטעון את הקובץ
   הזה *לפני* main.js). הרקע והמרווח מגיעים מהמחלקות שעל תגית
   <results-section> עצמה (למשל class="section section--alt").
   ============================================================ */
(function () {
  'use strict';

  /* אייקון וואטסאפ - חוזר בכל כרטיס, מוגדר פעם אחת */
  var WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.2 13.6c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5-.3.6-.7.9-.5 1.2.7 1.2 1.6 2 2.8 2.6.3.2.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2.1 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.2z"/></svg>';

  function card(delay, title, src, w, h, alt) {
    return '<figure class="t reveal ' + delay + '">' +
      '<figcaption><span class="t-wa" aria-hidden="true">' + WA + '</span>' + title + '</figcaption>' +
      '<img src="' + src + '" width="' + w + '" height="' + h + '" loading="lazy" decoding="async" alt="' + alt + '">' +
      '</figure>';
  }

  /* כרטיס וידאו - המלצה מצולמת. בלי כותרת, מושתק ובלולאה, ומתנגן רק כשהוא
     בשדה הראייה (ראה render) כדי לא למשוך את הקובץ עד שגוללים לסקשן. */
  function videoCard(delay, src, poster, extra) {
    return '<figure class="t t--video ' + (extra ? extra + ' ' : '') + 'reveal ' + delay + '">' +
      '<video class="t-video" muted loop playsinline controls controlslist="nodownload" preload="none" poster="' + poster + '">' +
        '<source src="' + src + '" type="video/mp4">' +
      '</video>' +
      '</figure>';
  }

  var MARKUP =
    '<div class="wrap">' +
      '<div class="shead shead--center reveal">' +
        '<h2 class="h">תוצאות שהבאנו ללקוחות מרוצים</h2>' +
        '<p class="tnote">צילומי מסך אמיתיים, כמו שהם. בלי עריכה.</p>' +
      '</div>' +
      /* שלושת הסרטונים בשורה אחת, האמצעי (השלישי) במרכז. ראה css/style.css. */
      '<div class="tvideos">' +
        videoCard('d1', '/img/testimonials/testimonial-video.mp4', '/img/testimonials/testimonial-video.jpg') +
        videoCard('d2', '/img/testimonials/testimonial-video-3.mp4', '/img/testimonials/testimonial-video-3.jpg') +
        videoCard('d3', '/img/testimonials/testimonial-video-2.mp4', '/img/testimonials/testimonial-video-2.jpg') +
      '</div>' +
      '<div class="tgrid">' +
        card('d1', 'ליווי צמוד עד לתוצאה', '/img/testimonials/thanks.jpg', 916, 202,
          'הודעת וואטסאפ מלקוח: ״תודה רבה על כל העזרה אחי לא הייתי מגיע לפה בלי שתכוון אותי״') +
        card('d2', 'לידים חמים יותר, פגישות בקצב', '/img/testimonials/leads.jpg', 898, 423,
          'הודעת וואטסאפ מלקוח: ״היי אלוף, חייב להגיד שעד עכשיו טפו טפו הכל הולך מעולה. מאז שהטמענו את ה-AI בעסק הלידים מגיעים הרבה יותר חמים, ומנהלת המשרד מתאמת פגישות בקצב״') +
        card('d3', 'שירות שחוזרים אליו', '/img/testimonials/master.jpg', 926, 589,
          'הודעות וואטסאפ מלקוח: ״שמע עכשיו שלחתי אתה כוכב אחי תודה על הכל״, ״אם אני אצטרך עוד עזרה אני אדע למי לפנות את המאסטר אחי תודה רבה״') +
        card('d4', 'הערך המוסף בתוכנית', '/img/testimonials/value.jpg', 929, 389,
          'הודעת וואטסאפ מלקוח: ״שמע, אתה באמת עוזר לי כל כך אתה אולי לא מבין. אבל אתה ממש הערך המוסף בתכנית הזו. תודה רבה״') +
      '</div>' +
    '</div>';

  function render(el) {
    if (el.getAttribute('data-rendered')) return;
    el.setAttribute('data-rendered', '1');
    el.innerHTML = MARKUP;

    /* כל וידאו מתנגן רק כשהוא גלוי - חוסך את הורדת הקבצים עד שגוללים לסקשן,
       ועוצר כשיוצאים ממנו. preload="none" בתגית משלים את זה. */
    Array.prototype.forEach.call(el.querySelectorAll('video'), function (vid) {
      vid.muted = true; /* נדרש כדי שדפדפנים יאשרו הפעלה מושתקת אוטומטית */
      var play = function () { var p = vid.play(); if (p && p.catch) p.catch(function () {}); };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? play() : vid.pause(); });
        }, { threshold: 0.25 }).observe(vid);
      } else {
        play();
      }
    });
  }

  if ('customElements' in window) {
    if (!customElements.get('results-section')) {
      customElements.define('results-section', class extends HTMLElement {
        connectedCallback() { render(this); }
      });
    }
  } else {
    /* דפדפנים ישנים בלי custom elements - מרנדרים ישירות */
    Array.prototype.forEach.call(document.querySelectorAll('results-section'), render);
  }
})();
