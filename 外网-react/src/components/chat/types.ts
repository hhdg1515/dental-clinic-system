export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessageStatus = 'delivered' | 'pending' | 'error';

export interface ChatMessageSource {
  id: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
  status?: ChatMessageStatus;
  sources?: ChatMessageSource[];
}

export interface QuickReply {
  id: string;
  label: string;
  prompt: string;
}

export interface ChatState {
  isOpen: boolean;
  isBusy: boolean;
  messages: ChatMessage[];
}
