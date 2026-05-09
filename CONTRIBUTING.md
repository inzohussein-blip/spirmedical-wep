# 🤝 المساهمة في Spir Medical

شكراً لاهتمامك بالمساهمة في سباير ميديكال!

---

## 📋 قواعد عامة

- استخدم **Conventional Commits** لرسائل الـ commits
- اكتب الكود بالإنكليزية، التعليقات يمكن أن تكون عربية
- لا ترفع `.env.local` أو أي مفاتيح أبداً
- اختبر تغييراتك محلياً قبل الـ push

## 🌳 Git Workflow

### Branches
- `main` — الإنتاج (لا push مباشر)
- `develop` — التطوير الحالي
- `feature/<name>` — ميزة جديدة
- `fix/<name>` — إصلاح خطأ
- `chore/<name>` — مهام صيانة

### مثال
```bash
# أنشئ branch جديد
git checkout -b feature/medication-reminders

# اعمل تعديلاتك
# تأكد من نجاح:
npm run type-check
npm run lint
npm test

# Commit
git add .
git commit -m "feat(medications): add reminder system"

# Push
git push origin feature/medication-reminders

# افتح Pull Request → develop
```

---

## 🎯 Conventional Commits

| النوع | الاستخدام |
|------|-----------|
| `feat` | ميزة جديدة |
| `fix` | إصلاح خطأ |
| `docs` | تحديث توثيق |
| `style` | تنسيق (لا يؤثر على الكود) |
| `refactor` | إعادة هيكلة بدون ميزات/إصلاحات |
| `perf` | تحسين أداء |
| `test` | إضافة/تحديث اختبارات |
| `chore` | صيانة (أدوات، تبعيات) |
| `security` | تحديث أمني |

### أمثلة جيدة
```
feat(auth): add 2FA for admin users
fix(appointments): prevent double booking
docs: update deployment guide
test(encryption): add edge cases for empty strings
security(rate-limit): tighten OTP attempts
```

---

## ✅ قبل فتح Pull Request

تأكد من:

- [ ] `npm run type-check` ينجح
- [ ] `npm run lint` ينجح بدون أخطاء
- [ ] `npm test` ينجح وكل الاختبارات تمر
- [ ] أضفت اختبارات للميزات الجديدة
- [ ] حدّثت `CHANGELOG.md` تحت `[Unreleased]`
- [ ] لا توجد بيانات حساسة في الكود
- [ ] ملاحظات Pull Request تشرح التغيير وسببه

---

## 🔐 الإبلاغ عن مشاكل أمنية

⚠️ **لا تفتح Issue عام لمشاكل أمنية!**

أرسل تفاصيل لـ: `security@spirmedical.iq`

سنرد خلال ٤٨ ساعة.

---

## 🧪 إضافة اختبارات

```typescript
// tests/feature.test.ts
import { yourFunction } from '@/lib/your-module';

describe('Your Module', () => {
  it('describes what it should do', () => {
    expect(yourFunction(input)).toBe(expected);
  });
});
```

شغّل:
```bash
npm test                  # كل الاختبارات
npm test -- feature      # اختبار محدّد
npm run test:watch        # watch mode
npm run test:coverage     # تغطية
```

---

## 📦 Dependencies الجديدة

قبل إضافة أي تبعية:

1. **هل هناك بديل بالـ standard library؟** (Node 20 له الكثير)
2. **هل التبعية مُصانة بنشاط؟** تحقق من آخر commit
3. **ما حجمها؟** (`npm install --dry-run`)
4. **هل لها bundle بديل أصغر؟**

عند الإضافة:
```bash
npm install --save package-name
# لـ dev dependencies:
npm install --save-dev package-name
```

---

## 🎨 Code Style

- **TypeScript صارم** (`strict: true`)
- **Prettier** للتنسيق التلقائي (`npm run format`)
- **ESLint** للأخطاء المنطقية (`npm run lint`)
- **Tailwind** للتصميم — تجنّب CSS مخصّص
- **shadcn/ui patterns** للمكوّنات

### ملفات المكوّنات
```typescript
// ✅ Server Component (افتراضي)
export default async function Page() {
  const data = await fetch(...);
  return <div>{data}</div>;
}

// ✅ Client Component (عند الحاجة)
'use client';
export default function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={...}>{count}</button>;
}
```

---

## 🏗️ بنية الكود

اتّبع نفس البنية الموجودة:

```
src/
├── app/                    # routes
├── components/
│   ├── ui/                # primitives (Button, Input, إلخ)
│   ├── shared/            # مكوّنات مشتركة
│   └── <feature>/         # مكوّنات خاصة بميزة
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── validations/      # Zod schemas
│   └── <feature>.ts      # business logic
├── hooks/                 # React hooks
└── types/                 # TypeScript types
```

---

## 💬 أسئلة؟

- 📧 `dev@spirmedical.iq`
- 💬 افتح [Discussion](https://github.com/inzohussein-blip/spirmedical-wep/discussions)
- 🐛 [Report a bug](https://github.com/inzohussein-blip/spirmedical-wep/issues)
