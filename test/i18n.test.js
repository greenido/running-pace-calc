import { test } from 'node:test';
import assert from 'node:assert/strict';

import { t, detectLang, defaultUnit, keysFor } from '../public/js/i18n.js';

test('every English string has a Hebrew translation, and nothing extra', () => {
  assert.deepEqual(keysFor('he').sort(), keysFor('en').sort());
});

test('placeholders survive translation', () => {
  for (const key of keysFor('en')) {
    const placeholders = (lang) => (t(key, {}, lang).match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders('he'), placeholders('en'), key);
  }
});

test('t() fills placeholders and leaves unknown ones visible', () => {
  assert.equal(t('splits.summary', { count: 26, unit: 'Mi' }, 'en'), 'Splits (26 × Mi)');
  assert.equal(t('splits.summary', { count: 42, unit: 'ק״מ' }, 'he'), 'זמני ביניים (42 × ק״מ)');
  assert.equal(t('splits.summary', {}, 'en'), 'Splits ({count} × {unit})');
});

test('t() falls back to English, then to the key itself', () => {
  assert.equal(t('tab.calc', {}, 'fr'), 'Pace');
  assert.equal(t('no.such.key', {}, 'he'), 'no.such.key');
});

test('detectLang: URL beats storage beats browser', () => {
  assert.equal(detectLang({ urlLang: 'he', storedLang: 'en', browserLangs: ['en-US'] }), 'he');
  assert.equal(detectLang({ urlLang: 'xx', storedLang: 'he', browserLangs: ['en-US'] }), 'he');
  assert.equal(detectLang({ storedLang: null, browserLangs: ['he-IL', 'en'] }), 'he');
  assert.equal(detectLang({ browserLangs: ['iw'] }), 'he');
  assert.equal(detectLang({ browserLangs: ['en-GB', 'he'] }), 'en');
  assert.equal(detectLang(), 'en');
});

test('Hebrew defaults to kilometres', () => {
  assert.equal(defaultUnit('he'), 'km');
  assert.equal(defaultUnit('en'), 'mi');
});
