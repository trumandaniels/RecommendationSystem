import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  History,
  Network,
  PlayCircle,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  DEMO_META,
  HISTORY as HISTORY_SEED,
  HOW_IT_WORKS_STEPS,
  MODEL_EXPLANATIONS,
  PRODUCT_DETAILS,
  RECOMMENDATIONS,
} from "./demoData.generated";

type ModelId = "popularity" | "item_item";
type AppTabId = "how_it_works" | "live_demo";
type TagType = "intent" | "similarity" | "coview" | "category" | "popularity";

type Signal = {
  label: string;
  value: number;
  color: string;
};

type Tag = {
  label: string;
  type: TagType;
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

type SessionItem = {
  id: string;
  title: string;
  category: string;
  time: string;
  image: string;
};

type ProductDetail = {
  id: string;
  title: string;
  category: string;
  image: string;
  subtitle: string;
  description: string;
  attributes: string[];
  facts: Array<{ label: string; value: string }>;
};

type ModelExplanation = {
  id: ModelId;
  title: string;
  eyebrow: string;
  summary: string;
  signals: string[];
};

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

function buildSessionTimestamp(index: number) {
  const minutesSinceNine = 12 + index * 2;
  const rawHour = 9 + Math.floor(minutesSinceNine / 60);
  const minute = minutesSinceNine % 60;
  const meridiem = rawHour >= 12 ? "PM" : "AM";
  const hour = ((rawHour + 11) % 12) + 1;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

const APP_TABS: Array<{ id: AppTabId; label: string }> = [
  { id: "how_it_works", label: "How this works" },
  { id: "live_demo", label: "Live Demo" },
];

const MODEL_TABS: Array<{ id: ModelId; label: string }> = [
  { id: "popularity", label: "Popularity" },
  { id: "item_item", label: "Item-Item CF" },
];

const TAG_STYLES: Record<TagType, string> = {
  intent: "border-violet-200 bg-violet-50 text-violet-700",
  similarity: "border-amber-200 bg-amber-50 text-amber-700",
  coview: "border-blue-200 bg-blue-50 text-blue-700",
  category: "border-cyan-200 bg-cyan-50 text-cyan-700",
  popularity: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const HISTORY: SessionItem[] = HISTORY_SEED.map((item) => ({ ...item }));
const PRODUCT_DETAIL_MAP = PRODUCT_DETAILS as Record<string, ProductDetail>;
const RECOMMENDATION_MAP = RECOMMENDATIONS as Record<ModelId, RecItem[]>;
const MODEL_EXPLANATION_LIST = MODEL_EXPLANATIONS as ModelExplanation[];
const HOW_IT_WORKS = HOW_IT_WORKS_STEPS as Array<{ title: string; body: string }>;

function TagBadge({ label, type }: Tag) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
        TAG_STYLES[type],
      )}
    >
      {label}
    </span>
  );
}

function SignalBar({ label, value, color }: Signal) {
  return (
    <div className="w-24">
      <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-200">
        <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProductThumb({
  image,
  title,
  className,
}: {
  image: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/70 bg-zinc-100", className)}>
      <img src={image} alt={title} className="h-full w-full object-cover" />
    </div>
  );
}

function RecommendationRow({
  item,
  isFocused,
  onOpen,
}: {
  item: RecItem;
  isFocused: boolean;
  onOpen: (productId: string) => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      onDoubleClick={() => onOpen(item.id)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-colors",
        isFocused ? "border-indigo-300" : "border-zinc-200 hover:border-zinc-300",
      )}
      title={`Double-click to enter ${item.title}`}
    >
      <ProductThumb image={item.image} title={item.title} className="h-20 w-20 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold tracking-tight text-zinc-950">{item.title}</h4>
          {item.tags.map((tag) => (
            <TagBadge key={`${item.id}-${tag.label}`} {...tag} />
          ))}
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{item.explanation}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {item.signals.map((signal) => (
            <SignalBar key={`${item.id}-${signal.label}`} {...signal} />
          ))}
        </div>
      </div>

      <div className="shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          {item.scoreLabel}
        </div>
        <div className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
          {item.score}
        </div>
      </div>
    </motion.button>
  );
}

function ProductSpotlight({
  detail,
  modelLabel,
  historyTime,
  recommendation,
}: {
  detail: ProductDetail;
  modelLabel: string;
  historyTime: string;
  recommendation?: RecItem;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="w-full rounded-[28px] border border-zinc-200 bg-[linear-gradient(140deg,#ffffff_0%,#f8fafc_46%,#eef2ff_100%)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
    >
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ProductThumb image={detail.image} title={detail.title} className="h-[220px] w-full" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span className="text-indigo-500">Product page</span>
            <span className="text-zinc-400">Centered at {historyTime}</span>
            <span className="text-zinc-400">{modelLabel}</span>
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{detail.title}</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">{detail.category}</p>
          <p className="mt-4 text-sm leading-6 text-zinc-700">{detail.subtitle}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{detail.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {detail.attributes.map((attribute) => (
              <span
                key={attribute}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700"
              >
                {attribute}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                Why it is centered
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {modelLabel} is the active ranking lens
              </p>
            </div>
            {recommendation ? (
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {recommendation.scoreLabel}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                  {recommendation.score}
                </p>
              </div>
            ) : null}
          </div>

          {recommendation ? (
            <>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{recommendation.explanation}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {recommendation.tags.map((tag) => (
                  <TagBadge key={`${detail.id}-${tag.label}`} {...tag} />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {recommendation.signals.map((signal) => (
                  <SignalBar key={`${detail.id}-${signal.label}`} {...signal} />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              This product started in the selected purchase session, so it is centered without a
              recommendation metric on the active tab.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Recorded attributes
          </p>
          <div className="mt-4 space-y-3">
            {detail.facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2.5"
              >
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/55">
                  {fact.label}
                </span>
                <span className="text-sm font-semibold text-white">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HowItWorksView() {
  return (
    <div className="bg-white p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 shadow-[0_8px_24px_rgb(0,0,0,0.03)]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-500">
            <Workflow className="h-4 w-4" />
            Ranking flow
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            One real session, two recommendation strategies
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            This demo uses a real purchase session and real SQLite-exported catalog metadata to
            compare purchase-volume popularity against item-item collaborative filtering.
          </p>

          <div className="mt-6 grid gap-4">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_8px_24px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                Data provenance
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
                What the demo is grounded in
              </h2>
            </div>
            <Database className="h-5 w-5 text-zinc-300" />
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
              Source snapshot
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-900">{DEMO_META.datasetLabel}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{DEMO_META.note}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                  Session id
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 break-all">
                  {DEMO_META.sessionId}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                  Session products
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {DEMO_META.sessionProductCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {MODEL_EXPLANATION_LIST.map((model) => (
              <div key={model.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                      {model.eyebrow}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-zinc-900">{model.title}</h3>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-zinc-300" />
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{model.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {model.signals.map((signal) => (
                    <span
                      key={`${model.id}-${signal}`}
                      className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LiveDemoView({
  activeModel,
  setActiveModel,
  history,
  focusedProductId,
  enterProductPage,
}: {
  activeModel: ModelId;
  setActiveModel: (model: ModelId) => void;
  history: SessionItem[];
  focusedProductId: string | null;
  enterProductPage: (productId: string) => void;
}) {
  const currentItems = RECOMMENDATION_MAP[activeModel];
  const activeModelTab = MODEL_TABS.find((tab) => tab.id === activeModel) ?? MODEL_TABS[0];
  const focusedDetail = focusedProductId ? PRODUCT_DETAIL_MAP[focusedProductId] : null;
  const focusedRecommendation =
    currentItems.find((item) => item.id === focusedProductId) ??
    Object.values(RECOMMENDATION_MAP)
      .flat()
      .find((item) => item.id === focusedProductId);
  const focusedHistoryItem = focusedProductId
    ? history.find((item) => item.id === focusedProductId)
    : undefined;

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-zinc-200/30 bg-zinc-200/50 p-1 shadow-inner">
            {MODEL_TABS.map((tab) => {
              const isActive = activeModel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModel(tab.id)}
                  className={cn(
                    "relative min-w-[132px] rounded-md px-4 py-1.5 text-[13px] font-semibold transition-colors",
                    isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700",
                  )}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="activeModelTab"
                      className="absolute inset-0 -z-10 rounded-md border border-zinc-200/50 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.06)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                    />
                  ) : null}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500">
            Session {DEMO_META.sessionId.slice(0, 8)}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium tracking-tight text-zinc-500">
          <Network className="h-4 w-4 text-zinc-400" />
          Double-click any row to center its product page
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <aside className="w-full shrink-0 border-r border-zinc-100 bg-zinc-50/40 p-6 md:w-[330px] md:p-8">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-zinc-900">
            <History className="h-4 w-4 text-zinc-400" />
            Purchased in this session
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            A real October 2019 purchase session exported from SQLite. Products are labeled from
            recorded brand, category, price, and product ID fields.
          </p>

          <div className="relative mt-5">
            <div className="absolute bottom-6 left-[31px] top-6 w-px bg-zinc-200" />
            <div className="relative z-10 flex flex-col gap-4">
              {history.map((item) => {
                const isFocused = item.id === focusedProductId;
                return (
                  <button
                    key={`${item.id}-${item.time}`}
                    type="button"
                    onDoubleClick={() => enterProductPage(item.id)}
                    title={`Double-click to center ${item.title}`}
                    className={cn(
                      "flex items-center gap-3.5 rounded-xl border bg-white p-2.5 pr-4 text-left shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-colors",
                      isFocused ? "border-indigo-300" : "border-zinc-200/80 hover:border-zinc-300",
                    )}
                  >
                    <ProductThumb image={item.image} title={item.title} className="h-12 w-12 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                        {item.time}
                      </div>
                      <div className="mt-1 text-xs font-semibold leading-tight text-zinc-900">
                        {item.title}
                      </div>
                      <div className="mt-1 text-[10px] font-medium text-zinc-500">
                        {item.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-white p-6 md:p-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2.5 text-sm font-bold text-zinc-900">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                {focusedDetail ? "Centered product page" : "Recommended next"}
              </h3>
              <p className="mt-2 text-xs text-zinc-500">
                {focusedDetail
                  ? "The selected product is centered with its recorded dataset attributes."
                  : `Same purchase session, different outputs on the ${activeModelTab.label} tab.`}
              </p>
            </div>
            <span className="text-right text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
              {focusedDetail ? "Dataset fields + ranking context" : "Top 5 candidates"}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {focusedDetail ? (
              <div className="mb-6">
                <ProductSpotlight
                  key={focusedDetail.id}
                  detail={focusedDetail}
                  modelLabel={activeModelTab.label}
                  historyTime={focusedHistoryItem?.time ?? buildSessionTimestamp(history.length - 1)}
                  recommendation={focusedRecommendation}
                />
              </div>
            ) : null}
          </AnimatePresence>

          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                {activeModelTab.label}
              </p>
              <h4 className="mt-1 text-sm font-semibold text-zinc-900">
                Real products, real counts, different ranking logic
              </h4>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {currentItems.map((item) => (
                <RecommendationRow
                  key={`${activeModel}-${item.id}`}
                  item={item}
                  isFocused={item.id === focusedProductId}
                  onOpen={enterProductPage}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTabId>("live_demo");
  const [activeModel, setActiveModel] = useState<ModelId>("popularity");
  const [history, setHistory] = useState<SessionItem[]>(HISTORY.map((item) => ({ ...item })));
  const [focusedProductId, setFocusedProductId] = useState<string | null>(HISTORY[0]?.id ?? null);

  function enterProductPage(productId: string) {
    const detail = PRODUCT_DETAIL_MAP[productId];
    if (!detail) {
      return;
    }

    setFocusedProductId(productId);
    setHistory((previous) => {
      const nextHistory = previous.filter((item) => item.id !== productId);
      return [
        ...nextHistory,
        {
          id: detail.id,
          title: detail.title,
          category: detail.category,
          image: detail.image,
          time: buildSessionTimestamp(nextHistory.length),
        },
      ];
    });
  }

  return (
    <div className="relative min-h-screen bg-[#F9FAFB] p-4 font-sans md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/70 via-white to-white" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1220px] flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
        <header className="flex flex-col gap-4 border-b border-zinc-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
              Recommendation System
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              Purchase-volume popularity vs. Item-Item CF
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              Dataset-backed demo built from {DEMO_META.datasetLabel}. The UI uses recorded
              product metadata from SQLite instead of hand-authored mock products.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-500">
              {DEMO_META.sessionProductCount} session products
            </div>
            <div className="flex rounded-lg border border-zinc-200/30 bg-zinc-200/50 p-1 shadow-inner">
              {APP_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative min-w-[156px] rounded-md px-4 py-2 text-[13px] font-semibold transition-colors",
                      isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700",
                    )}
                  >
                    {isActive ? (
                      <motion.div
                        layoutId="activeAppTab"
                        className="absolute inset-0 -z-10 rounded-md border border-zinc-200/50 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.06)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                      />
                    ) : null}
                    <span className="inline-flex items-center gap-2">
                      {tab.id === "how_it_works" ? (
                        <Workflow className="h-4 w-4" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )}
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {activeTab === "how_it_works" ? (
          <HowItWorksView />
        ) : (
          <LiveDemoView
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            history={history}
            focusedProductId={focusedProductId}
            enterProductPage={enterProductPage}
          />
        )}
      </div>
    </div>
  );
}
