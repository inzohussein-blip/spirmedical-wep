/**
 * بياناتٌ منظَّمة تُكتب في HTML الخادم نفسه.
 *
 * كانت تُحقن بـ`next/script` و`strategy="afterInteractive"`، أي بالجافاسكربت
 * بعد التحميل. فقِستُ HTML المبنيّ لـ/about: **صفر** وسوم
 * `<script type="application/ld+json">` — البياناتُ موجودةٌ فقط خصائصَ
 * مُسلسلةً داخل حمولة RSC. Googlebot يراها بعد عرضٍ مؤجَّل، وزواحفُ الذكاء
 * الاصطناعي التي لا تُنفّذ الجافاسكربت (GPTBot وClaudeBot وPerplexityBot
 * وCCBot) لا تراها أبداً.
 *
 * `<` يُهرَّب إلى `<` كي لا يُغلق نصٌّ في البيانات وسمَ السكربت.
 */
export default function JsonLd({ id, data }: { id: string; data: unknown }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
