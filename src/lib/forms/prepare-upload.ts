/**
 * 📎 تجهيزُ ملفٍّ للرفع في المتصفّح — يُستورَد في العميل والخادم معاً (بلا اعتمادٍ على الخادم).
 *
 * صورةُ هويّةٍ من كاميرا الهاتف 3–6MB، وجسمُ طلب Server Action على Vercel لا يتجاوز 4.5MB:
 * كانت ستُرفض قبل أن تبلغ الكود. فالصورُ تُصغَّر (أطولُ ضلعٍ 1600px) وتُحوَّل إلى JPEG —
 * وهذا يحلّ أيضاً webp وHEIC اللذين لا تقبلهما الحاوية. وPDF يُرسل كما هو إن صغر.
 */

/** سقفُ الملف الواحد بعد التجهيز: ثلاثةُ ملفّاتٍ وحقولُ النموذج دون 4.5MB. */
export const UPLOAD_MAX_BYTES = 1.2 * 1024 * 1024;

const MAX_SIDE = 1600;

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

async function decodeImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // يسقط إلى <img> (Safari القديم)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareUpload(file: File): Promise<{ file: File } | { error: string }> {
  if (file.type === 'application/pdf') {
    return file.size <= UPLOAD_MAX_BYTES
      ? { file }
      : { error: 'ملفّ PDF كبير (الحدّ 1.2MB) — صوّر الوثيقة بالكاميرا بدلاً منه' };
  }
  if (!file.type.startsWith('image/') && file.type !== '') {
    return { error: 'الملفّ يجب أن يكون صورة أو PDF' };
  }

  let img: Awaited<ReturnType<typeof decodeImage>>;
  try {
    img = await decodeImage(file);
  } catch {
    return { error: 'تعذّرت قراءة الصورة — جرّب صورةً أخرى أو ملفّ PDF' };
  }

  for (const [side, quality] of [[MAX_SIDE, 0.82], [1200, 0.7], [1000, 0.6]] as const) {
    const scale = Math.min(1, side / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToJpeg(canvas, quality);
    if (blob && blob.size <= UPLOAD_MAX_BYTES) {
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return { file: new File([blob], name, { type: 'image/jpeg' }) };
    }
  }
  return { error: 'الصورة كبيرة جداً — جرّب صورةً أوضح بدقّةٍ أقلّ' };
}
