import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The center reading canvas is never replaced on compact screens — instead,
 * secondary panes (chain of narration, study tabs) slide up as an overlay
 * on top of it. Closing the sheet drops the reader back exactly where they
 * were, because the canvas underneath never unmounted.
 */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const startY = useRef<number | null>(null);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bottom-14 bg-black/50 z-[70]"
          aria-hidden="true"
        />
      )}
      <div
        className="lesson-scroller fixed inset-x-0 bottom-14 z-[75] rounded-t-[20px] border-t border-[var(--color-line)] bg-[var(--color-bg)] shadow-[0_-12px_34px_-12px_rgba(0,0,0,.35)] overflow-y-auto"
        style={{
          height: "72vh",
          maxHeight: "72vh",
          transform: open ? "translateY(0)" : "translateY(110%)",
          transition: "transform .32s cubic-bezier(.32,.72,0,1)",
          padding: "10px 18px 18px",
        }}
      >
        <div className="mb-2.5">
          <div
            onTouchStart={(e) => {
              startY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 60) {
                onClose();
              }
              startY.current = null;
            }}
            className="w-9 h-1 rounded-full bg-[var(--color-line)] mx-auto mb-3 cursor-grab"
          />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[var(--color-ink)]">{title}</span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded-full grid place-items-center bg-[var(--color-panel-2)] border border-[var(--color-line)] text-[var(--color-sub)]"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
