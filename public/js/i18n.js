//
// English / Hebrew strings and the bits that pick and apply a language.
//
// Everything above applyLanguage() is DOM-free so it can be unit tested in
// node. Numbers stay in Western digits in both languages — that is what
// Israeli race clocks and watches show.
//

export const LANGS = ['en', 'he'];

const STRINGS = {
  en: {
    'app.title': 'Running Pace Calculator',
    'food.title': 'Marathon Nutrition',
    'food.back': '← Back to the pace calculator',
    'lang.label': 'Language',

    'tabs.label': 'Calculator sections',
    'tab.calc': 'Pace',
    'tab.predict': 'Predict & Train',

    'mode.legend': 'What are you solving for?',
    'mode.time': 'I know my goal time → show pace',
    'mode.pace': 'I know my goal pace → show time',

    'unit.legend': 'Pace unit',
    'unit.mi': 'Miles',
    'unit.km': 'Kilometers',
    'unit.short.mi': 'Mi',
    'unit.short.km': 'Km',

    'dist.legend': 'Distance',
    'dist.custom': 'Custom',
    'dist.customLabel': 'Custom distance',

    'race.5k': '5K',
    'race.10k': '10K',
    'race.15k': '15K',
    'race.half': 'Half Marathon',
    'race.marathon': 'Marathon',
    'race.50k': '50K',
    'race.50mi': '50 Miles',
    'race.100k': '100K',
    'race.100mi': '100 Miles',

    'time.hours': 'Hours',
    'time.minutes': 'Minutes',
    'time.seconds': 'Seconds',
    'step.dec': 'Decrease {label}',
    'step.inc': 'Increase {label}',

    'result.time': 'Total Time',
    'result.pace': 'Pace',
    'pace.unit': 'Min/{unit}',
    'pace.per': '/{unit}',

    'btn.share': 'Copy link',
    'btn.shared': 'Link copied ✓',
    'btn.shareFailed': 'Copy from the address bar',
    'btn.print': 'Print pace band',

    'splits.summary': 'Splits ({count} × {unit})',
    'splits.strategy': 'Pacing strategy:',
    'splits.even': 'Even pace',
    'splits.negative': 'Negative split — back half {percent}% faster',
    'splits.distance': 'Distance',
    'splits.elapsed': 'Elapsed',
    'splits.pace': 'Pace',
    'splits.finish': '{mark} {unit} (finish)',

    'predict.legend': 'A race you have actually run',
    'predict.distance': 'Distance',
    'predict.time': 'Time',
    'predict.unit': 'Show paces in',
    'predict.error': "That time doesn't look right — try something like 45:00 or 3:30:00.",
    'predict.heading': 'What else could you run?',
    'predict.hint':
      "Riegel's formula, scaled from your result. It gets optimistic the further it reaches — a marathon predicted off a 5K assumes endurance the 5K never tested.",
    'predict.colDistance': 'Distance',
    'predict.colPredicted': 'Predicted',
    'predict.colPace': 'Pace',
    'predict.yourRace': '{label} (your race)',

    'train.heading': 'Training Paces',
    'train.hint':
      'From the Daniels/Gilbert VO₂ model. Easy days are meant to feel too easy — that is the point of them.',
    'train.colZone': 'Zone',
    'train.colPace': 'Pace',
    'zone.easy': 'Easy / Long',
    'zone.marathon': 'Marathon',
    'zone.threshold': 'Threshold / Tempo',
    'zone.interval': 'Interval',
    'zone.repetition': 'Repetition',

    'footer.nutrition': 'Marathon Nutrition',
    'footer.training': 'Training',
    'footer.quote':
      "🏃 🏃 The five S's of sports training are: Stamina, Speed, Strength, Skill and Spirit; but the greatest of these is Spirit.",
    'footer.projects': "Ido's Projects",
    'footer.updated': 'Updated: August 2026',
    'footer.talks': "Ido's Talks",
    'footer.foodUpdated': 'Updated: Aug 2019',
  },

  he: {
    'app.title': 'מחשבון קצב ריצה',
    'food.title': 'תזונה למרתון',
    'food.back': '→ חזרה למחשבון הקצב',
    'lang.label': 'שפה',

    'tabs.label': 'חלקי המחשבון',
    'tab.calc': 'קצב',
    'tab.predict': 'תחזית ואימון',

    'mode.legend': 'מה רוצים לחשב?',
    'mode.time': 'יש לי זמן יעד ← חשב קצב',
    'mode.pace': 'יש לי קצב יעד ← חשב זמן',

    'unit.legend': 'יחידת קצב',
    'unit.mi': 'מיילים',
    'unit.km': 'קילומטרים',
    'unit.short.mi': 'מייל',
    'unit.short.km': 'ק״מ',

    'dist.legend': 'מרחק',
    'dist.custom': 'אחר',
    'dist.customLabel': 'מרחק מותאם אישית',

    'race.5k': '5K',
    'race.10k': '10K',
    'race.15k': '15K',
    'race.half': 'חצי מרתון',
    'race.marathon': 'מרתון',
    'race.50k': '50K',
    'race.50mi': '50 מייל',
    'race.100k': '100K',
    'race.100mi': '100 מייל',

    'time.hours': 'שעות',
    'time.minutes': 'דקות',
    'time.seconds': 'שניות',
    'step.dec': 'הפחתת {label}',
    'step.inc': 'הוספת {label}',

    'result.time': 'זמן כולל',
    'result.pace': 'קצב',
    'pace.unit': 'דק׳/{unit}',
    'pace.per': 'דק׳/{unit}',

    'btn.share': 'העתקת קישור',
    'btn.shared': 'הקישור הועתק ✓',
    'btn.shareFailed': 'העתיקו משורת הכתובת',
    'btn.print': 'הדפסת צמיד קצב',

    'splits.summary': 'זמני ביניים ({count} × {unit})',
    'splits.strategy': 'אסטרטגיית קצב:',
    'splits.even': 'קצב אחיד',
    'splits.negative': 'ספליט שלילי — החצי השני מהיר ב-{percent}%',
    'splits.distance': 'מרחק',
    'splits.elapsed': 'זמן מצטבר',
    'splits.pace': 'קצב',
    'splits.finish': '{mark} {unit} (סיום)',

    'predict.legend': 'מרוץ שכבר רצתם',
    'predict.distance': 'מרחק',
    'predict.time': 'זמן',
    'predict.unit': 'הצגת קצב ב',
    'predict.error': 'הזמן לא נראה תקין — נסו משהו כמו 45:00 או 3:30:00.',
    'predict.heading': 'מה עוד אפשר לרוץ?',
    'predict.hint':
      'נוסחת ריגל, מותאמת לתוצאה שלכם. ככל שהמרחק רחוק יותר היא נעשית אופטימית — מרתון שחושב מתוך 5K מניח סיבולת שה-5K מעולם לא בדק.',
    'predict.colDistance': 'מרחק',
    'predict.colPredicted': 'תחזית',
    'predict.colPace': 'קצב',
    'predict.yourRace': '{label} (המרוץ שלכם)',

    'train.heading': 'קצבי אימון',
    'train.hint':
      'לפי מודל ה-VO₂ של דניאלס/גילברט. ימים קלים אמורים להרגיש קלים מדי — זו בדיוק המטרה שלהם.',
    'train.colZone': 'אזור',
    'train.colPace': 'קצב',
    'zone.easy': 'קל / ארוך',
    'zone.marathon': 'מרתון',
    'zone.threshold': 'סף / טמפו',
    'zone.interval': 'אינטרוולים',
    'zone.repetition': 'חזרות',

    'footer.nutrition': 'תזונה למרתון',
    'footer.training': 'אימון',
    'footer.quote':
      '🏃 🏃 חמשת ה-S של אימון ספורטיבי: סיבולת, מהירות, כוח, מיומנות ורוח — והחשובה מכולן היא הרוח.',
    'footer.projects': 'הפרויקטים של עידו',
    'footer.updated': 'עודכן: אוגוסט 2026',
    'footer.talks': 'ההרצאות של עידו',
    'footer.foodUpdated': 'עודכן: אוגוסט 2019',
  },
};

const STORAGE_KEY = 'pace-calc-lang';

let current = 'en';

export function getLang() {
  return current;
}

export function isRtl(lang = current) {
  return lang === 'he';
}

// The unit a fresh visitor in this language most likely thinks in.
export function defaultUnit(lang = current) {
  return lang === 'he' ? 'km' : 'mi';
}

//
// t('splits.summary', { count: 26, unit: 'Mi' }). A key missing from Hebrew
// falls back to English, and a missing key altogether shows the key, so a
// gap is visible rather than blank.
//
export function t(key, vars = {}, lang = current) {
  const template = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
}

//
// An explicit ?lang= wins, then the visitor's last choice, then the browser.
// "iw" is the legacy code some Android builds still report for Hebrew.
//
export function detectLang({ urlLang, storedLang, browserLangs = [] } = {}) {
  if (LANGS.includes(urlLang)) return urlLang;
  if (LANGS.includes(storedLang)) return storedLang;
  const primary = String(browserLangs[0] ?? '').toLowerCase();
  return primary.startsWith('he') || primary.startsWith('iw') ? 'he' : 'en';
}

export function keysFor(lang) {
  return Object.keys(STRINGS[lang] ?? {});
}

//
// Browser side
//

export function readStoredLang() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode or blocked storage: the choice just won't outlive the tab.
  }
}

//
// Swaps every static string on the page. Elements opt in with:
//   data-i18n="key"        -> textContent
//   data-i18n-aria="key"   -> aria-label
//   data-lang-block="he"   -> shown only in that language (long prose)
//
export function applyLanguage(lang, { remember = false } = {}) {
  current = LANGS.includes(lang) ? lang : 'en';
  if (remember) storeLang(current);

  const root = document.documentElement;
  root.lang = current;
  root.dir = isRtl() ? 'rtl' : 'ltr';

  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-aria]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nAria));
  }
  for (const node of document.querySelectorAll('[data-lang-block]')) {
    node.hidden = node.dataset.langBlock !== current;
  }
  for (const button of document.querySelectorAll('.lang-switch [data-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === current));
  }

  const titleKey = document.body.dataset.titleKey;
  if (titleKey) document.title = t(titleKey);
}

// Wires the EN / עב pill. onChange runs after the strings are swapped.
export function initLangSwitch(onChange = () => {}) {
  for (const button of document.querySelectorAll('.lang-switch [data-lang]')) {
    button.addEventListener('click', () => {
      if (button.dataset.lang === current) return;
      applyLanguage(button.dataset.lang, { remember: true });
      onChange(current);
    });
  }
}
