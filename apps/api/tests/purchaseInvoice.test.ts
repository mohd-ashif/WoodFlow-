import { describe, it, expect, vi } from 'vitest';
import { numberToIndianWords } from '../src/utils/numberToWords.js';
import { resolvePublicShareToken } from '../src/modules/purchases/purchase-share.service.js';

describe('Purchase Invoice & Document Sharing System', () => {
  describe('numberToIndianWords', () => {
    it('should format exact Indian Lakhs/Crores numbering format correctly', () => {
      expect(numberToIndianWords(45429)).toBe('Indian Rupees Forty-Five Thousand Four Hundred Twenty-Nine Only');
      expect(numberToIndianWords(150000)).toBe('Indian Rupees One Lakh Fifty Thousand Only');
      expect(numberToIndianWords(25000000)).toBe('Indian Rupees Two Crore Fifty Lakh Only');
    });

    it('should handle decimals with Paise correctly', () => {
      expect(numberToIndianWords(1250.50)).toBe('Indian Rupees One Thousand Two Hundred Fifty and Fifty Paise Only');
      expect(numberToIndianWords(0)).toBe('Zero Rupees Only');
    });
  });

  describe('resolvePublicShareToken', () => {
    it('should throw error for non-existent or invalid token', () => {
      expect(() => resolvePublicShareToken('invalid-token-12345')).toThrow('Shared document link expired or invalid');
    });
  });
});
