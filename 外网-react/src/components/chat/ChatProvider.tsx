import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage, ChatState } from './types';
import { useLanguage } from '../../context/LanguageContext';
import { infer } from '../../chat/providers/adapter';
import { useLocation } from 'react-router-dom';

interface ChatContextValue extends ChatState {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const createWelcomeMessage = (): ChatMessage => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content:
    'Hi there! I am your dental concierge. Ask me about treatments, post-visit care, or anything about the clinic. How can I help you today?',
  createdAt: new Date(),
  status: 'delivered'
});

const createInitialState = (isOpen = false): ChatState => ({
  isOpen,
  isBusy: false,
  messages: [createWelcomeMessage()]
});

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { lang } = useLanguage();
  const location = useLocation();
  const [state, setState] = useState<ChatState>(() => createInitialState());

  const openChat = useCallback(() => {
    setState(() => createInitialState(true));
  }, []);

  const closeChat = useCallback(() => {
    setState(() => createInitialState());
  }, []);

  const toggleChat = useCallback(() => {
    setState((prev) => (prev.isOpen ? createInitialState() : createInitialState(true)));
  }, []);

  const handleAssistantReply = useCallback(
    async (userInput: string) => {
      try {
        const response = await infer({ locale: lang, message: userInput });
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.text,
          createdAt: new Date(),
          status: 'delivered',
          sources: response.sources
        };

        setState((prev) => ({
          ...prev,
          isBusy: false,
          messages: [...prev.messages, assistantMessage]
        }));
      } catch (_error) {
        const fallbackText =
          lang === 'zh'
            ? '目前遇到一点问题，请稍后再试。'
            : 'Something went wrong - please try again shortly.';

        const failedMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fallbackText,
          createdAt: new Date(),
          status: 'error'
        };

        setState((prev) => ({
          ...prev,
          isBusy: false,
          messages: [...prev.messages, failedMessage]
        }));
      }
    },
    [lang]
  );

  const sendUserMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
      status: 'delivered'
    };

    setState((prev) => ({
      ...prev,
      isBusy: true,
      messages: [...prev.messages, newMessage]
    }));

    void handleAssistantReply(newMessage.content);
  }, [handleAssistantReply]);

  const addAssistantMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      createdAt: new Date(),
      status: 'delivered'
    };

    setState((prev) => ({
      ...prev,
      isBusy: false,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState((prev) => createInitialState(prev.isOpen));
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!state.isOpen) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeChat();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.isOpen, closeChat]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.classList.toggle('overflow-hidden', state.isOpen);
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [state.isOpen]);

  useEffect(() => {
    setState((prev) => (prev.isOpen ? createInitialState() : prev));
  }, [location.pathname]);

  const value = useMemo<ChatContextValue>(
    () => ({
      ...state,
      openChat,
      closeChat,
      toggleChat,
      sendUserMessage,
      addAssistantMessage,
      clearChat
    }),
    [state, openChat, closeChat, toggleChat, sendUserMessage, addAssistantMessage, clearChat]
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
      <ChatPanel />
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
