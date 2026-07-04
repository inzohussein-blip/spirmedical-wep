import '@testing-library/jest-dom';

// مفتاح تشفير للاختبارات فقط (64 hex char = 32 bytes).
// getKey() أصبح يتطلب ENCRYPTION_KEY دائماً بلا مفتاح احتياطي،
// لذا نوفّره هنا للبيئة الاختبارية.
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ??
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
