/**
 * 📤 رسائلُ الإدارة عبر واتساب — «انقر للمراسلة» من هاتف المدير نفسه.
 *
 * لا تمرّ بأيّ واجهةٍ برمجيّة (ولا بتوكن Meta المرفوض): الزرُّ يفتح محادثةً مع رقم
 * المستخدم والنصُّ جاهز، والمديرُ يضغط «إرسال». صافيةٌ بلا خادم — تُستعمل في العميل.
 *
 * طريقان للحساب الهاتفيّ:
 *   - **رابط التفعيل** (حين يعمل التحقّق العكسيّ): المستخدمُ يثبت رقمه بإرسال رمزٍ إلى
 *     رقمنا ويختار رمزَ دخوله بنفسه — لا يرى المديرُ الرمزَ ولا يمرّ في المحادثة.
 *   - **الرمز المؤقّت** (احتياطاً): الرقم + رمزٌ من ستّة أرقام، يغيّره صاحبه بعد الدخول.
 */

/** `+9647701234567` أو `07701234567` → `07701234567` للعرض */
export function displayPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('964')) return '0' + d.slice(3);
  return d.startsWith('0') ? d : '0' + d;
}

/** رابطُ محادثةٍ مع الرقم والنصُّ جاهز (`wa.me` يقبل الأرقامَ الدوليّة بلا +) */
export function waChatLink(phone: string, text: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = '964' + d.slice(1);
  else if (!d.startsWith('964')) d = '964' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function resetPinUrl(siteUrl: string, phone: string): string {
  return `${siteUrl.replace(/\/$/, '')}/login/reset-pin?phone=${displayPhone(phone)}`;
}

const ROLE_WORD: Record<string, string> = { specialist: 'كمختصّ', patient: '' };

export function activationMessage(opts: { name: string; role: string; url: string }): string {
  const role = ROLE_WORD[opts.role] ? ` ${ROLE_WORD[opts.role]}` : '';
  return [
    `مرحباً ${opts.name} 👋`,
    `أُنشئ حسابك في سباير ميديكال${role}.`,
    '',
    'لتفعيله واختيار رمز دخولك افتح الرابط:',
    opts.url,
    '',
    'ستُطلب منك رسالةُ واتساب واحدة من رقمك للتأكّد أنّه لك.',
  ].join('\n');
}

export function credentialsMessage(opts: {
  name: string;
  role: string;
  phone: string;
  pin: string;
  loginUrl: string;
}): string {
  const role = ROLE_WORD[opts.role] ? ` ${ROLE_WORD[opts.role]}` : '';
  return [
    `مرحباً ${opts.name} 👋`,
    `حسابك في سباير ميديكال${role} جاهز.`,
    '',
    `رقم الهاتف: ${displayPhone(opts.phone)}`,
    `رمز الدخول المؤقّت: ${opts.pin}`,
    `الدخول: ${opts.loginUrl}`,
    '',
    '⚠️ غيّر الرمز بعد أوّل دخول، ولا تشاركه مع أحد.',
  ].join('\n');
}
