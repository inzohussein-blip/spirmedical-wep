import {
  BLOOD_TESTS,
  TEST_BUNDLES,
  searchTests,
  needsFasting,
  longestResultTime,
  calculateTestsTotal,
  calculateBundleDiscount,
  buildTestsSummary,
} from '@/lib/services/blood-tests-data';

describe('Blood Tests Data', () => {
  describe('BLOOD_TESTS catalog', () => {
    it('contains 14 essential tests', () => {
      expect(BLOOD_TESTS).toHaveLength(14);
    });

    it('every test has unique id and code', () => {
      const ids = BLOOD_TESTS.map((t) => t.id);
      const codes = BLOOD_TESTS.map((t) => t.code);
      expect(new Set(ids).size).toBe(BLOOD_TESTS.length);
      expect(new Set(codes).size).toBe(BLOOD_TESTS.length);
    });

    it('every test has a positive price in IQD', () => {
      BLOOD_TESTS.forEach((t) => {
        expect(t.price).toBeGreaterThan(0);
      });
    });

    it('fasting tests have fastingHours defined', () => {
      BLOOD_TESTS.filter((t) => t.fastingRequired).forEach((t) => {
        expect(t.fastingHours).toBeGreaterThan(0);
      });
    });
  });

  describe('TEST_BUNDLES', () => {
    it('contains 3 bundles', () => {
      expect(TEST_BUNDLES).toHaveLength(3);
    });

    it('every bundle references valid test ids', () => {
      TEST_BUNDLES.forEach((bundle) => {
        bundle.testIds.forEach((id) => {
          expect(BLOOD_TESTS.find((t) => t.id === id)).toBeDefined();
        });
      });
    });

    it('bundle price is lower than sum of individual prices', () => {
      TEST_BUNDLES.forEach((bundle) => {
        const subtotal = calculateTestsTotal(bundle.testIds);
        expect(bundle.price).toBeLessThan(subtotal);
      });
    });
  });

  describe('searchTests', () => {
    it('returns all tests when query is empty', () => {
      expect(searchTests('').length).toBe(BLOOD_TESTS.length);
    });

    it('finds CBC by Arabic name', () => {
      const r = searchTests('تعداد');
      expect(r.some((t) => t.id === 'cbc')).toBe(true);
    });

    it('finds FBS by keyword "سكر"', () => {
      const r = searchTests('سكر');
      expect(r.some((t) => t.id === 'fbs')).toBe(true);
    });

    it('finds Vitamin D case-insensitive', () => {
      const r = searchTests('VIT');
      expect(r.some((t) => t.id === 'vit-d')).toBe(true);
    });

    it('returns empty for nonsense query', () => {
      expect(searchTests('xyzqwertynonsense').length).toBe(0);
    });
  });

  describe('needsFasting', () => {
    it('returns false for non-fasting tests only', () => {
      const { required, hours } = needsFasting(['cbc', 'tsh']);
      expect(required).toBe(false);
      expect(hours).toBe(0);
    });

    it('returns true with max hours when any test needs fasting', () => {
      const { required, hours } = needsFasting(['cbc', 'lipid']);
      expect(required).toBe(true);
      expect(hours).toBe(12); // lipid = 12h
    });

    it('returns highest fasting hours among selected', () => {
      const { hours } = needsFasting(['fbs', 'lipid']); // 8h, 12h
      expect(hours).toBe(12);
    });
  });

  describe('longestResultTime', () => {
    it('returns longest time across selected tests', () => {
      // vit-d = 48h, cbc = 24h
      expect(longestResultTime(['cbc', 'vit-d'])).toBe('48 ساعة');
    });
  });

  describe('calculateBundleDiscount', () => {
    it('applies 0% discount for single test', () => {
      const r = calculateBundleDiscount(['cbc']);
      expect(r.discountPercent).toBe(0);
      expect(r.total).toBe(r.subtotal);
    });

    it('applies 5% discount for 2 tests', () => {
      const r = calculateBundleDiscount(['cbc', 'fbs']);
      expect(r.discountPercent).toBe(5);
      expect(r.total).toBeLessThan(r.subtotal);
    });

    it('applies 10% discount for 3-4 tests', () => {
      const r = calculateBundleDiscount(['cbc', 'fbs', 'lipid']);
      expect(r.discountPercent).toBe(10);
    });

    it('applies 15% discount for 5+ tests', () => {
      const r = calculateBundleDiscount(['cbc', 'fbs', 'lipid', 'tsh', 'lft']);
      expect(r.discountPercent).toBe(15);
    });
  });

  describe('buildTestsSummary', () => {
    it('produces bundle label when bundleId provided', () => {
      const summary = buildTestsSummary(
        ['cbc', 'fbs'],
        'bundle-general-health'
      );
      expect(summary).toContain('[باقة]');
      expect(summary).toContain('باقة الصحة العامة');
    });

    it('produces tests label without bundle', () => {
      const summary = buildTestsSummary(['cbc', 'fbs']);
      expect(summary).toContain('[تحاليل]');
      expect(summary).toContain('CBC');
      expect(summary).toContain('FBS');
    });
  });
});
