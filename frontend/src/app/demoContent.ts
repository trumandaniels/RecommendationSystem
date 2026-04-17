export type ModelId = "popularity" | "item_item" | "hybrid_ranker";

export type SignalTone = "emerald" | "blue" | "cyan" | "amber" | "slate";

export type TagTone = "emerald" | "blue" | "cyan" | "amber" | "slate";

export type Thumbnail = {
  label: string;
  from: string;
  to: string;
};

export type SessionItem = {
  id: string;
  title: string;
  category: string;
  time: string;
  thumbnail: Thumbnail;
};

export type Signal = {
  label: string;
  value: number;
  tone: SignalTone;
};

export type Tag = {
  label: string;
  tone: TagTone;
};

export type Recommendation = {
  id: string;
  title: string;
  explanation: string;
  score: string;
  thumbnail: Thumbnail;
  signals: Signal[];
  tags: Tag[];
};

export type ModelView = {
  id: ModelId;
  label: string;
  eyebrow: string;
  summary: string;
  strength: string;
  caution: string;
  footer: string;
  recommendations: Recommendation[];
};

export const presentationHighlights = [
  {
    label: "Model views",
    value: "3",
    detail: "Popularity, collaborative filtering, and a final hybrid ranker compared on the same session.",
  },
  {
    label: "Recommendation depth",
    value: "Top 5",
    detail: "Each model shows its strongest next-item candidates with normalized scores and reason codes.",
  },
  {
    label: "Single session replay",
    value: "09:12-09:15",
    detail: "A fixed interaction path makes the model differences easy to explain live during a walkthrough.",
  },
  {
    label: "Readable explanations",
    value: "2 signals",
    detail: "Every row surfaces the strongest ranking signals so non-technical viewers can follow the logic.",
  },
];

export const storyPanels = [
  {
    title: "What this site is for",
    body: "Use this page to narrate how the same user session produces different ranked lists across your recommendation approaches.",
  },
  {
    title: "How to present it",
    body: "Start with the session history, flip through the model tabs, then explain why the hybrid view produces the most convincing next-item list.",
  },
  {
    title: "Where to customize",
    body: "Swap the content in `frontend/src/app/demoContent.ts` with your real items, scores, and experiment notes when your final outputs are ready.",
  },
];

export const pipelineSteps = [
  {
    title: "1. Session context",
    body: "Recent item views establish intent, category affinity, and a lightweight browsing narrative.",
  },
  {
    title: "2. Rank with each model",
    body: "Run the same session through a baseline, a collaborative model, and the strongest final ranker.",
  },
  {
    title: "3. Explain the output",
    body: "Show confidence, rationale, and the dominant signals so the ranking feels interpretable instead of mysterious.",
  },
];

export const sessionItems: SessionItem[] = [
  {
    id: "monitor",
    title: '27" 4K UHD Monitor',
    category: "Displays",
    time: "09:12 AM",
    thumbnail: { label: "MON", from: "#164e63", to: "#0891b2" },
  },
  {
    id: "keyboard",
    title: "Mechanical Keyboard",
    category: "Peripherals",
    time: "09:14 AM",
    thumbnail: { label: "KEY", from: "#1f2937", to: "#475569" },
  },
  {
    id: "dock",
    title: "Thunderbolt 4 Dock",
    category: "Accessories",
    time: "09:15 AM",
    thumbnail: { label: "DOC", from: "#78350f", to: "#d97706" },
  },
];

export const modelViews: ModelView[] = [
  {
    id: "popularity",
    label: "Popularity",
    eyebrow: "Fastest baseline",
    summary:
      "Ranks items that convert well overall, regardless of the active session's specific intent.",
    strength: "Easy to explain and cheap to compute. Great for establishing the baseline viewers should compare against.",
    caution: "The list is globally strong, but it underreacts to the user's immediate monitor-and-desk setup intent.",
    footer: "Use this view to frame the baseline before showing why personalized models outperform it.",
    recommendations: [
      {
        id: "webcam",
        title: "1080p HD Pro Webcam",
        explanation: "Very high global conversion rate across the electronics catalog.",
        score: "0.98",
        thumbnail: { label: "CAM", from: "#065f46", to: "#10b981" },
        signals: [
          { label: "Global demand", value: 98, tone: "emerald" },
          { label: "Session fit", value: 18, tone: "slate" },
        ],
        tags: [{ label: "Best seller", tone: "emerald" }],
      },
      {
        id: "mouse",
        title: "Ergonomic Wireless Mouse",
        explanation: "Frequently purchased accessory across a wide range of browsing sessions.",
        score: "0.95",
        thumbnail: { label: "MSE", from: "#0f766e", to: "#14b8a6" },
        signals: [
          { label: "Global demand", value: 95, tone: "emerald" },
          { label: "Session fit", value: 24, tone: "slate" },
        ],
        tags: [{ label: "Popular add-on", tone: "emerald" }],
      },
      {
        id: "stand",
        title: "Aluminum Laptop Stand",
        explanation: "Strong baseline item in office-accessory journeys.",
        score: "0.91",
        thumbnail: { label: "STD", from: "#1e3a8a", to: "#3b82f6" },
        signals: [
          { label: "Global demand", value: 91, tone: "emerald" },
          { label: "Session fit", value: 33, tone: "slate" },
        ],
        tags: [{ label: "Trending", tone: "emerald" }],
      },
      {
        id: "speakers",
        title: "Compact Desk Speakers",
        explanation: "Steady sitewide performance in electronics bundles.",
        score: "0.88",
        thumbnail: { label: "SPK", from: "#312e81", to: "#6366f1" },
        signals: [
          { label: "Global demand", value: 88, tone: "emerald" },
          { label: "Session fit", value: 12, tone: "slate" },
        ],
        tags: [{ label: "High volume", tone: "emerald" }],
      },
      {
        id: "deskmat",
        title: "Extended Desk Mat",
        explanation: "Persistent baseline performer with healthy attach rate.",
        score: "0.85",
        thumbnail: { label: "MAT", from: "#7c2d12", to: "#ea580c" },
        signals: [
          { label: "Global demand", value: 85, tone: "emerald" },
          { label: "Session fit", value: 28, tone: "slate" },
        ],
        tags: [{ label: "Reliable", tone: "emerald" }],
      },
    ],
  },
  {
    id: "item_item",
    label: "Item-Item CF",
    eyebrow: "Behavioral matching",
    summary:
      "Leans on co-view and co-purchase structure, so the ranking reacts to the monitor, keyboard, and dock sequence.",
    strength: "This view starts to mirror real shopping behavior and quickly surfaces natural bundle candidates.",
    caution: "It captures pairings well, but can still miss broader session intent when history is short or sparse.",
    footer: "Use this view to show the jump from generic catalog strength to interaction-aware recommendations.",
    recommendations: [
      {
        id: "arm",
        title: "Heavy-Duty Monitor Arm",
        explanation: "Strong co-view relationship with 4K monitors in workspace setups.",
        score: "0.94",
        thumbnail: { label: "ARM", from: "#0f172a", to: "#334155" },
        signals: [
          { label: "Co-view", value: 95, tone: "blue" },
          { label: "Category match", value: 86, tone: "cyan" },
        ],
        tags: [
          { label: "Bundle fit", tone: "blue" },
          { label: "Category match", tone: "cyan" },
        ],
      },
      {
        id: "lightbar",
        title: "Screen Light Bar",
        explanation: "Often viewed immediately after premium monitor detail pages.",
        score: "0.89",
        thumbnail: { label: "LGT", from: "#115e59", to: "#2dd4bf" },
        signals: [
          { label: "Co-view", value: 90, tone: "blue" },
          { label: "Similarity", value: 79, tone: "amber" },
        ],
        tags: [{ label: "Frequent next", tone: "blue" }],
      },
      {
        id: "mouse",
        title: "Ergonomic Wireless Mouse",
        explanation: "Frequently appears beside mechanical keyboards in the same sessions.",
        score: "0.82",
        thumbnail: { label: "MSE", from: "#0f766e", to: "#14b8a6" },
        signals: [
          { label: "Co-view", value: 84, tone: "blue" },
          { label: "Similarity", value: 61, tone: "amber" },
        ],
        tags: [{ label: "Peripheral pair", tone: "amber" }],
      },
      {
        id: "deskmat",
        title: "Extended Desk Mat",
        explanation: "Shows up often in accessory bundles with keyboards and mice.",
        score: "0.77",
        thumbnail: { label: "MAT", from: "#7c2d12", to: "#ea580c" },
        signals: [
          { label: "Co-view", value: 77, tone: "blue" },
          { label: "Similarity", value: 54, tone: "amber" },
        ],
        tags: [{ label: "Accessory set", tone: "amber" }],
      },
      {
        id: "stand",
        title: "Aluminum Laptop Stand",
        explanation: "Commonly paired with dock-heavy desk configurations.",
        score: "0.73",
        thumbnail: { label: "STD", from: "#1e3a8a", to: "#3b82f6" },
        signals: [
          { label: "Co-view", value: 74, tone: "blue" },
          { label: "Category match", value: 58, tone: "cyan" },
        ],
        tags: [{ label: "Workspace stack", tone: "cyan" }],
      },
    ],
  },
  {
    id: "hybrid_ranker",
    label: "Hybrid Ranker",
    eyebrow: "Presentation winner",
    summary:
      "Combines global strength, behavioral structure, and session intent to produce the most convincing next-item story.",
    strength: "Best for demos because the list feels both relevant and defensible. It explains why these five items belong together.",
    caution: "This is the strongest narrative view, but it depends on upstream feature quality and score calibration.",
    footer: "Use this as the final tab when you want to show the polished result that you would ship or evaluate deeper.",
    recommendations: [
      {
        id: "lightbar",
        title: "Screen Light Bar",
        explanation: "Strong monitor intent match and a common next purchase in premium desk setups.",
        score: "0.97",
        thumbnail: { label: "LGT", from: "#115e59", to: "#2dd4bf" },
        signals: [
          { label: "Intent", value: 98, tone: "cyan" },
          { label: "Behavior", value: 91, tone: "blue" },
        ],
        tags: [
          { label: "Session intent", tone: "cyan" },
          { label: "High confidence", tone: "slate" },
        ],
      },
      {
        id: "arm",
        title: "Heavy-Duty Monitor Arm",
        explanation: "High monitor affinity plus strong follow-on behavior from similar browsing trails.",
        score: "0.93",
        thumbnail: { label: "ARM", from: "#0f172a", to: "#334155" },
        signals: [
          { label: "Category", value: 95, tone: "cyan" },
          { label: "Behavior", value: 88, tone: "blue" },
        ],
        tags: [{ label: "Desk upgrade", tone: "cyan" }],
      },
      {
        id: "mouse",
        title: "Ergonomic Wireless Mouse",
        explanation: "Completes the keyboard-and-dock trail with a practical accessory add-on.",
        score: "0.88",
        thumbnail: { label: "MSE", from: "#0f766e", to: "#14b8a6" },
        signals: [
          { label: "Intent", value: 88, tone: "cyan" },
          { label: "Similarity", value: 84, tone: "amber" },
        ],
        tags: [{ label: "Profile fit", tone: "amber" }],
      },
      {
        id: "deskmat",
        title: "Extended Desk Mat",
        explanation: "Consistent fit with the broader desk-setup pattern without overpowering the top recommendations.",
        score: "0.84",
        thumbnail: { label: "MAT", from: "#7c2d12", to: "#ea580c" },
        signals: [
          { label: "Intent", value: 84, tone: "cyan" },
          { label: "Global demand", value: 80, tone: "emerald" },
        ],
        tags: [{ label: "Contextual", tone: "slate" }],
      },
      {
        id: "stand",
        title: "Aluminum Laptop Stand",
        explanation: "Rounds out the desk configuration while staying aligned with the dock-centered session.",
        score: "0.80",
        thumbnail: { label: "STD", from: "#1e3a8a", to: "#3b82f6" },
        signals: [
          { label: "Intent", value: 80, tone: "cyan" },
          { label: "Behavior", value: 74, tone: "blue" },
        ],
        tags: [{ label: "Usage pattern", tone: "slate" }],
      },
    ],
  },
];
