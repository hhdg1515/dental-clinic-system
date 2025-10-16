import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AppShellProps {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export const AppShell = ({ title, backHref = '/', onBack, actions, children }: AppShellProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(backHref);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            aria-label="Go back"
          >
            <i className="fas fa-arrow-left text-sm" aria-hidden="true" />
          </button>
          {title ? (
            <h1 className="flex-1 text-center text-sm font-semibold uppercase tracking-[0.3em] text-neutral-600">
              {title}
            </h1>
          ) : (
            <span className="flex-1" />
          )}
          <div className="flex h-10 w-10 items-center justify-center">
            {actions}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
