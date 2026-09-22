/**
 * Converts a numeric currency amount into Indian English Words.
 * e.g., 45429.50 -> "Indian Rupees Forty-Five Thousand Four Hundred Twenty-Nine and Fifty Paise Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ONES[num];
  const ten = Math.floor(num / 10);
  const one = num % 10;
  return `${TENS[ten]}${one > 0 ? '-' + ONES[one] : ''}`;
}

export function numberToIndianWords(amount: number, currencySymbol: string = 'INR'): string {
  if (isNaN(amount) || amount < 0) return 'Zero Rupees Only';

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';

  let words = '';

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundred = Math.floor(remainder / 100);
  const tensAndOnes = remainder % 100;

  if (crore > 0) {
    words += `${convertLessThanThousand(crore)} Crore `;
  }

  if (lakh > 0) {
    words += `${convertLessThanThousand(lakh)} Lakh `;
  }

  if (thousand > 0) {
    words += `${convertLessThanThousand(thousand)} Thousand `;
  }

  if (hundred > 0) {
    words += `${ONES[hundred]} Hundred `;
  }

  if (tensAndOnes > 0) {
    words += `${convertLessThanThousand(tensAndOnes)} `;
  }

  words = words.trim();
  const currencyName = currencySymbol === 'INR' ? 'Indian Rupees' : 'Rupees';

  let result = `${currencyName} ${words || 'Zero'}`;

  if (decimalPart > 0) {
    result += ` and ${convertLessThanThousand(decimalPart)} Paise`;
  }

  return `${result} Only`;
}
