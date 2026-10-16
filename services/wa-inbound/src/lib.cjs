/**
 * دوالُّ البوّابة الصافية — CommonJS كي يختبرها `tests/` في المشروع الرئيسيّ مباشرةً،
 * ويقارن توقيعَها بتوقيع الموقع (`src/lib/whatsapp/inbound-verify.ts`).
 */
'use strict';

const { createHmac } = require('node:crypto');

/** نفسُ صيغة الموقع: HMAC-SHA256 على `<timestamp>.<body>` بالسرّ المشترك. */
function sign(secret, timestamp, body) {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

function signedHeaders(secret, body, now = Date.now()) {
  const timestamp = String(now);
  return {
    'content-type': 'application/json',
    'x-spir-timestamp': timestamp,
    'x-spir-signature': sign(secret, timestamp, body),
  };
}

const PN = /@s\.whatsapp\.net$/;
const LID = /@lid$/;

/**
 * رقمُ المرسِل الحقيقيّ (`9647…@s.whatsapp.net`) من مفتاح الرسالة.
 * واتساب يُخفي الرقمَ أحياناً خلف «LID» (`…@lid`): نجرّب البديلَ في المفتاح
 * (`remoteJidAlt`)، ثمّ جدولَ الربط المحفوظ في الجلسة. وإلّا null — والموقعُ
 * يرفض التحقّق بلا رقم، لأنّ مطابقةَ الرقم هي الإثبات.
 */
async function resolveSender(key, lookupPnForLid) {
  if (!key || !key.remoteJid) return { pn: null, via: 'none' };
  if (PN.test(key.remoteJid)) return { pn: key.remoteJid, via: 'direct' };
  if (LID.test(key.remoteJid)) {
    if (key.remoteJidAlt && PN.test(key.remoteJidAlt)) return { pn: key.remoteJidAlt, via: 'alt' };
    if (lookupPnForLid) {
      try {
        const pn = await lookupPnForLid(key.remoteJid);
        if (pn && PN.test(pn)) return { pn, via: 'mapping' };
      } catch {
        /* لا ربط */
      }
    }
    return { pn: null, via: 'lid-hidden' };
  }
  return { pn: null, via: 'other' }; // مجموعة، قناة، بثّ…
}

/** نصُّ الرسالة من أشكالها الشائعة (نصّ، نصّ ممتدّ، تعليقُ صورة). */
function messageText(message) {
  if (!message) return null;
  return (
    message.conversation ||
    (message.extendedTextMessage && message.extendedTextMessage.text) ||
    (message.imageMessage && message.imageMessage.caption) ||
    null
  );
}

/** هل في النصّ ستّةُ أرقامٍ متتالية؟ (عربيّة أو لاتينيّة) — لا نرسل غيرها للموقع. */
function looksLikeCode(text) {
  if (!text) return false;
  const ascii = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  return /(?:^|\D)\d{6}(?!\d)/.test(ascii);
}

module.exports = { sign, signedHeaders, resolveSender, messageText, looksLikeCode };
