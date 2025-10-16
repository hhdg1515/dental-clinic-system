import { useMemo } from 'react';
import { useChat } from './ChatProvider';

interface ChatFloatingButtonProps {
  isEnabled: boolean;
  showVipBadge?: boolean;
}

export const ChatFloatingButton = ({ isEnabled, showVipBadge = false }: ChatFloatingButtonProps) => {
  const { toggleChat, isOpen } = useChat();

  const buttonClasses = useMemo(() => {
    const base =
      'fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full shadow-elevationLg transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 md:hidden';
    if (!isEnabled) {
      return `${base} cursor-not-allowed bg-neutral-400 text-white opacity-70`;
    }

    const gradient = isOpen
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-400'
      : 'bg-gradient-to-br from-brand-primary to-brand-primaryDark';
    return `${base} ${gradient} text-white hover:-translate-y-1 hover:shadow-elevationLg`;
  }, [isEnabled, isOpen]);

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={() => (isEnabled ? toggleChat() : undefined)}
      aria-label="Open chat assistant"
      disabled={!isEnabled}
    >
      <i className={`fas ${isOpen ? 'fa-times' : 'fa-comments'} text-xl`} aria-hidden="true" />
      {showVipBadge && (
        <span className="absolute -top-2 -right-2 rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-amber-400 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-neutral-800 shadow-elevationSm">
          VIP
        </span>
      )}
    </button>
  );
};
