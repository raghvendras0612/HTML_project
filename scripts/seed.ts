import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  users,
  communities,
  posts,
  threads,
  fillerPools,
  parseOffsetToMinutes,
  DemoUser,
  DemoCommunity,
  DemoPost,
  ThreadCommentNode,
} from "./seed-data";

// ============================================================================
// Deterministic Seeded Pseudo-Random Number Generator (Mulberry32)
// ============================================================================
function createPRNG(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================================
// Environment & Safety Pre-flight Checks
// ============================================================================
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ Error: .env.local not found in project root.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, "");
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

console.log(`\n🌐 Connected Project URL: ${SUPABASE_URL}`);

const isDryRun = process.argv.includes("--dry-run");
const isReset = process.argv.includes("--reset");

if (!isDryRun && process.env.CONFIRM_SEED !== "yes") {
  console.error("\n❌ REFUSAL TO EXECUTE:");
  console.error("   To protect production data, this script requires the environment variable CONFIRM_SEED=yes.");
  console.error("   Example: CONFIRM_SEED=yes npm run seed");
  console.error("   Example: CONFIRM_SEED=yes npm run seed:reset\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Credentials file path
const CREDENTIALS_FILE = path.resolve(process.cwd(), ".seed-credentials.local");

// ============================================================================
// Helper: Check if seed_key column exists on posts/comments
// ============================================================================
let hasSeedKey = false;
async function checkSeedKeyColumn(): Promise<boolean> {
  const { error } = await supabase.from("posts").select("seed_key").limit(1);
  return !error;
}

// ============================================================================
// RESET PROCEDURE (--reset)
// ============================================================================
async function runReset() {
  console.log("\n=================================================================");
  console.log("🧹 RUNNING RESET: Removing only demo data...");
  console.log("=================================================================");

  if (isDryRun) {
    console.log("[DRY RUN] Would remove seeded votes, notifications, comments, posts, communities, and users.");
    return;
  }

  hasSeedKey = await checkSeedKeyColumn();

  // 1. Fetch demo user ids
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const demoEmails = new Set(users.map((u) => u.email));
  const demoUsers = (authData?.users || []).filter((u) => u.email && demoEmails.has(u.email));
  const demoUserIds = demoUsers.map((u) => u.id);

  // 2. Fetch demo community ids
  const demoCommNames = communities.map((c) => c.name);
  const { data: comms } = await supabase
    .from("communities")
    .select("id, name")
    .in("name", demoCommNames);
  const commIds = (comms || []).map((c) => c.id);

  // 3. Delete comments
  let deletedCommentsCount = 0;
  if (hasSeedKey) {
    const { data: deletedComments } = await supabase
      .from("comments")
      .delete()
      .not("seed_key", "is", null)
      .select("id");
    deletedCommentsCount = deletedComments?.length || 0;
  } else if (commIds.length > 0) {
    const { data: demoPosts } = await supabase.from("posts").select("id").in("community_id", commIds);
    const postIds = (demoPosts || []).map((p) => p.id);
    if (postIds.length > 0) {
      const { data: deletedComments } = await supabase
        .from("comments")
        .delete()
        .in("post_id", postIds)
        .select("id");
      deletedCommentsCount = deletedComments?.length || 0;
    }
  }

  // 4. Delete posts
  let deletedPostsCount = 0;
  if (hasSeedKey) {
    const { data: deletedPosts } = await supabase
      .from("posts")
      .delete()
      .not("seed_key", "is", null)
      .select("id");
    deletedPostsCount = deletedPosts?.length || 0;
  } else if (commIds.length > 0) {
    const { data: deletedPosts } = await supabase
      .from("posts")
      .delete()
      .in("community_id", commIds)
      .select("id");
    deletedPostsCount = deletedPosts?.length || 0;
  }

  // 5. Delete demo communities
  let deletedCommsCount = 0;
  if (demoCommNames.length > 0) {
    const { data: deletedComms } = await supabase
      .from("communities")
      .delete()
      .in("name", demoCommNames)
      .select("id");
    deletedCommsCount = deletedComms?.length || 0;
  }

  // 6. Delete demo users from auth
  let deletedUsersCount = 0;
  for (const user of demoUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (!error) deletedUsersCount++;
  }

  // 7. Remove credentials file if exists
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }

  console.log(`\n✔ Reset Completed:`);
  console.log(`   - Comments deleted:    ${deletedCommentsCount}`);
  console.log(`   - Posts deleted:       ${deletedPostsCount}`);
  console.log(`   - Communities deleted: ${deletedCommsCount}`);
  console.log(`   - Demo users deleted:  ${deletedUsersCount}`);
  console.log("=================================================================\n");
}

// ============================================================================
// MAIN SEED PROCEDURE
// ============================================================================
async function runSeed() {
  console.log("\n=================================================================");
  console.log(`🌱 STARTING CURIA SEED${isDryRun ? " (DRY RUN)" : ""}`);
  console.log("=================================================================");

  hasSeedKey = await checkSeedKeyColumn();
  if (!hasSeedKey) {
    console.warn("⚠️ Notice: seed_key column not detected in database.");
    console.warn("   Falling back to unique post titles / comment identifiers for idempotency.");
    console.warn("   To enable full schema support, run supabase/migrations/00005_seed_support.sql in Supabase SQL Editor.");
  } else {
    console.log("✔ Schema support: 'seed_key' column active for posts and comments.");
  }

  // --------------------------------------------------------------------------
  // STEP 1: DEMO USERS
  // --------------------------------------------------------------------------
  console.log("\n--- [Step 1/6] Demo Users (12 Users) ---");
  const { data: authList, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("❌ Failed to list users from Supabase admin API:", listErr.message);
    process.exit(1);
  }

  const existingAuthMap = new Map<string, any>();
  for (const u of authList?.users || []) {
    if (u.email) existingAuthMap.set(u.email.toLowerCase(), u);
  }

  const userMap = new Map<string, string>(); // username -> userId
  let usersCreated = 0;
  let usersSkipped = 0;
  const newCredentials: Array<{ email: string; username: string; pass: string }> = [];

  for (const demoUser of users) {
    const existing = existingAuthMap.get(demoUser.email.toLowerCase());

    if (existing) {
      userMap.set(demoUser.username, existing.id);
      usersSkipped++;

      if (!isDryRun) {
        // Ensure profile row matches exact metadata
        await supabase
          .from("profiles")
          .update({
            username: demoUser.username,
            display_name: demoUser.displayName,
            bio: demoUser.bio,
          })
          .eq("id", existing.id);
      }
    } else {
      const generatedPass = crypto.randomBytes(12).toString("base64url").slice(0, 16);
      newCredentials.push({ email: demoUser.email, username: demoUser.username, pass: generatedPass });

      if (isDryRun) {
        userMap.set(demoUser.username, `dry-run-user-${demoUser.username}`);
        usersCreated++;
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: demoUser.email,
          password: generatedPass,
          email_confirm: true,
          user_metadata: {
            user_name: demoUser.username,
            name: demoUser.displayName,
          },
        });

        if (createErr || !newUser?.user) {
          console.error(`❌ Failed to create user ${demoUser.email}:`, createErr?.message);
          process.exit(1);
        }

        userMap.set(demoUser.username, newUser.user.id);
        usersCreated++;

        // Update profile with exact display name and bio
        await supabase
          .from("profiles")
          .update({
            username: demoUser.username,
            display_name: demoUser.displayName,
            bio: demoUser.bio,
          })
          .eq("id", newUser.user.id);
      }
    }
  }

  // Save new credentials safely once
  if (newCredentials.length > 0 && !isDryRun) {
    let credContent = fs.existsSync(CREDENTIALS_FILE) ? fs.readFileSync(CREDENTIALS_FILE, "utf-8") : "";
    if (!credContent) {
      credContent = "# Curia Demo Credentials (gitignored - DO NOT COMMIT)\n# Format: email | username | password\n";
    }
    for (const c of newCredentials) {
      credContent += `${c.email} | ${c.username} | ${c.pass}\n`;
    }
    fs.writeFileSync(CREDENTIALS_FILE, credContent, { mode: 0o600 });
    console.log(`🔒 Wrote ${newCredentials.length} generated credentials to .seed-credentials.local (permissions 0600).`);
  }

  console.log(`   Result: ${usersCreated} created, ${usersSkipped} skipped (already present)`);

  // --------------------------------------------------------------------------
  // STEP 2: COMMUNITIES & MEMBERSHIPS
  // --------------------------------------------------------------------------
  console.log("\n--- [Step 2/6] Communities & Memberships (8 Communities) ---");
  const { data: existingCommsData } = await supabase
    .from("communities")
    .select("id, name");
  const commMap = new Map<string, string>();
  for (const c of existingCommsData || []) {
    commMap.set(c.name, c.id);
  }

  let commsCreated = 0;
  let commsSkipped = 0;
  let membersAdded = 0;
  let membersSkipped = 0;

  for (const comm of communities) {
    let commId = commMap.get(comm.name);
    const creatorId = userMap.get(comm.creator);

    if (commId) {
      commsSkipped++;
    } else {
      if (isDryRun) {
        commId = `dry-run-comm-${comm.name}`;
        commMap.set(comm.name, commId);
        commsCreated++;
      } else {
        const { data: newComm, error: commErr } = await supabase
          .from("communities")
          .insert({
            name: comm.name,
            title: comm.title,
            description: comm.description,
            rules: comm.rules,
            creator_id: creatorId,
          })
          .select("id")
          .single();

        if (commErr || !newComm) {
          console.error(`❌ Failed to create community c/${comm.name}:`, commErr?.message);
          process.exit(1);
        }

        commId = newComm.id;
        commMap.set(comm.name, newComm.id);
        commsCreated++;
      }
    }

    if (!isDryRun && commId) {
      // Check existing members
      const { data: existingMembers } = await supabase
        .from("community_members")
        .select("user_id, role")
        .eq("community_id", commId);
      const existingMemberMap = new Map(existingMembers?.map((m) => [m.user_id, m.role]));

      // 1. Moderators
      for (const modUsername of comm.moderators) {
        const modId = userMap.get(modUsername);
        if (!modId) continue;
        if (!existingMemberMap.has(modId)) {
          await supabase.from("community_members").insert({
            community_id: commId,
            user_id: modId,
            role: "moderator",
          });
          membersAdded++;
        } else if (existingMemberMap.get(modId) !== "moderator") {
          await supabase
            .from("community_members")
            .update({ role: "moderator" })
            .eq("community_id", commId)
            .eq("user_id", modId);
        } else {
          membersSkipped++;
        }
      }

      // 2. Regular Members
      for (const memberUsername of comm.members) {
        if (memberUsername === comm.creator || comm.moderators.includes(memberUsername)) {
          continue; // Creator is handled by trigger, moderators already handled
        }
        const memberId = userMap.get(memberUsername);
        if (!memberId) continue;
        if (!existingMemberMap.has(memberId)) {
          await supabase.from("community_members").insert({
            community_id: commId,
            user_id: memberId,
            role: "member",
          });
          membersAdded++;
        } else {
          membersSkipped++;
        }
      }
    }
  }

  console.log(`   Communities: ${commsCreated} created, ${commsSkipped} skipped (already present)`);
  console.log(`   Memberships: ${membersAdded} added, ${membersSkipped} skipped`);

  // --------------------------------------------------------------------------
  // STEP 3: POSTS (24 Posts - P24 first, then oldest to newest)
  // --------------------------------------------------------------------------
  console.log("\n--- [Step 3/6] Posts (24 Posts) ---");

  // Fetch existing posts
  const postSelect = hasSeedKey ? "id, seed_key, title" : "id, title";
  const { data: existingPostsData } = await supabase.from("posts").select(postSelect as any);
  const existingPostMap = new Map<string, string>(); // seed_key or title -> id
  const existingPostsList = (existingPostsData as Array<{ id: string; seed_key?: string | null; title: string }> | null) || [];
  for (const p of existingPostsList) {
    if (hasSeedKey && p.seed_key) {
      existingPostMap.set(p.seed_key, p.id);
    }
    existingPostMap.set(p.title, p.id);
  }

  // Ordering: P24 first, then sort remaining posts by ageDays descending (oldest to newest)
  const p24Post = posts.find((p) => p.key === "P24")!;
  const otherPosts = posts.filter((p) => p.key !== "P24").sort((a, b) => b.ageDays - a.ageDays);
  const orderedPosts = [p24Post, ...otherPosts];

  const nowMs = Date.now();
  const postIdMap = new Map<string, { id: string; createdAt: Date }>(); // post.key -> { id, createdAt }
  let postsCreated = 0;
  let postsSkipped = 0;

  for (const post of orderedPosts) {
    const existingId = existingPostMap.get(post.key) || existingPostMap.get(post.title);
    const commId = commMap.get(post.community);
    const authorId = userMap.get(post.author);

    // Compute deterministic creation time
    const rng = createPRNG(stringToSeed(post.key));
    const hourOffsetMs = Math.floor(rng() * 24) * 3600000 + Math.floor(rng() * 60) * 60000;
    const postCreatedAt = new Date(nowMs - post.ageDays * 86400000 + hourOffsetMs);

    if (existingId) {
      postIdMap.set(post.key, { id: existingId, createdAt: postCreatedAt });
      postsSkipped++;
    } else {
      if (isDryRun) {
        const fakeId = `dry-run-post-${post.key}`;
        postIdMap.set(post.key, { id: fakeId, createdAt: postCreatedAt });
        postsCreated++;
      } else {
        const postPayload: any = {
          community_id: commId,
          author_id: authorId,
          type: post.type,
          title: post.title,
          body: post.body,
          url: post.url || null,
          image_path: post.imageUrl || null,
          is_pinned: post.pinned,
          created_at: postCreatedAt.toISOString(),
        };
        if (hasSeedKey) {
          postPayload.seed_key = post.key;
        }

        const { data: newPost, error: postErr } = await supabase
          .from("posts")
          .insert(postPayload)
          .select("id")
          .single();

        if (postErr || !newPost) {
          console.error(`❌ Failed to create post ${post.key} (${post.title}):`, postErr?.message);
          process.exit(1);
        }

        postIdMap.set(post.key, { id: newPost.id, createdAt: postCreatedAt });
        postsCreated++;
      }
    }
  }

  console.log(`   Result: ${postsCreated} created, ${postsSkipped} skipped (already present)`);

  // --------------------------------------------------------------------------
  // STEP 4: COMMENTS (Hand-written Threads T1-T4 + Filler Comments)
  // --------------------------------------------------------------------------
  console.log("\n--- [Step 4/6] Comments (42 Hand-written + 147 Filler = 189 Total) ---");

  // Fetch existing comments (paginated)
  const commentSelect = hasSeedKey ? "id, seed_key, body, post_id" : "id, body, post_id";
  const allExistingComments: any[] = [];
  let cFrom = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data: cPage } = await supabase
      .from("comments")
      .select(commentSelect as any)
      .range(cFrom, cFrom + PAGE_SIZE - 1);
    if (!cPage || cPage.length === 0) break;
    allExistingComments.push(...cPage);
    if (cPage.length < PAGE_SIZE) break;
    cFrom += PAGE_SIZE;
  }

  const existingCommentMap = new Map<string, string>(); // seed_key or (postId+body) -> id
  for (const c of allExistingComments) {
    if (hasSeedKey && (c as any).seed_key) {
      existingCommentMap.set((c as any).seed_key, c.id);
    }
    existingCommentMap.set(`${c.post_id}_${c.body}`, c.id);
  }

  const commentIdMap = new Map<string, string>(); // seed_key -> comment_id
  let commentsCreated = 0;
  let commentsSkipped = 0;

  // 4A. Threaded Comments (T1 to T4)
  const threadPostKeyMap: Record<"T1" | "T2" | "T3" | "T4", string> = {
    T1: "P01",
    T2: "P04",
    T3: "P22",
    T4: "P07",
  };

  async function insertThreadNodes(
    nodes: ThreadCommentNode[],
    postId: string,
    postCreatedAt: Date,
    parentId: string | null = null
  ) {
    for (const node of nodes) {
      const seedKey = node.key!;
      const existingId = existingCommentMap.get(seedKey) || existingCommentMap.get(`${postId}_${node.body}`);

      if (existingId) {
        commentIdMap.set(seedKey, existingId);
        commentsSkipped++;
        if (node.replies && node.replies.length > 0) {
          await insertThreadNodes(node.replies, postId, postCreatedAt, existingId);
        }
      } else {
        const offsetMinutes = parseOffsetToMinutes(node.offset);
        const commentCreatedAt = new Date(postCreatedAt.getTime() + offsetMinutes * 60000);
        const authorId = userMap.get(node.author);

        if (isDryRun) {
          const fakeId = `dry-run-comment-${seedKey}`;
          commentIdMap.set(seedKey, fakeId);
          commentsCreated++;
          if (node.replies && node.replies.length > 0) {
            await insertThreadNodes(node.replies, postId, postCreatedAt, fakeId);
          }
        } else {
          const commentPayload: any = {
            post_id: postId,
            author_id: authorId,
            parent_id: parentId,
            body: node.body,
            created_at: commentCreatedAt.toISOString(),
          };
          if (hasSeedKey) {
            commentPayload.seed_key = seedKey;
          }

          const { data: newComment, error: commErr } = await supabase
            .from("comments")
            .insert(commentPayload)
            .select("id")
            .single();

          if (commErr || !newComment) {
            console.error(`❌ Failed to insert thread comment ${seedKey}:`, commErr?.message);
            process.exit(1);
          }

          commentIdMap.set(seedKey, newComment.id);
          commentsCreated++;

          if (node.replies && node.replies.length > 0) {
            await insertThreadNodes(node.replies, postId, postCreatedAt, newComment.id);
          }
        }
      }
    }
  }

  for (const [threadKey, threadNodes] of Object.entries(threads) as [
    "T1" | "T2" | "T3" | "T4",
    ThreadCommentNode[]
  ][]) {
    const postKey = threadPostKeyMap[threadKey];
    const postInfo = postIdMap.get(postKey)!;
    await insertThreadNodes(threadNodes, postInfo.id, postInfo.createdAt, null);
  }

  // 4B. Filler Comments for Non-Threaded Posts
  const nonThreadedPosts = posts.filter((p) => p.threadKey === null);

  for (const post of nonThreadedPosts) {
    const postInfo = postIdMap.get(post.key)!;
    const commDef = communities.find((c) => c.name === post.community)!;
    // Eligible commenters: must be a member of this community and NOT the post author
    const eligibleCommenters = commDef.members.filter((m) => m !== post.author);
    if (eligibleCommenters.length === 0) {
      console.warn(`⚠️ Warning: No eligible commenters for post ${post.key} in c/${post.community}`);
      continue;
    }

    // Community specific text pool + generic pool
    const commPool = fillerPools.perCommunity[post.community] || [];
    const fullTextPool = [...fillerPools.generic, ...commPool];

    const rng = createPRNG(stringToSeed(`filler_${post.key}`));
    const generatedCommentIds: string[] = [];

    for (let i = 0; i < post.targetCommentCount; i++) {
      const seedKey = `F-${post.key}-${i + 1}`;
      // Use distinct text from pool for each index to avoid duplicate text collisions on same post
      const text = fullTextPool[i % fullTextPool.length];
      const existingId = (hasSeedKey ? existingCommentMap.get(seedKey) : null) || existingCommentMap.get(`${postInfo.id}_${text}`);

      if (existingId) {
        commentIdMap.set(seedKey, existingId);
        generatedCommentIds.push(existingId);
        commentsSkipped++;
      } else {
        // Pick commenter deterministically
        const authorUsername = eligibleCommenters[Math.floor(rng() * eligibleCommenters.length)];
        const authorId = userMap.get(authorUsername);

        // Pick parent: ~70% top-level, ~30% reply up to depth 3
        let parentId: string | null = null;
        if (i > 0 && rng() > 0.7 && generatedCommentIds.length > 0) {
          parentId = generatedCommentIds[Math.floor(rng() * generatedCommentIds.length)];
        }

        // Spread timestamps between +10 minutes and +3 days (capped at nowMs)
        const minOffsetMinutes = 10;
        const maxOffsetMinutes = 3 * 24 * 60; // 4320 mins
        const randomMinutes = minOffsetMinutes + Math.floor(rng() * (maxOffsetMinutes - minOffsetMinutes));
        let commentTimeMs = postInfo.createdAt.getTime() + randomMinutes * 60000;
        if (commentTimeMs > nowMs) {
          commentTimeMs = nowMs - (post.targetCommentCount - i) * 60000; // Keep slightly before now
        }
        const commentCreatedAt = new Date(commentTimeMs);

        if (isDryRun) {
          const fakeId = `dry-run-comment-${seedKey}`;
          commentIdMap.set(seedKey, fakeId);
          generatedCommentIds.push(fakeId);
          commentsCreated++;
        } else {
          const commentPayload: any = {
            post_id: postInfo.id,
            author_id: authorId,
            parent_id: parentId,
            body: text,
            created_at: commentCreatedAt.toISOString(),
          };
          if (hasSeedKey) {
            commentPayload.seed_key = seedKey;
          }

          const { data: newComment, error: commErr } = await supabase
            .from("comments")
            .insert(commentPayload)
            .select("id")
            .single();

          if (commErr || !newComment) {
            console.error(`❌ Failed to insert filler comment ${seedKey}:`, commErr?.message);
            process.exit(1);
          }

          commentIdMap.set(seedKey, newComment.id);
          generatedCommentIds.push(newComment.id);
          commentsCreated++;
        }
      }
    }
  }

  console.log(`   Result: ${commentsCreated} created, ${commentsSkipped} skipped (already present)`);

  // --------------------------------------------------------------------------
  // STEP 5: ATOMIC VOTES
  // --------------------------------------------------------------------------
  console.log("\n--- [Step 5/6] Votes (Posts & Comments) ---");

  // Fetch existing votes (paginated)
  const allExistingVotes: any[] = [];
  let vFrom = 0;
  while (true) {
    const { data: vPage } = await supabase
      .from("votes")
      .select("post_id, comment_id, user_id")
      .range(vFrom, vFrom + PAGE_SIZE - 1);
    if (!vPage || vPage.length === 0) break;
    allExistingVotes.push(...vPage);
    if (vPage.length < PAGE_SIZE) break;
    vFrom += PAGE_SIZE;
  }

  const existingPostVoteUsers = new Map<string, Set<string>>(); // postId -> Set<userId>
  const existingCommentVoteUsers = new Map<string, Set<string>>(); // commentId -> Set<userId>
  for (const v of allExistingVotes) {
    if (v.post_id) {
      if (!existingPostVoteUsers.has(v.post_id)) existingPostVoteUsers.set(v.post_id, new Set());
      existingPostVoteUsers.get(v.post_id)!.add(v.user_id);
    }
    if (v.comment_id) {
      if (!existingCommentVoteUsers.has(v.comment_id)) existingCommentVoteUsers.set(v.comment_id, new Set());
      existingCommentVoteUsers.get(v.comment_id)!.add(v.user_id);
    }
  }

  let postVotesCreated = 0;
  let postVotesSkipped = 0;
  let commentVotesCreated = 0;
  let commentVotesSkipped = 0;

  // 5A. Post Votes
  for (const post of posts) {
    const postInfo = postIdMap.get(post.key)!;
    const existingVoters = existingPostVoteUsers.get(postInfo.id) || new Set();

    if (existingVoters.size > 0) {
      postVotesSkipped++;
      continue;
    }

    const rng = createPRNG(stringToSeed(`post_vote_${post.key}`));
    // Eligible voters: all 12 demo users except the author
    const eligibleVoters = users
      .filter((u) => u.username !== post.author)
      .map((u) => userMap.get(u.username)!);
    const shuffledVoters = shuffleWithRng(eligibleVoters, rng);

    const targetScore = post.score;
    // Post scores are at most 11. Net score = Up - Down = targetScore.
    // If targetScore + 2 <= 11 and targetScore > 0, we can add 1 downvote to make scores natural.
    let upvotesCount = targetScore;
    let downvotesCount = 0;
    if (targetScore > 0 && targetScore + 2 <= shuffledVoters.length) {
      upvotesCount = targetScore + 1;
      downvotesCount = 1;
    }

    const upvoterIds = shuffledVoters.slice(0, upvotesCount);
    const downvoterIds = shuffledVoters.slice(upvotesCount, upvotesCount + downvotesCount);

    const votesToInsert: Array<{ user_id: string; post_id: string; value: number }> = [];
    for (const uid of upvoterIds) votesToInsert.push({ user_id: uid, post_id: postInfo.id, value: 1 });
    for (const uid of downvoterIds) votesToInsert.push({ user_id: uid, post_id: postInfo.id, value: -1 });

    if (!isDryRun && votesToInsert.length > 0) {
      const { error: voteErr } = await supabase.from("votes").insert(votesToInsert);
      if (voteErr) {
        console.error(`❌ Failed to insert votes for post ${post.key}:`, voteErr.message);
        process.exit(1);
      }
    }
    postVotesCreated += votesToInsert.length;
  }

  // 5B. Comment Votes (Threaded Nodes)
  async function voteOnThreadNodes(nodes: ThreadCommentNode[]) {
    for (const node of nodes) {
      const commentId = commentIdMap.get(node.key!)!;
      const existingVoters = existingCommentVoteUsers.get(commentId) || new Set();

      if (existingVoters.size > 0) {
        commentVotesSkipped++;
      } else {
        const rng = createPRNG(stringToSeed(`comment_vote_${node.key}`));
        const eligibleVoters = users
          .filter((u) => u.username !== node.author)
          .map((u) => userMap.get(u.username)!);
        const shuffledVoters = shuffleWithRng(eligibleVoters, rng);

        const targetScore = node.score;
        let upvotesCount = targetScore;
        let downvotesCount = 0;
        if (targetScore > 0 && targetScore + 2 <= shuffledVoters.length) {
          upvotesCount = targetScore + 1;
          downvotesCount = 1;
        }

        const upvoterIds = shuffledVoters.slice(0, upvotesCount);
        const downvoterIds = shuffledVoters.slice(upvotesCount, upvotesCount + downvotesCount);

        const votesToInsert: Array<{ user_id: string; comment_id: string; value: number }> = [];
        for (const uid of upvoterIds) {
          if (!existingVoters.has(uid)) {
            votesToInsert.push({ user_id: uid, comment_id: commentId, value: 1 });
            existingVoters.add(uid);
          }
        }
        for (const uid of downvoterIds) {
          if (!existingVoters.has(uid)) {
            votesToInsert.push({ user_id: uid, comment_id: commentId, value: -1 });
            existingVoters.add(uid);
          }
        }
        existingCommentVoteUsers.set(commentId, existingVoters);

        if (!isDryRun && votesToInsert.length > 0) {
          const { error: voteErr } = await supabase.from("votes").insert(votesToInsert);
          if (voteErr) {
            console.error(`❌ Failed to insert votes for comment ${node.key}:`, voteErr.message);
            process.exit(1);
          }
        }
        commentVotesCreated += votesToInsert.length;
      }

      if (node.replies && node.replies.length > 0) {
        await voteOnThreadNodes(node.replies);
      }
    }
  }

  for (const threadNodes of Object.values(threads)) {
    await voteOnThreadNodes(threadNodes);
  }

  // 5C. Comment Votes (Filler Comments: 1 to 6 votes each)
  for (const post of nonThreadedPosts) {
    for (let i = 0; i < post.targetCommentCount; i++) {
      const seedKey = `F-${post.key}-${i + 1}`;
      const commentId = commentIdMap.get(seedKey);
      if (!commentId) continue;
      const existingVoters = existingCommentVoteUsers.get(commentId) || new Set();

      if (existingVoters.size > 0) {
        commentVotesSkipped++;
      } else {
        const rng = createPRNG(stringToSeed(`filler_vote_${seedKey}`));
        // Net score 1 to 6
        const targetScore = 1 + Math.floor(rng() * 6);
        const eligibleVoters = users.map((u) => userMap.get(u.username)!);
        const shuffledVoters = shuffleWithRng(eligibleVoters, rng);

        const upvoterIds = shuffledVoters.slice(0, targetScore);
        const votesToInsert: Array<{ user_id: string; comment_id: string; value: number }> = [];
        for (const uid of upvoterIds) {
          if (!existingVoters.has(uid)) {
            votesToInsert.push({ user_id: uid, comment_id: commentId, value: 1 });
            existingVoters.add(uid);
          }
        }
        existingCommentVoteUsers.set(commentId, existingVoters);

        if (!isDryRun && votesToInsert.length > 0) {
          const { error: voteErr } = await supabase.from("votes").insert(votesToInsert);
          if (voteErr) {
            console.error(`❌ Failed to insert votes for filler comment ${seedKey}:`, voteErr.message);
            process.exit(1);
          }
        }
        commentVotesCreated += votesToInsert.length;
      }
    }
  }

  console.log(`   Post votes:    ${postVotesCreated} created, ${postVotesSkipped} posts skipped (already voted)`);
  console.log(`   Comment votes: ${commentVotesCreated} created, ${commentVotesSkipped} comments skipped (already voted)`);

  // --------------------------------------------------------------------------
  // STEP 6: RECOMPUTE HOT_RANK & CLEAN UP NOTIFICATIONS
  // --------------------------------------------------------------------------
  console.log("\n--- [Step 6/6] Hot Rank Maintenance & Notifications Polish ---");

  if (!isDryRun) {
    // 6A. Recompute hot_rank for all posts
    const { data: allPosts } = await supabase.from("posts").select("id, score, created_at");
    for (const p of allPosts || []) {
      const s = Math.sign(p.score || 0);
      const order = Math.log10(Math.max(Math.abs(p.score || 0), 1));
      const epoch = new Date(p.created_at).getTime() / 1000;
      const rank = Number((s * order + (epoch - 1700000000) / 45000.0).toFixed(7));
      await supabase.from("posts").update({ hot_rank: rank }).eq("id", p.id);
    }
    console.log(`✔ Recomputed hot_rank for ${allPosts?.length || 0} posts.`);

    // 6B. Notifications Polish:
    // Mark every notification as read EXCEPT for aarav_dev
    const aaravId = userMap.get("aarav_dev");
    if (aaravId) {
      // Mark all others as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .neq("user_id", aaravId);

      // Mark all of aarav_dev read first, then leave latest 4 unread
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", aaravId);

      const { data: latest4 } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", aaravId)
        .order("created_at", { ascending: false })
        .limit(4);

      if (latest4 && latest4.length > 0) {
        await supabase
          .from("notifications")
          .update({ is_read: false })
          .in("id", latest4.map((n) => n.id));
      }

      const { count: aaravUnreadCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", aaravId)
        .eq("is_read", false);

      console.log(`✔ Notifications updated: aarav_dev has ${aaravUnreadCount} unread notification(s).`);
    }
  } else {
    console.log("[DRY RUN] Would recompute hot_rank and polish notifications.");
  }

  console.log("\n=================================================================");
  console.log("🎉 SEED PROCEDURE COMPLETED SUCCESSFULLY!");
  console.log("=================================================================\n");
}

// Execute Entrypoint
if (isReset) {
  runReset().catch((err) => {
    console.error("❌ Reset uncaught error:", err);
    process.exit(1);
  });
} else {
  runSeed().catch((err) => {
    console.error("❌ Seed uncaught error:", err);
    process.exit(1);
  });
}
