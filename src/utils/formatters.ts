import { PaymentStatus, POStatus, SalesOrderStatus } from '../types';
export {
  adToBs,
  getTodayNepaliDate,
  formatNepaliDate,
  formatDateDual,
  toDevanagariDigits,
  bsToAd,
} from './nepaliDate';

export const formatCurrency = (amount: number | undefined | null, symbol = 'Rs. '): string => {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  // South Asian/Nepali numbering (lakhs & crores) or clean standard localized format
  const formatted = val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
};

/**
 * Converts a numeric amount to English/Nepali words for standard Tax Invoices
 */
export const numberToWordsNepali = (num: number): string => {
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tensMultiple = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertTwoDigits = (n: number): string => {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return twoDigits[n - 10];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tensMultiple[ten] + (unit ? ' ' + singleDigits[unit] : '');
  };

  const convertThreeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (rest > 0) res += ' and ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let words = '';
  let remaining = integerPart;

  // Crores (1,00,00,000)
  const crore = Math.floor(remaining / 10000000);
  if (crore > 0) {
    words += convertThreeDigits(crore) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs (1,00,000)
  const lakh = Math.floor(remaining / 100000);
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands (1,000)
  const thousand = Math.floor(remaining / 1000);
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
    remaining %= 1000;
  }

  // Hundreds & Below
  if (remaining > 0) {
    words += convertThreeDigits(remaining) + ' ';
  }

  words = words.trim() ? words.trim() + ' Rupees' : 'Zero Rupees';

  if (decimalPart > 0) {
    words += ' and ' + convertTwoDigits(decimalPart) + ' Paisa';
  }

  return words + ' Only';
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const getPaymentStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'partial':
      return {
        label: 'Partial',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'unpaid':
    default:
      return {
        label: 'Unpaid',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
  }
};

export const getPOStatusBadge = (status: POStatus) => {
  switch (status) {
    case 'received':
      return {
        label: 'Received',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'partially_received':
      return {
        label: 'Partially Recv',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'ordered':
      return {
        label: 'Ordered',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'draft':
      return {
        label: 'Draft',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

export const getSalesStatusBadge = (status: SalesOrderStatus) => {
  switch (status) {
    case 'fulfilled':
      return {
        label: 'Fulfilled',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'draft':
      return {
        label: 'Draft',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

export const exportToCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = typeof cell === 'object' ? JSON.stringify(cell) : String(cell);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
