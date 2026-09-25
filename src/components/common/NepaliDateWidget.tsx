import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Clock, 
  ChevronDown,
  X
} from 'lucide-react';
import { 
  getTodayNepaliDate, 
  adToBs, 
  bsToAd, 
  toDevanagariDigits, 
  NEPALI_MONTHS_NP, 
  NEPALI_MONTHS_EN,
  NepaliDateDetails 
} from '../../utils/nepaliDate';

export const NepaliDateWidget: React.FC = () => {
  const [today, setToday] = useState<NepaliDateDetails>(getTodayNepaliDate());
  const [isOpen, setIsOpen] = useState(false);
  const [activeConverterTab, setActiveConverterTab] = useState<'adToBs' | 'bsToAd'>('adToBs');
  
  // AD to BS State
  const [inputAdDate, setInputAdDate] = useState<string>(today.adDateStr);
  const [convertedBsResult, setConvertedBsResult] = useState<NepaliDateDetails | null>(today);

  // BS to AD State
  const [inputBsYear, setInputBsYear] = useState<number>(today.year);
  const [inputBsMonth, setInputBsMonth] = useState<number>(today.month);
  const [inputBsDate, setInputBsDate] = useState<number>(today.date);
  const [convertedAdResult, setConvertedAdResult] = useState<string | null>(today.adDateStr);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Update date periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setToday(getTodayNepaliDate());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle AD to BS conversion change
  const handleAdChange = (val: string) => {
    setInputAdDate(val);
    if (!val) {
      setConvertedBsResult(null);
      return;
    }
    const res = adToBs(val);
    setConvertedBsResult(res);
  };

  // Handle BS to AD conversion change
  const handleBsConversion = (y: number, m: number, d: number) => {
    const res = bsToAd(y, m, d);
    if (res && !isNaN(res.getTime())) {
      setConvertedAdResult(res.toISOString().split('T')[0]);
    } else {
      setConvertedAdResult(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="relative">
      {/* Clickable Header Date Pill */}
      <button
        id="nepali-date-pill-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#FDFCF9] hover:bg-[#F3F1ED] text-[#2D2D2A] border border-[#E6E4DF] hover:border-[#3E4A3D]/40 rounded-full transition-all shadow-xs group cursor-pointer"
        title="Nepali Date (Bikram Sambat वि.सं.) & Date Converter"
      >
        <div className="w-6 h-6 rounded-full bg-[#3E4A3D]/10 text-[#3E4A3D] flex items-center justify-center shrink-0 group-hover:bg-[#3E4A3D] group-hover:text-white transition-colors">
          <CalendarDays className="w-3.5 h-3.5" />
        </div>

        <div className="text-left flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#3E4A3D] tracking-tight">
              वि.सं. {today.bsDevanagariStr}
            </span>
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase hidden xl:inline">
              ({today.monthNameNp})
            </span>
          </div>
          <div className="text-[10px] text-[#8A8882] flex items-center gap-1 leading-none">
            <span>{today.dayNameNp}</span>
            <span>•</span>
            <span className="truncate max-w-[90px]">{today.adText}</span>
          </div>
        </div>

        <ChevronDown className="w-3 h-3 text-[#8A8882] opacity-70 group-hover:opacity-100 transition" />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6E4DF] rounded-3xl shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-150 text-[#2D2D2A]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#3E4A3D]/10 text-[#3E4A3D] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#3E4A3D]">
                    Nepali Calendar (नेपाली पात्रो)
                  </h4>
                  <p className="text-[11px] text-[#8A8882]">Bikram Sambat (वि.सं.) & Date Tool</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#8A8882] hover:text-[#2D2D2A] hover:bg-[#F3F1ED] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Today's Highlight Box */}
            <div className="mt-3.5 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E6E4DF]/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8882]">
                  आजको मिति (Today's Date)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3E4A3D] text-white">
                  LIVE B.S.
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-lg font-serif font-bold text-[#3E4A3D]">
                    {today.bsTextNp}
                  </div>
                  <div className="text-xs text-[#8A8882] font-medium">
                    {today.bsTextEn}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(`${today.bsDevanagariStr} वि.सं.`)}
                  className="p-1.5 rounded-lg bg-white border border-[#E6E4DF] text-stone-600 hover:text-[#3E4A3D] hover:bg-stone-50 transition shadow-2xs cursor-pointer"
                  title="Copy Nepali Date"
                >
                  {copiedText === `${today.bsDevanagariStr} वि.सं.` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-[#E6E4DF]/60 flex items-center justify-between text-xs text-[#8A8882]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#3E4A3D]" />
                  <span>English (A.D.): <strong className="text-stone-800">{today.adDateStr}</strong></span>
                </div>
                <span>{today.adText.split(',')[0]}</span>
              </div>
            </div>

            {/* Dual Converter Tool */}
            <div className="mt-4 pt-3 border-t border-[#E6E4DF]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#3E4A3D]" />
                  <span>Date Converter (मिति रूपान्तरण)</span>
                </div>

                {/* Tabs */}
                <div className="flex items-center p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setActiveConverterTab('adToBs')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      activeConverterTab === 'adToBs'
                        ? 'bg-white text-[#3E4A3D] shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    AD → BS
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConverterTab('bsToAd')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      activeConverterTab === 'bsToAd'
                        ? 'bg-white text-[#3E4A3D] shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    BS → AD
                  </button>
                </div>
              </div>

              {activeConverterTab === 'adToBs' ? (
                /* AD TO BS TAB */
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Select English Date (A.D.)
                    </label>
                    <input
                      type="date"
                      value={inputAdDate}
                      onChange={(e) => handleAdChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#3E4A3D]"
                    />
                  </div>

                  {convertedBsResult ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          Bikram Sambat (वि.सं.)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(convertedBsResult.bsDevanagariStr)}
                          className="text-emerald-700 hover:text-emerald-900 text-[10px] font-semibold flex items-center gap-1"
                        >
                          {copiedText === convertedBsResult.bsDevanagariStr ? (
                            <>
                              <Check className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-bold text-stone-900 text-sm">
                        {convertedBsResult.bsTextNp}
                      </div>
                      <div className="text-[11px] text-stone-600 font-mono">
                        {convertedBsResult.bsDateStr} B.S. ({convertedBsResult.bsDevanagariStr})
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-600 p-2 bg-rose-50 rounded-xl">
                      Invalid date selected.
                    </div>
                  )}
                </div>
              ) : (
                /* BS TO AD TAB */
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                        Year (वर्ष)
                      </label>
                      <input
                        type="number"
                        min={2000}
                        max={2090}
                        value={inputBsYear}
                        onChange={(e) => {
                          const y = parseInt(e.target.value, 10) || 2083;
                          setInputBsYear(y);
                          handleBsConversion(y, inputBsMonth, inputBsDate);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                        Month (महिना)
                      </label>
                      <select
                        value={inputBsMonth}
                        onChange={(e) => {
                          const m = parseInt(e.target.value, 10) || 1;
                          setInputBsMonth(m);
                          handleBsConversion(inputBsYear, m, inputBsDate);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
                      >
                        {NEPALI_MONTHS_NP.map((mName, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {idx + 1}. {mName} ({NEPALI_MONTHS_EN[idx]})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                        Day (गते)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        value={inputBsDate}
                        onChange={(e) => {
                          const d = parseInt(e.target.value, 10) || 1;
                          setInputBsDate(d);
                          handleBsConversion(inputBsYear, inputBsMonth, d);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  {convertedAdResult ? (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                          Gregorian Equivalent (A.D.)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(convertedAdResult)}
                          className="text-blue-700 hover:text-blue-900 text-[10px] font-semibold flex items-center gap-1"
                        >
                          {copiedText === convertedAdResult ? (
                            <>
                              <Check className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-bold text-stone-900 text-sm">
                        {new Date(convertedAdResult).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-stone-600 font-mono">
                        {convertedAdResult}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-600 p-2 bg-rose-50 rounded-xl">
                      Invalid BS date combination.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Tip */}
            <div className="mt-3 pt-2 text-center text-[10px] text-[#8A8882]">
              Inland Revenue Department (IRD) Nepal compliant date format (वि.सं.)
            </div>
          </div>
        </>
      )}
    </div>
  );
};
