import { useMemo, useState } from "react";
import {
  BrainCircuit,
  Check,
  Download,
  Gauge,
  Info,
  Library,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import {
  APP_DETAILS,
  DEMO_META,
  HISTORY as HISTORY_SEED,
  RECOMMENDATIONS,
} from "./demoData.generated";

type ModelId = "popularity" | "item_item";
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
  subtitle: string;
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

const APP_DETAIL_MAP = APP_DETAILS as Record<string, AppDetail>;
const RECOMMENDATION_MAP = RECOMMENDATIONS as Record<ModelId, RecItem[]>;
const TAG_STYLES: Record<TagType, string> = {
  intent: "border-slate-200 bg-slate-50 text-slate-700",
  similarity: "border-amber-200 bg-amber-50 text-amber-800",
  coview: "border-blue-200 bg-blue-50 text-blue-800",
  category: "border-cyan-200 bg-cyan-50 text-cyan-800",
  popularity: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function getFact(app: AppDetail, label: string) {
  return app.facts.find((fact) => fact.label === label)?.value ?? "Unknown";
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
}: {
  app: Pick<AppDetail, "image" | "title">;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-lg border border-white bg-slate-100 shadow-sm",
        size === "sm" && "h-10 w-10",
        size === "md" && "h-12 w-12",
        size === "lg" && "h-20 w-20",
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
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950" title={value}>
        {value}
      </p>
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
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {options.map(({ id, icon: Icon }) => {
        const isActive = activeModel === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex h-9 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
              isActive
                ? "bg-slate-950 text-white shadow-sm"
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
    <aside className="flex min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              User state
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-950">Installed apps</h2>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Library className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {installedApps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
              <Download className="h-4 w-4" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">Start from a blank slate</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Install any app from the recommendation rail. Until then, popularity mode shows the
              most installed apps in the Myket sample.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {installedApps.map((app) => (
              <article
                key={app.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border bg-white p-2 transition hover:border-slate-300",
                  selectedAppId === app.id ? "border-slate-900" : "border-slate-200",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(app.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <AppIcon app={app} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{app.title}</p>
                    <p className="text-xs text-slate-500">{app.category}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onUninstall(app.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title={`Uninstall ${app.title}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={onClear}
          disabled={installedApps.length === 0}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Trash2 className="h-4 w-4" />
          Clear installs
        </button>
      </div>
    </aside>
  );
}

function DetailPanel({
  app,
  activeModel,
  isInstalled,
  onInstall,
  onUninstall,
}: {
  app: AppRecord | null;
  activeModel: ModelId;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  if (!app) {
    return (
      <section className="border-b border-slate-200 bg-white p-5">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
          <Info className="h-5 w-5 text-slate-500" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Choose an app</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Open any app to inspect its metadata and install it into the demo user profile.
          </p>
        </div>
      </section>
    );
  }

  const recommendation = recommendationForApp(app.id, activeModel);

  return (
    <section className="border-b border-slate-200 bg-white p-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-w-0 gap-4">
          <AppIcon app={app} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                App page
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {app.category}
              </span>
              {isInstalled ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Installed
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight text-slate-950">
              {app.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{app.subtitle}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{app.description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={isInstalled ? onUninstall : onInstall}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
              isInstalled
                ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                : "bg-slate-950 text-white hover:bg-slate-800",
            )}
          >
            {isInstalled ? <Trash2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {isInstalled ? "Uninstall" : "Install"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Rating" value={app.attributes[2]?.replace(" rating", "") ?? "N/A"} />
            <Metric label="Sample" value={getFact(app, "Sample installs")} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Package" value={app.id} />
        <Metric label="Store installs" value={getFact(app, "Store installs")} />
        <Metric label="Rating count" value={getFact(app, "Rating count")} />
        <Metric label="Evidence" value={recommendation?.scoreLabel ?? "Metadata"} />
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

  return (
    <section className="p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              App description
            </p>
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{app.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{app.description}</p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            The local Myket dataset does not include publisher-written long descriptions, screenshots,
            or icon URLs, so this section uses the metadata available in the sample.
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Model signal
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                {MODE_DETAILS[activeModel].shortLabel} likelihood
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <Gauge className="h-5 w-5" />
            </div>
          </div>

          {likelihood === null ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Not ranked in this mode</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select an app from the recommendation rail to see its normalized recommendation score.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-slate-950">
                  {likelihood}%
                </span>
                <span className="pb-2 text-sm font-semibold text-slate-500">relative score</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-950"
                  style={{ width: `${likelihood}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{recommendation?.explanation}</p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

function RecommendationPanel({
  installedCount,
  activeModel,
  recommendations,
  selectedAppId,
  installedIds,
  onModeChange,
  onSelect,
  onInstall,
}: {
  installedCount: number;
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
    <aside className="flex min-h-0 min-w-0 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Recommendations
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-950">{activeDetails.label}</h2>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <ModeSelector activeModel={activeModel} onChange={onModeChange} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {activeDetails.description}
          {activeModel === "item_item" && installedCount === 0
            ? " Load a real user to align the profile rail with this precomputed model view."
            : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {recommendations.map((item, index) => {
            const app = APP_DETAIL_MAP[item.id];
            const isInstalled = installedIds.has(item.id);
            return (
              <article
                key={`${item.id}-${index}`}
                className={cn(
                  "w-full rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md",
                  selectedAppId === item.id ? "border-slate-900" : "border-slate-200",
                )}
              >
                <button type="button" onClick={() => onSelect(item.id)} className="w-full text-left">
                  <div className="flex gap-3">
                    <AppIcon app={item} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-950">{item.title}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {app?.category ?? "Unknown category"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {item.score}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 2).map((tag) => (
                          <TagBadge key={`${item.id}-${tag.label}`} tag={tag} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                    {item.explanation}
                  </p>
                </button>

                {!isInstalled ? (
                  <button
                    type="button"
                    onClick={() => onInstall(item.id)}
                    className="mt-3 inline-flex h-8 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
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

export default function App() {
  const [activeModel, setActiveModel] = useState<ModelId>("popularity");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(DEFAULT_SELECTED_APP_ID);
  const [installedAppIds, setInstalledAppIds] = useState<string[]>([]);

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

  function loadDemoHistory() {
    setInstalledAppIds([...SEEDED_INSTALL_IDS]);
    setSelectedAppId(SEEDED_INSTALL_IDS[0] ?? DEFAULT_SELECTED_APP_ID);
    setActiveModel("item_item");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Portfolio ML demo
              </p>
              <span className="max-w-[180px] truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 sm:max-w-none">
                {DEMO_META.datasetLabel}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              AppGraph Recommender
            </h1>
          </div>

          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={loadDemoHistory}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <PackageCheck className="h-4 w-4" />
              Load real user
            </button>
            <div className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4" />
              <span className="truncate">Myket install graph</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-[1500px] grid-cols-1 overflow-hidden border-x border-slate-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <InstalledPanel
          installedApps={installedApps}
          selectedAppId={selectedAppId}
          onSelect={setSelectedAppId}
          onUninstall={uninstallApp}
          onClear={() => setInstalledAppIds([])}
        />

        <section className="min-w-0 bg-[#fbfcfd]">
          <div className="border-b border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  App page
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Inspect the selected app
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Use the right rail to switch ranking modes and install recommended apps into the
                  profile. The main canvas stays focused on the selected app's available metadata.
                </p>
              </div>

              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
                {activeModel === "popularity" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <BrainCircuit className="h-4 w-4" />
                )}
                <span className="truncate">{MODE_DETAILS[activeModel].label}</span>
              </div>
            </div>
          </div>

          <DetailPanel
            app={selectedApp}
            activeModel={activeModel}
            isInstalled={Boolean(selectedAppId && installedIdSet.has(selectedAppId))}
            onInstall={() => selectedAppId && installApp(selectedAppId)}
            onUninstall={() => selectedAppId && uninstallApp(selectedAppId)}
          />

          <AppInsightPanel app={selectedApp} activeModel={activeModel} />
        </section>

        <RecommendationPanel
          installedCount={installedApps.length}
          activeModel={activeModel}
          recommendations={recommendations}
          selectedAppId={selectedAppId}
          installedIds={installedIdSet}
          onModeChange={setActiveModel}
          onSelect={setSelectedAppId}
          onInstall={installApp}
        />
      </div>
    </main>
  );
}
