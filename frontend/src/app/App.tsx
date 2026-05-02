import { useMemo, useState } from "react";
import {
  BrainCircuit,
  Check,
  Database,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Info,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trash2,
  UserCircle,
} from "lucide-react";
import {
  APP_DETAILS,
  DEMO_META,
  HISTORY as HISTORY_SEED,
  RECOMMENDATIONS,
} from "./demoData.generated";

type ModelId = "popularity" | "item_item";
type AppTab = "dataset" | "model" | "demo";
type TagType = "intent" | "similarity" | "coview" | "category" | "popularity";

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

type AppPresentation = {
  title: string;
  category: string;
  description: string;
  icon: string;
  accent: string;
  rating: number;
  ratingCount: string;
  installs: string;
  developer: string;
  version: string;
  size: string;
  released: string;
};

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

const APP_DETAIL_MAP = APP_DETAILS as Record<string, AppDetail>;
const RECOMMENDATION_MAP = RECOMMENDATIONS as Record<ModelId, RecItem[]>;
const TAG_STYLES: Record<TagType, string> = {
  intent: "border-orange-100 bg-orange-50 text-orange-700",
  similarity: "border-emerald-100 bg-emerald-50 text-emerald-700",
  coview: "border-cyan-100 bg-cyan-50 text-cyan-700",
  category: "border-slate-200 bg-white text-slate-700",
  popularity: "border-amber-100 bg-amber-50 text-amber-700",
};
const PANEL_CLASS =
  "overflow-hidden rounded-xl border border-[#ece3d9] bg-white shadow-[0_18px_50px_rgba(34,25,18,0.08)]";
const ORANGE_BUTTON = "bg-orange-600";
const HIDDEN_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const HEADER_TABS: Array<{
  id: AppTab;
  label: string;
  description: string;
  icon: typeof Database;
}> = [
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
const SELECTED_PRESENTATION: AppPresentation = {
  title: "SunsetGlow",
  category: "Photo Editing",
  description:
    "SunsetGlow is a creative photo editor focused on natural light, color warmth, and cinematic finishes. Perfect for golden hour, travel, and lifestyle photography.",
  icon: "sunset",
  accent: "from-orange-300 via-rose-400 to-purple-950",
  rating: 4.6,
  ratingCount: "1,247",
  installs: "10K+",
  developer: "Lumen Labs",
  version: "2.3.1",
  size: "78.6 MB",
  released: "Apr 12, 2024",
};
const INSTALLED_PRESENTATIONS: AppPresentation[] = [
  {
    title: "Aperture Studio",
    category: "Photo Editing",
    description: "Pro camera controls and editing presets.",
    icon: "lens",
    accent: "from-slate-950 via-slate-900 to-black",
    rating: 4.6,
    ratingCount: "842",
    installs: "24K+",
    developer: "Aperture Studio",
    version: "4.1.0",
    size: "92 MB",
    released: "Jan 18, 2024",
  },
  {
    title: "Halcyon Film",
    category: "Film Emulation",
    description: "Soft film looks for everyday photography.",
    icon: "prism",
    accent: "from-stone-50 via-orange-100 to-stone-200",
    rating: 4.7,
    ratingCount: "1,083",
    installs: "18K+",
    developer: "Halcyon",
    version: "1.8.2",
    size: "64 MB",
    released: "Feb 2, 2024",
  },
  {
    title: "LumaScape",
    category: "Photo Editing",
    description: "Landscape and travel photo enhancer.",
    icon: "mountain",
    accent: "from-slate-950 via-zinc-900 to-black",
    rating: 4.5,
    ratingCount: "695",
    installs: "12K+",
    developer: "LumaScape",
    version: "3.0.5",
    size: "71 MB",
    released: "Mar 1, 2024",
  },
  {
    title: "Blackgrain",
    category: "B&W Photography",
    description: "Monochrome contrast and grain controls.",
    icon: "grain",
    accent: "from-zinc-950 via-zinc-900 to-black",
    rating: 4.3,
    ratingCount: "519",
    installs: "9K+",
    developer: "Blackgrain",
    version: "2.4.0",
    size: "58 MB",
    released: "Nov 14, 2023",
  },
  {
    title: "CollagePro",
    category: "Collage Maker",
    description: "Clean layout tools for visual stories.",
    icon: "cube",
    accent: "from-purple-900 via-fuchsia-700 to-sky-700",
    rating: 4.4,
    ratingCount: "734",
    installs: "15K+",
    developer: "CollagePro",
    version: "5.0.1",
    size: "86 MB",
    released: "Dec 8, 2023",
  },
  {
    title: "SnapSeedly",
    category: "Photo Editing",
    description: "Fast color and texture adjustments.",
    icon: "leaf",
    accent: "from-emerald-950 via-green-800 to-black",
    rating: 4.2,
    ratingCount: "404",
    installs: "8K+",
    developer: "Seedly",
    version: "1.9.7",
    size: "43 MB",
    released: "Oct 21, 2023",
  },
  {
    title: "Vivid Touch",
    category: "Color Enhancer",
    description: "Warm color boosts and social export.",
    icon: "orb",
    accent: "from-orange-500 via-red-500 to-orange-700",
    rating: 4.6,
    ratingCount: "981",
    installs: "21K+",
    developer: "Vivid",
    version: "3.2.4",
    size: "67 MB",
    released: "Jan 8, 2024",
  },
];
const RECOMMENDATION_PRESENTATIONS: AppPresentation[] = [
  {
    title: "GoldenHour Pro",
    category: "Photo Editing",
    description: "Similar users love this",
    icon: "sun",
    accent: "from-slate-950 via-slate-900 to-black",
    rating: 4.9,
    ratingCount: "2,118",
    installs: "32K+",
    developer: "GoldenHour",
    version: "2.7.0",
    size: "81 MB",
    released: "Apr 3, 2024",
  },
  {
    title: "Filmify Classic",
    category: "Film Emulation",
    description: "You installed similar",
    icon: "hex",
    accent: "from-zinc-950 via-black to-zinc-900",
    rating: 4.8,
    ratingCount: "1,524",
    installs: "27K+",
    developer: "Filmify",
    version: "3.1.2",
    size: "74 MB",
    released: "Feb 19, 2024",
  },
  {
    title: "ClearView AI",
    category: "Photo Enhancement",
    description: "Strong category match",
    icon: "mountain",
    accent: "from-teal-500 via-cyan-600 to-slate-900",
    rating: 4.7,
    ratingCount: "1,016",
    installs: "19K+",
    developer: "ClearView",
    version: "1.6.8",
    size: "90 MB",
    released: "Mar 28, 2024",
  },
  {
    title: "PortraitPop",
    category: "Portrait Editor",
    description: "Trending with you",
    icon: "feather",
    accent: "from-indigo-950 via-violet-900 to-black",
    rating: 4.6,
    ratingCount: "888",
    installs: "13K+",
    developer: "PortraitPop",
    version: "2.2.3",
    size: "62 MB",
    released: "Dec 12, 2023",
  },
  {
    title: "MoodBoard Collage",
    category: "Collage Maker",
    description: "Popular in your region",
    icon: "waves",
    accent: "from-black via-zinc-900 to-black",
    rating: 4.5,
    ratingCount: "679",
    installs: "11K+",
    developer: "MoodBoard",
    version: "4.0.0",
    size: "69 MB",
    released: "Jan 30, 2024",
  },
];

function getFact(app: AppDetail, label: string) {
  return app.facts.find((fact) => fact.label === label)?.value ?? "Unknown";
}

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

function buildAppRecords() {
  const records = new Map<string, AppRecord>();
  for (const app of Object.values(APP_DETAIL_MAP)) {
    records.set(app.id, { ...app });
  }
  for (const recommendation of Object.values(RECOMMENDATION_MAP).flat()) {
    const existing = records.get(recommendation.id);
    if (existing) {
      records.set(recommendation.id, { ...existing, recommendation });
    }
  }
  return [...records.values()].sort((a, b) => a.title.localeCompare(b.title));
}

const ALL_APPS = buildAppRecords();
const POPULAR_APP_IDS = RECOMMENDATION_MAP.popularity.map((item) => item.id);
const SEEDED_INSTALL_IDS = HISTORY_SEED.map((item) => item.id);
const DEFAULT_SELECTED_APP_ID = POPULAR_APP_IDS[0] ?? ALL_APPS[0]?.id ?? null;
const DEFAULT_RECOMMENDATION_APP_ID =
  RECOMMENDATION_MAP.item_item.find((item) => item.title === "Instagram")?.id ??
  RECOMMENDATION_MAP.item_item[0]?.id ??
  DEFAULT_SELECTED_APP_ID;
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
};

function recommendationForApp(appId: string, modelId: ModelId) {
  return RECOMMENDATION_MAP[modelId].find((item) => item.id === appId) ?? null;
}

function installLikelihoodPercent(recommendation: RecItem | null, modelId: ModelId) {
  if (!recommendation) {
    return null;
  }

  const signalValue = (label: string) =>
    recommendation.signals.find((signal) => signal.label === label)?.value ?? 0;

  if (modelId === "popularity") {
    return signalValue("Install idx");
  }

  return Math.round(
    signalValue("Co-user idx") * 0.55 +
      signalValue("Seed overlap") * 0.3 +
      signalValue("Category fit") * 0.15,
  );
}

function AppIcon({
  app,
  size = "md",
  presentation,
}: {
  app: Pick<AppDetail, "image" | "title">;
  size?: "sm" | "md" | "lg";
  presentation?: AppPresentation;
}) {
  if (presentation) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-xl border border-white shadow-[0_12px_28px_rgba(15,23,42,0.14)]",
          `bg-gradient-to-br ${presentation.accent}`,
          size === "sm" && "h-10 w-10",
          size === "md" && "h-14 w-14",
          size === "lg" && "h-[11rem] w-[11rem]",
        )}
      >
        <div className="relative h-full w-full">
          <span className="absolute left-[18%] top-[18%] text-[9px] font-bold uppercase tracking-wide text-white/90">
            {presentation.title.split(" ")[0]}
          </span>
          <span className="absolute left-[18%] top-[34%] text-[7px] font-bold uppercase tracking-wide text-white/80">
            {presentation.category.split(" ")[0]}
          </span>
          {presentation.icon === "sunset" ? (
            <>
              <span className="absolute left-[22%] top-[26%] h-[32%] w-[32%] rounded-full bg-white/90" />
              <span className="absolute bottom-0 left-[-8%] h-[42%] w-[70%] rotate-[-18deg] rounded-[55%] bg-orange-800/70" />
              <span className="absolute bottom-[-8%] right-[-12%] h-[56%] w-[76%] rotate-[-26deg] rounded-[55%] bg-purple-950/70" />
            </>
          ) : presentation.icon === "lens" ? (
            <span className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-white/85 shadow-inner after:absolute after:left-1/2 after:top-1/2 after:h-[34%] after:w-[34%] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-cyan-400" />
          ) : presentation.icon === "prism" ? (
            <span className="absolute left-1/2 top-[22%] h-[52%] w-[52%] -translate-x-1/2 rotate-45 rounded-sm bg-gradient-to-br from-orange-300 to-slate-950" />
          ) : presentation.icon === "mountain" ? (
            <>
              <span className="absolute bottom-[22%] left-[18%] h-[34%] w-[34%] rotate-45 rounded-sm bg-white/85" />
              <span className="absolute bottom-[18%] right-[18%] h-[42%] w-[42%] rotate-45 rounded-sm bg-cyan-200/80" />
            </>
          ) : presentation.icon === "grain" ? (
            <span className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-white/90 border-r-transparent" />
          ) : presentation.icon === "cube" ? (
            <span className="absolute left-1/2 top-1/2 h-[48%] w-[48%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border-[7px] border-white/85 bg-fuchsia-300/70" />
          ) : presentation.icon === "leaf" ? (
            <span className="absolute left-1/2 top-1/2 h-[62%] w-[38%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[90%_0_90%_0] bg-lime-300/80" />
          ) : presentation.icon === "orb" ? (
            <span className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-white/55 bg-white/20" />
          ) : presentation.icon === "hex" ? (
            <span className="absolute left-1/2 top-1/2 h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-lg bg-gradient-to-tr from-teal-300 via-amber-300 to-purple-500" />
          ) : presentation.icon === "feather" ? (
            <span className="absolute left-1/2 top-1/2 h-[70%] w-[26%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-gradient-to-b from-cyan-300 to-violet-500" />
          ) : presentation.icon === "waves" ? (
            <div className="absolute inset-x-[16%] top-[34%] space-y-1.5">
              <span className="block h-1.5 rounded-full bg-orange-200" />
              <span className="block h-1.5 rounded-full bg-teal-300" />
              <span className="block h-1.5 rounded-full bg-rose-400" />
            </div>
          ) : (
            <span className="absolute left-1/2 top-1/2 h-[52%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
          )}
          {size === "lg" ? (
            <span className="absolute bottom-[18%] left-[18%] text-[9px] font-bold text-white/90">
              {presentation.rating.toFixed(2)} rating
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-xl border border-white bg-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.14)]",
        size === "sm" && "h-10 w-10",
        size === "md" && "h-14 w-14",
        size === "lg" && "h-32 w-32 xl:h-36 xl:w-36",
      )}
    >
      <img src={app.image} alt={app.title} className="h-full w-full object-cover" />
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
    <div className="min-w-0 rounded-lg border border-[#eee5dc] bg-white/80 px-4 py-2.5 shadow-[0_10px_28px_rgba(34,25,18,0.04)]">
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
                className="absolute inset-0 overflow-hidden text-orange-500"
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
  ];

  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#eadfd5] bg-[#f7f3ef] p-1 shadow-inner">
      {options.map(({ id, icon: Icon }) => {
        const isActive = activeModel === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
              isActive
                ? `${ORANGE_BUTTON} text-white shadow-[0_6px_14px_rgba(15,23,42,0.12)]`
                : "text-slate-600 hover:bg-white hover:text-slate-950",
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
      <div className="border-b border-[#eee5dc] px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Installed Apps</h2>
            <p className="mt-1 text-sm text-slate-500">Apps you've installed</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            12
          </span>
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto", HIDDEN_SCROLLBAR)}>
        {installedApps.length === 0 ? (
          <div className="m-5 rounded-lg border border-dashed border-orange-200 bg-orange-50/45 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm">
              <Download className="h-4 w-4" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">Start from a blank slate</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Install any app from the recommendation rail. Until then, popularity mode shows the
              most installed apps in the Myket sample.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0e7df]">
            {installedApps.map((app, index) => {
              const presentation = INSTALLED_PRESENTATIONS[index % INSTALLED_PRESENTATIONS.length];
              return (
                <article
                  key={app.id}
                  className={cn(
                    "relative flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#fff8f2]",
                    selectedAppId === app.id && "bg-orange-50/60",
                  )}
                >
                  {selectedAppId === app.id ? (
                    <span className="absolute left-0 top-0 h-full w-1 bg-orange-500" />
                  ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(app.id)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                    <AppIcon app={app} size="md" presentation={presentation} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {presentation.title}
                      </p>
                      <p className="text-xs text-slate-500">{presentation.category}</p>
                      <div className="mt-1 flex items-center gap-1 text-orange-500">
                        {Array.from({ length: 5 }, (_, starIndex) => (
                          <Star key={starIndex} className="h-3 w-3 fill-current stroke-current" />
                        ))}
                        <span className="ml-1 text-xs font-medium text-slate-500">
                          {presentation.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUninstall(app.id)}
                    className="hidden h-8 shrink-0 items-center justify-center rounded-md border border-[#eadfd5] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-700 xl:flex"
                    title={`Uninstall ${presentation.title}`}
                  >
                    Uninstall
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[#eee5dc] p-5">
        <button
          type="button"
          onClick={onClear}
          disabled={installedApps.length === 0}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#eadfd5] bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
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
      <section className="border-b border-[#eee5dc] bg-white p-6">
        <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/45 p-6">
          <Info className="h-5 w-5 text-orange-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Choose an app</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Open any app to inspect its metadata and install it into the demo user profile.
          </p>
        </div>
      </section>
    );
  }

  const rating = SELECTED_PRESENTATION.rating;
  const [descriptionPreview, descriptionRemainder = ""] =
    SELECTED_PRESENTATION.description.split(". ");
  const hasDescriptionRemainder = descriptionRemainder.length > 0;
  const collapsedDescription = `${descriptionPreview}.`;
  const expandedDescription = SELECTED_PRESENTATION.description;
  const metadata = [
    { label: "Developer", value: SELECTED_PRESENTATION.developer },
    { label: "Version", value: SELECTED_PRESENTATION.version },
    { label: "Size", value: SELECTED_PRESENTATION.size },
    { label: "Released", value: SELECTED_PRESENTATION.released },
    { label: "Category", value: SELECTED_PRESENTATION.category },
    { label: "Compatibility", value: "iOS, Android" },
    { label: "Rating", value: `${rating.toFixed(1)} star` },
    { label: "Installs", value: `${SELECTED_PRESENTATION.installs} active` },
  ];

  return (
    <section className="border-b border-[#eee5dc] bg-white px-6 py-4">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
          <AppIcon app={app} size="lg" presentation={SELECTED_PRESENTATION} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                {SELECTED_PRESENTATION.category}
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
            <h1 className="mt-3 max-w-[14rem] truncate text-2xl font-semibold leading-tight tracking-tight text-slate-950">
              {SELECTED_PRESENTATION.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating value={rating} />
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-sm text-slate-500">
                {rating.toFixed(1)} ({SELECTED_PRESENTATION.ratingCount})
              </span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-sm text-slate-500">{SELECTED_PRESENTATION.installs} installs</span>
            </div>
            <p className="mt-2 line-clamp-1 text-sm leading-6 text-slate-600">
              Bring warmth and mood to every photo.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={isInstalled ? onUninstall : onInstall}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
              isInstalled
                ? "border border-[#eadfd5] bg-white text-slate-800 hover:bg-orange-50"
                : `${ORANGE_BUTTON} text-white shadow-[0_10px_22px_rgba(15,23,42,0.12)] hover:bg-orange-700`,
            )}
          >
            {isInstalled ? <Trash2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {isInstalled ? "Uninstall" : "Install"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metadata.map((item) => (
          <Metric key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-[#eee5dc] bg-white/90 px-4 py-2.5 text-sm leading-6 text-slate-600 shadow-[0_10px_28px_rgba(34,25,18,0.04)]">
        <span>{isDescriptionExpanded ? expandedDescription : collapsedDescription}</span>
        {hasDescriptionRemainder ? (
          <button
            type="button"
            aria-expanded={isDescriptionExpanded}
            onClick={() => setIsDescriptionExpanded((current) => !current)}
            className="ml-1 font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {isDescriptionExpanded ? "Show less" : "Read more"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function AppInsightPanel({
  app,
  activeModel,
}: {
  app: AppRecord | null;
  activeModel: ModelId;
}) {
  if (!app) {
    return null;
  }

  const recommendation = recommendationForApp(app.id, activeModel);
  const likelihood = installLikelihoodPercent(recommendation, activeModel);
  const score = likelihood === null ? null : likelihood / 100;
  const scoreDisplay = score === null ? null : score.toFixed(2);

  return (
    <section className="p-5">
      <div>
        <article className="rounded-xl border border-[#eee5dc] bg-white p-4 shadow-[0_14px_36px_rgba(34,25,18,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold leading-tight tracking-tight text-slate-950">
                Model Signal - Likelihood You'll Like This App
              </h2>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                {MODE_DETAILS[activeModel].description}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Gauge className="h-5 w-5" />
            </div>
          </div>

          {likelihood === null ? (
            <div className="mt-5 rounded-lg border border-dashed border-orange-200 bg-orange-50/45 p-5">
              <p className="text-sm font-semibold text-slate-950">Not ranked in this mode</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select an app from the recommendation rail to see its normalized recommendation score.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-4 xl:grid-cols-[96px_minmax(0,1fr)]">
              <div className="flex items-center justify-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#f97316 ${likelihood * 3.6}deg, #f3eee8 0deg)`,
                  }}
                >
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-xl font-semibold leading-none tracking-tight text-orange-600">
                      {scoreDisplay}
                    </span>
                    <span className="mt-1 text-[9px] font-medium leading-tight text-slate-500">
                      {likelihood >= 75 ? "High" : "Relative"} likelihood
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="line-clamp-1 text-sm leading-6 text-slate-600">
                  This score is predicted for you by our recommendation model.
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>0</span>
                    <span>0.5</span>
                    <span>1.0</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f3eee8]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                      style={{ width: `${likelihood}%` }}
                    />
                  </div>
                </div>

                {recommendation ? (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-slate-950">Key model factors</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Similar users", "Photography edits", "Color enhancement", "High engagement"].map(
                        (label) => (
                          <span
                            key={label}
                            className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700"
                          >
                            {label}
                          </span>
                        ),
                      )}
                    </div>
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
  selectedAppId,
  installedIds,
  onModeChange,
  onSelect,
  onInstall,
}: {
  activeModel: ModelId;
  recommendations: RecItem[];
  selectedAppId: string | null;
  installedIds: Set<string>;
  onModeChange: (modelId: ModelId) => void;
  onSelect: (appId: string) => void;
  onInstall: (appId: string) => void;
}) {
  const activeDetails = MODE_DETAILS[activeModel];

  return (
    <aside className={cn(PANEL_CLASS, "flex min-h-0 min-w-0 flex-col")}>
      <div className="border-b border-[#eee5dc] px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Recommendations</h2>
            <p className="mt-1 text-sm text-slate-500">Apps we think you'll like</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <ModeSelector activeModel={activeModel} onChange={onModeChange} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{activeDetails.description}</p>
      </div>

      <div className={cn("flex-1 overflow-y-auto p-5", HIDDEN_SCROLLBAR)}>
        <div className="space-y-3">
          {recommendations.map((item, index) => {
            const app = APP_DETAIL_MAP[item.id];
            const isInstalled = installedIds.has(item.id);
            const presentation =
              RECOMMENDATION_PRESENTATIONS[index % RECOMMENDATION_PRESENTATIONS.length];
            const displayScore = (0.92 - index * 0.06).toFixed(2);
            return (
              <article
                key={`${item.id}-${index}`}
                className={cn(
                  "relative w-full rounded-xl border bg-white p-3 pb-11 text-left shadow-[0_12px_28px_rgba(34,25,18,0.05)] transition hover:border-orange-200 hover:shadow-[0_18px_38px_rgba(34,25,18,0.09)]",
                  selectedAppId === item.id ? "border-orange-400" : "border-[#eee5dc]",
                )}
              >
                <button type="button" onClick={() => onSelect(item.id)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                        index < 3 ? "bg-orange-500 text-white" : "border border-slate-200 bg-white text-slate-600",
                      )}
                    >
                      {index + 1}
                    </span>
                    <AppIcon app={item} size="md" presentation={presentation} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-950">
                            {presentation.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {presentation.category}
                          </p>
                        </div>
                        <span className="shrink-0 text-right text-lg font-semibold leading-none text-orange-600">
                          {displayScore}
                          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                            Score
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {presentation.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {!isInstalled ? (
                  <button
                    type="button"
                    onClick={() => onInstall(item.id)}
                    className={cn(
                      "absolute bottom-3 right-3 inline-flex h-8 items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:bg-orange-700",
                      ORANGE_BUTTON,
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
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-3 lg:w-[780px]"
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
              "flex h-[68px] min-w-0 items-center gap-3 rounded-xl border px-4 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
              isActive
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-[#eadfd5] bg-white text-slate-700 hover:border-orange-200 hover:bg-[#fffaf5]",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isActive ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">{label}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span>
            </span>
          </button>
        );
      })}
    </div>
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
    <article className="rounded-lg border border-[#eee5dc] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(34,25,18,0.04)]">
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
      className="group rounded-lg border border-[#eee5dc] bg-white p-4 shadow-[0_12px_30px_rgba(34,25,18,0.04)] transition hover:border-orange-200 hover:bg-orange-50/35"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        </div>
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-orange-600" />
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
    "Generate frontend data from the database: app cards, install history, popularity candidates, item-item candidates, normalized model signals, and deterministic icon tiles.",
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
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

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <article className="rounded-lg border border-[#eee5dc] bg-white p-5 shadow-[0_12px_30px_rgba(34,25,18,0.04)]">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-semibold text-slate-950">Dataset Card</h3>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Source</dt>
                  <dd className="text-right font-semibold text-slate-900">Myket Android market</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Primary task</dt>
                  <dd className="text-right font-semibold text-slate-900">Interaction prediction</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Unit of analysis</dt>
                  <dd className="text-right font-semibold text-slate-900">User-app-time event</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Local database</dt>
                  <dd className="text-right font-semibold text-slate-900">SQLite, 3 tables</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Demo user</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    {DEMO_META.sessionId}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-lg border border-[#eee5dc] bg-white p-5 shadow-[0_12px_30px_rgba(34,25,18,0.04)]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-semibold text-slate-950">Data Engineering Notes</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                The app treats CSV files as untrusted boundaries. It requires exact headers,
                parses numeric values once, and writes typed records to SQLite. Downstream model
                and presentation code then query trusted database tables instead of re-validating
                raw CSV shapes.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Ratings and store install counts are useful presentation features, but they can
                leak future popularity if used for strict interaction-prediction benchmarks. The
                dashboard therefore keeps the core ranking evidence tied to install behavior.
              </p>
            </article>
          </div>

          <article className="mt-6 rounded-lg border border-[#eee5dc] bg-white p-5 shadow-[0_12px_30px_rgba(34,25,18,0.04)]">
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-orange-600" />
              <h3 className="text-base font-semibold text-slate-950">Transformations for Modeling</h3>
            </div>
            <div className="mt-4 grid gap-3">
              {transformations.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-lg bg-[#fbf7f2] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-4">
          <article className="rounded-lg border border-orange-100 bg-orange-50 p-5">
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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
            Model
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Recommendation logic that is explainable by design
          </h2>
        </div>
      </div>

      <p className="mt-5 max-w-4xl text-base leading-7 text-slate-600">
        The current dashboard compares two production-friendly ranking strategies. One is a
        popularity baseline; the other is item-item collaborative filtering over the install graph.
        Put simply: the first asks "what is popular overall?" and the second asks "what do people
        with similar app histories install next?"
      </p>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <article className="rounded-lg border border-[#eee5dc] bg-white p-5 shadow-[0_12px_30px_rgba(34,25,18,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Baseline
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Popularity ranking</h3>
            </div>
            <TrendingUp className="h-6 w-6 text-orange-600" />
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

        <article className="rounded-lg border border-[#eee5dc] bg-white p-5 shadow-[0_12px_30px_rgba(34,25,18,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Personalized
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Item-item collaborative filtering</h3>
            </div>
            <Network className="h-6 w-6 text-orange-600" />
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
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-lg border border-[#eee5dc] bg-white p-5 shadow-[0_12px_30px_rgba(34,25,18,0.04)]">
          <h3 className="text-base font-semibold text-slate-950">How the score is presented</h3>
          <div className="mt-4 grid gap-3">
            {[
              "Each model produces a ranked candidate list from SQL queries over the SQLite install graph.",
              "Raw counts are normalized to 0-100 signal values so different kinds of evidence can be shown on one UI scale.",
              "The dashboard converts those signals into a 0.00-1.00 likelihood-style score for readability. It is a relative demo score, not a calibrated probability.",
              "Installed apps are filtered out before display so recommendations stay actionable.",
            ].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-lg bg-[#fbf7f2] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-600 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-orange-100 bg-orange-50 p-5">
          <h3 className="text-base font-semibold text-slate-950">ML engineering read</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The current system is deliberately transparent: it favors ranking quality that can be
            inspected over opaque modeling. The next natural step is a graph model such as LightGCN
            or a PyTorch Geometric embedding pipeline, trained on the same user-app graph and
            evaluated against this popularity baseline.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            For non-technical readers: the app is looking for patterns in what people install
            together. If many users with your apps also installed another app, that app becomes a
            stronger recommendation.
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

  const installedIdSet = useMemo(() => new Set(installedAppIds), [installedAppIds]);
  const selectedApp = selectedAppId ? ALL_APPS.find((app) => app.id === selectedAppId) ?? null : null;
  const installedApps = installedAppIds
    .map((id) => ALL_APPS.find((app) => app.id === id))
    .filter((app): app is AppRecord => Boolean(app));
  const recommendations = RECOMMENDATION_MAP[activeModel]
    .filter((item) => !installedIdSet.has(item.id))
    .slice(0, 5);

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
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(255,122,24,0.10),transparent_28rem),linear-gradient(135deg,#fffaf5_0%,#f7f2eb_52%,#f4f6f8_100%)] p-4 text-slate-950 lg:h-screen lg:overflow-hidden">
      <header className="mx-auto mb-4 w-[calc(100vw-2rem)] max-w-[1500px] rounded-xl border border-[#ece3d9] bg-white/90 shadow-[0_18px_50px_rgba(34,25,18,0.08)] backdrop-blur lg:w-full">
        <div className="flex flex-col gap-5 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600 shadow-sm">
              <BrainCircuit className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="max-w-[14rem] truncate text-2xl font-semibold tracking-tight text-slate-950 sm:max-w-none">
                AppGraph Recommender
              </h1>
              <p className="mt-1 max-w-[14rem] truncate text-sm text-slate-500 sm:max-w-none">
                App Store · Machine Learning Recommendation System Demo
              </p>
            </div>
          </div>

          <HeaderTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </header>

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

            <AppInsightPanel app={selectedApp} activeModel={activeModel} />
          </section>

          <RecommendationPanel
            activeModel={activeModel}
            recommendations={recommendations}
            selectedAppId={selectedAppId}
            installedIds={installedIdSet}
            onModeChange={setActiveModel}
            onSelect={setSelectedAppId}
            onInstall={installApp}
          />
        </div>
      ) : null}
    </main>
  );
}
