import type { KBEntry } from './schema';

type Locale = KBEntry['locale'];

interface SearchOptions {
  tags?: string[];
  limit?: number;
}

const KB_BASE_PATH = '/kb';
const DEFAULT_LIMIT = 3;

const cache = new Map<Locale, Promise<KBEntry[]>>();

const normalise = (value: string): string => value.toLowerCase();

const intersects = (source: string[], targets: string[]): boolean =>
  targets.some((target) => source.includes(normalise(target)));

export const loadKB = async (locale: Locale): Promise<KBEntry[]> => {
  if (!cache.has(locale)) {
    const loader = fetch(`${KB_BASE_PATH}/${locale}.json`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load KB for locale ${locale}`);
        }
        return response.json() as Promise<KBEntry[]>;
      })
      .then((entries) => entries.filter((entry) => entry.locale === locale));

    cache.set(locale, loader);
  }

  return cache.get(locale)!;
};

export const searchKB = async (
  locale: Locale,
  query: string,
  options: SearchOptions = {}
): Promise<KBEntry[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const { tags = [], limit = DEFAULT_LIMIT } = options;
  const entries = await loadKB(locale);

  const keywords = normalise(trimmedQuery)
    .split(/\s+/)
    .filter(Boolean);

  const taggedKeywords = keywords.filter((keyword) => keyword.length > 2);

  const scored = entries
    .map((entry) => {
      const entryTags = entry.tags.map(normalise);
      if (tags.length && !intersects(entryTags, tags)) {
        return null;
      }

      const haystack = normalise(`${entry.title} ${entry.excerpt} ${entry.body}`);
      let score = 0;

      for (const keyword of keywords) {
        if (haystack.includes(keyword)) {
          score += 3;
        }
      }

      for (const tag of taggedKeywords) {
        if (entryTags.includes(tag)) {
          score += 2;
        }
      }

      return { entry, score };
    })
    .filter((result): result is { entry: KBEntry; score: number } => {
      if (!result) {
        return false;
      }
      return result.score > 0;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit, 1))
    .map(({ entry }) => entry);

  return scored;
};
