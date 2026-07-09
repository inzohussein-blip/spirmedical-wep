/**
 * ════════════════════════════════════════════════════════════════════
 * 📍 Map Markers (V25.37)
 * ════════════════════════════════════════════════════════════════════
 *
 * تعريف الـ 8 أيقونات حسب نوع الخدمة
 *
 * يُبنى كـ HTML string (SVG inline) — يُستخدم كعنصر مؤشّر في MapLibre، لا يحتاج assets خارجية
 * ════════════════════════════════════════════════════════════════════
 */

export type ServiceMarkerType =
  | 'blood-draw'      // 🩸 سحب دم
  | 'home-nursing'    // 💉 تمريض منزلي
  | 'pharmacy'        // 💊 صيدلية
  | 'dental'          // 🦷 أسنان
  | 'optical'         // 👓 نظارات
  | 'mental-health'   // 🧠 صحة نفسية
  | 'nutrition'       // 🥗 تغذية
  | 'hospital'        // 🏥 مستشفى
  | 'doctor'          // 👨‍⚕️ طبيب
  | 'clinic'          // 🏥 عيادة
  | 'user';           // 📍 موقع المستخدم

export interface MarkerStyle {
  color: string;       // اللون الأساسي
  bgColor: string;     // background للـ icon container
  textColor: string;   // لون النص
  symbol: string;      // نص قصير في المؤشّر (مثل Rx)
  label: string;       // الاسم العربي
}

/**
 * Map كل نوع خدمة لـ marker style
 */
export const MARKER_STYLES: Record<ServiceMarkerType, MarkerStyle> = {
  'blood-draw': {
    color: '#0F6E56',
    bgColor: '#E1F5EE',
    textColor: '#04342C',
    symbol: '💉',
    label: 'سحب دم',
  },
  'home-nursing': {
    color: '#BA7517',
    bgColor: '#FAEEDA',
    textColor: '#412402',
    symbol: '+',
    label: 'تمريض',
  },
  'pharmacy': {
    color: '#0F6E56',
    bgColor: '#E1F5EE',
    textColor: '#04342C',
    symbol: 'Rx',
    label: 'صيدلية',
  },
  'dental': {
    color: '#534AB7',
    bgColor: '#EEEDFE',
    textColor: '#26215C',
    symbol: '🦷',
    label: 'أسنان',
  },
  'optical': {
    color: '#BA7517',
    bgColor: '#FAEEDA',
    textColor: '#412402',
    symbol: '👓',
    label: 'نظارات',
  },
  'mental-health': {
    color: '#534AB7',
    bgColor: '#EEEDFE',
    textColor: '#26215C',
    symbol: '🧠',
    label: 'صحة نفسية',
  },
  'nutrition': {
    color: '#0F6E56',
    bgColor: '#E1F5EE',
    textColor: '#04342C',
    symbol: '🥗',
    label: 'تغذية',
  },
  'hospital': {
    color: '#A32D2D',
    bgColor: '#FCEBEB',
    textColor: '#501313',
    symbol: '+',
    label: 'مستشفى',
  },
  'doctor': {
    color: '#185FA5',
    bgColor: '#E6F1FB',
    textColor: '#0C447C',
    symbol: '👨‍⚕️',
    label: 'طبيب',
  },
  'clinic': {
    color: '#185FA5',
    bgColor: '#E6F1FB',
    textColor: '#0C447C',
    symbol: '🏥',
    label: 'عيادة',
  },
  'user': {
    color: '#185FA5',
    bgColor: '#E6F1FB',
    textColor: '#0C447C',
    symbol: '•',
    label: 'موقعك',
  },
};

/**
 * يبني SVG marker كـ HTML string
 *
 * Format: pin shape + circle بياض داخل + نص/رمز
 */
export function buildMarkerSvg(type: ServiceMarkerType, size: number = 40): string {
  const style = MARKER_STYLES[type] || MARKER_STYLES['blood-draw'];

  if (type === 'user') {
    // marker خاص للموقع الحالي (دائرة بـ pulse)
    return `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <div style="position: absolute; inset: 0; background: ${style.color}; opacity: 0.15; border-radius: 50%; animation: marker-pulse 2s ease-in-out infinite;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${Math.floor(size * 0.4)}px; height: ${Math.floor(size * 0.4)}px; background: ${style.color}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `;
  }

  const pinWidth = size;
  const pinHeight = Math.floor(size * 1.15);
  const circleRadius = Math.floor(size * 0.32);
  const circleY = Math.floor(size * 0.38);

  // emoji marker إذا الرمز emoji
  const isEmoji = style.symbol.length > 1;
  const symbolFontSize = isEmoji ? Math.floor(size * 0.42) : Math.floor(size * 0.32);

  return `
    <div style="position: relative; width: ${pinWidth}px; height: ${pinHeight}px;">
      <svg viewBox="0 0 ${pinWidth} ${pinHeight}" width="${pinWidth}" height="${pinHeight}" style="display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
        <path d="M${pinWidth / 2} 0 C${pinWidth * 0.18} 0 0 ${pinWidth * 0.22} 0 ${pinWidth * 0.5} C0 ${pinHeight * 0.85} ${pinWidth / 2} ${pinHeight} ${pinWidth / 2} ${pinHeight} S${pinWidth} ${pinHeight * 0.85} ${pinWidth} ${pinWidth * 0.5} C${pinWidth} ${pinWidth * 0.22} ${pinWidth * 0.82} 0 ${pinWidth / 2} 0 Z" fill="${style.color}" stroke="white" stroke-width="2"/>
        <circle cx="${pinWidth / 2}" cy="${circleY}" r="${circleRadius}" fill="white"/>
        <text x="${pinWidth / 2}" y="${circleY + symbolFontSize * 0.35}" text-anchor="middle" fill="${style.color}" font-size="${symbolFontSize}" font-weight="500" font-family="Tajawal, system-ui">${style.symbol}</text>
      </svg>
    </div>
  `;
}

/**
 * يبني cluster marker (لتجميع markers قريبة)
 */
export function buildClusterSvg(count: number, type?: ServiceMarkerType): string {
  const style = type ? MARKER_STYLES[type] : MARKER_STYLES['blood-draw'];

  let size = 36;
  if (count >= 100) size = 52;
  else if (count >= 50) size = 46;
  else if (count >= 20) size = 42;

  return `
    <div style="width: ${size}px; height: ${size}px; background: ${style.color}; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: ${Math.floor(size * 0.32)}px; font-weight: 500; font-family: Tajawal, system-ui; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
      ${count}
    </div>
  `;
}
