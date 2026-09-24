import type { AnchorHTMLAttributes, CSSProperties } from 'react';
import { isDialable } from '@/lib/format/phone';

/**
 * رابطُ اتصالٍ أو واتساب لا يُفعَّل إلّا لرقمٍ حقيقيّ.
 * `phone` هو الرقمُ الخام الذي بُني منه `href`؛ فإن كان مُقنَّعاً («0770 xxx
 * xxxx») أو فارغاً صار الزرُّ نصّاً معطّلاً بنفس مظهره، لا رابطاً يطلب رقماً
 * مبتوراً.
 */
export default function PhoneLink({
  phone,
  href,
  target,
  rel,
  style,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { phone: string | null | undefined }) {
  if (isDialable(phone)) {
    return (
      <a href={href} target={target} rel={rel} style={style} {...rest}>
        {children}
      </a>
    );
  }
  const disabledStyle: CSSProperties = { ...style, opacity: 0.5, cursor: 'not-allowed' };
  return (
    <span
      className={rest.className}
      style={disabledStyle}
      aria-disabled="true"
      title="الرقم غير متاحٍ بعد"
    >
      {children}
    </span>
  );
}
