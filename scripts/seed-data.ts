// Curia Demo Seed Data (Single source of truth converted from curia_demo_seed_data.md)

export interface DemoUser {
  email: string;
  username: string;
  displayName: string;
  bio: string;
}

export interface DemoCommunity {
  name: string;
  title: string;
  description: string;
  rules: string[];
  creator: string;
  moderators: string[];
  members: string[];
}

export type PostType = "text" | "image" | "link";

export interface DemoPost {
  key: string; // P01 to P24
  community: string;
  author: string;
  type: PostType;
  title: string;
  body: string | null;
  url?: string;
  imageUrl?: string;
  ageDays: number;
  score: number;
  pinned: boolean;
  targetCommentCount: number;
  threadKey: "T1" | "T2" | "T3" | "T4" | null;
}

export interface ThreadCommentNode {
  key?: string; // Stable seed key e.g. T1.1, T1.1.2
  author: string;
  score: number;
  offset: string; // e.g. '+12m', '+1h 20m'
  body: string;
  replies?: ThreadCommentNode[];
}

export interface FillerPools {
  generic: string[];
  perCommunity: Record<string, string[]>;
}

export const users: DemoUser[] = [
  {
    email: "demo1@curia.test",
    username: "aarav_dev",
    displayName: "Aarav Sharma",
    bio: "Full-stack dev. Next.js, Postgres, too many side projects.",
  },
  {
    email: "demo2@curia.test",
    username: "meera_codes",
    displayName: "Meera Iyer",
    bio: "Frontend engineer. Accessibility first.",
  },
  {
    email: "demo3@curia.test",
    username: "rohan_ml",
    displayName: "Rohan Verma",
    bio: "Learning machine learning, one weekend project at a time.",
  },
  {
    email: "demo4@curia.test",
    username: "priya_designs",
    displayName: "Priya Nair",
    bio: "Product designer. Dark UIs and empty states.",
  },
  {
    email: "demo5@curia.test",
    username: "kabir_builds",
    displayName: "Kabir Singh",
    bio: "Indie hacker. Shipping small tools.",
  },
  {
    email: "demo6@curia.test",
    username: "ananya_reads",
    displayName: "Ananya Gupta",
    bio: "Reader, reviewer, tea enthusiast.",
  },
  {
    email: "demo7@curia.test",
    username: "vikram_fit",
    displayName: "Vikram Rao",
    bio: "Calisthenics and long runs.",
  },
  {
    email: "demo8@curia.test",
    username: "isha_pixels",
    displayName: "Isha Patel",
    bio: "Pixel artist and game jam regular.",
  },
  {
    email: "demo9@curia.test",
    username: "dev_tanmay",
    displayName: "Tanmay Joshi",
    bio: "Backend dev. Postgres and performance.",
  },
  {
    email: "demo10@curia.test",
    username: "sara_ai",
    displayName: "Sara Khan",
    bio: "Prompt engineer. Cares about evals and guardrails.",
  },
  {
    email: "demo11@curia.test",
    username: "neel_ops",
    displayName: "Neel Desai",
    bio: "DevOps. Keeps the lights on.",
  },
  {
    email: "demo12@curia.test",
    username: "zoya_writes",
    displayName: "Zoya Ahmed",
    bio: "Writer and community helper.",
  },
];

export const communities: DemoCommunity[] = [
  {
    name: "webdev",
    title: "Web Development",
    description: "Questions, tips and discussion about building for the web.",
    rules: [
      "Be kind and specific. Share code, versions and what you already tried.",
      "No self-promotion without contributing to the discussion.",
      'Mark posts with a clear title. "Help!!" is not a title.',
    ],
    creator: "aarav_dev",
    moderators: ["meera_codes"],
    members: [
      "aarav_dev",
      "meera_codes",
      "rohan_ml",
      "priya_designs",
      "kabir_builds",
      "isha_pixels",
      "dev_tanmay",
      "neel_ops",
      "sara_ai",
    ],
  },
  {
    name: "ai_tools",
    title: "AI Tools and Prompts",
    description: "Prompts, APIs, tools and honest results from people building with AI.",
    rules: [
      "Share what worked and what did not.",
      "No API keys, ever. Redact them.",
      "Disclose it when you are promoting your own tool.",
    ],
    creator: "sara_ai",
    moderators: ["rohan_ml"],
    members: [
      "sara_ai",
      "rohan_ml",
      "aarav_dev",
      "dev_tanmay",
      "kabir_builds",
      "priya_designs",
      "neel_ops",
      "zoya_writes",
    ],
  },
  {
    name: "startups",
    title: "Startups and Side Projects",
    description: "Validation, shipping, pricing and lessons from small projects.",
    rules: [
      "Numbers beat opinions. Share them when you can.",
      "No fundraising spam or referral links.",
      "Critique ideas, not people.",
    ],
    creator: "kabir_builds",
    moderators: [],
    members: [
      "kabir_builds",
      "aarav_dev",
      "priya_designs",
      "zoya_writes",
      "vikram_fit",
      "sara_ai",
      "neel_ops",
    ],
  },
  {
    name: "design",
    title: "Design and UX",
    description: "Interfaces, visual design, research and accessibility.",
    rules: [
      "Show your work: screenshots, tokens, before and after.",
      "Give feedback that explains why.",
      "Credit sources and inspiration.",
    ],
    creator: "priya_designs",
    moderators: ["meera_codes"],
    members: [
      "priya_designs",
      "meera_codes",
      "aarav_dev",
      "isha_pixels",
      "zoya_writes",
      "kabir_builds",
    ],
  },
  {
    name: "gaming",
    title: "Gaming and Game Dev",
    description: "Game dev logs, jam recaps, pixel art and what you are playing.",
    rules: [
      "Mark spoilers clearly.",
      "Keep console and platform arguments out.",
      "Original art only unless credited.",
    ],
    creator: "isha_pixels",
    moderators: [],
    members: [
      "isha_pixels",
      "aarav_dev",
      "rohan_ml",
      "vikram_fit",
      "dev_tanmay",
      "priya_designs",
    ],
  },
  {
    name: "books",
    title: "Books and Reading",
    description: "What you are reading, recommendations and discussion.",
    rules: [
      "Spoiler tags for plot details.",
      "Recommend with a reason, not just a title.",
      "No piracy links.",
    ],
    creator: "ananya_reads",
    moderators: [],
    members: [
      "ananya_reads",
      "zoya_writes",
      "rohan_ml",
      "priya_designs",
      "vikram_fit",
      "aarav_dev",
    ],
  },
  {
    name: "fitness",
    title: "Fitness and Health",
    description: "Training, running, mobility and sustainable habits.",
    rules: [
      "Share experience, not medical advice.",
      "No extreme diet or body-shaming talk.",
      "Beginners are always welcome.",
    ],
    creator: "vikram_fit",
    moderators: [],
    members: [
      "vikram_fit",
      "neel_ops",
      "ananya_reads",
      "isha_pixels",
      "aarav_dev",
      "zoya_writes",
    ],
  },
  {
    name: "askcuria",
    title: "Ask Curia",
    description: "Questions about how Curia works, feedback and feature ideas.",
    rules: [
      "Search before asking.",
      "One question per post.",
      "Bug reports: say what you did, what you expected and what happened.",
    ],
    creator: "neel_ops",
    moderators: ["zoya_writes"],
    members: [
      "aarav_dev",
      "meera_codes",
      "rohan_ml",
      "priya_designs",
      "kabir_builds",
      "ananya_reads",
      "vikram_fit",
      "isha_pixels",
      "dev_tanmay",
      "sara_ai",
      "neel_ops",
      "zoya_writes",
    ],
  },
];

export const posts: DemoPost[] = [
  {
    key: "P24",
    community: "webdev",
    author: "aarav_dev",
    type: "text",
    ageDays: 20,
    score: 8,
    pinned: true,
    targetCommentCount: 3,
    threadKey: null,
    title: "c/webdev rules and how to ask a good question",
    body: "Welcome! Before you post: say what you are building, what you expected, what happened, and what you have already tried. Include versions (Next.js, Node, browser). Screenshots or a minimal repro help a lot. If your question is answered, reply with the fix so the next person finds it. Be kind, we were all beginners once.",
  },
  {
    key: "P01",
    community: "webdev",
    author: "aarav_dev",
    type: "text",
    ageDays: 3,
    score: 11,
    pinned: false,
    targetCommentCount: 14,
    threadKey: "T1",
    title: "Server Components vs Client Components: how do you decide?",
    body: "I keep going back and forth. My current approach is to default to server components and only add 'use client' when I need state, effects or browser APIs. But my pages end up with lots of tiny client islands (vote buttons, dropdowns, theme toggle). Is that a smell, or just how it works? What rule of thumb do you use?",
  },
  {
    key: "P02",
    community: "webdev",
    author: "meera_codes",
    type: "link",
    ageDays: 6,
    score: 9,
    pinned: false,
    targetCommentCount: 9,
    threadKey: null,
    title: "A practical checklist for keyboard-accessible web apps",
    url: "https://web.dev/learn/accessibility",
    body: "Tried tabbing through my own app after reading this. It was humbling. Focus order, visible focus rings and skip links were all broken. Sharing in case it saves someone else the embarrassment.",
  },
  {
    key: "P03",
    community: "webdev",
    author: "dev_tanmay",
    type: "text",
    ageDays: 11,
    score: 7,
    pinned: false,
    targetCommentCount: 6,
    threadKey: null,
    title: "Postgres tip: index the column you sort by, not only the one you filter by",
    body: "I had a feed query that filtered by `community_id` and sorted by `created_at desc`. It was fine at 1k rows and awful at 100k. A composite index on `(community_id, created_at desc)` made it instant. Check your `EXPLAIN ANALYZE` output for a sort step before you add caching.",
  },
  {
    key: "P04",
    community: "ai_tools",
    author: "sara_ai",
    type: "text",
    ageDays: 2,
    score: 11,
    pinned: false,
    targetCommentCount: 13,
    threadKey: "T2",
    title: "Which free LLM API are you using for side projects?",
    body: "Building a small app with summaries and a spam check. I want something free for the demo phase that returns clean JSON. What are you using, and what surprised you about it?",
  },
  {
    key: "P05",
    community: "ai_tools",
    author: "rohan_ml",
    type: "text",
    ageDays: 5,
    score: 10,
    pinned: false,
    targetCommentCount: 8,
    threadKey: null,
    title: "I built a thread summarizer in a weekend. What I learned about token budgets",
    body: "Biggest lesson: do not send the whole thread. I pick the top-scoring comments, cap the total, and make sure different depths are represented. Summaries got shorter, cheaper and, to my surprise, better. Also cache by content hash, otherwise you pay for the same thread twice.",
  },
  {
    key: "P06",
    community: "ai_tools",
    author: "sara_ai",
    type: "link",
    ageDays: 9,
    score: 8,
    pinned: false,
    targetCommentCount: 5,
    threadKey: null,
    title: "Prompt injection 101 for people building with LLMs",
    url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
    body: "If your app sends user text to a model, treat that text as data, not instructions. Wrap it in delimiters, tell the model to ignore instructions inside it, and never let the output trigger actions without validation.",
  },
  {
    key: "P07",
    community: "startups",
    author: "kabir_builds",
    type: "text",
    ageDays: 4,
    score: 10,
    pinned: false,
    targetCommentCount: 8,
    threadKey: "T4",
    title: "What's the cheapest way you've validated an idea before building it?",
    body: "I have burned months on things nobody wanted. This time I want a cheap test first. Landing page? Interviews? Pre-sales? What has actually worked for you?",
  },
  {
    key: "P08",
    community: "startups",
    author: "kabir_builds",
    type: "image",
    ageDays: 8,
    score: 7,
    pinned: false,
    targetCommentCount: 7,
    threadKey: null,
    title: "Our first 100 users, week by week",
    imageUrl: "https://picsum.photos/seed/curia-growth/1200/700",
    body: "Weeks 1 and 2 were almost all friends. Week 3 was the first time strangers showed up, and it was after a thread in a niche community, not after any ad.",
  },
  {
    key: "P09",
    community: "startups",
    author: "zoya_writes",
    type: "text",
    ageDays: 13,
    score: 5,
    pinned: false,
    targetCommentCount: 4,
    threadKey: null,
    title: "Writing a one-page product brief: the template I use",
    body: "Problem, who has it, how they cope today, the smallest thing that would help, how we will know it worked. If I cannot fill the last line, I am not ready to build.",
  },
  {
    key: "P10",
    community: "design",
    author: "priya_designs",
    type: "image",
    ageDays: 1,
    score: 11,
    pinned: false,
    targetCommentCount: 10,
    threadKey: null,
    title: "The dark UI palette I am using for a Reddit-style forum",
    imageUrl: "https://picsum.photos/seed/curia-palette/1200/700",
    body: "Near-black background, a slightly lighter surface, violet accent with a cyan glow for focus. The trick was keeping borders very subtle and using the accent sparingly. Feedback on contrast welcome.",
  },
  {
    key: "P11",
    community: "design",
    author: "priya_designs",
    type: "text",
    ageDays: 7,
    score: 9,
    pinned: false,
    targetCommentCount: 8,
    threadKey: null,
    title: "Hot take: design the empty states first",
    body: "Every list in your app will be empty on day one. If the first thing a new user sees is a blank page, you have lost them. Empty states are onboarding.",
  },
  {
    key: "P12",
    community: "design",
    author: "meera_codes",
    type: "link",
    ageDays: 10,
    score: 6,
    pinned: false,
    targetCommentCount: 4,
    threadKey: null,
    title: "Contrast checker for your design tokens",
    url: "https://webaim.org/resources/contrastchecker/",
    body: "Run every text and background token pair through this before you ship. Muted grey on dark surfaces is the usual culprit.",
  },
  {
    key: "P13",
    community: "gaming",
    author: "isha_pixels",
    type: "text",
    ageDays: 3,
    score: 9,
    pinned: false,
    targetCommentCount: 9,
    threadKey: null,
    title: "Game jam recap: 48 hours, 3 devs, 1 very buggy boss fight",
    body: "We scoped too big, cut the second level at hour 30 and shipped a boss fight that only works if you do not move. Still the most fun I have had all year. Key lesson: playable by hour 8, or it is not happening.",
  },
  {
    key: "P14",
    community: "gaming",
    author: "isha_pixels",
    type: "image",
    ageDays: 6,
    score: 7,
    pinned: false,
    targetCommentCount: 6,
    threadKey: null,
    title: "Pixel art tileset I made for our jam game",
    imageUrl: "https://picsum.photos/seed/curia-tiles/1200/700",
    body: "16x16 tiles, 8 colours. Trying to keep the palette tight so everything feels like one world.",
  },
  {
    key: "P15",
    community: "gaming",
    author: "aarav_dev",
    type: "text",
    ageDays: 12,
    score: 5,
    pinned: false,
    targetCommentCount: 12,
    threadKey: null,
    title: "What game do you replay every year?",
    body: "Mine is a cosy farming sim I somehow always restart in winter. Curious what your yearly comfort game is.",
  },
  {
    key: "P16",
    community: "books",
    author: "ananya_reads",
    type: "text",
    ageDays: 2,
    score: 8,
    pinned: false,
    targetCommentCount: 11,
    threadKey: null,
    title: "What is on your nightstand this month?",
    body: "I am juggling a slow literary novel and a fast thriller, and I keep picking the thriller. Share what you are reading and whether you would recommend it.",
  },
  {
    key: "P17",
    community: "books",
    author: "zoya_writes",
    type: "text",
    ageDays: 7,
    score: 6,
    pinned: false,
    targetCommentCount: 7,
    threadKey: null,
    title: "Books that changed how you think about work",
    body: "Looking for books about focus, craft or teamwork that are not just productivity hacks in disguise.",
  },
  {
    key: "P18",
    community: "books",
    author: "rohan_ml",
    type: "text",
    ageDays: 5,
    score: 7,
    pinned: false,
    targetCommentCount: 10,
    threadKey: null,
    title: "Best books to start machine learning without drowning in maths?",
    body: "I know basic Python. I want something that builds intuition first and formulas second. Recommendations and warnings both welcome.",
  },
  {
    key: "P19",
    community: "fitness",
    author: "vikram_fit",
    type: "text",
    ageDays: 4,
    score: 10,
    pinned: false,
    targetCommentCount: 9,
    threadKey: null,
    title: "Beginner routine: 3 days a week, 45 minutes, no gym needed",
    body: "Day A: squats, push-ups, rows (towel or table), plank. Day B: lunges, pike push-ups, glute bridges, dead bugs. Day C: easy run or brisk walk plus mobility. Start with 2 sets, add one set when it feels easy. Consistency beats intensity.",
  },
  {
    key: "P20",
    community: "fitness",
    author: "vikram_fit",
    type: "image",
    ageDays: 9,
    score: 6,
    pinned: false,
    targetCommentCount: 5,
    threadKey: null,
    title: "Morning run route around campus",
    imageUrl: "https://picsum.photos/seed/curia-run/1200/700",
    body: "About 5 km, mostly shaded, one gentle hill. Best at 6:30 before it gets hot.",
  },
  {
    key: "P21",
    community: "fitness",
    author: "neel_ops",
    type: "text",
    ageDays: 8,
    score: 6,
    pinned: false,
    targetCommentCount: 6,
    threadKey: null,
    title: "Desk-job stretches that actually help",
    body: "Hip flexor stretch, chest opener in a doorway, neck rolls and a 2 minute walk every hour. Boring, but my back stopped complaining.",
  },
  {
    key: "P22",
    community: "askcuria",
    author: "neel_ops",
    type: "text",
    ageDays: 14,
    score: 11,
    pinned: true,
    targetCommentCount: 7,
    threadKey: "T3",
    title: "Welcome to Curia! Read this first",
    body: "Curia is a place for topic-based discussion. Join communities, post text, images or links, reply in threads, and vote on what is useful. Karma is the sum of votes on your posts and comments. Be kind, search before posting, and use the report button if something is off. Questions go in the comments below.",
  },
  {
    key: "P23",
    community: "askcuria",
    author: "zoya_writes",
    type: "text",
    ageDays: 6,
    score: 6,
    pinned: false,
    targetCommentCount: 8,
    threadKey: null,
    title: "Feature requests: what would you like to see next?",
    body: 'Starting a list. Mine: saved posts, a "mark as solved" tag for questions, and email digests. Add yours.',
  },
];

export const threads: Record<"T1" | "T2" | "T3" | "T4", ThreadCommentNode[]> = {
  T1: [
    {
      key: "T1.1",
      author: "meera_codes",
      score: 9,
      offset: "+12m",
      body: "Rule of thumb: start on the server, and only add 'use client' when you need state, effects or browser APIs.",
      replies: [
        {
          key: "T1.1.1",
          author: "aarav_dev",
          score: 4,
          offset: "+20m",
          body: "That is what I have been doing, but my pages end up with tiny client islands everywhere. Is that okay?",
          replies: [
            {
              key: "T1.1.1.1",
              author: "meera_codes",
              score: 7,
              offset: "+31m",
              body: "Totally fine. Small islands are the point. Keep the interactive part (a vote button, a dropdown) on the client and pass data in as props.",
              replies: [
                {
                  key: "T1.1.1.1.1",
                  author: "dev_tanmay",
                  score: 5,
                  offset: "+48m",
                  body: "Just watch the props. Passing huge objects across the boundary serialises them and slows things down.",
                  replies: [
                    {
                      key: "T1.1.1.1.1.1",
                      author: "aarav_dev",
                      score: 4,
                      offset: "+1h",
                      body: "Good call. I was passing a whole post with 200 comments to the vote button. Fixed it to pass only the id and score.",
                      replies: [
                        {
                          key: "T1.1.1.1.1.1.1",
                          author: "neel_ops",
                          score: 3,
                          offset: "+1h 20m",
                          body: "This is the kind of bug that never shows in dev and hurts in production. Check the payload size in the network tab.",
                          replies: [
                            {
                              key: "T1.1.1.1.1.1.1.1",
                              author: "dev_tanmay",
                              score: 2,
                              offset: "+1h 35m",
                              body: "Also worth running a production build once and reading the First Load JS table.",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "T1.2",
      author: "isha_pixels",
      score: 3,
      offset: "+40m",
      body: "I just make everything a client component and move on. Honestly it ships faster for small projects.",
      replies: [
        {
          key: "T1.2.1",
          author: "priya_designs",
          score: 5,
          offset: "+55m",
          body: "Faster to write, slower to load. On a phone with a weak signal you will feel it.",
        },
        {
          key: "T1.2.2",
          author: "isha_pixels",
          score: 2,
          offset: "+1h 10m",
          body: "Fair, but for a game jam landing page nobody cares.",
          replies: [
            {
              key: "T1.2.2.1",
              author: "meera_codes",
              score: 3,
              offset: "+1h 25m",
              body: "Haha, agreed. Context matters. For anything with SEO or real users I would go server first.",
            },
          ],
        },
      ],
    },
    {
      key: "T1.3",
      author: "rohan_ml",
      score: 4,
      offset: "+2h",
      body: "Does fetching data in a server component mean I do not need TanStack Query at all?",
      replies: [
        {
          key: "T1.3.1",
          author: "aarav_dev",
          score: 6,
          offset: "+2h 15m",
          body: "For reads, mostly yes. I still use it for mutations and optimistic updates, like votes.",
          replies: [
            {
              key: "T1.3.1.1",
              author: "rohan_ml",
              score: 2,
              offset: "+2h 30m",
              body: "That split makes sense, thanks.",
            },
          ],
        },
      ],
    },
  ],
  T2: [
    {
      key: "T2.1",
      author: "rohan_ml",
      score: 9,
      offset: "+15m",
      body: "Gemini Flash free tier for prototypes. Good enough quality, structured JSON output works well, and the limits are fine for a demo.",
      replies: [
        {
          key: "T2.1.1",
          author: "sara_ai",
          score: 8,
          offset: "+25m",
          body: "Same. Biggest tip: cache results by content hash so you do not burn requests on repeat inputs.",
          replies: [
            {
              key: "T2.1.1.1",
              author: "kabir_builds",
              score: 5,
              offset: "+40m",
              body: "Caching saved me more than any model switch. Half my users hit the same few prompts.",
            },
          ],
        },
      ],
    },
    {
      key: "T2.2",
      author: "dev_tanmay",
      score: 7,
      offset: "+50m",
      body: "I run small open models locally with Ollama. No rate limits, no keys, works offline. Quality is lower but fine for classification.",
      replies: [
        {
          key: "T2.2.1",
          author: "aarav_dev",
          score: 4,
          offset: "+1h",
          body: "Local is great until you need to deploy. Where do you host it for a public demo?",
          replies: [
            {
              key: "T2.2.1.1",
              author: "dev_tanmay",
              score: 4,
              offset: "+1h 10m",
              body: "That is the catch. For public demos I switch to a hosted API. Local is for dev and tests.",
            },
          ],
        },
        {
          key: "T2.2.2",
          author: "sara_ai",
          score: 3,
          offset: "+1h 20m",
          body: "I disagree a bit: for moderation tasks, small local models gave me more false positives than I could live with.",
          replies: [
            {
              key: "T2.2.2.1",
              author: "dev_tanmay",
              score: 2,
              offset: "+1h 30m",
              body: "Fair. I only use them for coarse spam filtering, not for toxicity.",
            },
          ],
        },
      ],
    },
    {
      key: "T2.3",
      author: "priya_designs",
      score: 7,
      offset: "+2h",
      body: "As a non-ML person: I just want something that does not break my UI when it fails. Always build the fallback first.",
      replies: [
        {
          key: "T2.3.1",
          author: "neel_ops",
          score: 6,
          offset: "+2h 10m",
          body: "100%. Fail open, show a tooltip, never block posting because an AI call timed out.",
        },
      ],
    },
    {
      key: "T2.4",
      author: "kabir_builds",
      score: 3,
      offset: "+3h",
      body: "Anyone worried about depending on free tiers for a real product?",
      replies: [
        {
          key: "T2.4.1",
          author: "sara_ai",
          score: 5,
          offset: "+3h 15m",
          body: "Yes. Free tier for demos, paid plan once there are real users. Do not build a business on a free quota.",
          replies: [
            {
              key: "T2.4.1.1",
              author: "kabir_builds",
              score: 2,
              offset: "+3h 25m",
              body: "Makes sense. A budget line item from day one, then.",
            },
          ],
        },
      ],
    },
  ],
  T3: [
    {
      key: "T3.1",
      author: "zoya_writes",
      score: 4,
      offset: "+20m",
      body: "Thanks for setting this up! Quick question: does downvoting reduce someone's karma?",
      replies: [
        {
          key: "T3.1.1",
          author: "neel_ops",
          score: 6,
          offset: "+35m",
          body: "Yes. Karma is the sum of votes received on a user's posts and comments, so downvotes lower it. We recommend downvoting only for off-topic or low-effort content, not for disagreement.",
          replies: [
            {
              key: "T3.1.1.1",
              author: "zoya_writes",
              score: 2,
              offset: "+45m",
              body: "Good to know. Disagreement goes in the comments, then.",
            },
          ],
        },
      ],
    },
    {
      key: "T3.2",
      author: "isha_pixels",
      score: 3,
      offset: "+2h",
      body: "Can I create my own community?",
      replies: [
        {
          key: "T3.2.1",
          author: "neel_ops",
          score: 4,
          offset: "+2h 10m",
          body: "Yes, any logged-in user can. Names are 3 to 21 characters: lowercase letters, numbers and underscores.",
        },
      ],
    },
    {
      key: "T3.3",
      author: "ananya_reads",
      score: 3,
      offset: "+5h",
      body: "Love the dark theme. Is there a light mode toggle?",
      replies: [
        {
          key: "T3.3.1",
          author: "neel_ops",
          score: 3,
          offset: "+5h 10m",
          body: "Open the user menu in the top right. There is a theme toggle: dark, light or system.",
        },
      ],
    },
  ],
  T4: [
    {
      key: "T4.1",
      author: "priya_designs",
      score: 8,
      offset: "+30m",
      body: "A landing page with a waitlist form and a clear promise. If nobody signs up after you share it in five relevant communities, rethink.",
      replies: [
        {
          key: "T4.1.1",
          author: "kabir_builds",
          score: 3,
          offset: "+45m",
          body: "How many signups would you count as a signal?",
          replies: [
            {
              key: "T4.1.1.1",
              author: "priya_designs",
              score: 4,
              offset: "+1h",
              body: "I look at conversion rather than the raw count. In my experience 5 to 10 percent of visitors joining a waitlist is encouraging for a niche tool.",
            },
          ],
        },
      ],
    },
    {
      key: "T4.2",
      author: "aarav_dev",
      score: 7,
      offset: "+1h 15m",
      body: "Talk to 10 potential users first. A 20 minute call beats a week of coding.",
      replies: [
        {
          key: "T4.2.1",
          author: "zoya_writes",
          score: 4,
          offset: "+1h 30m",
          body: "And write down their exact words. They will describe the problem better than you do.",
        },
      ],
    },
    {
      key: "T4.3",
      author: "vikram_fit",
      score: 5,
      offset: "+2h",
      body: "Pre-sell it. If someone will not pay a small amount upfront, they probably will not pay later.",
      replies: [
        {
          key: "T4.3.1",
          author: "kabir_builds",
          score: 2,
          offset: "+2h 20m",
          body: "Hard for free consumer apps though.",
          replies: [
            {
              key: "T4.3.1.1",
              author: "vikram_fit",
              score: 2,
              offset: "+2h 35m",
              body: "True. For those I would measure repeat usage in a small group instead of payments.",
            },
          ],
        },
      ],
    },
  ],
};

export const fillerPools: FillerPools = {
  generic: [
    "Thanks for sharing this, really useful.",
    "Bookmarking this for later.",
    "Same experience here. It took me ages to figure out.",
    "Could you share a bit more detail on how you got there?",
    "Great write-up. The last paragraph is the part most people skip.",
    "I would add one thing: start small and iterate.",
    "This is exactly what I needed today.",
    "Slightly disagree, but I see where you are coming from.",
    "Any link to read more about this?",
    "Came here to say the same thing.",
    "Love this community. Quality posts like this keep me coming back.",
    "Has anyone tried this on a smaller scale first?",
    "Following. I would like to hear what others think.",
    "Solid advice. Wish I had read this a year ago.",
    "Good point, hadn't thought about it that way.",
    "Appreciate you taking the time to write this up.",
  ],
  perCommunity: {
    webdev: [
      "Did you measure this before and after? Curious about the numbers.",
      "Works on my machine, but I would test on a slower phone too.",
    ],
    ai_tools: [
      "Did you evaluate it on a test set, or is this vibes-based?",
      "Remember to handle the case where the API call fails.",
    ],
    startups: [
      "How long did this take you end to end?",
      "The distribution part is always harder than building it.",
    ],
    design: [
      "The spacing is great. What grid are you using?",
      "Have you checked the contrast on the muted text?",
    ],
    gaming: [
      "That art style is so clean.",
      "Jam games are the best way to learn scope, painfully.",
    ],
    books: [
      "Added to my reading list.",
      "Read it last year. The ending stayed with me.",
    ],
    fitness: [
      "Consistency really is everything. Thanks for the routine.",
      "Stretching after a run changed things for me.",
    ],
    askcuria: [
      "Thanks, that answers my question.",
      "+1 on this one, would love to see it.",
    ],
  },
};

/**
 * Parses time offset strings like '+12m', '+1h', '+1h 20m', '+3d' into minutes.
 */
export function parseOffsetToMinutes(offset: string): number {
  const clean = offset.replace(/^\+/, "").trim();
  let totalMinutes = 0;

  const dayMatch = clean.match(/(\d+)\s*d/);
  if (dayMatch) {
    totalMinutes += parseInt(dayMatch[1], 10) * 24 * 60;
  }

  const hourMatch = clean.match(/(\d+)\s*h/);
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1], 10) * 60;
  }

  const minMatch = clean.match(/(\d+)\s*m/);
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }

  return totalMinutes;
}

/**
 * Recursively counts comments in a thread tree.
 */
export function countThreadComments(nodes: ThreadCommentNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.replies && node.replies.length > 0) {
      count += countThreadComments(node.replies);
    }
  }
  return count;
}
