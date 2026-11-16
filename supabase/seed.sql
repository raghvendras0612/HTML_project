-- Curia Comprehensive Seed Dataset
-- File: supabase/seed.sql

-- 1. Profiles (Uses deterministic UUIDs for reproducibility)
INSERT INTO public.profiles (id, username, display_name, avatar_url, bio, karma, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'alex_dev', 'Alex Vance', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Full-stack engineer building AI interfaces and reactive web tools.', 2840, now() - interval '60 days'),
  ('a0000000-0000-0000-0000-000000000002', 'elena_ai', 'Dr. Elena Rostova', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Research scientist working on multimodal reasoning models & alignment.', 4120, now() - interval '55 days'),
  ('a0000000-0000-0000-0000-000000000003', 'marcus_design', 'Marcus Chen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Design systems fanatic. Obsessed with contrast, tokens, and micro-interactions.', 1950, now() - interval '45 days'),
  ('a0000000-0000-0000-0000-000000000004', 'sarah_sys', 'Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Distributed systems architect. Rust & Go enthusiast.', 3310, now() - interval '40 days')
ON CONFLICT (id) DO UPDATE SET
  karma = EXCLUDED.karma,
  bio = EXCLUDED.bio;

-- 2. Communities
INSERT INTO public.communities (id, name, title, description, icon_url, banner_url, creator_id, members_count, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'webdev', 'Web Development', 'Modern frontend, backend, SSR frameworks, edge runtimes, and web platform standards.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', 'a0000000-0000-0000-0000-000000000001', 14280, now() - interval '50 days'),
  ('c0000000-0000-0000-0000-000000000002', 'ai_engineers', 'AI Engineering & LLMs', 'Practical engineering around LLMs, agents, embeddings, RAG architectures, and fine-tuning.', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', 'a0000000-0000-0000-0000-000000000002', 9840, now() - interval '48 days'),
  ('c0000000-0000-0000-0000-000000000003', 'startups', 'Startup Builders', 'Founders, PMs, and early employees discussing product-market fit, unit economics, and growth.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80', 'a0000000-0000-0000-0000-000000000001', 6720, now() - interval '45 days'),
  ('c0000000-0000-0000-0000-000000000004', 'design_systems', 'Design Systems & UI', 'Token architectures, component primitives, accessibility patterns, and micro-animations.', 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80', 'a0000000-0000-0000-0000-000000000003', 4310, now() - interval '42 days'),
  ('c0000000-0000-0000-0000-000000000005', 'typescript', 'TypeScript Deep Dives', 'Advanced type gymnastics, compiler diagnostics, type-level programming, and performance tips.', 'https://images.unsplash.com/photo-1516116211227-bbc04c6e938f?w=100&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80', 'a0000000-0000-0000-0000-000000000004', 8190, now() - interval '38 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- 3. Community Memberships & Moderators
INSERT INTO public.community_members (community_id, user_id)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT (community_id, user_id) DO NOTHING;

INSERT INTO public.community_moderators (community_id, user_id, role)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'creator'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'creator')
ON CONFLICT (community_id, user_id) DO NOTHING;

-- 4. Community Rules
INSERT INTO public.community_rules (community_id, order_index, title, description)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 1, 'High Signal Submissions', 'Include reproducible snippets or architectural reasoning.'),
  ('c0000000-0000-0000-0000-000000000001', 2, 'Constructive Critique', 'No hostility or zero-effort dismissal.'),
  ('c0000000-0000-0000-0000-000000000002', 1, 'Technical Rigor', 'Cite model versions and evaluation benchmarks.')
ON CONFLICT DO NOTHING;

-- 5. Seed Posts
INSERT INTO public.posts (
  id,
  community_id,
  author_id,
  title,
  content_type,
  content_text,
  content_url,
  score,
  upvotes_count,
  downvotes_count,
  comments_count,
  is_pinned,
  is_removed,
  hot_score,
  created_at
)
VALUES
  (
    'p0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Why Flash-class models are winning the production agent race over heavyweight reasoning models',
    'text',
    'Over the past six months, we migrated our multi-turn orchestration pipelines from 100B+ models down to specialized fast-inferencing models like Gemini 2.5 Flash.\n\nTakeaways:\n1. Sub-second latency keeps users in flow\n2. Structured JSON schema enforcement matches 99.4% accuracy\n3. Cost asymmetry enables 20x the validation checkpoints.',
    NULL,
    842,
    860,
    18,
    4,
    true,
    false,
    9.21,
    now() - interval '8 hours'
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Building Curia: How we designed a Reddit-style forum with Next.js App Router, Supabase RLS, and Gemini AI',
    'link',
    'Full breakdown of cookie SSR auth, infinite cursor feeds, and server-side Gemini sentiment analysis.',
    'https://curia-forum.vercel.app/blog/architecture',
    624,
    635,
    11,
    2,
    false,
    false,
    8.85,
    now() - interval '5 hours'
  ),
  (
    'p0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'Dark-first color tokens: Why #0B0D12 and violet glows provide superior contrast and reduced eye strain',
    'image',
    'Comparing pure pitch black (#000000) against deep obsidian (#0B0D12) with subtle tinted surface boundaries.',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
    418,
    425,
    7,
    1,
    false,
    false,
    8.12,
    now() - interval '3 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  score = EXCLUDED.score,
  title = EXCLUDED.title;

-- 6. Seed Threaded Comments (Depth 0 through 4)
INSERT INTO public.comments (id, post_id, author_id, parent_id, content, score, upvotes_count, downvotes_count, depth, created_at)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    NULL,
    'Completely agree on tool-calling latency. When an agent has to execute 5 sequential queries to assemble an answer, a 2-second per-step delay feels completely broken. Flash models bring that to ~300ms total.',
    84,
    85,
    1,
    0,
    now() - interval '7 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'Exactly. And people underestimate how much of agent success comes from the system prompt constraint loop rather than raw model parameters.',
    42,
    42,
    0,
    1,
    now() - interval '6 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000002',
    'How are you handling tool error retries when the JSON output violates your Zod schema?',
    19,
    19,
    0,
    2,
    now() - interval '5 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000003',
    'We feed the Zod error issues array directly back into the assistant message as a user correction. In 99% of cases it self-corrects on retry 1.',
    28,
    28,
    0,
    3,
    now() - interval '4 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content;
