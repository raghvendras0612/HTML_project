import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Read .env.local manually for service role key
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found in current directory");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Demo Users Configuration (12 Users)
const DEMO_USERS = [
  {
    email: "demo1@curia.test",
    username: "alex_dev",
    display_name: "Alex Rivera",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Full-stack engineer building high-performance web applications with React, Next.js, and Postgres.",
  },
  {
    email: "demo2@curia.test",
    username: "elena_ai",
    display_name: "Dr. Elena Rostova",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    bio: "AI research scientist specializing in multimodal models, prompt defense, and LLM alignment.",
  },
  {
    email: "demo3@curia.test",
    username: "marcus_ux",
    display_name: "Marcus Chen",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Design systems obsessive. Focused on micro-interactions, WCAG AA compliance, and dark-first tokens.",
  },
  {
    email: "demo4@curia.test",
    username: "sarah_sys",
    display_name: "Sarah Kim",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    bio: "Distributed systems architect. Rust & Go enthusiast obsessed with low-latency streaming.",
  },
  {
    email: "demo5@curia.test",
    username: "chen_code",
    display_name: "Wei Chen",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    bio: "Senior backend developer writing high-throughput database engines and exploring zero-knowledge proofs.",
  },
  {
    email: "demo6@curia.test",
    username: "olivia_data",
    display_name: "Olivia Patel",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    bio: "Data platform engineer. Transforming petabytes into real-time business insights with DuckDB and ClickHouse.",
  },
  {
    email: "demo7@curia.test",
    username: "david_ops",
    display_name: "David Miller",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    bio: "Site reliability and cloud infra specialist. Automating Kubernetes clusters and eliminating downtime.",
  },
  {
    email: "demo8@curia.test",
    username: "maya_sec",
    display_name: "Maya Lin",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "Application security engineer and red team researcher. Hardening APIs and breaking cryptographic protocols.",
  },
  {
    email: "demo9@curia.test",
    username: "sam_frontend",
    display_name: "Sam Becker",
    avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    bio: "Frontend engineer and CSS wizard. Creating beautiful, fluid user interfaces and smooth 60fps animations.",
  },
  {
    email: "demo10@curia.test",
    username: "nina_ml",
    display_name: "Nina Johansson",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    bio: "Machine learning engineer deploying edge inference models and optimizing neural network quantization.",
  },
  {
    email: "demo11@curia.test",
    username: "lucas_rust",
    display_name: "Lucas Rossi",
    avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    bio: "Systems programmer building embedded microcontrollers, memory-safe OS kernels, and audio DSP engines in Rust.",
  },
  {
    email: "demo12@curia.test",
    username: "priya_cloud",
    display_name: "Priya Sharma",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Cloud native developer advocate and serverless enthusiast building event-driven microservices.",
  },
];

// 8 Communities with distinct themes and 3 rules each
const DEMO_COMMUNITIES = [
  {
    name: "webdev",
    title: "Web Development",
    description: "Modern frontend, backend, SSR frameworks, edge runtimes, browser standards, and web architecture.",
    rules: [
      { title: "Constructive Code Reviews", body: "Focus technical critique on design patterns and architecture rather than author personality." },
      { title: "No Low-Effort Memes", body: "Discussions should center on real-world engineering experiences, benchmarks, and solutions." },
      { title: "Format Code Snippets", body: "Always use code blocks with proper syntax highlighting to ensure readability." },
    ],
  },
  {
    name: "ai_tools",
    title: "AI Tools & LLM Engineering",
    description: "Building production systems with language models, prompt engineering, agentic workflows, and local open-weights inference.",
    rules: [
      { title: "Cite Benchmarks and Models", body: "Specify exact model names, quantizations, and evaluation methodologies when sharing results." },
      { title: "No Pure Marketing Hype", body: "Commercial product pitches without technical architectures will be removed." },
      { title: "Responsible Disclosure", body: "Prompt injection vulnerabilities in active commercial products must be reported safely." },
    ],
  },
  {
    name: "startups",
    title: "Tech Startups & Indie Hacking",
    description: "Bootstrapping, venture capital, early PMF, SaaS metrics, technical co-founding, and scaling modern companies.",
    rules: [
      { title: "Transparent Metrics", body: "Share authentic numbers, challenges, and post-mortems rather than vanity revenue screenshots." },
      { title: "Actionable Advice", body: "Offer actionable playbooks backed by actual founder experience." },
      { title: "Respect Confidentiality", body: "Do not disclose private investor communications or confidential metrics without consent." },
    ],
  },
  {
    name: "design",
    title: "Design Systems & UI Engineering",
    description: "Tokens, typography, micro-interactions, layout grids, accessibility standards, and component libraries.",
    rules: [
      { title: "WCAG Accessibility First", body: "Color contrast and accessible tap targets must always be considered in critiques." },
      { title: "Include Context", body: "When sharing UI screenshots, explain the user journey and constraints." },
      { title: "Attribute Inspiration", body: "Credit design system inspirations, open-source libraries, and designers." },
    ],
  },
  {
    name: "gaming",
    title: "Game Development & Engine Tech",
    description: "Shaders, physics engines, game design, Unreal Engine, Unity, Godot, and low-level graphics programming.",
    rules: [
      { title: "Specify Engine & Platform", body: "Always include engine version and target platforms in debugging threads." },
      { title: "Respect Spoilers", body: "Use markdown spoiler tags when analyzing commercial story-driven mechanics." },
      { title: "No Piracy or Cracks", body: "Discussions must center exclusively on development and technical implementation." },
    ],
  },
  {
    name: "books",
    title: "Technical Books & Publications",
    description: "Deep readings in software engineering, computer science classics, distributed algorithms, and system design.",
    rules: [
      { title: "In-Depth Summaries", body: "Provide chapter highlights and personal takeaways rather than brief ratings." },
      { title: "Encourage Diverse Perspectives", body: "Critique theories and methodologies with intellectual honesty." },
      { title: "Legal Sources Only", body: "Link only to official publishers, author websites, and legal open-access publications." },
    ],
  },
  {
    name: "fitness",
    title: "Developer Fitness & Ergonomics",
    description: "Ergonomic desk setups, physical training, mental wellness, RSI prevention, and sustained developer health.",
    rules: [
      { title: "No Medical Advice", body: "Share personal fitness routines, but consult certified physical therapists for injuries." },
      { title: "Scientific Backing", body: "Cite peer-reviewed ergonomics and physiology principles where relevant." },
      { title: "Supportive Culture", body: "Encourage beginners with positive reinforcement and practical advice." },
    ],
  },
  {
    name: "askcuria",
    title: "Ask Curia: Engineering Q&A",
    description: "A forum for technical inquiries, career architectural guidance, post-mortems, and engineering discussions.",
    rules: [
      { title: "Detailed Questions", body: "Provide reproducible examples, error logs, and attempted solutions in all requests." },
      { title: "Civil Discourse", body: "Treat all inquiries with respect regardless of engineer seniority." },
      { title: "Mark Solutions", body: "Update question threads with what ultimately fixed your problem." },
    ],
  },
];

// Helper to generate a random password
function generateSecurePassword(): string {
  return "CuriaDemo!" + crypto.randomBytes(6).toString("hex");
}

// --------------------------------------------------------------------------
// RESET DEMO DATA
// --------------------------------------------------------------------------
async function resetDemoData() {
  console.log("🧹 Resetting Curia demo data...");

  // 1. Fetch existing demo users by email prefix or domain
  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (listErr) {
    console.error("Error listing users:", listErr);
    return;
  }

  const demoUsers = usersData.users.filter(
    (u) => u.email?.endsWith("@curia.test") && u.email.startsWith("demo")
  );
  const demoUserIds = demoUsers.map((u) => u.id);

  console.log(`Found ${demoUserIds.length} demo users to clean up.`);

  if (demoUserIds.length > 0) {
    // 2. Delete votes by demo users
    await admin.from("votes").delete().in("user_id", demoUserIds);

    // 3. Delete comments by demo users
    await admin.from("comments").delete().in("author_id", demoUserIds);

    // 4. Delete posts by demo users
    await admin.from("posts").delete().in("author_id", demoUserIds);

    // 5. Delete memberships and bans
    await admin.from("community_members").delete().in("user_id", demoUserIds);
    await admin.from("community_bans").delete().in("user_id", demoUserIds);
    await admin.from("reports").delete().in("reporter_id", demoUserIds);
    await admin.from("notifications").delete().in("user_id", demoUserIds);

    // 6. Delete profiles
    await admin.from("profiles").delete().in("id", demoUserIds);

    // 7. Delete auth users
    for (const u of demoUsers) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }

  // 8. Delete demo communities (only if creator was demo user or match names)
  const demoCommNames = DEMO_COMMUNITIES.map((c) => c.name).filter((n) => n !== "testlab");
  await admin.from("communities").delete().in("name", demoCommNames);

  console.log("✅ Demo data reset completed cleanly.\n");
}

// --------------------------------------------------------------------------
// SEED ENGINE
// --------------------------------------------------------------------------
async function seedDemoData() {
  console.log("🌱 Starting Curia Idempotent Seeding...");

  const demoPassword = generateSecurePassword();
  console.log(`🔑 Demo Accounts Password: ${demoPassword} (printed once for convenience)\n`);

  // 1. Provision 12 Demo Users
  const userMap = new Map<string, { id: string; username: string }>();

  for (const cfg of DEMO_USERS) {
    // Check if user already exists
    const { data: existingProfiles } = await admin
      .from("profiles")
      .select("id, username")
      .eq("username", cfg.username)
      .maybeSingle();

    if (existingProfiles) {
      userMap.set(cfg.username, existingProfiles);
      console.log(`👤 User @${cfg.username} already exists (ID: ${existingProfiles.id})`);
    } else {
      // Create via Auth Admin API
      const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
        email: cfg.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          username: cfg.username,
          display_name: cfg.display_name,
        },
      });

      if (authErr || !authUser.user) {
        console.error(`Failed to create auth user ${cfg.email}:`, authErr?.message);
        continue;
      }

      const uid = authUser.user.id;

      // Upsert profile
      await admin.from("profiles").upsert({
        id: uid,
        username: cfg.username,
        display_name: cfg.display_name,
        avatar_url: cfg.avatar_url,
        bio: cfg.bio,
        karma: 150 + Math.floor(Math.random() * 850),
      });

      userMap.set(cfg.username, { id: uid, username: cfg.username });
      console.log(`✨ Created user @${cfg.username} (${cfg.email})`);
    }
  }

  const userList = Array.from(userMap.values());
  if (userList.length === 0) {
    throw new Error("No users available for seeding.");
  }

  // 2. Provision 8 Communities
  const commMap = new Map<string, { id: string; name: string }>();

  for (let i = 0; i < DEMO_COMMUNITIES.length; i++) {
    const commCfg = DEMO_COMMUNITIES[i];
    const creator = userList[i % userList.length];

    const { data: existingComm } = await admin
      .from("communities")
      .select("id, name")
      .eq("name", commCfg.name)
      .maybeSingle();

    if (existingComm) {
      commMap.set(commCfg.name, existingComm);
      console.log(`🏰 Community c/${commCfg.name} already exists (ID: ${existingComm.id})`);
    } else {
      const { data: newComm, error: commErr } = await admin
        .from("communities")
        .insert({
          name: commCfg.name,
          title: commCfg.title,
          description: commCfg.description,
          rules: commCfg.rules,
          creator_id: creator.id,
          member_count: 50 + Math.floor(Math.random() * 450),
        })
        .select("id, name")
        .single();

      if (commErr || !newComm) {
        console.error(`Failed to create community ${commCfg.name}:`, commErr?.message);
        continue;
      }

      commMap.set(commCfg.name, newComm);
      console.log(`✨ Created community c/${commCfg.name} (creator: @${creator.username})`);

      // Assign creator as moderator
      await admin.from("community_members").upsert(
        {
          community_id: newComm.id,
          user_id: creator.id,
          role: "moderator",
        },
        { onConflict: "community_id,user_id" }
      );

      // Add random demo users as members
      for (const u of userList) {
        if (u.id !== creator.id && Math.random() > 0.3) {
          await admin.from("community_members").upsert(
            {
              community_id: newComm.id,
              user_id: u.id,
              role: "member",
            },
            { onConflict: "community_id,user_id" }
          );
        }
      }
    }
  }

  // 3. Provision 40 Realistic Posts
  console.log("\n📝 Seeding 40 realistic posts across communities...");

  const POST_TEMPLATES = [
    // c/webdev
    {
      comm: "webdev",
      type: "text",
      title: "Why React Server Components (RSC) completely transformed our multi-tenant SaaS architecture",
      body: `Over the past six months, our engineering team migrated our core customer dashboard to Next.js App Router and React Server Components.
Here are the primary architectural lessons learned:
1. **Zero Client Bundle for Data Layer**: We eliminated over 140KB of frontend client libraries by executing data formatting on the server.
2. **Streaming & Suspense**: Loading boundaries prevent blocking page transitions. Skeletons pop instantly, and heavyweight analytical grids stream in progressively.
3. **Optimistic Updates**: Using TanStack Query for interactive mutation leaves user feedback feeling instantaneous.

What has been your experience transitioning production workloads to Server Components?`,
    },
    {
      comm: "webdev",
      type: "link",
      title: "V8 JavaScript Engine: High-performance memory management and generational garbage collection",
      url: "https://v8.dev/blog/concurrent-marking",
      body: "Comprehensive architectural breakdown from the V8 team on concurrent marking and write barrier optimizations.",
    },
    {
      comm: "webdev",
      type: "image",
      title: "Clean Design System Token Hierarchy & CSS Variables Structure",
      image_path: "https://picsum.photos/seed/webdev1/1200/630",
      body: "Our finalized design tokens schema showing semantic surface, border, and glow layers.",
    },
    {
      comm: "webdev",
      type: "text",
      title: "Benchmarking PostgreSQL Row Level Security (RLS) throughput under 10,000 concurrent sessions",
      body: `We put PostgreSQL Row Level Security (RLS) under sustained load using k6.
Key takeaways:
- Using \`(select auth.uid()) = user_id\` instead of \`auth.uid() = user_id\` allows Postgres to optimize the query plan as a stable subquery.
- Covering indexes on \`(user_id, created_at desc)\` reduced 99th percentile query latency from 85ms to 2.4ms.
- Connection pooling with PgBouncer is mandatory when scaling past 2,000 active WebSocket connections.`,
    },
    {
      comm: "webdev",
      type: "text",
      title: "TypeScript 5.5 Inferred Type Predicates: No more manual type guards",
      body: "TypeScript 5.5 automatically infers type guards for functions returning boolean filter checks. This cleans up Array.prototype.filter() chains across our entire codebase.",
    },
    // c/ai_tools
    {
      comm: "ai_tools",
      type: "text",
      title: "Prompt Injection Defenses: Why passive data delimiters (<USER_SUBMITTED_TEXT>) are mandatory",
      body: `When piping user content into LLMs for automated moderation or summarization, treating user strings as raw prompt text invites jailbreaks.
Using explicit XML/HTML-style delimiters combined with unambiguous system instructions tells the model to treat the wrapped block strictly as inert payload.

In our stress tests, prompt boundary tags blocked 99.4% of directive override attempts.`,
    },
    {
      comm: "ai_tools",
      type: "link",
      title: "Google AI Gemini 2.5 Flash: 1M token context window and sub-second reasoning latency",
      url: "https://ai.google.dev",
      body: "Official documentation and developer benchmarks for the Gemini 2.5 family of multimodal models.",
    },
    {
      comm: "ai_tools",
      type: "image",
      title: "Quantization Benchmarks: FP16 vs INT8 vs INT4 Inference Latency & VRAM footprint",
      image_path: "https://picsum.photos/seed/aitools1/1200/630",
      body: "Detailed comparison charts across Llama-3-70B and Mistral-Large running locally on dual RTX 4090s.",
    },
    {
      comm: "ai_tools",
      type: "text",
      title: "Thread Summarization Architectures: Combining SHA-256 caching with streaming synthesis",
      body: "How we implemented discussion synthesis on Curia using content hashes of post comment counts to ensure zero redundant Gemini tokens.",
    },
    {
      comm: "ai_tools",
      type: "text",
      title: "Building Deterministic Agents: Structured JSON Schemas in Production Workflows",
      body: "Relying on regex to extract JSON from LLM prose is fragile. Native JSON schema enforcement ensures typed objects that never throw parsing errors.",
    },
    // c/startups
    {
      comm: "startups",
      type: "text",
      title: "From 0 to $20k MRR in 8 months: The unglamorous technical and sales truth",
      body: `Most startup stories gloss over the sheer volume of manual outreach required in the early days.
Here is what actually drove our growth:
1. Building in public on Curia and Twitter.
2. Talking to 5 churned customers every week without being defensive.
3. Saying no to enterprise customization requests that would derail our product roadmap.`,
    },
    {
      comm: "startups",
      type: "link",
      title: "Paul Graham: How to Get Startup Ideas and Discover Organic Demand",
      url: "https://paulgraham.com/startupideas.html",
      body: "The classic essay on living at the leading edge and noticing what is missing.",
    },
    {
      comm: "startups",
      type: "image",
      title: "Our Cohort Retention Curve After Shipping the New Onboarding Flow",
      image_path: "https://picsum.photos/seed/startups1/1200/630",
      body: "Month 1 retention flattened at 48% after simplifying signup and adding instant workspace presets.",
    },
    {
      comm: "startups",
      type: "text",
      title: "Solo Founder vs Co-founder: Lessons after founding both ways",
      body: "Going solo gives you speed and absolute decision-making autonomy. Having a technical co-founder provides psychological resilience during the inevitable troughs of sorrow.",
    },
    {
      comm: "startups",
      type: "text",
      title: "Bootstrapping on Free Tiers: How modern tech stacks keep burn rate near zero",
      body: "Using Supabase free tier for PostgreSQL and Auth, Vercel for edge deployment, and Google AI Studio for Gemini prototyping lets founders validate PMF before raising capital.",
    },
    // c/design
    {
      comm: "design",
      type: "text",
      title: "Designing for Darkness: Obsidian tokens, soft borders, and luminance hierarchy",
      body: `Pure black (#000000) causes intense eye strain and harsh contrast with bright white text.
Curia uses #0B0D12 for the background, #12151C for cards, and #181C25 for interactive surfaces.
Paired with 1px borders (#232834) and subtle violet glows, the interface achieves depth without visual noise.`,
    },
    {
      comm: "design",
      type: "image",
      title: "Typography Scale Comparison: Inter UI vs JetBrains Mono for Metadata",
      image_path: "https://picsum.photos/seed/design1/1200/630",
      body: "Visual specimen of our twin font pairing across badges, timestamps, and body paragraphs.",
    },
    {
      comm: "design",
      type: "link",
      title: "Refactoring UI: Practical design advice for developers without design degrees",
      url: "https://www.refactoringui.com",
      body: "Essential reading for engineers who want their apps to look intentional and polished.",
    },
    {
      comm: "design",
      type: "text",
      title: "Micro-interactions that matter: 150ms transitions and optimistic feedback",
      body: "Why perceived speed matters more than raw benchmark milliseconds. Immediate button scale animations and instant vote score increments make web apps feel native.",
    },
    {
      comm: "design",
      type: "text",
      title: "Designing Accessible Forms: Floating labels, inline validation, and keyboard traps",
      body: "Ensuring every input has clear error states, aria-describedby links, and natural tab order.",
    },
    // c/gaming
    {
      comm: "gaming",
      type: "text",
      title: "Building a custom voxel engine in Rust and WGPU: 60 FPS at 32 chunk render distance",
      body: `Greedy meshing combined with compute shader frustum culling gave us a 4x framerate uplift.
We moved chunk generation entirely to multi-threaded Rayon workers, eliminating main-thread stuttering completely.`,
    },
    {
      comm: "gaming",
      type: "image",
      title: "Raytraced Global Illumination Screenshot in Godot 4.3 Forward+ Renderer",
      image_path: "https://picsum.photos/seed/gaming1/1200/630",
      body: "Testing emissive material bounce lighting inside an abandoned sci-fi reactor bay.",
    },
    {
      comm: "gaming",
      type: "link",
      title: "GDC Talk: The Netcode of Rocket League — Physics Prediction and Client Synchronization",
      url: "https://www.youtube.com/watch?v=ueEmiDM94IE",
      body: "Masterclass on deterministic lockstep physics simulation and rollback client architecture.",
    },
    {
      comm: "gaming",
      type: "text",
      title: "Shader Development 101: Understanding Signed Distance Functions (SDFs)",
      body: "A beginner-friendly breakdown of mathematical raymarching and procedural geometric modeling in GLSL.",
    },
    {
      comm: "gaming",
      type: "text",
      title: "Asset Streaming & Virtual Texturing: Managing 8K textures without VRAM exhaustion",
      body: "Techniques for streaming mipmaps on-demand directly from NVMe SSDs into GPU memory.",
    },
    // c/books
    {
      comm: "books",
      type: "text",
      title: "Deep Dive into 'Designing Data-Intensive Applications' by Martin Kleppmann: 5 Key Insights",
      body: `1. Reliability, Scalability, and Maintainability are concrete mathematical engineering trade-offs, not buzzwords.
2. Partitioning and Replication are fundamentally orthogonal strategies.
3. Consensus algorithms (Raft, Paxos) solve the fundamental problem of distributed coordination under network partitions.
4. Stream processing bridges the gap between batch analytics and low-latency transactional state.
5. Strong consistency comes with undeniable availability penalties (CAP theorem).`,
    },
    {
      comm: "books",
      type: "link",
      title: "Structure and Interpretation of Computer Programs (SICP) — Free Interactive Edition",
      url: "https://sourceacademy.org/sicpjs",
      body: "The legendary MIT computer science curriculum rewritten with interactive JavaScript/Scheme evaluations.",
    },
    {
      comm: "books",
      type: "image",
      title: "My 2026 Systems Architecture Reading List & Study Mindmap",
      image_path: "https://picsum.photos/seed/books1/1200/630",
      body: "Covering distributed systems, database internals, OS architecture, and network protocols.",
    },
    {
      comm: "books",
      type: "text",
      title: "Review: 'Database Internals' by Alex Petrov — How storage engines actually work",
      body: "An indispensable guide comparing B-Trees vs LSM-Trees, write-ahead logs, and page buffer management.",
    },
    {
      comm: "books",
      type: "text",
      title: "Clean Code vs Pragmatic Programmer: Which philosophy aged better in modern engineering?",
      body: "Comparing dogmatic object-oriented clean code with pragmatic, composable software craftsmanship.",
    },
    // c/fitness
    {
      comm: "fitness",
      type: "text",
      title: "Ergonomics for Engineers: How I cured chronic RSI and lower back fatigue",
      body: `After 10 years of 12-hour terminal sessions, severe cubital tunnel syndrome almost ended my career.
What reversed it:
1. Split ergonomic mechanical keyboard with tenting (Corne / Ergodox).
2. Vertical optical mouse that eliminates forearm pronation.
3. 25-minute Pomodoro timer enforcing 2 minutes of wrist extensor stretches.
4. Heavy barbell deadlifts and pull-ups to build rear chain strength.`,
    },
    {
      comm: "fitness",
      type: "image",
      title: "My Minimalist Standing Desk Cable Management & Monitor Height Setup",
      image_path: "https://picsum.photos/seed/fitness1/1200/630",
      body: "Dual monitor arms positioned exactly at eye level with hidden under-desk cable raceways.",
    },
    {
      comm: "fitness",
      type: "link",
      title: "Huberman Lab: Science-backed protocols for sleep, morning sunlight, and physical energy",
      url: "https://www.hubermanlab.com",
      body: "Essential protocols for optimizing circadian rhythm and sustaining cognitive performance.",
    },
    {
      comm: "fitness",
      type: "text",
      title: "Walking Pads under standing desks: 15,000 steps while answering Slack and reviewing PRs",
      body: "How adding a quiet 2 mph under-desk treadmill transformed daily energy levels and eliminated afternoon slumps.",
    },
    {
      comm: "fitness",
      type: "text",
      title: "Eye Health for Screen Workers: The 20-20-20 rule and ambient lighting calibration",
      body: "Reducing digital eye strain with warm backlight bias lighting and intentional distance refocusing.",
    },
    // c/askcuria
    {
      comm: "askcuria",
      type: "text",
      title: "Senior engineers: What is one piece of architectural advice you wish you knew at year 3?",
      body: `If you could travel back to when you were 3 years into your software career, what would you emphasize?
For me, it was: 'Do not optimize for hypothetical scale before you have actual paying customers hitting bottlenecks.'
Simplicity and code deletion are the greatest engineering virtues.

What is yours?`,
    },
    {
      comm: "askcuria",
      type: "text",
      title: "How do you evaluate new dependencies before adding them to package.json?",
      body: "What is your checklist for adopting a third-party library? Bundle size? Open issues? Maintenance cadence? Corporate backing?",
    },
    {
      comm: "askcuria",
      type: "text",
      title: "Monolith vs Microservices: When did your team regret splitting too early?",
      body: "Share your war stories of distributed transactions, network latency hops, and debugging nightmare traces.",
    },
    {
      comm: "askcuria",
      type: "text",
      title: "What is your favorite underappreciated CLI productivity tool?",
      body: "Tools like fzf, zoxide, ripgrep, jq, and bat have 10x'd my terminal navigation. What obscure gems do you swear by?",
    },
    {
      comm: "askcuria",
      type: "text",
      title: "How do you structure code review etiquette to prevent burnout and bike-shedding?",
      body: "Techniques for keeping PRs under 400 lines, separating stylistic nits from blocking bugs, and maintaining psychological safety.",
    },
  ];

  const createdPosts: { id: string; title: string; commName: string; commId: string }[] = [];

  for (let i = 0; i < POST_TEMPLATES.length; i++) {
    const tpl = POST_TEMPLATES[i];
    const comm = commMap.get(tpl.comm);
    if (!comm) continue;

    const author = userList[i % userList.length];
    // Varied timestamp over the last 30 days
    const daysAgo = Math.floor(Math.random() * 28) + 1;
    const createdAt = new Date(Date.now() - daysAgo * 86400000 + (i * 3600000)).toISOString();

    const { data: existingPost } = await admin
      .from("posts")
      .select("id, title")
      .eq("title", tpl.title)
      .eq("community_id", comm.id)
      .maybeSingle();

    if (existingPost) {
      createdPosts.push({ id: existingPost.id, title: existingPost.title, commName: tpl.comm, commId: comm.id });
    } else {
      const isPinned = (tpl.comm === "webdev" && i === 0) || (tpl.comm === "ai_tools" && i === 5);

      const { data: newP, error: postErr } = await admin
        .from("posts")
        .insert({
          community_id: comm.id,
          author_id: author.id,
          type: tpl.type as "text" | "link" | "image",
          title: tpl.title,
          body: tpl.body || null,
          url: tpl.url || null,
          image_path: tpl.image_path || null,
          is_pinned: isPinned,
          score: 5 + Math.floor(Math.random() * 85),
          comment_count: 0,
          created_at: createdAt,
        } as any)
        .select("id, title")
        .single();

      if (postErr || !newP) {
        console.error(`Error creating post "${tpl.title}":`, postErr?.message);
        continue;
      }

      createdPosts.push({ id: newP.id, title: newP.title, commName: tpl.comm, commId: comm.id });
    }
  }

  console.log(`✅ ${createdPosts.length} posts seeded / verified.`);

  // 4. Provision 150 Comments with Nested Hierarchies
  console.log("\n💬 Seeding 150 hierarchical comments...");

  const COMMENT_SNIPPETS = [
    "Completely agree with this perspective. We saw identical latency improvements in our staging tests.",
    "Interesting trade-off, though I wonder how this pattern scales when distributed over multiple regions?",
    "Could you elaborate on how you handled connection pool timeouts during peak traffic spikes?",
    "We adopted a similar approach last quarter and it cut our cloud hosting bill by nearly 35%.",
    "Great point on deterministic schemas. LLMs without strict response schemas are virtually unusable in production.",
    "One subtle caveat with this approach is handling cache invalidation when background jobs update rows.",
    "This was the exact architectural bottleneck we faced. Thanks for writing such a clear post-mortem!",
    "Strongly recommend pairing this with OpenTelemetry distributed traces to capture request hops.",
    "Have you evaluated using DuckDB for local analytics before pushing to the cloud warehouse?",
    "The contrast between pure black and dark obsidian surfaces is night and day for eye fatigue.",
    "We implemented the exact same 25-minute Pomodoro routine and it completely eliminated wrist strain.",
    "This is why I love the Curia engineering community. Real, substantive technical discussions without hype.",
    "Do you have a minimal reproduction repo or gist showing the exact Next.js route handler config?",
    "The 150ms transition rule is spot on. Perceived responsiveness keeps users engaged.",
    "Excellent breakdown of consensus algorithms. Martin Kleppmann's book is truly the Bible of distributed systems.",
  ];

  // Pick 2 posts to have 12+ comments for AI summarizer verification
  const summarizerPost1 = createdPosts[0]; // webdev post
  const summarizerPost2 = createdPosts[5]; // ai_tools post

  let totalCommentsCreated = 0;

  for (let pIdx = 0; pIdx < createdPosts.length; pIdx++) {
    const p = createdPosts[pIdx];

    // Determine target comment count for this post:
    // Summarizer posts get 14-16 comments; others get 2-5 comments
    const isSummarizerTarget = p.id === summarizerPost1?.id || p.id === summarizerPost2?.id;
    const targetCount = isSummarizerTarget ? 15 : Math.floor(Math.random() * 4) + 2;

    const { data: existingComments } = await admin
      .from("comments")
      .select("id")
      .eq("post_id", p.id);

    const existingCount = existingComments?.length || 0;
    if (existingCount >= targetCount) {
      totalCommentsCreated += existingCount;
      continue;
    }

    const needed = targetCount - existingCount;
    const parentStack: { id: string; depth: number; path: string }[] = [];

    for (let c = 0; c < needed; c++) {
      const commenter = userList[(pIdx + c) % userList.length];
      const snippet = COMMENT_SNIPPETS[(pIdx * 3 + c) % COMMENT_SNIPPETS.length];

      let parentId: string | null = null;
      let depth = 0;
      let pathStr = `${Date.now()}_${c}`;

      // Create hierarchy up to depth 5
      if (parentStack.length > 0 && Math.random() > 0.4 && parentStack[parentStack.length - 1].depth < 5) {
        const parent = parentStack[parentStack.length - 1];
        parentId = parent.id;
        depth = parent.depth + 1;
        pathStr = `${parent.path}.${c}`;
      }

      const { data: newComment, error: commentErr } = await admin
        .from("comments")
        .insert({
          post_id: p.id,
          author_id: commenter.id,
          parent_id: parentId,
          depth,
          path: pathStr,
          body: snippet,
          score: 1 + Math.floor(Math.random() * 25),
        } as any)
        .select("id, depth, path")
        .single();

      if (!commentErr && newComment) {
        totalCommentsCreated++;
        parentStack.push({ id: newComment.id, depth: newComment.depth, path: newComment.path });
      }
    }

    // Update actual comment count on post
    const { count: exactCount } = await admin
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", p.id);

    await admin.from("posts").update({ comment_count: exactCount || 0 }).eq("id", p.id);
  }

  console.log(`✅ Total comments across database: ~${totalCommentsCreated}`);

  // 5. Add Realistic Votes
  console.log("\n🗳️ Adding realistic community votes...");
  const samplePosts = createdPosts.slice(0, 25);
  for (const p of samplePosts) {
    const voters = userList.slice(0, 5);
    for (const v of voters) {
      await admin.from("votes").upsert(
        {
          post_id: p.id,
          user_id: v.id,
          value: 1,
        },
        { onConflict: "post_id,user_id" }
      );
    }
  }

  console.log("✅ Voting seeded successfully.");
  console.log("\n🎉 Curia Database Seeding Finished Successfully!");
}

// --------------------------------------------------------------------------
// MAIN ENTRYPOINT
// --------------------------------------------------------------------------
async function main() {
  const isReset = process.argv.includes("--reset");
  if (isReset) {
    await resetDemoData();
  } else {
    await seedDemoData();
  }
}

main().catch((err) => {
  console.error("❌ Fatal error in seed script:", err);
  process.exit(1);
});
