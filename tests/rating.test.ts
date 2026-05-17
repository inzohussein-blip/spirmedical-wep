/**
 * Tests for Rating logic
 */

describe('Rating', () => {
  describe('Feedback messages', () => {
    const getFeedback = (stars: number): string => {
      if (stars === 5) return '🤩 ممتاز! نحن سعداء جداً';
      if (stars === 4) return '😊 جيد جداً';
      if (stars === 3) return '🙂 جيد';
      if (stars === 2) return '😐 مقبول';
      if (stars === 1) return '😞 يحتاج تحسين';
      return '';
    };

    it('returns excellent for 5 stars', () => {
      expect(getFeedback(5)).toContain('ممتاز');
    });

    it('returns very good for 4 stars', () => {
      expect(getFeedback(4)).toContain('جيد جداً');
    });

    it('returns acceptable for 2 stars', () => {
      expect(getFeedback(2)).toContain('مقبول');
    });

    it('returns needs improvement for 1 star', () => {
      expect(getFeedback(1)).toContain('يحتاج تحسين');
    });

    it('returns empty for 0', () => {
      expect(getFeedback(0)).toBe('');
    });
  });

  describe('Tags selection', () => {
    const POSITIVE_TAGS = ['professional', 'punctual', 'friendly', 'clean'];
    const NEGATIVE_TAGS = ['late', 'rushed', 'unclear'];

    const getAvailableTags = (rating: number): string[] => {
      if (rating >= 4) return POSITIVE_TAGS;
      return [...POSITIVE_TAGS, ...NEGATIVE_TAGS];
    };

    it('shows only positive tags for high rating', () => {
      const tags = getAvailableTags(5);
      expect(tags).toEqual(POSITIVE_TAGS);
      expect(tags).not.toContain('late');
    });

    it('shows all tags for low rating', () => {
      const tags = getAvailableTags(2);
      expect(tags).toContain('late');
      expect(tags).toContain('professional');
    });
  });

  describe('Review validation', () => {
    const MAX_LENGTH = 500;

    const isValidReview = (text: string): boolean => {
      return text.length <= MAX_LENGTH;
    };

    it('accepts empty review', () => {
      expect(isValidReview('')).toBe(true);
    });

    it('accepts short review', () => {
      expect(isValidReview('خدمة رائعة')).toBe(true);
    });

    it('rejects too long review', () => {
      const long = 'أ'.repeat(501);
      expect(isValidReview(long)).toBe(false);
    });

    it('accepts max length review', () => {
      const max = 'أ'.repeat(500);
      expect(isValidReview(max)).toBe(true);
    });
  });

  describe('Rating submission validation', () => {
    const canSubmit = (overall: number): { ok: boolean; error?: string } => {
      if (overall === 0) return { ok: false, error: 'يرجى اختيار تقييم عام' };
      if (overall < 1 || overall > 5) return { ok: false, error: 'تقييم غير صالح' };
      return { ok: true };
    };

    it('requires overall rating', () => {
      const result = canSubmit(0);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('تقييم عام');
    });

    it('accepts valid ratings', () => {
      for (let i = 1; i <= 5; i++) {
        expect(canSubmit(i).ok).toBe(true);
      }
    });

    it('rejects out-of-range ratings', () => {
      expect(canSubmit(6).ok).toBe(false);
      expect(canSubmit(-1).ok).toBe(false);
    });
  });
});
