import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import {
  users as expectedUsers,
  communities as expectedCommunities,
  posts as expectedPosts,
  threads as expectedThreads,
  ThreadCommentNode,
} from "./seed-data";

// Read environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ Error: .env.local not found.");
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Error: Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface VerificationFailure {
  category: string;
  message: string;
}

const failures: VerificationFailure[] = [];

function assert(condition: boolean, category: string, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${category}: ${message}`);
    failures.push({ category, message });
  } else {
    console.log(`  ✔ [PASS] ${category}: ${message}`);
  }
}

async function verify() {
  console.log("\n=================================================================");
  console.log("🔍 RUNNING CURIA SEED VERIFICATION SUITE (scripts/verify-seed.ts)");
  console.log("=================================================================\n");

  // --------------------------------------------------------------------------
  // 1. COUNTS VERIFICATION
  // --------------------------------------------------------------------------
  console.log("--- 1. Entity Counts ---");

  // 1A. Users
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const demoEmails = new Set(expectedUsers.map((u) => u.email.toLowerCase()));
  const actualDemoUsers = (authList?.users || []).filter((u) => u.email && demoEmails.has(u.email.toLowerCase()));
  assert(actualDemoUsers.length === 12, "Users Count", `Found ${actualDemoUsers.length}/12 demo users in auth.users`);

  const userMap = new Map<string, string>(); // username -> id
  const { data: profiles } = await supabase.from("profiles").select("id, username, karma");
  for (const p of profiles || []) {
    userMap.set(p.username, p.id);
  }

  // 1B. Communities
  const expectedCommNames = expectedCommunities.map((c) => c.name);
  const { data: comms } = await supabase
    .from("communities")
    .select("id, name, member_count")
    .in("name", expectedCommNames);
  assert(comms?.length === 8, "Communities Count", `Found ${comms?.length || 0}/8 demo communities`);

  const commIdMap = new Map<string, string>();
  for (const c of comms || []) {
    commIdMap.set(c.name, c.id);
  }

  // 1C. Posts
  const expectedTitles = expectedPosts.map((p) => p.title);
  const { data: seededPosts } = await supabase
    .from("posts")
    .select("id, title, score, comment_count, is_pinned, created_at, hot_rank, author_id, community_id")
    .in("title", expectedTitles);

  assert(seededPosts?.length === 24, "Posts Count", `Found ${seededPosts?.length || 0}/24 seeded demo posts`);

  const seededPostMap = new Map<string, any>();
  const seededPostIdSet = new Set<string>();
  for (const p of seededPosts || []) {
    seededPostMap.set(p.title, p);
    seededPostIdSet.add(p.id);
  }

  // 1D. Comments (on seeded posts)
  const seededPostIds = Array.from(seededPostIdSet);
  let allSeededComments: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  while (seededPostIds.length > 0) {
    const { data: cPage } = await supabase
      .from("comments")
      .select("id, post_id, author_id, parent_id, depth, path, body, score")
      .in("post_id", seededPostIds)
      .range(from, from + PAGE_SIZE - 1);
    if (!cPage || cPage.length === 0) break;
    allSeededComments.push(...cPage);
    if (cPage.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  assert(
    allSeededComments.length === 189,
    "Comments Count",
    `Found ${allSeededComments.length}/189 comments across seeded posts (expected 42 hand-written + 147 filler)`
  );

  // 1E. Votes on seeded items
  const seededCommentIds = allSeededComments.map((c) => c.id);
  let allVotes: any[] = [];
  let vFrom = 0;
  while (true) {
    const { data: vPage } = await supabase
      .from("votes")
      .select("id, user_id, post_id, comment_id, value")
      .range(vFrom, vFrom + PAGE_SIZE - 1);
    if (!vPage || vPage.length === 0) break;
    allVotes.push(...vPage);
    if (vPage.length < PAGE_SIZE) break;
    vFrom += PAGE_SIZE;
  }

  const postVotes = allVotes.filter((v) => v.post_id && seededPostIdSet.has(v.post_id));
  const commentVoteCommentIdSet = new Set(seededCommentIds);
  const commentVotes = allVotes.filter((v) => v.comment_id && commentVoteCommentIdSet.has(v.comment_id));

  console.log(`  ℹ Total votes on seeded posts: ${postVotes.length}`);
  console.log(`  ℹ Total votes on seeded comments: ${commentVotes.length}`);
  console.log(`  ℹ Combined votes on demo content: ${postVotes.length + commentVotes.length}`);

  // --------------------------------------------------------------------------
  // 2. MATHEMATICAL INTEGRITY (Scores, Karma, Counts)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Score, Karma & Count Consistency ---");

  // 2A. Every post score equals sum of its votes
  let postScoreMismatches = 0;
  for (const post of seededPosts || []) {
    const votesForPost = postVotes.filter((v) => v.post_id === post.id);
    const sumVotes = votesForPost.reduce((acc, v) => acc + v.value, 0);
    if (post.score !== sumVotes) {
      postScoreMismatches++;
    }
  }
  assert(postScoreMismatches === 0, "Post Score Integrity", `Every seeded post score equals sum of votes (${postScoreMismatches} mismatches)`);

  // 2B. Every comment score equals sum of its votes
  let commentScoreMismatches = 0;
  for (const comment of allSeededComments) {
    const votesForComment = commentVotes.filter((v) => v.comment_id === comment.id);
    const sumVotes = votesForComment.reduce((acc, v) => acc + v.value, 0);
    if (comment.score !== sumVotes) {
      commentScoreMismatches++;
    }
  }
  assert(commentScoreMismatches === 0, "Comment Score Integrity", `Every seeded comment score equals sum of votes (${commentScoreMismatches} mismatches)`);

  // 2C. Every post comment_count equals real comment count
  let postCommentCountMismatches = 0;
  for (const post of seededPosts || []) {
    const realCount = allSeededComments.filter((c) => c.post_id === post.id).length;
    if (post.comment_count !== realCount) {
      postCommentCountMismatches++;
    }
  }
  assert(postCommentCountMismatches === 0, "Post Comment Count Integrity", `Every post comment_count matches real count (${postCommentCountMismatches} mismatches)`);

  // 2D. Community member_count equals real community_members rows
  const { data: allMembers } = await supabase.from("community_members").select("community_id, user_id");
  let commMemberMismatches = 0;
  for (const comm of comms || []) {
    const realCount = (allMembers || []).filter((m) => m.community_id === comm.id).length;
    if (comm.member_count !== realCount) {
      commMemberMismatches++;
    }
  }
  assert(commMemberMismatches === 0, "Community Member Count Integrity", `Every community member_count matches real count (${commMemberMismatches} mismatches)`);

  // 2E. User Karma equals sum of votes received on their posts & comments
  const profileMap = new Map(profiles?.map((p) => [p.id, p]));
  let karmaMismatches = 0;
  for (const demoUser of expectedUsers) {
    const userId = userMap.get(demoUser.username);
    if (!userId) continue;
    const profile = profileMap.get(userId);

    // Votes received on posts
    const userPostIds = new Set((seededPosts || []).filter((p) => p.author_id === userId).map((p) => p.id));
    const votesReceivedOnPosts = postVotes.filter((v) => userPostIds.has(v.post_id)).reduce((acc, v) => acc + v.value, 0);

    // Votes received on comments
    const userCommentIds = new Set(allSeededComments.filter((c) => c.author_id === userId).map((c) => c.id));
    const votesReceivedOnComments = commentVotes.filter((v) => userCommentIds.has(v.comment_id)).reduce((acc, v) => acc + v.value, 0);

    const expectedKarma = votesReceivedOnPosts + votesReceivedOnComments;
    if (profile?.karma !== expectedKarma) {
      karmaMismatches++;
    }
  }
  assert(karmaMismatches === 0, "User Karma Integrity", `All 12 demo users have karma equal to votes received (${karmaMismatches} mismatches)`);

  // --------------------------------------------------------------------------
  // 3. TARGET SCORES & THREADS
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Target Scores & Thread Structures ---");

  // 3A. Post target scores
  let postTargetScoreMismatches = 0;
  for (const expPost of expectedPosts) {
    const actualPost = seededPostMap.get(expPost.title);
    if (!actualPost || actualPost.score !== expPost.score) {
      postTargetScoreMismatches++;
    }
  }
  assert(postTargetScoreMismatches === 0, "Post Target Scores", `All 24 posts have exact target score from seed-data (${postTargetScoreMismatches} mismatches)`);

  // 3B. Thread comments target scores
  let threadScoreMismatches = 0;
  function verifyThreadScores(nodes: ThreadCommentNode[], postId: string) {
    for (const node of nodes) {
      const actualComment = allSeededComments.find((c) => c.post_id === postId && c.body === node.body);
      if (!actualComment || actualComment.score !== node.score) {
        threadScoreMismatches++;
      }
      if (node.replies && node.replies.length > 0) {
        verifyThreadScores(node.replies, postId);
      }
    }
  }

  const p01 = seededPostMap.get(expectedPosts.find((p) => p.key === "P01")!.title);
  const p04 = seededPostMap.get(expectedPosts.find((p) => p.key === "P04")!.title);
  const p22 = seededPostMap.get(expectedPosts.find((p) => p.key === "P22")!.title);
  const p07 = seededPostMap.get(expectedPosts.find((p) => p.key === "P07")!.title);

  if (p01) verifyThreadScores(expectedThreads.T1, p01.id);
  if (p04) verifyThreadScores(expectedThreads.T2, p04.id);
  if (p22) verifyThreadScores(expectedThreads.T3, p22.id);
  if (p07) verifyThreadScores(expectedThreads.T4, p07.id);

  assert(threadScoreMismatches === 0, "Thread Comments Target Scores", `All 42 thread comments match exact target score (${threadScoreMismatches} mismatches)`);

  // 3C. Specific Thread Depth & Counts
  const p01Comments = allSeededComments.filter((c) => c.post_id === p01?.id);
  assert(p01Comments.length === 14, "P01 Thread Count", `P01 has exactly 14 comments (found ${p01Comments.length})`);

  const maxDepthP01 = Math.max(...p01Comments.map((c) => c.depth));
  assert(maxDepthP01 >= 6, "P01 Nesting Depth", `P01 thread chain reaches depth ${maxDepthP01} (>= 6 required for "Continue this thread")`);

  const p04Comments = allSeededComments.filter((c) => c.post_id === p04?.id);
  assert(p04Comments.length === 13, "P04 Thread Count", `P04 has exactly 13 comments (found ${p04Comments.length})`);

  // 3D. Pinned Posts Check
  const pinnedPosts = (seededPosts || []).filter((p) => p.is_pinned);
  assert(pinnedPosts.length === 2, "Pinned Posts Count", `Exactly 2 posts are pinned (found ${pinnedPosts.length})`);

  const p24 = seededPostMap.get(expectedPosts.find((p) => p.key === "P24")!.title);
  assert(p24?.is_pinned === true, "P24 Pinned", `P24 in webdev is pinned`);
  assert(p22?.is_pinned === true, "P22 Pinned", `P22 in askcuria is pinned`);

  // --------------------------------------------------------------------------
  // 4. FILLER COMMENTS RULES
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Filler Comments Author & Membership Checks ---");

  // Build membership map: community_id -> Set<user_id>
  const commMembersMap = new Map<string, Set<string>>();
  for (const m of allMembers || []) {
    if (!commMembersMap.has(m.community_id)) commMembersMap.set(m.community_id, new Set());
    commMembersMap.get(m.community_id)!.add(m.user_id);
  }

  // Non-threaded posts are filler posts
  const fillerPostTitles = new Set(expectedPosts.filter((p) => p.threadKey === null).map((p) => p.title));
  const fillerPosts = (seededPosts || []).filter((p) => fillerPostTitles.has(p.title));

  let fillerAuthorViolations = 0;
  let fillerMembershipViolations = 0;

  for (const fPost of fillerPosts) {
    const postComments = allSeededComments.filter((c) => c.post_id === fPost.id);
    const validMembers = commMembersMap.get(fPost.community_id) || new Set();

    for (const comment of postComments) {
      if (comment.author_id === fPost.author_id) {
        fillerAuthorViolations++;
      }
      if (!validMembers.has(comment.author_id)) {
        fillerMembershipViolations++;
      }
    }
  }

  assert(fillerAuthorViolations === 0, "Filler Author Check", `No filler comment was authored by the post's author (${fillerAuthorViolations} violations)`);
  assert(fillerMembershipViolations === 0, "Filler Membership Check", `Every filler commenter is an enrolled community member (${fillerMembershipViolations} violations)`);

  // --------------------------------------------------------------------------
  // 5. FEED REPORTS
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Feed Reports (Top 5 by Score, Newest, Hot) ---");

  // Top 5 by score
  const topByScore = [...(seededPosts || [])].sort((a, b) => b.score - a.score).slice(0, 5);
  console.log("\n🏆 Top 5 Posts by Score:");
  topByScore.forEach((p, idx) => {
    console.log(`   ${idx + 1}. [Score: ${p.score}] ${p.title}`);
  });

  // Top 5 newest
  const topNewest = [...(seededPosts || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  console.log("\n⏱ Top 5 Newest Posts:");
  topNewest.forEach((p, idx) => {
    console.log(`   ${idx + 1}. [Created: ${p.created_at.slice(0, 10)}] ${p.title}`);
  });

  // Top 5 Hot
  const topHot = [...(seededPosts || [])].sort((a, b) => b.hot_rank - a.hot_rank).slice(0, 5);
  console.log("\n🔥 Top 5 Posts by Hot Rank:");
  topHot.forEach((p, idx) => {
    console.log(`   ${idx + 1}. [HotRank: ${p.hot_rank.toFixed(3)}] ${p.title}`);
  });

  // --------------------------------------------------------------------------
  // 6. SECURITY AUDIT (No Service Role Key or Passwords in src/)
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Security Audit (Codebase Scan) ---");

  let leakedKey = false;
  try {
    const grepKey = execSync("grep -rn 'SUPABASE_SERVICE_ROLE_KEY' src/ || true", { encoding: "utf-8" }).trim();
    if (grepKey.length > 0) {
      leakedKey = true;
      console.error("  ❌ Found SUPABASE_SERVICE_ROLE_KEY references in src/:", grepKey);
    }
  } catch (err) {
    // Grep returns 1 if not found
  }
  assert(!leakedKey, "Service Role Key Isolation", "SUPABASE_SERVICE_ROLE_KEY is never referenced in src/");

  let leakedPassword = false;
  const credPath = path.resolve(process.cwd(), ".seed-credentials.local");
  if (fs.existsSync(credPath)) {
    const credText = fs.readFileSync(credPath, "utf-8");
    const passwords = credText
      .split("\n")
      .map((l) => l.split("|")[2]?.trim())
      .filter((p) => p && p.length > 8);

    for (const pwd of passwords) {
      try {
        const grepPwd = execSync(`grep -rn -F -e "${pwd}" src/ || true`, { encoding: "utf-8" }).trim();
        if (grepPwd.length > 0) {
          leakedPassword = true;
          console.error(`  ❌ Demo password found in src/:`, grepPwd);
          break;
        }
      } catch {}
    }
  }
  assert(!leakedPassword, "Password Leak Isolation", "No generated demo passwords exist in src/");

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n=================================================================");
  if (failures.length > 0) {
    console.error(`❌ VERIFICATION FAILED with ${failures.length} issue(s):`);
    for (const f of failures) {
      console.error(`   - [${f.category}] ${f.message}`);
    }
    console.log("=================================================================\n");
    process.exit(1);
  } else {
    console.log("🎉 ALL VERIFICATION ASSERTIONS PASSED CLEANLY (100% GREEN)!");
    console.log("=================================================================\n");
  }
}

verify().catch((err) => {
  console.error("❌ Verification uncaught exception:", err);
  process.exit(1);
});
