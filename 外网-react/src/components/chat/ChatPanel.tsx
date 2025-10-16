import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from './ChatProvider';
import type { ChatMessage, QuickReply } from './types';
import { useLanguage } from '../../context/LanguageContext';

const suggestionSeeds: QuickReply[] = [
  {
    id: 'prep',
    label: 'Visit preparation',
    prompt: 'What should I bring to my appointment?'
  },
  {
    id: 'postcare',
    label: 'Aftercare',
    prompt: 'How do I care for my teeth after a root canal?'
  },
  {
    id: 'insurance',
    label: 'Insurance',
    prompt: 'Do you accept PPO insurance plans?'
  }
];

const SUGGESTION_INTERVAL_MS = 6000;

const formatTimestamp = (value: Date) =>
  value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const ChatPanel = () => {
  const { isOpen, closeChat: close, messages, sendUserMessage, isBusy } = useChat();
  const { lang } = useLanguage();

  const [draft, setDraft] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendButtonRef = useRef<HTMLButtonElement | null>(null);

  const referencesLabel = lang === 'zh' ? '参考资料' : 'References';
  const transcriptLabel = lang === 'zh' ? '聊天记录' : 'Chat transcript';
  const chatLabel = lang === 'zh' ? '会员礼宾聊天' : 'Member concierge chat';
  const basePlaceholder = lang === 'zh' ? '输入你的问题…' : 'Type your message…';
  const closeLabel = lang === 'zh' ? '关闭聊天' : 'Close chat';
  const messageLabel = lang === 'zh' ? '输入消息' : 'Enter message';
  const suggestionPrompts = useMemo(() => suggestionSeeds.map((item) => item.prompt), []);
  const composedMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setActiveSuggestionIndex(0);
      setCarouselPaused(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTarget = closeButtonRef.current ?? textAreaRef.current;
    focusTarget?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (
      !isOpen ||
      carouselPaused ||
      draft.trim().length > 0 ||
      suggestionPrompts.length <= 1 ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSuggestionIndex((previous) => (previous + 1) % suggestionPrompts.length);
    }, SUGGESTION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [carouselPaused, draft, isOpen, suggestionPrompts.length]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendUserMessage(draft);
    setDraft('');
    setCarouselPaused(true);
  };

  const handleFocus = () => setCarouselPaused(true);
  const handleBlur = () => {
    if (!draft.trim()) {
      setCarouselPaused(false);
    }
  };

  const placeholder =
    draft.trim().length > 0 || carouselPaused
      ? ''
      : suggestionPrompts[activeSuggestionIndex] || basePlaceholder;

  const renderBubble = (message: ChatMessage) => {
    const createdAt = message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt);
    const baseBubble =
      'max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-elevationSm transition duration-200';

    if (message.role === 'user') {
      return (
        <div className="flex flex-col items-end gap-2">
          <div className={`${baseBubble} bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white`}>
            {message.content}
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
            {formatTimestamp(createdAt)}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start gap-2">
        <div className="w-auto max-w-[48ch] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-800 shadow-md md:max-w-[60ch] xl:max-w-[68ch]">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {message.sources?.length ? (
            <div className="mt-2 border-t border-neutral-200/60 pt-2" aria-label={referencesLabel}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {referencesLabel}
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-600">
                {message.sources.map((source) => (
                  <li key={source.id} className="truncate" title={source.title}>
                    {source.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
          {formatTimestamp(createdAt)}
        </span>
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[55] bg-black/40 md:hidden"
        aria-hidden="true"
      />
      <section
        className="fixed inset-0 z-[60] flex h-screen w-screen flex-col overflow-hidden bg-white/95 p-4 text-neutral-900 shadow-elevationLg backdrop-blur-xl md:inset-y-0 md:inset-x-auto md:left-0 md:right-auto md:h-auto md:w-[56vw] md:max-w-[960px] md:rounded-3xl md:bg-white/10 md:p-6 md:ring-1 md:ring-white/20 md:shadow-2xl md:pointer-events-auto xl:w-[52vw]"
        role="dialog"
        aria-modal="true"
        aria-label={chatLabel}
      >
        <span
          tabIndex={0}
          className="absolute h-0 w-0 p-0"
          onFocus={() => {
            (sendButtonRef.current ?? closeButtonRef.current)?.focus();
          }}
        />

        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-2xl bg-white/90 px-4 py-3 text-neutral-900 shadow-sm md:bg-white/70 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/10 text-neutral-700">
              <i className="fas fa-robot text-lg" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                VIP Exclusive
              </p>
              <h2 className="font-display text-lg text-neutral-900">Member Concierge</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            aria-label={closeLabel}
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white/85 p-4 shadow-inner md:bg-white/65">
          <div className="flex flex-1 min-h-0 flex-col">
            <div
              className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2"
              aria-live="polite"
              aria-label={transcriptLabel}
            >
              {composedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {renderBubble(message)}
                </div>
              ))}
              <div className="pb-6 md:pb-4" aria-hidden="true" />
            </div>

            <div className="flex-shrink-0 pt-3">
              <div className="rounded-2xl border border-neutral-200 bg-white/85 p-3 shadow-elevationSm backdrop-blur-sm md:bg-white/80">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSend();
                  }}
                  className="flex flex-col gap-2"
                >
                  <label htmlFor="chat-entry" className="sr-only">
                    {messageLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <textarea
                      id="chat-entry"
                      ref={textAreaRef}
                      className="min-h-[44px] flex-1 resize-none rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                      placeholder={placeholder || basePlaceholder}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      ref={sendButtonRef}
                      type="submit"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 ring-1 ring-neutral-300 transition hover:text-neutral-900 hover:ring-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!draft.trim() || isBusy}
                    >
                      <i className="fas fa-paper-plane text-xs" aria-hidden="true" />
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>

        <span
          tabIndex={0}
          className="absolute h-0 w-0 p-0"
          onFocus={() => {
            (closeButtonRef.current ?? textAreaRef.current)?.focus();
          }}
        />
      </section>
    </>
  );
};
