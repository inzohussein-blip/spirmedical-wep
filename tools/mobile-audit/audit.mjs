import { chromium } from 'playwright-core';
import fs from 'fs';

const BASE = process.env.APP_URL || 'http://127.0.0.1:3917';
if (process.argv.length < 4) { console.error('usage: node audit.mjs /path1,/path2 OUT_DIR'); process.exit(2); }
fs.mkdirSync(process.argv[3], { recursive: true });
const PAGES = process.argv[2].split(',');
const OUT = process.argv[3];
const widths = [360, 390];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const report = {};

for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: 'ar-IQ',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  });
  if (process.env.SB_COOKIE) {
    await ctx.addCookies([{ name: 'sb-127-auth-token', value: process.env.SB_COOKIE, domain: '127.0.0.1', path: '/' }]);
    // الشعارُ يُقاس في الجولة السابقة؛ هنا يُصرف كي لا يحجب الشاشات
    await ctx.addInitScript(() => { try { localStorage.setItem('spir_cookie_consent_v1', JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() })); } catch {} });
  }
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 140)));
    let status = 0;
    try {
      const r = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
      status = r?.status() ?? 0;
    } catch (e) { errors.push('goto: ' + String(e.message).slice(0, 100)); }
    await page.waitForTimeout(600);
    const finalPath = new URL(page.url()).pathname;

    const r = await page.evaluate((vw) => {
      const vis = (el) => {
        const s = getComputedStyle(el); const b = el.getBoundingClientRect();
        return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && b.width > 0 && b.height > 0;
      };
      const label = (el) => {
        const t = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.getAttribute('name') || el.tagName).trim().replace(/\s+/g, ' ');
        const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.split(' ').filter(Boolean)[0] : '';
        return `${el.tagName.toLowerCase()}${cls} «${t.slice(0, 28)}»`;
      };
      const docW = document.documentElement.scrollWidth;
      // عناصرُ تتجاوز عرض الشاشة (في الاتّجاهين: RTL)
      const over = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (!vis(el)) continue;
        const b = el.getBoundingClientRect();
        if (b.right > vw + 1 || b.left < -1) {
          // لا تُحصَ عناصرُ داخل حاويةٍ قابلةٍ للتمرير أفقياً عمداً
          let p = el.parentElement, scroller = false;
          while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { scroller = true; break; } p = p.parentElement; }
          if (!scroller) over.push(`${label(el)} [${Math.round(b.left)}→${Math.round(b.right)}]`);
        }
      }
      // أهدافُ لمسٍ صغيرة
      const small = [], tiny = [];
      for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],summary,label[for]')) {
        if (!vis(el)) continue;
        const b = el.getBoundingClientRect();
        const m = Math.min(b.width, b.height);
        // الرابط داخل فقرة نصّيّة مستثنى من القاعدة (WCAG 2.5.8)
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p,li')) continue;
        if (m < 24) tiny.push(`${label(el)} ${Math.round(b.width)}×${Math.round(b.height)}`);
        else if (m < 40) small.push(`${label(el)} ${Math.round(b.width)}×${Math.round(b.height)}`);
      }
      // خطوطٌ صغيرة جدّاً
      const fonts = {};
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = tw.nextNode())) {
        const t = n.textContent.trim(); if (t.length < 2 || !n.parentElement || !vis(n.parentElement)) continue;
        const fs = parseFloat(getComputedStyle(n.parentElement).fontSize);
        if (fs < 12) { const k = fs.toFixed(1); fonts[k] = fonts[k] || []; if (fonts[k].length < 4) fonts[k].push(t.slice(0, 24)); }
      }
      // حقولٌ خطُّها < 16px تُسبّب تكبيراً تلقائياً في iOS عند التركيز
      const zoom = [];
      for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')) {
        if (!vis(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 16) zoom.push(`${label(el)} ${fs}px`);
      }
      const vp = document.querySelector('meta[name=viewport]')?.content || '(none)';
      return { docW, over: [...new Set(over)].slice(0, 8), overCount: over.length, tiny: tiny.slice(0, 10), tinyCount: tiny.length, small: small.slice(0, 6), smallCount: small.length, fonts, zoom, vp, dir: document.documentElement.dir, lang: document.documentElement.lang };
    }, w);

    const shot = `${OUT}/${w}${path.replace(/[\/?=&]/g, '_') || '_home'}.png`;
    await page.screenshot({ path: shot, fullPage: false });
    if (process.env.FULL) await page.screenshot({ path: shot.replace('.png','_full.png'), fullPage: true });
    report[`${w}${path}`] = { status, finalPath, errors: errors.slice(0, 3), ...r };
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
console.log('done', Object.keys(report).length);
