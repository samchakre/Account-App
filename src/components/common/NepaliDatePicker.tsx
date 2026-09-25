import React, { useEffect, useId, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Check,
} from 'lucide-react';
import {
  adToBs,
  bsDateToAdString,
  getDaysInNepaliMonth,
  getFirstDayOfNepaliMonth,
  getTodayNepaliDate,
  NEPALI_MONTHS_EN,
  NEPALI_MONTHS_NP,
  parseBsDateString,
  toDevanagariDigits,
} from '../../utils/nepaliDate';

interface NepaliDatePickerProps {
  id?: string;
  label?: string;
  value: string; // Stored as ISO AD string: 'YYYY-MM-DD'
  onChange: (adDateStr: string, bsDateStr: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  defaultMode?: 'BS' | 'AD';
  minYear?: number;
  maxYear?: number;
  compact?: boolean;
  placeholder?: string;
}

const WEEKDAY_NAMES_NP = ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिही', 'शुक्र', 'शनि'];

export const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  defaultMode = 'BS',
  minYear = 2070,
  maxYear = 2090,
  compact = false,
  placeholder,
}) => {
  const autoId = useId();
  const inputId = id || autoId;

  // Safe year boundaries (nepali-date-converter supports 2000 - 2090)
  const safeMinYear = Math.max(2000, minYear);
  const safeMaxYear = Math.min(2090, maxYear);

  const [mode, setMode] = useState<'BS' | 'AD'>(defaultMode);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Parse current value into B.S. details
  const todayDetails = getTodayNepaliDate();
  const currentBs = adToBs(value) || todayDetails;

  // Text state for manual typing in B.S. mode
  const [typeInputVal, setTypeInputVal] = useState<string>(currentBs.bsDateStr);
  const [typeError, setTypeError] = useState<string>('');

  // Internal view state for the calendar view
  const [viewYear, setViewYear] = useState<number>(currentBs.year);
  const [viewMonth, setViewMonth] = useState<number>(currentBs.month); // 1-12

  // Sync internal view when value changes from outside
  useEffect(() => {
    if (value) {
      const bs = adToBs(value);
      if (bs) {
        setViewYear(bs.year);
        setViewMonth(bs.month);
        setTypeInputVal(bs.bsDateStr);
        setTypeError('');
      }
    } else {
      setTypeInputVal('');
      setTypeError('');
    }
  }, [value]);

  // Handle selecting a specific Nepali day
  const handleSelectBsDate = (year: number, month: number, day: number) => {
    const adStr = bsDateToAdString(year, month, day);
    if (adStr) {
      const paddedMonth = String(month).padStart(2, '0');
      const paddedDay = String(day).padStart(2, '0');
      const bsStr = `${year}-${paddedMonth}-${paddedDay}`;
      setTypeInputVal(bsStr);
      setTypeError('');
      onChange(adStr, bsStr);
      setIsCalendarOpen(false);
    }
  };

  // Handle direct text typing of Nepali date (e.g. 2083-05-22 or २०८३-०५-२२)
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTypeInputVal(raw);

    if (!raw.trim()) {
      setTypeError('');
      if (!required) {
        onChange('', '');
      }
      return;
    }

    const parsed = parseBsDateString(raw);
    if (parsed) {
      const maxDays = getDaysInNepaliMonth(parsed.year, parsed.month - 1);
      if (parsed.date > maxDays) {
        setTypeError(`${NEPALI_MONTHS_NP[parsed.month - 1]} महिनामा ${toDevanagariDigits(maxDays)} दिन मात्र हुन्छन्`);
        return;
      }
      const adStr = bsDateToAdString(parsed.year, parsed.month, parsed.date);
      if (adStr) {
        setTypeError('');
        const paddedMonth = String(parsed.month).padStart(2, '0');
        const paddedDay = String(parsed.date).padStart(2, '0');
        const bsStr = `${parsed.year}-${paddedMonth}-${paddedDay}`;
        onChange(adStr, bsStr);
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
      }
    } else {
      // Partial typing - show light hint if 10 characters entered
      if (raw.length >= 10) {
        setTypeError('ढाँचा मिलेन (उदा: 2083-05-22)');
      } else {
        setTypeError('');
      }
    }
  };

  const handleTypeBlur = () => {
    // If input was left invalid, revert to last valid date
    if (typeInputVal && !parseBsDateString(typeInputVal)) {
      if (value) {
        const bs = adToBs(value);
        if (bs) {
          setTypeInputVal(bs.bsDateStr);
          setTypeError('');
        }
      } else {
        setTypeInputVal('');
        setTypeError('');
      }
    }
  };

  // Quick navigation: Previous Nepali Month
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => Math.max(safeMinYear, y - 1));
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  // Quick navigation: Next Nepali Month
  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => Math.min(safeMaxYear, y + 1));
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Jump to today
  const handleSetToday = () => {
    setViewYear(todayDetails.year);
    setViewMonth(todayDetails.month);
    handleSelectBsDate(todayDetails.year, todayDetails.month, todayDetails.date);
  };

  // Generate Year options
  const yearsList: number[] = [];
  for (let y = safeMinYear; y <= safeMaxYear; y++) {
    yearsList.push(y);
  }

  // Days calculations for current viewing month in the calendar modal
  const monthIndex = viewMonth - 1;
  const daysInCurrentMonth = getDaysInNepaliMonth(viewYear, monthIndex);
  const firstDayWeekday = getFirstDayOfNepaliMonth(viewYear, monthIndex);

  // Compact POS / Inline view
  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-xs font-medium text-[#8A8882] truncate">
              {label}
            </span>
          )}
          <button
            type="button"
            id={inputId}
            disabled={disabled}
            onClick={() => setIsCalendarOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#E6E4DF] hover:border-[#3E4A3D] text-[#3E4A3D] transition shadow-2xs group cursor-pointer"
            title="नेपाली पात्रो (Nepali Calendar)"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#3E4A3D]" />
            <span className="font-mono">{currentBs.bsDevanagariStr}</span>
            <span className="text-[10px] text-[#8A8882]">({currentBs.monthNameNp})</span>
          </button>
        </div>

        {/* Modal Calendar */}
        {renderCalendarModal()}
      </div>
    );
  }

  function renderCalendarModal() {
    if (!isCalendarOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        {/* Backdrop dismiss */}
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsCalendarOpen(false)}
        ></div>

        <div className="bg-white rounded-3xl shadow-2xl border border-[#E6E4DF] p-5 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150 text-[#2D2D2A]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#3E4A3D]/10 text-[#3E4A3D] flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#3E4A3D]">नेपाली पात्रो (वि.सं.)</h4>
                <p className="text-[11px] text-[#8A8882]">Bikram Sambat Calendar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="p-1.5 rounded-lg text-[#8A8882] hover:text-[#2D2D2A] hover:bg-[#F3F1ED] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Month & Year Selection Bar */}
          <div className="flex items-center justify-between gap-1.5 my-3.5 p-2 rounded-2xl bg-[#FAF9F6] border border-[#E6E4DF]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-xl text-[#3E4A3D] transition border border-transparent hover:border-[#E6E4DF] shadow-2xs cursor-pointer"
              title="अघिल्लो महिना (Previous Month)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              {/* Month Selector */}
              <select
                aria-label="महिना छान्नुहोस्"
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="px-2 py-1 text-xs font-bold text-[#3E4A3D] bg-white border border-[#E6E4DF] rounded-xl cursor-pointer"
              >
                {NEPALI_MONTHS_NP.map((mName, idx) => (
                  <option key={idx} value={idx + 1}>
                    {toDevanagariDigits(idx + 1)}. {mName} ({NEPALI_MONTHS_EN[idx]})
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                aria-label="वर्ष छान्नुहोस्"
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="px-2 py-1 text-xs font-mono font-bold text-[#3E4A3D] bg-white border border-[#E6E4DF] rounded-xl cursor-pointer"
              >
                {yearsList.map((yr) => (
                  <option key={yr} value={yr}>
                    {toDevanagariDigits(yr)} ({yr})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-xl text-[#3E4A3D] transition border border-transparent hover:border-[#E6E4DF] shadow-2xs cursor-pointer"
              title="पछिल्लो महिना (Next Month)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-[#8A8882] mb-2">
            {WEEKDAY_NAMES_NP.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-1 ${idx === 6 ? 'text-[#C97B5A] font-bold' : ''}`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank offset days */}
            {Array.from({ length: firstDayWeekday }, (_, i) => (
              <div key={`blank-${i}`} className="h-9"></div>
            ))}

            {/* Month days */}
            {Array.from({ length: daysInCurrentMonth }, (_, i) => {
              const d = i + 1;
              const isSelected =
                currentBs.year === viewYear &&
                currentBs.month === viewMonth &&
                currentBs.date === d;

              const isToday =
                todayDetails.year === viewYear &&
                todayDetails.month === viewMonth &&
                todayDetails.date === d;

              const weekday = (firstDayWeekday + i) % 7;
              const isSaturday = weekday === 6;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectBsDate(viewYear, viewMonth, d)}
                  className={`h-9 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3E4A3D] text-white font-bold shadow-xs ring-2 ring-[#3E4A3D]/30'
                      : isToday
                      ? 'bg-[#A7C4BC]/25 text-[#3E4A3D] font-bold border border-[#A7C4BC]/60 hover:bg-[#A7C4BC]/40'
                      : isSaturday
                      ? 'text-[#C97B5A] hover:bg-[#F3F1ED] font-semibold'
                      : 'text-[#2D2D2A] hover:bg-[#F3F1ED]'
                  }`}
                >
                  <span className="text-xs leading-none font-bold">
                    {toDevanagariDigits(d)}
                  </span>
                  <span className="text-[9px] opacity-60 leading-none mt-0.5 font-mono">
                    {d}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer with Today Jump & AD Date Summary */}
          <div className="mt-4 pt-3 border-t border-[#E6E4DF] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F1ED] hover:bg-[#E6E4DF] text-[#3E4A3D] font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>आज (Today)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-[#3E4A3D] hover:bg-[#2D362C] text-white font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>सकियो (Done)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Label and mode switcher */}
      <div className="flex items-center justify-between gap-2 mb-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="flex items-center bg-[#F3F1ED] p-0.5 rounded-full text-[10px] font-semibold border border-[#E6E4DF] shrink-0">
          <button
            type="button"
            onClick={() => setMode('BS')}
            className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              mode === 'BS'
                ? 'bg-[#3E4A3D] text-white shadow-2xs font-bold'
                : 'text-[#8A8882] hover:text-[#2D2D2A]'
            }`}
          >
            वि.सं. (B.S.)
          </button>
          <button
            type="button"
            onClick={() => setMode('AD')}
            className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              mode === 'AD'
                ? 'bg-[#3E4A3D] text-white shadow-2xs font-bold'
                : 'text-[#8A8882] hover:text-[#2D2D2A]'
            }`}
          >
            A.D.
          </button>
        </div>
      </div>

      {mode === 'BS' ? (
        /* NEPALI DATE (B.S.) ENTRY VIEW */
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {/* Direct Editable Input */}
            <div className="relative flex-1">
              <input
                type="text"
                id={inputId}
                disabled={disabled}
                required={required}
                value={typeInputVal}
                onChange={handleTypeChange}
                onBlur={handleTypeBlur}
                placeholder={placeholder || 'YYYY-MM-DD (e.g. 2083-05-22)'}
                className="w-full pl-3 pr-8 py-2 text-xs font-mono font-semibold border border-[#E6E4DF] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3E4A3D] text-[#2D2D2A]"
              />
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => setIsCalendarOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8A8882] hover:text-[#3E4A3D] transition cursor-pointer"
                title="पात्रो खोल्नुहोस् (Open Calendar)"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Calendar Popover Trigger Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsCalendarOpen(true)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#FDFCF9] hover:bg-[#F3F1ED] text-[#3E4A3D] border border-[#E6E4DF] hover:border-[#3E4A3D]/40 transition shadow-2xs shrink-0 cursor-pointer"
              title="नेपाली क्यालेन्डर (Open Bikram Sambat Calendar)"
            >
              पात्रो
            </button>
          </div>

          {/* Validation error if any */}
          {typeError && (
            <div className="text-[11px] text-rose-600 font-medium px-1">
              {typeError}
            </div>
          )}

          {/* Helper Preview Underneath */}
          <div className="flex items-center justify-between text-[11px] text-[#8A8882] px-1">
            <span className="truncate">
              {currentBs.monthNameNp} {toDevanagariDigits(currentBs.date)} • A.D.: <strong className="text-[#3E4A3D] font-mono">{currentBs.adDateStr}</strong>
            </span>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[#3E4A3D] hover:underline font-semibold flex items-center gap-1 shrink-0 ml-1 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> आज (Today)
            </button>
          </div>
        </div>
      ) : (
        /* GREGORIAN DATE (A.D.) ENTRY VIEW */
        <div className="space-y-1">
          <input
            type="date"
            id={inputId}
            required={required}
            disabled={disabled}
            value={value}
            onChange={(e) => {
              const newAd = e.target.value;
              const bs = adToBs(newAd);
              onChange(newAd, bs ? bs.bsDateStr : '');
            }}
            className="w-full px-3 py-2 text-xs border border-[#E6E4DF] rounded-xl focus:ring-2 focus:ring-[#3E4A3D] bg-white text-[#2D2D2A]"
          />
          {/* Corresponding Nepali date preview underneath */}
          <div className="flex items-center justify-between text-[11px] text-[#8A8882] px-1">
            <span className="truncate">
              वि.सं.: <strong className="text-[#3E4A3D] font-mono">{currentBs.bsDevanagariStr}</strong>{' '}
              ({currentBs.monthNameNp} {toDevanagariDigits(currentBs.date)})
            </span>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[#3E4A3D] hover:underline font-semibold flex items-center gap-1 shrink-0 ml-1 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> आज (Today)
            </button>
          </div>
        </div>
      )}

      {/* Render Modal Dialog Calendar */}
      {renderCalendarModal()}
    </div>
  );
};
