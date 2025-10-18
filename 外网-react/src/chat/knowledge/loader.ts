import type { KBEntry } from './schema';

type Locale = KBEntry['locale'];

interface SearchOptions {
  tags?: string[];
  limit?: number;
}

interface SearchResult {
  hits: KBEntry[];
  maxScore: number;
  localesTried: Locale[];
}

type ScoredEntry = {
  entry: KBEntry;
  score: number;
  reasons: string[];
  tagOverlap: number;
  titleOverlap: number;
  domainGate: boolean;
};

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const KB_BASE_PATH = '/kb';

export const MIN_SCORE = 0.7;
const TOP_N = 3;
const CROSS_LOCALE_PENALTY = 0.95;
const SCORE_EPSILON = 1e-4;

const BODY_SCORE_STEP = 0.15; // retained for potential future use
const BODY_SCORE_CAP = 0; // zero out body-only matches

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'make',
  'of',
  'on',
  'or',
  'tell',
  'that',
  'the',
  'them',
  'this',
  'to',
  'today',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'would',
  'you',
  'your',
  'am',
  'be',
  'about',
  'please',
  'could',
  'should',
  'fried',
  'chicken',
  'day',
  'make',
  '做',
  '什么',
  '今天',
  '可以',
  '吗',
  '嗎',
  '你',
  '我',
  '他',
  '她',
  '是',
  '的',
  '了',
  '呢',
  '吧',
  '在',
  '有',
  '怎么',
  '如何',
  '为什么',
  '是否'
]);

const SYNONYM_GROUPS: string[][] = [
  ['root canal', 'root', 'canal', 'endodontics', 'rct', '根管', '根管治疗'],
  ['veneers', 'veneer', 'laminates', 'laminate', '贴面']
].map((group) =>
  Array.from(
    new Set(
      group
        .map((term) => normalise(term))
        .filter((term) => term.length > 0)
    )
  )
);

const DENTAL_TERMS = new Set<string>(
  SYNONYM_GROUPS.flat()
);

const CJK_REGEX = /\p{Script=Han}/u;

const lastHitReasons = new Map<string, string[]>();

const cache = new Map<Locale, Promise<KBEntry[]>>();

const tokenize = (value: string): string[] => {
  const cleaned = normalise(value);
  if (!cleaned) {
    return [];
  }

  const rawTokens = cleaned.split(/\s+/);
  const tokens = new Set<string>();

  const addToken = (token: string) => {
    if (!token || STOPWORDS.has(token)) {
      return;
    }
    const minLength = CJK_REGEX.test(token) ? 1 : 3;
    if (token.length < minLength) {
      return;
    }
    tokens.add(token);
  };

  rawTokens.forEach(addToken);
  if (rawTokens.length > 1) {
    addToken(cleaned);
  }

  return Array.from(tokens);
};

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

const expandWithSynonyms = (tokens: string[]): string[] => {
  const expanded = new Set(tokens);

  for (const group of SYNONYM_GROUPS) {
    if (group.some((variant) => expanded.has(variant))) {
      for (const variant of group) {
        expanded.add(variant);
      }
    }
  }

  return Array.from(expanded);
};

const buildQueryTokens = (query: string): { tokens: string[]; wordSet: Set<string>; hasDentalTerm: boolean } => {
  const baseTokens = tokenize(query);
  const expandedTokens = expandWithSynonyms(baseTokens);
  const wordSet = new Set<string>();

  for (const token of expandedTokens) {
    const parts = token.split(' ').filter(Boolean);
    if (parts.length > 1) {
      parts.forEach((part) => wordSet.add(part));
    } else {
      wordSet.add(token);
    }
  }

  const hasDentalTerm = expandedTokens.some((token) => DENTAL_TERMS.has(token));
  return { tokens: expandedTokens, wordSet, hasDentalTerm };
};

const updateBest = (
  currentScore: number,
  currentReasons: string[],
  candidateScore: number,
  candidateReasons: string[]
): { score: number; reasons: string[] } => {
  if (candidateScore > currentScore + SCORE_EPSILON) {
    return { score: candidateScore, reasons: candidateReasons };
  }
  if (Math.abs(candidateScore - currentScore) <= SCORE_EPSILON) {
    const merged = new Set([...currentReasons, ...candidateReasons]);
    return { score: currentScore, reasons: Array.from(merged) };
  }
  return { score: currentScore, reasons: currentReasons };
};

const logDebug = (
  phase: 'primary' | 'fallback',
  entry: KBEntry,
  score: number,
  reasons: string[],
  tokens: string[],
  tagOverlap: number,
  titleOverlap: number,
  domainGate: boolean
) => {
  if (!import.meta.env?.DEV) {
    return;
  }

  console.debug(`[kb-${phase}]`, {
    title: entry.title,
    score: Number(score.toFixed(3)),
    reasons,
    tokens,
    tagOverlap,
    titleOverlap,
    domainGate
  });
};

const evaluateEntries = (
  entries: KBEntry[],
  queryTokens: string[],
  queryWordSet: Set<string>,
  hasDentalTerm: boolean,
  tagFilter: string[],
  modifier: number,
  phase: 'primary' | 'fallback'
): ScoredEntry[] => {
  const evaluated: ScoredEntry[] = [];

  for (const entry of entries) {
    const entryTags = entry.tags.map((tag) => normalise(tag));
    if (tagFilter.length && !entryTags.some((tag) => tagFilter.includes(tag))) {
      continue;
    }

    const titleTokens = tokenize(entry.title);
    const bodyTokens = tokenize(`${entry.excerpt} ${entry.body}`);

    let tagOverlap = 0;
    let tagExact = false;
    let tagPartial = false;

    for (const tag of entryTags) {
      if (queryTokens.includes(tag)) {
        tagOverlap += 1;
        tagExact = true;
        break;
      }
    }

    if (!tagExact) {
      for (const tag of entryTags) {
        if (
          queryTokens.some((token) => tag.includes(token) || token.includes(tag))
        ) {
          tagOverlap += 1;
          tagPartial = true;
          break;
        }
      }
    }

    const titleOverlap = titleTokens.filter((token) => queryWordSet.has(token)).length;

    const domainGate = tagOverlap > 0 || titleOverlap > 0 || hasDentalTerm;

    let best = { score: 0, reasons: [] as string[] };

    if (!domainGate) {
      logDebug(phase, entry, best.score, best.reasons, queryTokens, tagOverlap, titleOverlap, domainGate);
      continue;
    }

    if (tagOverlap > 0) {
      if (tagExact) {
        best = updateBest(best.score, best.reasons, 1, ['tag-exact']);
      } else if (tagPartial) {
        best = updateBest(best.score, best.reasons, 1, ['tag-partial']);
      }
    } else if (titleOverlap > 0) {
      best = updateBest(best.score, best.reasons, 0.9, ['title-overlap']);
    }

    if (best.score <= 0 && bodyTokens.length > 0) {
      const bodyMatches = bodyTokens.filter((token) => queryTokens.includes(token)).length;
      if (bodyMatches > 0 && BODY_SCORE_CAP > 0) {
        const bodyScore = Math.min(BODY_SCORE_CAP, bodyMatches * BODY_SCORE_STEP);
        best = updateBest(best.score, best.reasons, bodyScore, [`body-${bodyMatches}-hits`]);
      }
    }

    if (best.score <= 0) {
      logDebug(phase, entry, 0, best.reasons, queryTokens, tagOverlap, titleOverlap, domainGate);
      continue;
    }

    const reasons = [...best.reasons];
    if (hasDentalTerm && !reasons.includes('dental-term')) {
      reasons.push('dental-term');
    }

    let adjustedScore = best.score;

    if (modifier < 1) {
      adjustedScore = Math.min(best.score * modifier, 1);
      reasons.push('cross-locale-penalty');
    }

    logDebug(phase, entry, adjustedScore, reasons, queryTokens, tagOverlap, titleOverlap, domainGate);

    evaluated.push({
      entry,
      score: adjustedScore,
      reasons,
      tagOverlap,
      titleOverlap,
      domainGate
    });
  }

  return evaluated;
};

const dedupeAndTrim = (entries: ScoredEntry[], limit: number): ScoredEntry[] => {
  const bestById = new Map<string, ScoredEntry>();

  for (const current of entries) {
    if (current.score <= 0) {
      continue;
    }
    const existing = bestById.get(current.entry.id);
    if (!existing || current.score > existing.score + SCORE_EPSILON) {
      bestById.set(current.entry.id, current);
    }
  }

  return Array.from(bestById.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const attachReasons = (entries: ScoredEntry[]): KBEntry[] => {
  lastHitReasons.clear();

  return entries.map(({ entry, reasons }) => {
    const enriched = { ...entry } as KBEntry & { __kbReasons?: string[] };
    Object.defineProperty(enriched, '__kbReasons', {
      value: reasons,
      enumerable: false
    });
    lastHitReasons.set(enriched.id, reasons);
    return enriched;
  });
};

export const getHitReasons = (entryId: string): string[] | undefined => lastHitReasons.get(entryId);

export const searchKB = async (
  locale: Locale,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    lastHitReasons.clear();
    return { hits: [], maxScore: 0, localesTried: [locale] };
  }

  const normalisedQuery = normalise(trimmedQuery);
  if (!normalisedQuery) {
    lastHitReasons.clear();
    return { hits: [], maxScore: 0, localesTried: [locale] };
  }

  const { tags = [], limit = TOP_N } = options;
  const topLimit = Math.max(1, Math.min(limit, TOP_N));
  const normalisedTags = tags.map((tag) => normalise(tag)).filter(Boolean);
  const { tokens: queryTokens, wordSet: queryWordSet, hasDentalTerm } = buildQueryTokens(normalisedQuery);

  const localesTried: Locale[] = [locale];

  const primaryEntries = await loadKB(locale);
  const primaryEvaluated = evaluateEntries(
    primaryEntries,
    queryTokens,
    queryWordSet,
    hasDentalTerm,
    normalisedTags,
    1,
    'primary'
  );

  const primaryHits = dedupeAndTrim(primaryEvaluated, topLimit);
  if (primaryHits.length && primaryHits[0].score >= MIN_SCORE) {
    return {
      hits: attachReasons(primaryHits),
      maxScore: primaryHits[0].score,
      localesTried
    };
  }

  const fallbackLocale: Locale = locale === 'en' ? 'zh' : 'en';
  if (fallbackLocale !== locale) {
    localesTried.push(fallbackLocale);
    const fallbackEntries = await loadKB(fallbackLocale);
    const fallbackEvaluated = evaluateEntries(
      fallbackEntries,
      queryTokens,
      queryWordSet,
      hasDentalTerm,
      normalisedTags,
      CROSS_LOCALE_PENALTY,
      'fallback'
    );

    const fallbackHits = dedupeAndTrim(fallbackEvaluated, topLimit);
    if (fallbackHits.length) {
      return {
        hits: attachReasons(fallbackHits),
        maxScore: fallbackHits[0].score,
        localesTried
      };
    }
  }

  lastHitReasons.clear();
  return {
    hits: [],
    maxScore: 0,
    localesTried
  };
};
