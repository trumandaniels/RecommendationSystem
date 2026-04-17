import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, History, Layers3, Network, Sparkles } from "lucide-react";
import {
  modelViews,
  pipelineSteps,
  presentationHighlights,
  sessionItems,
  storyPanels,
  type ModelId,
  type Recommendation,
  type SessionItem,
  type Signal,
  type Tag,
  type Thumbnail,
} from "./demoContent";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const tagStyles = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

const signalStyles = {
  emerald: "bg-emerald-500",
  blue: "bg-sky-500",
  cyan: "bg-cyan-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
} as const;

function GradientThumb({ thumbnail, large = false }: { thumbnail: Thumbnail; large?: boolean }) {
  return (
    <div
      className={cx(
        "flex shrink-0 items-end justify-start rounded-2xl border border-white/60 p-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white shadow-inner",
        large ? "h-16 w-16" : "h-12 w-12 rounded-xl",
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${thumbnail.from}, ${thumbnail.to})`,
      }}
    >
      {thumbnail.label}
    </div>
  );
}

function HighlightCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className="display-font mb-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      <p className="text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function StoryCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 backdrop-blur">
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function SessionCard({ item }: { item: SessionItem }) {
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <GradientThumb thumbnail={item.thumbnail} />
      <div className="min-w-0">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
          {item.time}
        </div>
        <div className="truncate text-sm font-semibold text-slate-900">{item.title}</div>
        <div className="text-xs text-slate-500">{item.category}</div>
      </div>
    </div>
  );
}

function TagChip({ label, tone }: Tag) {
  return (
    <span
      className={cx(
        "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        tagStyles[tone],
      )}
    >
      {label}
    </span>
  );
}

function SignalMeter({ label, value, tone }: Signal) {
  return (
    <div className="w-[92px]">
      <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={cx("h-full rounded-full", signalStyles[tone])}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({
  item,
  rank,
}: {
  item: Recommendation;
  rank: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0 }}
      className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] lg:grid-cols-[auto_auto_1fr_auto]"
    >
      <div className="flex items-center justify-center text-sm font-bold text-slate-400">
        #{rank}
      </div>
      <GradientThumb thumbnail={item.thumbnail} />
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
          {item.tags.map((tag) => (
            <TagChip key={tag.label} {...tag} />
          ))}
        </div>
        <p className="text-sm leading-6 text-slate-600">{item.explanation}</p>
      </div>
      <div className="flex flex-col justify-between gap-3 lg:items-end">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {item.signals.map((signal) => (
            <SignalMeter key={signal.label} {...signal} />
          ))}
        </div>
        <div className="text-left lg:text-right">
          <div className="display-font text-3xl font-bold tracking-tight text-slate-900">
            {item.score}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Score
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [activeModelId, setActiveModelId] = useState<ModelId>("hybrid_ranker");

  const activeModel = useMemo(
    () => modelViews.find((model) => model.id === activeModelId) ?? modelViews[0],
    [activeModelId],
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="bg-grid absolute inset-0 opacity-35" />
      <div className="absolute left-0 top-0 h-[28rem] w-[28rem] rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-amber-300/20 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="panel-shadow overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 backdrop-blur-xl">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Interactive Recommendation Results
              </div>

              <div className="max-w-3xl">
                <h1 className="display-font text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  A polished results site for showing how your recommender behaves in real time.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  This frontend is built from the provided Figma concept and organized for live demos:
                  one session history, three model views, and a recommendation panel that makes the
                  ranking story easy to explain.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {storyPanels.map((panel) => (
                  <StoryCard key={panel.title} {...panel} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/70 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
                    Demo flow
                  </div>
                  <div className="display-font mt-2 text-2xl font-bold tracking-tight">
                    Same-session model comparison
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <Layers3 className="h-6 w-6 text-cyan-200" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {presentationHighlights.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      {item.label}
                    </div>
                    <div className="display-font text-2xl font-bold tracking-tight">{item.value}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {pipelineSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-6 backdrop-blur"
            >
              <h2 className="mb-2 text-lg font-semibold text-slate-900">{step.title}</h2>
              <p className="text-sm leading-7 text-slate-600">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="panel-shadow overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5">
              {modelViews.map((model) => {
                const isActive = model.id === activeModelId;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setActiveModelId(model.id)}
                    className={cx(
                      "relative rounded-full px-4 py-2 text-sm font-semibold transition",
                      isActive ? "text-slate-950" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="active-model-pill"
                        className="absolute inset-0 rounded-full bg-slate-950"
                        transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
                      />
                    ) : null}
                    <span className={cx("relative z-10", isActive && "text-white")}>{model.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Network className="h-4 w-4 text-cyan-600" />
              Same browsing trail, different ranking logic
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[320px_1fr]">
            <aside className="border-r border-slate-100 bg-slate-50/60 p-5 lg:p-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <History className="h-4 w-4 text-slate-500" />
                Viewed in this session
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                A short sequence is enough to show how each ranking approach interprets the same user
                behavior differently.
              </p>

              <div className="relative mt-6 flex flex-col gap-4">
                <div className="absolute left-6 top-6 h-[calc(100%-3rem)] w-px bg-slate-200" />
                {sessionItems.map((item) => (
                  <SessionCard key={item.id} item={item} />
                ))}
              </div>
            </aside>

            <div className="p-5 lg:p-8">
              <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-950 p-6 text-white">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
                    {activeModel.eyebrow}
                  </div>
                  <h2 className="display-font mt-2 text-3xl font-bold tracking-tight">
                    {activeModel.label}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                    {activeModel.summary}
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ArrowRight className="h-4 w-4 text-cyan-600" />
                    Presenter notes
                  </div>
                  <div className="space-y-4 text-sm leading-7 text-slate-600">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        Strength
                      </div>
                      {activeModel.strength}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        Tradeoff
                      </div>
                      {activeModel.caution}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Recommended next
                  </div>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">Top five ranked products</h3>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Normalized scores per model
                </div>
              </div>

              <div className="flex min-h-[30rem] flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {activeModel.recommendations.map((item, index) => (
                    <RecommendationCard key={`${activeModel.id}-${item.id}`} item={item} rank={index + 1} />
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-cyan-100 bg-cyan-50/70 p-5 text-sm leading-7 text-cyan-950">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
                  Demo takeaway
                </div>
                {activeModel.footer}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
