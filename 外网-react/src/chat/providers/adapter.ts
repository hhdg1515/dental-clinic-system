import type { KBEntry } from '../knowledge/schema';
import { searchKB } from '../knowledge/loader';

type Locale = KBEntry['locale'];

interface InferRequest {
  locale: Locale;
  message: string;
  tags?: string[];
}

interface InferSource {
  id: string;
  title: string;
}

interface InferResponse {
  text: string;
  sources?: InferSource[];
}

const buildFoundText = (locale: Locale, count: number): string => {
  if (locale === 'zh') {
    return count === 1
      ? '为你找到 1 条相关内容。'
      : `为你找到 ${count} 条相关内容。`;
  }

  return count === 1 ? 'Found 1 relevant guide.' : `Found ${count} relevant guides.`;
};

const buildFallbackText = (locale: Locale): string =>
  locale === 'zh'
    ? '我目前没有相关资料，会转交团队尽快回复你。'
    : "I don't have that information yet, but I'll flag it for our team.";

export const infer = async ({ locale, message, tags }: InferRequest): Promise<InferResponse> => {
  const results = await searchKB(locale, message, { tags });

  if (results.length === 0) {
    return { text: buildFallbackText(locale) };
  }

  return {
    text: buildFoundText(locale, results.length),
    sources: results.map((entry) => ({
      id: entry.id,
      title: entry.title
    }))
  };
};

