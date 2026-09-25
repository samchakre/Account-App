import pkg from 'nepali-date-converter';

// Handle both CJS and ESM exports cleanly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NepaliDateConstructor: any = (pkg as any).default || pkg;

export interface NepaliDateDetails {
  year: number;
  month: number; // 1-12
  date: number; // 1-32
  day: number; // 0 = Sunday, 1 = Monday, etc.
  bsDateStr: string; // "2083-05-22"
  bsDevanagariStr: string; // "२०८३-०५-२२"
  bsTextNp: string; // "२०८३ भाद्र २२, सोमबार"
  bsTextEn: string; // "2083 Bhadra 22, Monday"
  adDateStr: string; // "2026-09-07"
  adText: string; // "Monday, Sep 7, 2026"
  monthNameNp: string; // "भाद्र"
  monthNameEn: string; // "Bhadra"
  dayNameNp: string; // "सोमबार"
  dayNameEn: string; // "Monday"
}

export const NEPALI_MONTHS_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भाद्र',
  'आश्विन',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फाल्गुन',
  'चैत्र',
];

export const NEPALI_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const NEPALI_DAYS_NP = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहीबार',
  'शुक्रबार',
  'शनिबार',
];

export const NEPALI_DAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Converts Western digits 0-9 to Devanagari numerals ०-९
 */
export const toDevanagariDigits = (val: number | string): string => {
  const str = String(val);
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit, 10)]);
};

/**
 * Converts Devanagari numerals ०-९ to Western digits 0-9
 */
export const fromDevanagariDigits = (val: string): string => {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return val.replace(/[०-९]/g, (digit) => map[digit] || digit);
};

/**
 * Parses a B.S. date string (e.g. "2083-05-22", "2083/5/22", "२०८३-०५-२२") into year, month, date
 */
export const parseBsDateString = (
  bsStr?: string | null
): { year: number; month: number; date: number } | null => {
  if (!bsStr) return null;
  const normalized = fromDevanagariDigits(bsStr.trim());
  const match = normalized.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const date = parseInt(match[3], 10);

  if (year < 2000 || year > 2090 || month < 1 || month > 12 || date < 1 || date > 32) {
    return null;
  }
  return { year, month, date };
};

/**
 * Converts AD Date to detailed Nepali Date (Bikram Sambat)
 * Fully timezone-safe: parses "YYYY-MM-DD" at local noon to avoid UTC midnight day-shifts.
 */
export const adToBs = (dateInput?: string | Date | null): NepaliDateDetails | null => {
  if (!dateInput) return null;
  try {
    let d: Date;
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10) - 1;
        const dt = parseInt(match[3], 10);
        d = new Date(y, m, dt, 12, 0, 0); // Noon prevents any daylight savings or timezone shift
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput;
    }
    if (isNaN(d.getTime())) return null;

    const nd = new NepaliDateConstructor(d);

    const year = nd.getYear();
    const month = nd.getMonth() + 1; // 0-indexed in library -> convert to 1-12
    const date = nd.getDate();
    const day = nd.getDay(); // 0-6

    const paddedMonth = String(month).padStart(2, '0');
    const paddedDate = String(date).padStart(2, '0');
    const bsDateStr = `${year}-${paddedMonth}-${paddedDate}`;
    const bsDevanagariStr = `${toDevanagariDigits(year)}-${toDevanagariDigits(paddedMonth)}-${toDevanagariDigits(paddedDate)}`;

    const monthNameNp = NEPALI_MONTHS_NP[month - 1] || '';
    const monthNameEn = NEPALI_MONTHS_EN[month - 1] || '';
    const dayNameNp = NEPALI_DAYS_NP[day] || '';
    const dayNameEn = NEPALI_DAYS_EN[day] || '';

    const bsTextNp = `${toDevanagariDigits(year)} ${monthNameNp} ${toDevanagariDigits(date)}, ${dayNameNp}`;
    const bsTextEn = `${year} ${monthNameEn} ${date}, ${dayNameEn}`;

    // Timezone-safe AD Date string format YYYY-MM-DD
    const adYear = d.getFullYear();
    const adMonth = String(d.getMonth() + 1).padStart(2, '0');
    const adDate = String(d.getDate()).padStart(2, '0');
    const adDateStr = `${adYear}-${adMonth}-${adDate}`;

    const adText = d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return {
      year,
      month,
      date,
      day,
      bsDateStr,
      bsDevanagariStr,
      bsTextNp,
      bsTextEn,
      adDateStr,
      adText,
      monthNameNp,
      monthNameEn,
      dayNameNp,
      dayNameEn,
    };
  } catch {
    return null;
  }
};

/**
 * Gets today's Nepali Date details
 */
export const getTodayNepaliDate = (): NepaliDateDetails => {
  const details = adToBs(new Date());
  if (details) return details;

  // Fallback if unexpected error
  return {
    year: 2083,
    month: 5,
    date: 22,
    day: 1,
    bsDateStr: '2083-05-22',
    bsDevanagariStr: '२०८३-०५-२२',
    bsTextNp: '२०८३ भाद्र २२, सोमबार',
    bsTextEn: '2083 Bhadra 22, Monday',
    adDateStr: new Date().toISOString().split('T')[0],
    adText: new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    monthNameNp: 'भाद्र',
    monthNameEn: 'Bhadra',
    dayNameNp: 'सोमबार',
    dayNameEn: 'Monday',
  };
};

/**
 * Converts a BS Date (year, month 1-12, date 1-32) to AD Date
 */
export const bsToAd = (year: number, month: number, date: number): Date | null => {
  try {
    const nd = new NepaliDateConstructor(year, month - 1, date);
    return nd.toJsDate();
  } catch {
    return null;
  }
};

/**
 * Formats any date string into Nepali Bikram Sambat date
 * Default format: "२०८३-०५-२२" or English "2083-05-22"
 */
export const formatNepaliDate = (
  dateInput?: string | Date | null,
  options?: {
    format?: 'short' | 'standard' | 'full' | 'devanagari';
    language?: 'en' | 'np';
  }
): string => {
  if (!dateInput) return '—';
  const details = adToBs(dateInput);
  if (!details) return typeof dateInput === 'string' ? dateInput : '—';

  const format = options?.format || 'standard';
  const lang = options?.language || 'np';

  if (format === 'devanagari') {
    return details.bsDevanagariStr;
  }

  if (format === 'full') {
    return lang === 'np' ? details.bsTextNp : details.bsTextEn;
  }

  if (format === 'short') {
    return lang === 'np'
      ? `${details.monthNameNp} ${toDevanagariDigits(details.date)}`
      : `${details.monthNameEn} ${details.date}`;
  }

  // Standard format
  return lang === 'np'
    ? `${details.bsDevanagariStr} वि.सं.`
    : `${details.bsDateStr} B.S.`;
};

/**
 * Dual Date formatter: Displays both A.D. and B.S. dates
 * e.g. "Sep 7, 2026 (२०८३/०५/२२)"
 */
export const formatDateDual = (
  dateInput?: string | Date | null,
  preferBsFirst = false
): string => {
  if (!dateInput) return '—';
  const details = adToBs(dateInput);
  if (!details) {
    return typeof dateInput === 'string' ? dateInput : '—';
  }

  const adPart = details.adText;
  const bsPart = `${details.bsDevanagariStr} वि.सं.`;

  if (preferBsFirst) {
    return `${bsPart} (${adPart})`;
  }
  return `${adPart} (${bsPart})`;
};

/**
 * Calculates total number of days in a Nepali month for a specific year.
 * monthIndex is 0-11 (0 = Baisakh, 11 = Chaitra)
 */
export const getDaysInNepaliMonth = (year: number, monthIndex: number): number => {
  for (let d = 32; d >= 28; d--) {
    try {
      const nd = new NepaliDateConstructor(year, monthIndex, d);
      if (nd.getMonth() === monthIndex) {
        return d;
      }
    } catch {
      // Continue search
    }
  }
  return 30;
};

/**
 * Returns weekday (0 = Sunday, 1 = Monday, ... 6 = Saturday) for 1st of Nepali month
 */
export const getFirstDayOfNepaliMonth = (year: number, monthIndex: number): number => {
  try {
    const nd = new NepaliDateConstructor(year, monthIndex, 1);
    return nd.getDay();
  } catch {
    return 0;
  }
};

/**
 * Converts BS Year, Month (1-12), and Day (1-32) to ISO string "YYYY-MM-DD"
 * Fully timezone-safe: uses getAD() to avoid UTC midnight date shifts.
 */
export const bsDateToAdString = (year: number, month: number, date: number): string => {
  try {
    const nd = new NepaliDateConstructor(year, month - 1, date);
    const ad = typeof nd.getAD === 'function' ? nd.getAD() : null;
    if (ad && typeof ad.year === 'number') {
      const mm = String(ad.month + 1).padStart(2, '0');
      const dd = String(ad.date).padStart(2, '0');
      return `${ad.year}-${mm}-${dd}`;
    }
    const jsDate: Date = nd.toJsDate();
    const y = jsDate.getFullYear();
    const m = String(jsDate.getMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return '';
  }
};
