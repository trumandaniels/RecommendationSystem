import { type SVGProps, useMemo, useState } from "react";
import {
  BrainCircuit,
  Check,
  Database,
  Download,
  ExternalLink,
  Gauge,
  Info,
  Layers3,
  Network,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Trash2,
  UserCircle,
} from "lucide-react";
import {
  APP_CATALOG,
  DEMO_META,
  HISTORY as HISTORY_SEED,
  USER_APP_HISTORY,
} from "./demoData.generated";

type ModelId = "popularity" | "item_item" | "semantic";
type AppTab = "problem" | "dataset" | "model" | "demo";
type TagType = "intent" | "similarity" | "coview" | "category" | "popularity" | "search";

type Tag = {
  label: string;
  type: TagType;
};

type Signal = {
  label: string;
  value: number;
  color: string;
};

type RecItem = {
  id: string;
  title: string;
  image: string;
  explanation: string;
  score: string;
  scoreLabel: string;
  signals: Signal[];
  tags: Tag[];
};

type CatalogApp = {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  storeInstalls: number | null;
  rating: number | null;
  ratingCount: number | null;
  sampleInstalls: number;
  source: string;
  sourceUrl: string;
};

type AppDetail = {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  attributes: string[];
  facts: Array<{ label: string; value: string }>;
};

type AppRecord = AppDetail & {
  recommendation?: RecItem;
};

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

type BrandIcon = {
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

function SpotifyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Spotify" {...props}>
      <circle cx="16" cy="16" r="16" fill="#1ED760" />
      <path
        d="M9.1 12.6c4.5-1.3 9.5-1 13.8 1.1M10 16.1c3.7-1 8-0.8 11.2 0.9M10.8 19.4c2.7-0.7 6-0.5 8.4 0.7"
        fill="none"
        stroke="#0B0B0B"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function AmazonLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Amazon" {...props}>
      <rect width="32" height="32" rx="7" fill="#FFFFFF" />
      <path
        d="M15.4 8.1c3.2 0 5.3 1.7 5.3 4.8v7.8h-3.3l-.3-1.4c-.9 1.1-2.2 1.7-4 1.7-2.6 0-4.5-1.5-4.5-3.9 0-2.7 2.1-4 5.6-4h2.7v-.5c0-1.2-.7-1.8-2.2-1.8-1.3 0-2.9.4-4.4 1.1l-1-2.6c1.7-.8 3.9-1.2 6.1-1.2Zm-.9 10.2c1.1 0 2-.4 2.5-1.2v-1.5h-2.2c-1.5 0-2.3.5-2.3 1.4 0 .8.7 1.3 2 1.3Z"
        fill="#111827"
      />
      <path
        d="M9 23.3c4 2 9.4 1.9 13.1-.3"
        fill="none"
        stroke="#FF9900"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path d="M21.4 21.8l3.1.1-1.5 2.7" fill="none" stroke="#FF9900" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function YouTubeLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="YouTube" {...props}>
      <rect x="3" y="7.5" width="26" height="17" rx="5" fill="#FF0000" />
      <path d="M14 12.2v7.6l6.5-3.8-6.5-3.8Z" fill="#FFFFFF" />
    </svg>
  );
}

function TikTokLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="TikTok" {...props}>
      <rect width="32" height="32" rx="7" fill="#050505" />
      <path d="M18.7 7.4h3.1c.3 2.2 1.5 3.8 3.8 4.3v3.1c-1.4 0-2.7-.4-3.8-1.1v6.7c0 3.2-2.4 5.4-5.7 5.4-3 0-5.4-2-5.4-4.9 0-3.2 2.7-5.3 6.2-4.8v3.1c-1.6-.4-2.9.3-2.9 1.7 0 1.1.9 1.8 2.1 1.8 1.4 0 2.6-.8 2.6-2.6V7.4Z" fill="#25F4EE" />
      <path d="M20.4 7.4h1.4c.3 2.2 1.5 3.8 3.8 4.3v3.1c-1 0-2-.2-2.8-.7v6.3c0 3.2-2.4 5.4-5.7 5.4-2 0-3.8-.9-4.7-2.3.9.7 2.1 1.1 3.4 1.1 3.3 0 5.7-2.2 5.7-5.4v-6.7c1.1.7 2.4 1.1 3.8 1.1v-1c-2.9-.4-4.5-2.3-4.9-5.2Z" fill="#FE2C55" />
      <path d="M18.7 7.4h3.1c.3 2.2 1.5 3.8 3.8 4.3v3.1c-1.4 0-2.7-.4-3.8-1.1v6.7c0 3.2-2.4 5.4-5.7 5.4-3 0-5.4-2-5.4-4.9 0-3.2 2.7-5.3 6.2-4.8v3.1c-1.6-.4-2.9.3-2.9 1.7 0 1.1.9 1.8 2.1 1.8 1.4 0 2.6-.8 2.6-2.6V7.4Z" fill="#FFFFFF" transform="translate(-1 -0.7)" />
    </svg>
  );
}

function InstagramLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Instagram" {...props}>
      <defs>
        <radialGradient id="instagram-gradient" cx="30%" cy="107%" r="115%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="22%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5949" />
          <stop offset="62%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#instagram-gradient)" />
      <rect x="8.2" y="8.2" width="15.6" height="15.6" rx="5" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="3.8" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
      <circle cx="21.2" cy="10.9" r="1.3" fill="#FFFFFF" />
    </svg>
  );
}

const CATALOG_APPS: CatalogApp[] = APP_CATALOG.map((row) => ({
  id: String(row[0]),
  title: String(row[1]),
  category: String(row[2]),
  image: String(row[3]),
  description: String(row[4]),
  storeInstalls: typeof row[5] === "number" ? row[5] : null,
  rating: typeof row[6] === "number" ? row[6] : null,
  ratingCount: typeof row[7] === "number" ? row[7] : null,
  sampleInstalls: typeof row[8] === "number" ? row[8] : 0,
  source: String(row[9] ?? ""),
  sourceUrl: String(row[10] ?? ""),
}));
const CATALOG_BY_ID = new Map(CATALOG_APPS.map((app) => [app.id, app]));
const CATALOG_INDEX_BY_ID = new Map(CATALOG_APPS.map((app, index) => [app.id, index]));
const USER_APP_INDEX_HISTORY = USER_APP_HISTORY as readonly (readonly number[])[];
const TAG_STYLES: Record<TagType, string> = {
  intent: "border-blue-100 bg-blue-50 text-blue-700",
  similarity: "border-emerald-100 bg-emerald-50 text-emerald-700",
  coview: "border-cyan-100 bg-cyan-50 text-cyan-700",
  category: "border-slate-200 bg-white text-slate-700",
  popularity: "border-sky-100 bg-sky-50 text-sky-700",
  search: "border-blue-100 bg-blue-50 text-blue-700",
};
const PANEL_CLASS =
  "overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] ring-1 ring-blue-950/[0.04] backdrop-blur-xl";
const BLUE_BUTTON =
  "bg-[#1877f2] shadow-[0_10px_24px_rgba(24,119,242,0.22)]";
const HIDDEN_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const HEADER_TABS: Array<{
  id: AppTab;
  label: string;
  description: string;
  icon: typeof Database;
}> = [
  {
    id: "problem",
    label: "The Problem",
    description: "Why recommendations matter",
    icon: Info,
  },
  {
    id: "dataset",
    label: "Dataset",
    description: "Source, shape, and transformations",
    icon: Database,
  },
  {
    id: "model",
    label: "Model",
    description: "Ranking methods and signals",
    icon: BrainCircuit,
  },
  {
    id: "demo",
    label: "Demo",
    description: "Interactive recommendation dashboard",
    icon: UserCircle,
  },
];
function getFact(app: AppDetail, label: string) {
  return app.facts.find((fact) => fact.label === label)?.value ?? "Unknown";
}

function formatNumber(value: number | null) {
  return value === null ? "Unknown" : value.toLocaleString("en-US");
}

function catalogDescription(app: CatalogApp) {
  if (app.description.trim()) {
    return app.description.trim();
  }

  return `${app.title} is a ${app.category} app from the Myket dataset, represented with install, rating, and category signals.`;
}

function appDetailFromCatalog(app: CatalogApp): AppDetail {
  const rating = app.rating ?? 0;
  return {
    id: app.id,
    title: app.title,
    category: app.category,
    image: app.image,
    description: catalogDescription(app),
    attributes: [
      app.id,
      app.category,
      `${rating.toFixed(2)} rating`,
      `${formatNumber(app.storeInstalls)} installs`,
    ],
    facts: [
      {"label": "Sample installs", "value": formatNumber(app.sampleInstalls)},
      {"label": "Store installs", "value": formatNumber(app.storeInstalls)},
      {"label": "Rating count", "value": formatNumber(app.ratingCount)},
      {"label": "History role", "value": "Candidate app"},
    ].concat(
      app.source
        ? [
            {"label": "Presentation source", "value": app.source},
            {"label": "Store page", "value": app.sourceUrl},
          ]
        : [],
    ),
  };
}

const APP_DETAIL_MAP = Object.fromEntries(
  CATALOG_APPS.map((app) => [app.id, appDetailFromCatalog(app)]),
) as Record<string, AppDetail>;

function getRating(app: AppDetail) {
  const ratingAttribute = app.attributes.find((attribute) => attribute.endsWith(" rating"));
  if (!ratingAttribute) {
    throw new Error(`Missing rating attribute for app ${app.id}`);
  }

  const rating = Number.parseFloat(ratingAttribute.replace(" rating", ""));
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw new Error(`Invalid rating attribute for app ${app.id}: ${ratingAttribute}`);
  }

  return rating;
}

function getRatingsCount(app: AppDetail) {
  return getFact(app, "Rating count");
}

function getStoreInstalls(app: AppDetail) {
  return getFact(app, "Store installs");
}

function appVersion(app: AppDetail) {
  return app.id.split(".").slice(-1)[0]?.slice(0, 10) || "Demo";
}

const ALL_APPS = Object.values(APP_DETAIL_MAP).sort((a, b) => a.title.localeCompare(b.title));
const SEEDED_INSTALL_IDS = HISTORY_SEED.map((item) => item.id);
const RECOMMENDATION_DISPLAY_LIMIT = 12;
const DEFAULT_SELECTED_APP_ID = CATALOG_BY_ID.has("com.instagram.android")
  ? "com.instagram.android"
  : ALL_APPS[0]?.id ?? null;
const DEFAULT_RECOMMENDATION_APP_ID = DEFAULT_SELECTED_APP_ID;
const MODE_DETAILS: Record<
  ModelId,
  { label: string; shortLabel: string; eyebrow: string; description: string }
> = {
  popularity: {
    label: "Popularity",
    shortLabel: "Popularity",
    eyebrow: "Install volume",
    description: "Ranks apps by total install interactions in the Myket sample.",
  },
  item_item: {
    label: "ML recommendation",
    shortLabel: "ML",
    eyebrow: "Co-install graph",
    description: "Ranks apps by overlap with users who installed the profile's apps.",
  },
  semantic: {
    label: "Semantic model",
    shortLabel: "Semantic",
    eyebrow: "Name + description",
    description: "Ranks store apps by text similarity to the currently selected app.",
  },
};

const MODEL_SIGNAL_TITLES: Record<ModelId, string> = {
  popularity: "Popularity Score",
  item_item: "Personalized Score",
  semantic: "Semantic Match Score",
};

function ordinalSuffix(value: number) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) {
    return "th";
  }

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function popularityPercentile(app: CatalogApp) {
  const atOrBelow = CATALOG_APPS.filter(
    (candidate) => candidate.sampleInstalls <= app.sampleInstalls,
  ).length;

  return Math.round((atOrBelow / CATALOG_APPS.length) * 100);
}

function modelScoreCopy(
  activeModel: ModelId,
  recommendation: RecItem | null,
  scoreDisplay: string | null,
) {
  const displayedScore = scoreDisplay ?? "0.00";

  if (activeModel === "popularity") {
    const catalogApp = recommendation ? CATALOG_BY_ID.get(recommendation.id) : null;
    if (!catalogApp) {
      return `Max-normalized install volume across the ranked catalog. Displayed score: ${displayedScore}.`;
    }

    const percentile = popularityPercentile(catalogApp);
    return `${formatNumber(catalogApp.sampleInstalls)} sample installs. ${percentile}${ordinalSuffix(percentile)} percentile by observed popularity.`;
  }

  if (activeModel === "semantic") {
    return `Blends app-name, description, and semantic similarity into a ${displayedScore} match score.`;
  }

  return `Blends co-user strength, seed overlap, and category fit into a ${displayedScore} personalized score.`;
}

function modelScoreRingLabel(activeModel: ModelId, signalPercent: number) {
  if (activeModel === "popularity") {
    return "Popularity score";
  }
  if (activeModel === "semantic") {
    return "Similarity score";
  }

  return signalPercent >= 75 ? "High likelihood" : "Relative likelihood";
}

function categoryFitScore(category: string, installedCategories: Set<string>) {
  return installedCategories.has(category) ? 100 : 35;
}

function ratingScore(rating: number | null) {
  return Math.round(((rating ?? 0) / 5) * 100);
}

function recommendationFromCatalog(
  app: CatalogApp,
  modelId: ModelId,
  scoreValue: number,
  scoreLabel: string,
  installedCategories: Set<string>,
  extraSignals: Signal[],
  tags: Tag[],
): RecItem {
  const fit = categoryFitScore(app.category, installedCategories);
  const signals =
    modelId === "popularity"
      ? [
          {
            label: "Install idx",
            value: scoreValue,
            color: "bg-emerald-500",
          },
          {
            label: "Category fit",
            value: fit,
            color: fit === 100 ? "bg-cyan-500" : "bg-zinc-300",
          },
          {
            label: "Rating",
            value: ratingScore(app.rating),
            color: "bg-sky-500",
          },
        ]
      : extraSignals;

  return {
    id: app.id,
    title: app.title,
    image: app.image,
    explanation:
      modelId === "popularity"
        ? `Installed ${formatNumber(app.sampleInstalls)} times in the Myket sample. Metadata places it in ${app.category} with ${formatNumber(app.storeInstalls)} approximate store installs.`
        : modelId === "item_item"
          ? `Ranked from users who installed one or more apps currently in this profile, across the full ${formatNumber(CATALOG_APPS.length)} app catalog.`
          : `Ranked by cosine similarity between this app's name and description embedding and the selected app embedding.`,
    score: formatNumber(scoreValue),
    scoreLabel,
    signals,
    tags,
  };
}

function buildPopularityRecommendations(installedIds: Set<string>) {
  const installedCategories = new Set(
    [...installedIds].map((id) => CATALOG_BY_ID.get(id)?.category).filter(Boolean) as string[],
  );
  const candidates = CATALOG_APPS.filter((app) => !installedIds.has(app.id));
  const topSampleInstalls = Math.max(...candidates.map((app) => app.sampleInstalls), 1);

  return candidates
    .sort((a, b) => b.sampleInstalls - a.sampleInstalls || a.title.localeCompare(b.title))
    .slice(0, RECOMMENDATION_DISPLAY_LIMIT)
    .map((app) =>
      recommendationFromCatalog(
        app,
        "popularity",
        Math.round((app.sampleInstalls / topSampleInstalls) * 100),
        "Install index",
        installedCategories,
        [],
        [
          { label: "Top installs", type: "popularity" },
          ...(installedCategories.has(app.category)
            ? [{ label: "Same category", type: "category" as const }]
            : []),
        ],
      ),
    );
}

function buildItemItemRecommendations(installedIds: Set<string>) {
  const installedIndexes = new Set(
    [...installedIds]
      .map((id) => CATALOG_INDEX_BY_ID.get(id))
      .filter((index): index is number => index !== undefined),
  );
  const installedCategories = new Set(
    [...installedIds].map((id) => CATALOG_BY_ID.get(id)?.category).filter(Boolean) as string[],
  );
  const scores = new Map<
    number,
    { coUsers: number; pairCount: number; matchedSeeds: Set<number> }
  >();

  if (installedIndexes.size === 0) {
    return [];
  }

  for (const userApps of USER_APP_INDEX_HISTORY) {
    const seedsInUser = userApps.filter((index) => installedIndexes.has(index));
    if (seedsInUser.length === 0) {
      continue;
    }

    for (const candidateIndex of userApps) {
      if (installedIndexes.has(candidateIndex)) {
        continue;
      }

      const score = scores.get(candidateIndex) ?? {
        coUsers: 0,
        pairCount: 0,
        matchedSeeds: new Set<number>(),
      };
      score.coUsers += 1;
      score.pairCount += seedsInUser.length;
      for (const seedIndex of seedsInUser) {
        score.matchedSeeds.add(seedIndex);
      }
      scores.set(candidateIndex, score);
    }
  }

  const ranked = [...scores.entries()].sort(([, a], [, b]) => {
    return (
      b.coUsers - a.coUsers ||
      b.matchedSeeds.size - a.matchedSeeds.size ||
      b.pairCount - a.pairCount
    );
  });
  const topCoUsers = Math.max(...ranked.map(([, score]) => score.coUsers), 1);

  return ranked.slice(0, RECOMMENDATION_DISPLAY_LIMIT).map(([appIndex, score]) => {
    const app = CATALOG_APPS[appIndex];
    const fit = categoryFitScore(app.category, installedCategories);
    const seedOverlap = Math.round((score.matchedSeeds.size / installedIndexes.size) * 100);
    const signals = [
      {
        label: "Co-user idx",
        value: Math.round((score.coUsers / topCoUsers) * 100),
        color: "bg-blue-500",
      },
      {
        label: "Seed overlap",
        value: seedOverlap,
        color: "bg-indigo-500",
      },
      {
        label: "Category fit",
        value: fit,
        color: fit === 100 ? "bg-cyan-500" : "bg-zinc-300",
      },
    ];
    const tags: Tag[] = [
      {
        label: `${score.matchedSeeds.size}/${installedIndexes.size} seed overlap`,
        type: "coview",
      },
    ];
    if (fit === 100) {
      tags.push({ label: "Same category", type: "category" });
    }

    return recommendationFromCatalog(
      app,
      "item_item",
      score.coUsers,
      "Co-users",
      installedCategories,
      signals,
      tags,
    );
  });
}

const SEMANTIC_EMBEDDING_DIMS = 160;
const SEMANTIC_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "apps",
  "around",
  "as",
  "at",
  "be",
  "by",
  "catalog",
  "demo",
  "for",
  "from",
  "in",
  "is",
  "it",
  "myket",
  "of",
  "on",
  "or",
  "store",
  "the",
  "this",
  "to",
  "with",
]);
const semanticEmbeddingCache = new Map<string, number[]>();

function hashFeature(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function addSemanticFeature(vector: number[], key: string, weight: number) {
  const hash = hashFeature(key);
  const dimension = hash % SEMANTIC_EMBEDDING_DIMS;
  const direction = hash & 1 ? 1 : -1;
  vector[dimension] += direction * weight;
}

function normalizeSemanticText(value: string) {
  return value
    .toLowerCase()
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function semanticTokens(value: string) {
  return normalizeSemanticText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !SEMANTIC_STOP_WORDS.has(token));
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.hypot(...vector);
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}

function textEmbedding(cacheKey: string, text: string) {
  const cached = semanticEmbeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const vector = Array.from({ length: SEMANTIC_EMBEDDING_DIMS }, () => 0);
  const tokens = semanticTokens(text);
  for (const token of tokens) {
    addSemanticFeature(vector, `word:${token}`, 1.8);
    for (let index = 0; index <= token.length - 3; index += 1) {
      addSemanticFeature(vector, `char:${token.slice(index, index + 3)}`, 0.45);
    }
  }
  for (let index = 0; index < tokens.length - 1; index += 1) {
    addSemanticFeature(vector, `bigram:${tokens[index]} ${tokens[index + 1]}`, 1.15);
  }

  const normalized = normalizeVector(vector);
  semanticEmbeddingCache.set(cacheKey, normalized);
  return normalized;
}

function appSemanticText(app: CatalogApp) {
  return `${app.title}. ${app.description}`;
}

function appEmbedding(app: CatalogApp) {
  return textEmbedding(`app:${app.id}`, appSemanticText(app));
}

function appTitleEmbedding(app: CatalogApp) {
  return textEmbedding(`title:${app.id}`, app.title);
}

function appDescriptionEmbedding(app: CatalogApp) {
  return textEmbedding(`description:${app.id}`, app.description);
}

function cosineSimilarity(a: number[], b: number[]) {
  let total = 0;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    total += a[index] * b[index];
  }
  return total;
}

function similarityScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function buildSemanticRecommendations(selectedAppId: string | null) {
  if (!selectedAppId) {
    return [];
  }

  const selectedApp = CATALOG_BY_ID.get(selectedAppId);
  if (!selectedApp) {
    throw new Error(`Cannot build semantic recommendations for unknown app: ${selectedAppId}`);
  }

  const selectedEmbedding = appEmbedding(selectedApp);
  const selectedTitleEmbedding = appTitleEmbedding(selectedApp);
  const selectedDescriptionEmbedding = appDescriptionEmbedding(selectedApp);
  const selectedCategories = new Set([selectedApp.category]);

  return CATALOG_APPS.filter((app) => app.id !== selectedApp.id)
    .map((app) => {
      const semanticSimilarity = cosineSimilarity(selectedEmbedding, appEmbedding(app));
      const titleSimilarity = cosineSimilarity(selectedTitleEmbedding, appTitleEmbedding(app));
      const descriptionSimilarity = cosineSimilarity(
        selectedDescriptionEmbedding,
        appDescriptionEmbedding(app),
      );

      return {
        app,
        semanticSimilarity,
        titleSimilarity,
        descriptionSimilarity,
      };
    })
    .filter((candidate) => candidate.semanticSimilarity > 0)
    .sort((a, b) => {
      return (
        b.semanticSimilarity - a.semanticSimilarity ||
        b.descriptionSimilarity - a.descriptionSimilarity ||
        b.app.sampleInstalls - a.app.sampleInstalls ||
        a.app.title.localeCompare(b.app.title)
      );
    })
    .slice(0, RECOMMENDATION_DISPLAY_LIMIT)
    .map(({ app, semanticSimilarity, titleSimilarity, descriptionSimilarity }) => {
      const fit = categoryFitScore(app.category, selectedCategories);
      const tags: Tag[] = [{ label: "Name + description", type: "similarity" }];
      if (fit === 100) {
        tags.push({ label: "Same category", type: "category" });
      }

      return {
        id: app.id,
        title: app.title,
        image: app.image,
        explanation: `Closest semantic match to ${selectedApp.title} using compact embeddings of app names and descriptions across the full ${formatNumber(CATALOG_APPS.length)} app catalog.`,
        score: (Math.max(0, semanticSimilarity)).toFixed(2),
        scoreLabel: "Cosine similarity",
        signals: [
          {
            label: "Semantic sim",
            value: similarityScore(semanticSimilarity),
            color: "bg-emerald-500",
          },
          {
            label: "Description fit",
            value: similarityScore(descriptionSimilarity),
            color: "bg-cyan-500",
          },
          {
            label: "Title fit",
            value: similarityScore(titleSimilarity),
            color: "bg-violet-500",
          },
          {
            label: "Category fit",
            value: fit,
            color: fit === 100 ? "bg-blue-500" : "bg-zinc-300",
          },
        ],
        tags,
      } satisfies RecItem;
    });
}

function buildRecommendations(modelId: ModelId, installedIds: Set<string>, selectedAppId: string | null) {
  if (modelId === "popularity") {
    return buildPopularityRecommendations(installedIds);
  }
  if (modelId === "semantic") {
    return buildSemanticRecommendations(selectedAppId);
  }

  return buildItemItemRecommendations(installedIds);
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().trim();
}

function buildSearchRecommendations(query: string, installedIds: Set<string>) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return CATALOG_APPS.flatMap((app) => {
    if (installedIds.has(app.id)) {
      return [];
    }

    const title = normalizeSearchText(app.title);
    const category = normalizeSearchText(app.category);
    const description = normalizeSearchText(app.description);
    const packageId = normalizeSearchText(app.id);
    const titleScore =
      title === normalizedQuery
        ? 100
        : title.startsWith(normalizedQuery)
          ? 85
          : title.includes(normalizedQuery)
            ? 70
            : terms.filter((term) => title.includes(term)).length * 30;
    const keywordScore = terms.reduce((score, term) => {
      if (category.includes(term)) {
        return score + 18;
      }
      if (description.includes(term)) {
        return score + 12;
      }
      if (packageId.includes(term)) {
        return score + 8;
      }
      return score;
    }, 0);
    const matchScore = titleScore + keywordScore;
    if (matchScore <= 0) {
      return [];
    }

    const scoreValue = Math.min(100, matchScore);
    const tags: Tag[] = [{ label: titleScore > 0 ? "Title match" : "Keyword match", type: "search" }];
    if (category.includes(normalizedQuery) || terms.some((term) => category.includes(term))) {
      tags.push({ label: app.category, type: "category" });
    }

    return [
      {
        id: app.id,
        title: app.title,
        image: app.image,
        explanation: `Search match across title, category, description, and package id in the full ${formatNumber(CATALOG_APPS.length)} app catalog.`,
        score: `${scoreValue}`,
        scoreLabel: "Search match",
        signals: [
          { label: "Title match", value: Math.min(100, titleScore), color: "bg-blue-500" },
          { label: "Keyword match", value: Math.min(100, keywordScore), color: "bg-cyan-500" },
          { label: "Popularity", value: Math.min(100, Math.round(app.sampleInstalls / 160)), color: "bg-sky-500" },
        ],
        tags,
      } satisfies RecItem,
    ];
  })
    .sort((a, b) => {
      const aScore = Number(a.score);
      const bScore = Number(b.score);
      const aApp = CATALOG_BY_ID.get(a.id);
      const bApp = CATALOG_BY_ID.get(b.id);
      return (
        bScore - aScore ||
        (bApp?.sampleInstalls ?? 0) - (aApp?.sampleInstalls ?? 0) ||
        a.title.localeCompare(b.title)
      );
    })
    .slice(0, RECOMMENDATION_DISPLAY_LIMIT);
}

function modelSignalPercent(recommendation: RecItem | null, modelId: ModelId) {
  if (!recommendation) {
    return null;
  }

  const signalValue = (label: string) =>
    recommendation.signals.find((signal) => signal.label === label)?.value ?? 0;

  if (modelId === "popularity") {
    return signalValue("Install idx");
  }
  if (modelId === "semantic") {
    return Math.round(
      signalValue("Semantic sim") * 0.65 +
        signalValue("Description fit") * 0.25 +
        signalValue("Title fit") * 0.1,
    );
  }

  return Math.round(
    signalValue("Co-user idx") * 0.55 +
      signalValue("Seed overlap") * 0.3 +
      signalValue("Category fit") * 0.15,
  );
}

const ICON_FALLBACK_GRADIENTS = [
  "from-slate-900 via-blue-700 to-cyan-500",
  "from-teal-900 via-emerald-700 to-lime-500",
  "from-zinc-900 via-slate-700 to-blue-500",
  "from-fuchsia-950 via-purple-700 to-rose-500",
  "from-indigo-950 via-indigo-700 to-sky-500",
  "from-neutral-900 via-zinc-700 to-slate-500",
];

function hashText(text: string) {
  return Array.from(text).reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function iconInitials(title: string) {
  const words = title
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0] ?? title).slice(0, 2).toUpperCase();
}

function AppIcon({
  app,
  size = "md",
}: {
  app: Pick<AppDetail, "image" | "title">;
  size?: "sm" | "md" | "lg";
}) {
  const gradient = ICON_FALLBACK_GRADIENTS[hashText(app.title) % ICON_FALLBACK_GRADIENTS.length];
  const initials = iconInitials(app.title);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border border-white bg-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.14)]",
        size === "sm" && "h-10 w-10",
        size === "md" && "h-14 w-14",
        size === "lg" && "h-[11rem] w-[11rem]",
      )}
    >
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br text-center font-bold text-white",
          gradient,
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-xl",
        )}
        aria-hidden="true"
      >
        {initials}
      </div>
      {app.image ? (
        <img
          key={app.image}
          src={app.image}
          alt={app.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TAG_STYLES[tag.type],
      )}
    >
      {tag.label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,255,0.9))] px-4 py-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-blue-950/[0.03]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950" title={value}>
        {value}
      </p>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  const displayValue = value.toFixed(2);

  return (
    <div
      className="flex items-center gap-2"
      aria-label={`${displayValue} out of 5 rating`}
      title={`${displayValue} out of 5 rating`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const fillPercent = Math.max(0, Math.min(1, value - index)) * 100;

          return (
            <span key={index} className="relative inline-flex h-4 w-4 text-slate-200">
              <Star className="h-4 w-4 fill-current stroke-current" />
              <span
                className="absolute inset-0 overflow-hidden text-blue-500"
                style={{ width: `${fillPercent}%` }}
              >
                <Star className="h-4 w-4 fill-current stroke-current" />
              </span>
            </span>
          );
        })}
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-700">{displayValue}</span>
    </div>
  );
}

function ModeSelector({
  activeModel,
  onChange,
}: {
  activeModel: ModelId;
  onChange: (modelId: ModelId) => void;
}) {
  const options: Array<{ id: ModelId; icon: typeof TrendingUp }> = [
    { id: "popularity", icon: TrendingUp },
    { id: "item_item", icon: BrainCircuit },
    { id: "semantic", icon: Sparkles },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/70 bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-blue-950/[0.04] backdrop-blur">
      {options.map(({ id, icon: Icon }) => {
        const isActive = activeModel === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              isActive
                ? `${BLUE_BUTTON} text-white ring-1 ring-white/30`
                : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm",
            )}
            title={`Use ${MODE_DETAILS[id].label}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{MODE_DETAILS[id].shortLabel}</span>
            {isActive ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function InstalledPanel({
  installedApps,
  selectedAppId,
  onSelect,
  onUninstall,
  onClear,
}: {
  installedApps: AppRecord[];
  selectedAppId: string | null;
  onSelect: (appId: string) => void;
  onUninstall: (appId: string) => void;
  onClear: () => void;
}) {
  return (
    <aside className={cn(PANEL_CLASS, "flex min-h-0 min-w-0 flex-col")}>
      <div className="border-b border-[#dbe7f5] px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Installed Apps</h2>
            <p className="mt-1 text-sm text-slate-500">Apps you've installed</p>
          </div>
          <span className="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {installedApps.length}
          </span>
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto", HIDDEN_SCROLLBAR)}>
        {installedApps.length === 0 ? (
          <div className="m-5 rounded-lg border border-dashed border-blue-200 bg-blue-50/45 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
              <Download className="h-4 w-4" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">Start from a blank slate</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Install any app from the recommendation rail. Until then, popularity mode shows the
              most installed apps in the Myket sample.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e5eefb]">
            {installedApps.map((app) => {
              const rating = getRating(app);
              return (
                <article
                  key={app.id}
                  className={cn(
                    "relative flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/75",
                    selectedAppId === app.id && "bg-[linear-gradient(90deg,rgba(37,99,235,0.10),rgba(255,255,255,0.72))]",
                  )}
                >
                  {selectedAppId === app.id ? (
                    <span className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
                  ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(app.id)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                    <AppIcon app={app} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {app.title}
                      </p>
                      <p className="text-xs text-slate-500">{app.category}</p>
                      <div className="mt-1 flex items-center gap-1 text-blue-500">
                        {Array.from({ length: 5 }, (_, starIndex) => (
                          <Star key={starIndex} className="h-3 w-3 fill-current stroke-current" />
                        ))}
                        <span className="ml-1 text-xs font-medium text-slate-500">
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUninstall(app.id)}
                    className="hidden h-8 shrink-0 items-center justify-center rounded-md border border-white/75 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 xl:flex"
                    title={`Uninstall ${app.title}`}
                  >
                    Uninstall
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[#dbe7f5] p-5">
        <button
          type="button"
          onClick={onClear}
          disabled={installedApps.length === 0}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/75 bg-white/80 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Trash2 className="h-4 w-4" />
          Uninstall all apps
        </button>
      </div>
    </aside>
  );
}

function DetailPanel({
  app,
  isInstalled,
  onInstall,
  onUninstall,
}: {
  app: AppRecord | null;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  if (!app) {
    return (
      <section className="border-b border-[#dbe7f5] bg-white p-6">
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/45 p-6">
          <Info className="h-5 w-5 text-blue-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Choose an app</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Open any app to inspect its metadata and install it into the demo user profile.
          </p>
        </div>
      </section>
    );
  }

  const rating = getRating(app);
  const ratingCount = getRatingsCount(app);
  const storeInstalls = getStoreInstalls(app);
  const sampleInstalls = getFact(app, "Sample installs");
  const presentationSource = getFact(app, "Presentation source");
  const description = app.description.trim();
  const descriptionParts = description.split(". ");
  const descriptionPreview = descriptionParts[0] ?? "";
  const hasDescriptionRemainder = descriptionParts.length > 1;
  const collapsedDescription = hasDescriptionRemainder ? `${descriptionPreview}.` : description;
  const expandedDescription = description;
  const metadata = [
    { label: "Package", value: app.id },
    { label: "Category", value: app.category },
    { label: "Store installs", value: storeInstalls },
    { label: "Sample installs", value: sampleInstalls },
    { label: "Rating", value: `${rating.toFixed(1)} star` },
    { label: "Rating count", value: ratingCount },
    { label: "Platform", value: "Android" },
    { label: "Source", value: presentationSource === "Unknown" ? "Dataset" : presentationSource },
  ];

  return (
    <section className="border-b border-[#dbe7f5] bg-white px-6 py-4">
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
          <AppIcon app={app} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {app.category}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                App Store
              </span>
              {isInstalled ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Installed
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 truncate text-2xl font-semibold leading-tight tracking-tight text-slate-950">
              {app.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating value={rating} />
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-sm text-slate-500">
                {rating.toFixed(1)} ({ratingCount})
              </span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-sm text-slate-500">{storeInstalls} installs</span>
            </div>
            <p className="mt-2 line-clamp-1 text-sm leading-6 text-slate-600">
              {description || app.attributes[0]}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={isInstalled ? onUninstall : onInstall}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              isInstalled
                ? "border border-white/75 bg-white/90 text-slate-800 hover:bg-white"
                : `${BLUE_BUTTON} text-white hover:bg-[#166fe5]`,
            )}
          >
            {isInstalled ? <Trash2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {isInstalled ? "Uninstall" : "Install"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {metadata.map((item) => (
          <Metric key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      {description ? (
        <div className="mt-3 rounded-lg border border-white/75 bg-white/90 px-4 py-2.5 text-sm leading-6 text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.05)] ring-1 ring-blue-950/[0.03]">
          <span>{isDescriptionExpanded ? expandedDescription : collapsedDescription}</span>
          {hasDescriptionRemainder ? (
          <button
            type="button"
            aria-expanded={isDescriptionExpanded}
            onClick={() => setIsDescriptionExpanded((current) => !current)}
            className="ml-1 font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isDescriptionExpanded ? "Show less" : "Read more"}
          </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function AppInsightPanel({
  app,
  activeModel,
  recommendation,
}: {
  app: AppRecord | null;
  activeModel: ModelId;
  recommendation: RecItem | null;
}) {
  if (!app) {
    return null;
  }

  const signalPercent = modelSignalPercent(recommendation, activeModel);
  const score = signalPercent === null ? null : signalPercent / 100;
  const scoreDisplay = score === null ? null : score.toFixed(2);
  const scoreCopy = modelScoreCopy(activeModel, recommendation, scoreDisplay);
  const ringLabel =
    signalPercent === null ? null : modelScoreRingLabel(activeModel, signalPercent);

  return (
    <section className="p-5">
      <div>
        <article className="rounded-xl border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.92))] p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] ring-1 ring-blue-950/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold leading-tight tracking-tight text-slate-950">
                {MODEL_SIGNAL_TITLES[activeModel]}
              </h2>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                {MODE_DETAILS[activeModel].description}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Gauge className="h-5 w-5" />
            </div>
          </div>

          {signalPercent === null ? (
            <div className="mt-5 rounded-lg border border-dashed border-blue-200 bg-blue-50/45 p-5">
              <p className="text-sm font-semibold text-slate-950">Not ranked in this mode</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeModel === "semantic"
                  ? "Every app has perfect semantic similarity with itself, so the selected app is left out of its own recommendation ranking."
                  : "Select an app from the recommendation rail to see its normalized recommendation score."}
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)]">
              <div className="rounded-xl border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-4 shadow-inner">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Score
                </p>
                <p className="mt-2 text-4xl font-bold leading-none tracking-tight text-slate-950">
                  {scoreDisplay ?? "0.00"}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{ringLabel}</p>
              </div>

              <div className="min-w-0 rounded-xl border border-white/75 bg-white/80 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] ring-1 ring-blue-950/[0.03]">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm leading-6 text-slate-600">{scoreCopy}</p>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {signalPercent}%
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8f1ff]">
                    <div
                      className="h-full rounded-full bg-[#1877f2]"
                      style={{ width: `${signalPercent}%` }}
                    />
                  </div>
                </div>

                {recommendation ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Factors</span>
                    {recommendation.tags.map((tag) => (
                      <TagBadge key={`${recommendation.id}-${tag.label}`} tag={tag} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function RecommendationPanel({
  activeModel,
  recommendations,
  searchQuery,
  selectedAppId,
  installedIds,
  onModeChange,
  onSearchQueryChange,
  onSelect,
  onInstall,
}: {
  activeModel: ModelId;
  recommendations: RecItem[];
  searchQuery: string;
  selectedAppId: string | null;
  installedIds: Set<string>;
  onModeChange: (modelId: ModelId) => void;
  onSearchQueryChange: (query: string) => void;
  onSelect: (appId: string) => void;
  onInstall: (appId: string) => void;
}) {
  const activeDetails = MODE_DETAILS[activeModel];
  const isSearching = searchQuery.trim().length > 0;
  const needsSemanticQuery = !isSearching && activeModel === "semantic" && selectedAppId === null;
  const emptyTitle = needsSemanticQuery ? "Select an app to compare" : "No matching apps";
  const emptyBody = needsSemanticQuery
    ? "Semantic mode compares the currently selected app with every other app in the store."
    : "Try another title, category, description keyword, or package id.";

  return (
    <aside className={cn(PANEL_CLASS, "flex min-h-0 min-w-0 flex-col")}>
      <div className="border-b border-[#dbe7f5] px-6 py-5">
        <div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Recommendations</h2>
            <p className="mt-1 text-sm text-slate-500">Apps we think you'll like</p>
          </div>
        </div>
        <div className="mt-4">
          <ModeSelector activeModel={activeModel} onChange={onModeChange} />
        </div>
        <label className="relative mt-3 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
            placeholder="Search by title or keyword"
            className="h-10 w-full rounded-lg border border-white/75 bg-white/90 pl-9 pr-3 text-sm font-medium text-slate-800 shadow-sm outline-none ring-1 ring-blue-950/[0.03] transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isSearching
            ? `Searches title, category, description, and package id across ${formatNumber(CATALOG_APPS.length)} apps.`
            : activeDetails.description}
        </p>
      </div>

      <div className={cn("flex-1 overflow-y-auto p-5", HIDDEN_SCROLLBAR)}>
        {recommendations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/45 p-5">
            <Search className="h-5 w-5 text-blue-600" />
            <h3 className="mt-4 text-sm font-semibold text-slate-950">{emptyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{emptyBody}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((item, index) => {
            const app = APP_DETAIL_MAP[item.id];
            const isInstalled = installedIds.has(item.id);
            const signalPercent = isSearching ? null : modelSignalPercent(item, activeModel);
            const displayScore =
              signalPercent === null ? item.score : (signalPercent / 100).toFixed(2);
            const category = app?.category ?? item.tags.find((tag) => tag.type === "category")?.label ?? "App";
            return (
              <article
                key={`${item.id}-${index}`}
                className={cn(
                  "relative w-full rounded-xl border bg-white/90 p-3 pb-11 text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] ring-1 ring-blue-950/[0.03] transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_22px_46px_rgba(15,23,42,0.10)]",
                  selectedAppId === item.id ? "border-blue-400 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.92))]" : "border-white/75",
                )}
              >
                <button type="button" onClick={() => onSelect(item.id)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                        index < 3 ? "bg-gradient-to-br from-blue-600 to-sky-400 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600",
                      )}
                    >
                      {index + 1}
                    </span>
                    <AppIcon app={app ?? item} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {category}
                          </p>
                        </div>
                        <span className="shrink-0 text-right text-lg font-semibold leading-none text-blue-600">
                          {displayScore}
                          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                            Score
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 2).map((tag) => (
                          <TagBadge key={`${item.id}-${tag.label}`} tag={tag} />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>

                {!isInstalled ? (
                  <button
                    type="button"
                    onClick={() => onInstall(item.id)}
                    className={cn(
                      "absolute bottom-3 right-3 inline-flex h-8 min-w-[96px] items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold text-white transition hover:bg-[#166fe5]",
                      BLUE_BUTTON,
                    )}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Install
                  </button>
                ) : null}
              </article>
            );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function HeaderTabs({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <div
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:w-[1040px]"
      role="tablist"
      aria-label="Recommendation system sections"
    >
      {HEADER_TABS.map(({ id, label, description, icon: Icon }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={cn(
              "flex h-[68px] min-w-0 items-center gap-3 rounded-xl border px-4 text-left shadow-sm ring-1 ring-blue-950/[0.03] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              isActive
                ? "border-transparent bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
                : "border-white/75 bg-white/80 text-slate-700 hover:border-blue-200 hover:bg-white hover:shadow-md",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isActive ? "bg-white/20 text-white ring-1 ring-white/25" : "bg-slate-100 text-slate-600",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className={cn("block truncate text-sm font-semibold", isActive ? "text-white" : "text-slate-950")}>{label}</span>
              <span className={cn("mt-0.5 block truncate text-xs", isActive ? "text-blue-50" : "text-slate-500")}>{description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProblemPage() {
  const recommendationExamples = [
    {
      title: "Spotify",
      body: "Learns from listening patterns so the next playlist feels like it already knows your taste.",
      icons: [{ label: "Spotify", Icon: SpotifyLogo }],
    },
    {
      title: "Amazon",
      body: "Uses browsing and purchase behavior to surface products people are likely to want next.",
      icons: [{ label: "Amazon", Icon: AmazonLogo }],
    },
    {
      title: "YouTube, TikTok, Instagram",
      body: "Rank feeds with recommendation systems that keep attention flowing from one item to the next.",
      icons: [
        { label: "YouTube", Icon: YouTubeLogo },
        { label: "TikTok", Icon: TikTokLogo },
        { label: "Instagram", Icon: InstagramLogo },
      ],
    },
  ];

  return (
    <section
      className={cn(
        PANEL_CLASS,
        HIDDEN_SCROLLBAR,
        "mx-auto min-h-[calc(100vh-132px)] w-[calc(100vw-2rem)] max-w-[1500px] overflow-y-auto p-6 lg:h-[calc(100vh-124px)] lg:w-full",
      )}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)]">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                The Problem
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Helping people find what they want before they know how to search for it
              </h2>
            </div>
          </div>

          <div className="mt-6 max-w-4xl space-y-4 text-base leading-7 text-slate-600">
            <p>
              Ever noticed how Spotify always seems to know what songs you like? Amazon knows what
              products you might want, even if you've never bought them before. Your YouTube,
              TikTok, and Instagram feeds feel so addictive because they use machine-learning-backed
              recommendation systems.
            </p>
            <p>
              Better recommendations mean more sales, more attention, and customers getting more of
              what they actually want. The business value is simple: when a system can rank the next
              best item from a huge catalog, discovery becomes faster and the product becomes more
              useful.
            </p>
            <p>
              This project uses a Persian app market dataset containing Android application install
              data over about six and a half months. I translated the app metadata into English, and
              this demo is designed to show how different recommendation systems work on the same
              real interaction graph.
            </p>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {recommendationExamples.map(({ title, body, icons }) => (
              <article
                key={title}
                className="rounded-lg border border-white/75 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]"
              >
                <div className="flex h-10 items-center gap-2">
                  {icons.map(({ label, Icon }: BrandIcon) => (
                    <span
                      key={label}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                  ))}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <article className="rounded-lg border border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.94),rgba(255,255,255,0.82))] p-5 shadow-[0_16px_38px_rgba(37,99,235,0.08)] ring-1 ring-white/70">
            <h3 className="text-base font-semibold text-slate-950">What this demo proves</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              A recommendation system does not need to be mysterious. This demo lets you compare a
              popularity baseline, a collaborative model, and semantic matching while seeing the
              evidence each model uses to rank apps.
            </p>
          </article>

          <div className="rounded-lg border border-white/75 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]">
            <h3 className="text-base font-semibold text-slate-950">Project framing</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Market</dt>
                <dd className="text-right font-semibold text-slate-900">Persian Android apps</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Behavior</dt>
                <dd className="text-right font-semibold text-slate-900">User installs</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Time span</dt>
                <dd className="text-right font-semibold text-slate-900">About 6.5 months</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Demo goal</dt>
                <dd className="text-right font-semibold text-slate-900">Explain ranking methods</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

function InfoMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-white/75 bg-white/90 px-5 py-4 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function LinkCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-lg border border-white/75 bg-white/90 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03] transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        </div>
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-600" />
      </div>
    </a>
  );
}

function DatasetPage() {
  const transformations = [
    "Load `myket.csv`, `app_info_sample.csv`, and `categories.csv` with strict header checks at the ingestion boundary.",
    "Parse user ids, package ids, timestamps, install counts, ratings, rating counts, and bilingual categories into typed SQLite columns.",
    "Store the result in `data/myket.db` as `installs`, `apps`, and `categories`, with indexes on user-time, app name, and timestamp for recommendation queries.",
    "Select one anonymized demo user with at least six early installs across four or more categories so the dashboard has a realistic seed profile.",
    "Generate frontend data from the database: the full app catalog, one real install history, and a compact user-app index for in-browser recommendation scoring.",
  ];

  return (
    <section
      className={cn(
        PANEL_CLASS,
        HIDDEN_SCROLLBAR,
        "mx-auto min-h-[calc(100vh-132px)] w-[calc(100vw-2rem)] max-w-[1500px] overflow-y-auto p-6 lg:h-[calc(100vh-124px)] lg:w-full",
      )}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Dataset
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Myket Android app install graph
              </h2>
            </div>
          </div>

          <p className="mt-5 max-w-4xl text-base leading-7 text-slate-600">
            This demo uses anonymized install interactions from the Myket Android application
            market. The source data is a temporal user-app graph: each row says that a user
            interacted with an Android package at a timestamp. That shape is exactly what a
            recommendation system needs: users, items, and behavioral evidence ordered over time.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoMetric
              label="Interactions"
              value="694,121"
              detail="Install events available for ranking and graph construction."
            />
            <InfoMetric
              label="Users"
              value="10,000"
              detail="Anonymized users retained after the source cleaning process."
            />
            <InfoMetric
              label="Apps"
              value="7,988"
              detail="Distinct Android packages observed in install interactions."
            />
            <InfoMetric
              label="Metadata"
              value="7,606"
              detail="Apps with category, rating, rating-count, and install metadata."
            />
          </div>

          <article className="mt-6 rounded-lg border border-white/75 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]">
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-semibold text-slate-950">Transformations for Modeling</h3>
            </div>
            <div className="mt-4 grid gap-3">
              {transformations.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-lg bg-[#f3f8ff] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-4">
          <article className="rounded-lg border border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.94),rgba(255,255,255,0.82))] p-5 shadow-[0_16px_38px_rgba(37,99,235,0.08)] ring-1 ring-white/70">
            <h3 className="text-base font-semibold text-slate-950">Why this dataset works here</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              A recommendation demo should be able to explain every suggestion from observable
              behavior. Myket gives us real co-install patterns, category context, and timestamps,
              so even the simple models have traceable evidence.
            </p>
          </article>

          <LinkCard
            href="https://github.com/erfanloghmani/myket-android-application-market-dataset"
            title="GitHub Dataset Repository"
            body="Source files, creation notes, summary statistics, and citation details."
          />
          <LinkCard
            href="https://huggingface.co/datasets/erfanloghmani/myket-android-application-recommendation-dataset"
            title="Hugging Face Dataset Card"
            body="Hosted dataset entry for discovery and reuse."
          />
          <LinkCard
            href="https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.datasets.MyketDataset.html"
            title="PyTorch Geometric Loader"
            body="Graph ML loader for the Myket dataset path."
          />
          <LinkCard
            href="https://arxiv.org/abs/2308.06862"
            title="Research Citation"
            body="Paper associated with the dataset and dynamic-network modeling setup."
          />
        </aside>
      </div>
    </section>
  );
}

function ModelPage() {
  return (
    <section
      className={cn(
        PANEL_CLASS,
        HIDDEN_SCROLLBAR,
        "mx-auto min-h-[calc(100vh-132px)] w-[calc(100vw-2rem)] max-w-[1500px] overflow-y-auto p-6 lg:h-[calc(100vh-124px)] lg:w-full",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)]">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Model
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Recommendation logic that is explainable by design
          </h2>
        </div>
      </div>

      <p className="mt-5 max-w-4xl text-base leading-7 text-slate-600">
        The current dashboard compares three production-friendly ranking strategies: a popularity
        baseline, item-item collaborative filtering over the install graph, and a compact semantic
        model over app names and descriptions. Put simply: the first asks "what is popular
        overall?", the second asks "what do similar app histories install?", and the third asks
        "what apps describe similar jobs, formats, and interests?"
      </p>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <article className="rounded-lg border border-white/75 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Baseline
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Popularity ranking</h3>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Popularity ranks candidate apps by total install interactions in the local Myket
            sample, excluding apps already installed by the demo user. It is simple, fast, and
            useful as a quality floor: a personalized model should beat this for relevance.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Main signal" value="Sample installs" />
            <Metric label="Secondary" value="Category fit" />
            <Metric label="Display" value="Rating" />
          </div>
        </article>

        <article className="rounded-lg border border-white/75 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Personalized
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Item-item collaborative filtering</h3>
            </div>
            <Network className="h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Item-item CF starts from the demo user's installed apps, finds other users who installed
            those same apps, then ranks candidate apps by co-user evidence and seed-app overlap. It
            is accessible to explain because each recommendation can point back to shared behavior.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Main signal" value="Co-users" />
            <Metric label="Personalization" value="Seed overlap" />
            <Metric label="Context" value="Category fit" />
          </div>
        </article>

        <article className="rounded-lg border border-white/75 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Semantic
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Name-description embeddings</h3>
            </div>
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Semantic mode embeds the selected app's title and description with a tiny hostable
            n-gram model, compares that vector with every other app in the store, then ranks
            candidates by cosine similarity. It can surface apps with similar purpose even when
            users have not co-installed them often.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <Metric label="Main signal" value="Semantic sim" />
            <Metric label="Text field" value="Description fit" />
            <Metric label="Name field" value="Title fit" />
          </div>
        </article>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-lg border border-white/75 bg-white/90 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.07)] ring-1 ring-blue-950/[0.03]">
          <h3 className="text-base font-semibold text-slate-950">How the score is presented</h3>
          <div className="mt-4 grid gap-3">
            {[
              "Each mode produces a ranked candidate list from the exported full catalog, user-app install index, or selected-app text embeddings.",
              "Raw counts are normalized to 0-100 signal values so different kinds of evidence can be shown on one UI scale.",
              "The dashboard converts those signals into a 0.00-1.00 model-specific display score for readability. Popularity is a normalized install-volume score, while personalized modes are relative recommendation scores.",
              "Installed apps are filtered out before display so recommendations stay actionable.",
            ].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-lg bg-[#f3f8ff] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.94),rgba(255,255,255,0.82))] p-5 shadow-[0_16px_38px_rgba(37,99,235,0.08)] ring-1 ring-white/70">
          <h3 className="text-base font-semibold text-slate-950">ML engineering read</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The current system is deliberately transparent: it favors ranking quality that can be
            inspected over opaque modeling. The semantic tab keeps that spirit by using a small
            local embedding path first; a later hosted model could swap in MiniLM, ONNX, or another
            compact transformer if the extra asset size is worth it.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            For non-technical readers: one model looks for patterns in what people install
            together, while the semantic model looks for apps that talk like the current app.
            The two signals answer different questions and are useful to compare side by side.
          </p>
        </article>
      </div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("demo");
  const [activeModel, setActiveModel] = useState<ModelId>("item_item");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    DEFAULT_RECOMMENDATION_APP_ID,
  );
  const [installedAppIds, setInstalledAppIds] = useState<string[]>([...SEEDED_INSTALL_IDS]);
  const [searchQuery, setSearchQuery] = useState("");

  const installedIdSet = useMemo(() => new Set(installedAppIds), [installedAppIds]);
  const selectedApp = selectedAppId ? APP_DETAIL_MAP[selectedAppId] ?? null : null;
  const installedApps = installedAppIds
    .map((id) => APP_DETAIL_MAP[id])
    .filter((app): app is AppRecord => Boolean(app));
  const modelRecommendations = useMemo(
    () => buildRecommendations(activeModel, installedIdSet, selectedAppId),
    [activeModel, installedIdSet, selectedAppId],
  );
  const searchRecommendations = useMemo(
    () => buildSearchRecommendations(searchQuery, installedIdSet),
    [searchQuery, installedIdSet],
  );
  const recommendations = searchQuery.trim() ? searchRecommendations : modelRecommendations;
  const recommendationMap = useMemo(
    () => new Map(modelRecommendations.map((recommendation) => [recommendation.id, recommendation])),
    [modelRecommendations],
  );
  const selectedRecommendation = selectedAppId ? recommendationMap.get(selectedAppId) ?? null : null;

  function installApp(appId: string) {
    if (!APP_DETAIL_MAP[appId]) {
      throw new Error(`Cannot install unknown app: ${appId}`);
    }
    setSelectedAppId(appId);
    setInstalledAppIds((current) => (current.includes(appId) ? current : [...current, appId]));
  }

  function uninstallApp(appId: string) {
    setInstalledAppIds((current) => current.filter((id) => id !== appId));
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#edf5ff_42%,#f8fafc_100%)] p-4 text-slate-950 lg:h-screen lg:overflow-hidden">
      <header className="mx-auto mb-4 w-[calc(100vw-2rem)] max-w-[1500px] rounded-xl border border-white/70 bg-white/75 shadow-[0_24px_70px_rgba(15,23,42,0.12)] ring-1 ring-blue-950/[0.04] backdrop-blur-xl lg:w-full">
        <div className="flex flex-col gap-5 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] ring-1 ring-blue-950/[0.08]">
              <BrainCircuit className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                AppGraph Recommender
              </h1>
              <p className="mt-1 max-w-[34rem] text-sm leading-5 text-slate-500">
                App Store · Machine Learning Recommendation System Demo
              </p>
            </div>
          </div>

          <HeaderTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </header>

      {activeTab === "problem" ? <ProblemPage /> : null}
      {activeTab === "dataset" ? <DatasetPage /> : null}
      {activeTab === "model" ? <ModelPage /> : null}
      {activeTab === "demo" ? (
        <div className="mx-auto grid min-h-[calc(100vh-132px)] w-[calc(100vw-2rem)] max-w-[1500px] grid-cols-1 gap-4 lg:h-[calc(100vh-124px)] lg:min-h-0 lg:w-full lg:grid-cols-[345px_minmax(0,1fr)_445px]">
          <InstalledPanel
            installedApps={installedApps}
            selectedAppId={selectedAppId}
            onSelect={setSelectedAppId}
            onUninstall={uninstallApp}
            onClear={() => setInstalledAppIds([])}
          />

          <section className={cn(PANEL_CLASS, HIDDEN_SCROLLBAR, "min-h-0 min-w-0 overflow-y-auto")}>
            <DetailPanel
              app={selectedApp}
              isInstalled={Boolean(selectedAppId && installedIdSet.has(selectedAppId))}
              onInstall={() => selectedAppId && installApp(selectedAppId)}
              onUninstall={() => selectedAppId && uninstallApp(selectedAppId)}
            />

            <AppInsightPanel
              app={selectedApp}
              activeModel={activeModel}
              recommendation={selectedRecommendation}
            />
          </section>

          <RecommendationPanel
            activeModel={activeModel}
            recommendations={recommendations}
            searchQuery={searchQuery}
            selectedAppId={selectedAppId}
            installedIds={installedIdSet}
            onModeChange={setActiveModel}
            onSearchQueryChange={setSearchQuery}
            onSelect={setSelectedAppId}
            onInstall={installApp}
          />
        </div>
      ) : null}
    </main>
  );
}
