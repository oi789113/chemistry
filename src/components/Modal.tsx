import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
export function Modal({
  children,
  onClose,
  labelledBy,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  labelledBy: string;
  className: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,[tabindex="0"],summary',
        ) ?? [],
      ).filter((e) => !e.hasAttribute('disabled'));
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab') {
        const list = focusables(),
          first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('keydown', key, true);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </section>
    </div>,
    document.fullscreenElement ?? document.body,
  );
}
