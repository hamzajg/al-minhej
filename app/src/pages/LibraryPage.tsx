import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Library, Lock, Search, Moon, Sun } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const SHELF_BOOKS = [
  { id: "bukhari", slug: "sahih-al-bukhari", ar: "صحيح البخاري", en: "Sahih al-Bukhari", authorAr: "الإمام البخاري", authorEn: "Imam al-Bukhari", total: "7,563", unitAr: "حديث", unitEn: "hadith", active: true },
  { id: "muslim", slug: "sahih-muslim", ar: "صحيح مسلم", en: "Sahih Muslim", authorAr: "الإمام مسلم", authorEn: "Imam Muslim", total: "7,500", unitAr: "حديث", unitEn: "hadith", active: true },
  { id: "sharh-arbain", slug: "sharh-al-arbain", ar: "شرح الأربعين النووية", en: "Sharh al-Arba'in", authorAr: "الإمام النووي", authorEn: "Imam an-Nawawi", total: "42", unitAr: "شرح", unitEn: "commentaries", active: true },
  { id: "jami-ulum", slug: "jami-al-ulum-wal-hikam", ar: "جامع العلوم والحكم", en: "Jami' al-'Ulum", authorAr: "ابن رجب", authorEn: "Ibn Rajab", total: "50", unitAr: "باب", unitEn: "chapters", active: true },
  { id: "fathalbari", slug: "fath-al-bari", ar: "فتح الباري", en: "Fath al-Bari", authorAr: "ابن حجر", authorEn: "Ibn Hajar", total: "9,200", unitAr: "صفحة", unitEn: "pages", active: true },
  { id: "tabaqat", slug: "al-tabaqat-al-kubra", ar: "الطبقات الكبرى", en: "Al-Tabaqat al-Kubra", authorAr: "ابن سعد", authorEn: "Ibn Sa'd", total: "4,250", unitAr: "ترجمة", unitEn: "biographies", active: true },
  { id: "bidayah", slug: "al-bidayah-wan-nihayah", ar: "البداية والنهاية", en: "Al-Bidayah wa'n-Nihayah", authorAr: "ابن كثير", authorEn: "Ibn Kathir", total: "14", unitAr: "مجلد", unitEn: "volumes", active: true },
];

export default function LibraryPage() {
  const { t, uiLang, dir, dark, setUiLang, toggleDark } = useSettings();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  };

  const openBook = (book: typeof SHELF_BOOKS[0]) => {
    if (!book.active) {
      showToast(t.bookNotOpen);
      return;
    }
    navigate(`/reading/book/${book.slug}/page/1`);
  };

  return (
    <div dir={dir} className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)] relative" style={{ fontFamily: uiLang === "ar" ? "'Cairo','Inter',sans-serif" : "'Inter',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUpLib { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform:translateY(0);} }
        @keyframes toastInLib { from { opacity:0; transform: translate(-50%,-8px);} to { opacity:1; transform: translate(-50%,0);} }
        .fade-up-lib { animation: fadeUpLib .45s ease both; }
        .book-card { transition: transform .2s, box-shadow .2s; }
        .book-card:hover { transform: translateY(-3px); }
        button:focus-visible { outline: 2px solid var(--color-gold); outline-offset: 2px; }
      `}</style>

      {/* HEADER matching prototype exactly */}
      <header className="h-14 flex items-center justify-between px-4 border-b shrink-0" style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--color-emerald)" }}>
            <span className="font-arabic text-[15px]" style={{ color: "var(--color-gold)" }}>ن</span>
          </div>
          <span className="font-display text-[17px] font-semibold" style={{ color: "var(--color-ink)" }}>{t.appName}</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-line)" }}>
            {(["ar", "en"] as const).map((l) => (
              <button key={l} onClick={() => setUiLang(l)}
                className="text-[11px] px-[9px] py-[7px] cursor-pointer border-none"
                style={{
                  fontFamily: l === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif",
                  background: uiLang === l ? "var(--color-emerald)" : "var(--color-panel-2)",
                  color: uiLang === l ? "#F4EFE2" : "var(--color-sub)",
                }}>
                {l === "ar" ? "AR" : "EN"}
              </button>
            ))}
          </div>
          <button onClick={toggleDark} aria-label="Toggle dark mode"
            className="w-8 h-8 rounded-lg grid place-items-center cursor-pointer border"
            style={{ background: "var(--color-panel-2)", borderColor: "var(--color-line)" }}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* LIBRARY SHELF matching prototype exactly */}
      <div className="fade-up-lib flex-1 overflow-y-auto px-6 py-[50px]">
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] mb-2.5" style={{ color: "var(--color-gold)", textTransform: uiLang === "en" ? "uppercase" : "none" }}>
              <Library size={13} /> {t.libraryShelfTag}
            </div>
            <h1 className="font-display text-[38px] font-semibold m-0" style={{ color: "var(--color-ink)" }}>{t.libraryShelfTitle}</h1>
          </div>

          <div className="flex items-center gap-[10px] px-4 py-[10px] mb-9 border rounded-xl" style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}>
            <Search size={15} className="shrink-0" style={{ color: "var(--color-sub)" }} />
            <input placeholder={t.searchPlaceholder} className="border-none outline-none bg-none flex-1 text-[13px] font-family-inherit" style={{ color: "var(--color-ink)" }} />
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {SHELF_BOOKS.map((book) => (
              <button key={book.id} onClick={() => openBook(book)} className="book-card"
                style={{ textAlign: "start", cursor: "pointer", border: "1px solid var(--color-line)", borderRadius: 14, background: "var(--color-panel)", padding: 0, overflow: "hidden", opacity: book.active ? 1 : 0.6 }}>
                <div className="h-[90px] flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, var(--color-emerald), color-mix(in srgb, var(--color-emerald) 80%, transparent))" }}>
                  <span className="font-arabic text-[22px]" style={{ color: "var(--color-gold)" }}>{book.ar.slice(0, 1)}</span>
                  {!book.active && (
                    <div className="absolute top-2 inset-inline-end-2 w-[22px] h-[22px] rounded-full grid place-items-center" style={{ background: "rgba(0,0,0,.35)" }}>
                      <Lock size={11} color="#fff" />
                    </div>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <div className="text-[12.5px] font-bold mb-1" style={{ lineHeight: 1.35, color: "var(--color-ink)" }}>{uiLang === "ar" ? book.ar : book.en}</div>
                  <div className="text-[10px] mb-1.5" style={{ color: "var(--color-sub)" }}>{uiLang === "ar" ? book.authorAr : book.authorEn}</div>
                  <div className="text-[9.5px]" style={{ color: "var(--color-gold)" }}>{book.total} {uiLang === "ar" ? book.unitAr : book.unitEn}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-[66px] inset-x-1/2 -translate-x-1/2 z-[99] px-[18px] py-[10px] rounded-full text-xs whitespace-nowrap animate-[toastInLib_0.25s_ease]"
          style={{ background: "var(--color-ink)", color: "var(--color-bg)", boxShadow: "0 12px 30px -10px rgba(0,0,0,.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
