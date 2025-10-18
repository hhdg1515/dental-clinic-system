import type { KBEntry } from '../knowledge/schema';
import { MIN_SCORE, getHitReasons, searchKB } from '../knowledge/loader';
import { auth } from '../../config/firebase';

type Locale = KBEntry['locale'];

interface InferRequest {
  locale: Locale;
  message: string;
  tags?: string[];
}

interface InferSource {
  id: string;
  title: string;
  locale: Locale;
}

interface InferResponse {
  text: string;
  sources?: InferSource[];
  toolUsed: 'kb' | 'fallback-quota';
  maxScore: number;
  hitsCount: number;
}

const buildFoundText = (locale: Locale, count: number): string => {
  if (locale === 'zh') {
    return count === 1 ? '为你找到 1 条相关内容。' : `为你找到 ${count} 条相关内容。`;
  }

  return count === 1 ? 'Found 1 relevant guide.' : `Found ${count} relevant guides.`;
};

const DAILY_QUOTA = 3;
const QUOTA_PREFIX = 'chat:generation-quota';

const getQuotaKey = (uid: string, date: Date): string => {
  const isoDate = date.toISOString().slice(0, 10);
  return `${QUOTA_PREFIX}:${uid}:${isoDate}`;
};

const readRemainingQuota = (uid: string): { key: string; remaining: number } => {
  if (typeof window === 'undefined') {
    return { key: '', remaining: DAILY_QUOTA };
  }

  const key = getQuotaKey(uid, new Date());
  const stored = window.localStorage.getItem(key);

  if (stored === null) {
    window.localStorage.setItem(key, String(DAILY_QUOTA));
    return { key, remaining: DAILY_QUOTA };
  }

  const parsed = Number(stored);
  if (!Number.isFinite(parsed)) {
    window.localStorage.setItem(key, String(DAILY_QUOTA));
    return { key, remaining: DAILY_QUOTA };
  }

  const normalised = Math.round(parsed);
  return {
    key,
    remaining: Math.min(Math.max(normalised, 0), DAILY_QUOTA)
  };
};

const storeRemainingQuota = (key: string, remaining: number) => {
  if (!key || typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, String(Math.min(Math.max(remaining, 0), DAILY_QUOTA)));
};

const buildQuotaPlaceholderText = (locale: Locale, remaining: number): string => {
  if (locale === 'zh') {
    return `未命中本地；若连网生成已启用，这里会给出更完整答案（剩余 ${remaining}/${DAILY_QUOTA}）`;
  }
  return `No local match; when online generation is enabled, you'll see a fuller answer here (remaining ${remaining}/${DAILY_QUOTA}).`;
};

const buildQuotaExhaustedText = (locale: Locale): string => {
  if (locale === 'zh') {
    return '今天的 AI 生成次数已用完，请明日再试或联系客服。';
  }
  return "You've reached today's AI generation limit. Please try again tomorrow or contact support.";
};

export const infer = async ({ locale, message, tags }: InferRequest): Promise<InferResponse> => {
  const { hits, maxScore, localesTried } = await searchKB(locale, message, { tags });

  if (import.meta.env.DEV) {
    console.debug('[chat] searchKB', {
      localeTried: localesTried,
      hitsCount: hits.length,
      maxScore,
      titles: hits.map((entry) => entry.title)
    });
  }

  const hasQualifiedReason = hits.some((entry) => {
    const reasons = getHitReasons(entry.id) ?? [];
    return reasons.some(
      (reason) =>
        reason.startsWith('tag-') ||
        reason.startsWith('title-') ||
        reason === 'dental-term'
    );
  });

  if (maxScore >= MIN_SCORE && hits.length >= 1 && hasQualifiedReason) {
    return {
      text: buildFoundText(locale, hits.length),
      sources: hits.map((entry) => ({
        id: entry.id,
        title: entry.title,
        locale: entry.locale
      })),
      toolUsed: 'kb',
      maxScore,
      hitsCount: hits.length
    };
  }

  const uid = auth.currentUser?.uid ?? 'anonymous';
  const { key, remaining } = readRemainingQuota(uid);

  if (remaining <= 0) {
    return {
      text: buildQuotaExhaustedText(locale),
      toolUsed: 'fallback-quota',
      maxScore,
      hitsCount: hits.length
    };
  }

  const nextRemaining = Math.max(remaining - 1, 0);
  storeRemainingQuota(key, nextRemaining);

  return {
    text: buildQuotaPlaceholderText(locale, nextRemaining),
    toolUsed: 'fallback-quota',
    maxScore,
    hitsCount: hits.length
  };
};
