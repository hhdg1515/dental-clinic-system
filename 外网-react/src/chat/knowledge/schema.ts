export interface KBEntry {
  id: string;
  title: string;
  locale: 'en' | 'zh';
  tags: string[];
  excerpt: string;
  body: string;
  updatedAt: string;
}

