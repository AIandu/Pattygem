import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Optional lock: if PATTY_ACCESS_KEY is set on the server, every /api call
// (except /api/health) must send a matching "x-patty-key" header.
// Leave it unset until the front end sends that header.
if (process.env.PATTY_ACCESS_KEY) {
  app.use("/api", (req, res, next) => {
    if (req.path === "/health") return next();
    if (req.headers["x-patty-key"] !== process.env.PATTY_ACCESS_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// Patty's voice: plain conversation, honest about what she can and can't see.
// ---------------------------------------------------------------------------
const PATTY_SYSTEM_INSTRUCTION = `
You are Patty, Loretta's cognitive predictive partner. Loretta has final say on everything.

How to talk:
- Plain conversation. No headers, no fixed sections.
- Lead with the answer. For ideas: the idea, what it takes to build it, a rough timeline, and the first step.
- Keep it short. Go deeper only when she asks you to elaborate.
- Mention a risk only when there's a real one, in a sentence.

Honesty:
- You only know what's in this conversation and any repository or file content shown to you below.
- A filename only proves the file exists. Never describe code you weren't given.
- If you couldn't read something, say so and say what you'd need.
- Never invent repos, files, commits, or past conversations. Label guesses as guesses.
- Only take action when she asks.
`;

// ---------------------------------------------------------------------------
// Gemini caller with retry + model fallback
// ---------------------------------------------------------------------------
async function callGeminiWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  preferredModel?: string;
  customApiKey?: string;
}): Promise<string> {
  const apiKey = params.customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on server and no custom key provided. Please configure your key in Settings.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  const modelsToTry =
    params.preferredModel === "gemini-3.1-pro-preview" || params.preferredModel === "pro"
      ? ["gemini-3.1-pro-preview", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
      : ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.1-pro-preview"];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: params.temperature ?? 0.7,
          },
        });
        if (response && response.text) return response.text;
      } catch (err: any) {
        lastError = err;
        const rawMsg = err?.message || String(err);

        if (rawMsg.includes("404") || rawMsg.includes("no longer available") || rawMsg.includes("not found")) {
          break; // model retired: try the next one
        }

        if (rawMsg.includes("prepayment credits are depleted") || rawMsg.includes("resource_exhausted")) {
          throw new Error("Prepayment credits on the workspace key are depleted. Enter your own Gemini API key in Patty Settings for uninterrupted use.");
        }

        const isTransient =
          rawMsg.includes("503") ||
          rawMsg.includes("high demand") ||
          rawMsg.includes("429") ||
          rawMsg.includes("UNAVAILABLE") ||
          rawMsg.includes("quota");

        console.warn(`[Patty] ${model} (attempt ${attempt}/2) failed: ${rawMsg.slice(0, 150)}`);

        if (isTransient && attempt < 2) {
          await new Promise((r) => setTimeout(r, 600 * attempt + Math.floor(Math.random() * 300)));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("All model backends are busy right now. Please retry in a moment.");
}

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------
const GH = "https://api.github.com";

function ghHeaders(token?: string, accept = "application/vnd.github.v3+json") {
  const h: Record<string, string> = { "User-Agent": "Patty-Cognitive-Partner", Accept: accept };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// Fetch from GitHub; if the token is rejected, retry once without it (public repos).
async function ghFetch(url: string, token?: string, accept?: string): Promise<Response> {
  let r = await fetch(url, { headers: ghHeaders(token, accept) });
  if (r.status === 401 && token) r = await fetch(url, { headers: ghHeaders(undefined, accept) });
  return r;
}

const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

// ---------------------------------------------------------------------------
// Health + token status (never sends the token to the browser)
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    partner: "Patty",
    authority: "Loretta",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/github/secrets-status", async (_req, res) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.json({ hasSecretTokens: false, tokens: [], authenticatedUser: null });

  try {
    const userRes = await fetch(`${GH}/user`, { headers: ghHeaders(token) });
    if (userRes.ok) {
      const u = await userRes.json();
      return res.json({
        hasSecretTokens: true,
        tokens: [], // the token stays on the server
        authenticatedUser: u.login || null,
        name: u.name || null,
      });
    }
  } catch (_) {}

  return res.json({ hasSecretTokens: false, tokens: [], authenticatedUser: null });
});

// ---------------------------------------------------------------------------
// Repo lookup for chat: reads the tree, README, and a handful of real files
// ---------------------------------------------------------------------------
async function resolveRepoAndFetchDetails(
  prompt: string,
  activeRepo: any,
  accounts: any[] = [],
  allRepos: any[] = []
): Promise<{ detectedRepo: any | null; contextText: string }> {
  let targetRepo: any = null;

  // 1) A pasted GitHub URL wins
  const urlMatch = prompt.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?=[\s/?#)"']|$)/i);
  if (urlMatch) {
    const [, urlOwner, urlName] = urlMatch;
    targetRepo =
      allRepos.find(
        (r) =>
          r.name?.toLowerCase() === urlName.toLowerCase() &&
          r.owner?.login?.toLowerCase() === urlOwner.toLowerCase()
      ) || { name: urlName, owner: { login: urlOwner } };
  }

  // 2) Otherwise the active repo, or one named in the message
  if (!targetRepo) {
    targetRepo = activeRepo;
    const words = prompt.split(/[\s,?:;"'()]+/);
    if (!targetRepo || words.some((w) => w.toLowerCase().includes("repo"))) {
      for (const r of allRepos) {
        if (r.name && words.some((w) => w.toLowerCase() === r.name.toLowerCase())) {
          targetRepo = r;
          break;
        }
      }
      if (!targetRepo) {
        const m = prompt.match(/(?:repo|repository|check|audit|inspect|review)\s+([a-zA-Z0-9_-]+)/i);
        if (m && m[1] && !["the", "my", "a", "an", "this", "our", "me", "for"].includes(m[1].toLowerCase())) {
          const found = allRepos.find((r) => r.name?.toLowerCase() === m[1].toLowerCase());
          targetRepo = found || { name: m[1], owner: { login: accounts[0]?.username || "Dessiidoo" } };
        }
      }
    }
  }

  if (!targetRepo) return { detectedRepo: null, contextText: "" };

  const repoName: string = targetRepo.name;
  const owner: string = targetRepo.owner?.login || accounts[0]?.username || "Dessiidoo";
  const matchingAccount =
    accounts.find((a) => a.username?.toLowerCase() === owner.toLowerCase() || a.id === targetRepo.accountId) ||
    accounts[0];
  const token: string | undefined = matchingAccount?.token || process.env.GITHUB_TOKEN;
  const base = `${GH}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`;

  let liveTree: string[] = [];
  let readmeSnippet = "";
  const fileBlocks: string[] = [];

  try {
    // Repo metadata (default branch etc.) when we don't already have it
    if (!targetRepo.default_branch) {
      const metaRes = await ghFetch(base, token);
      if (metaRes.ok) targetRepo = { ...(await metaRes.json()), accountId: targetRepo.accountId };
    }
    const branch = targetRepo.default_branch || "HEAD";

    const treeRes = await ghFetch(`${base}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token);
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (Array.isArray(treeData?.tree)) {
        const entries: any[] = treeData.tree;
        liveTree = entries.slice(0, 80).map((f) => `${f.type === "tree" ? "[DIR]" : "[FILE]"} ${f.path}`);

        // Pick up to 8 real source files to read (entry points first)
        const skip = /(^|\/)(node_modules|dist|build|\.git)\/|lock|\.(png|jpe?g|gif|svg|ico|woff2?|mp4|pdf)$/i;
        const priority = /(^|\/)(server|app|main|index|types|storage)\.[a-z]+$|package\.json$/i;
        const readable = entries.filter(
          (f) => f.type === "blob" && !skip.test(f.path) && /\.(tsx?|jsx?|py|rs|go|json|css|html)$/i.test(f.path) && (f.size ?? 0) < 200000
        );
        const picked = [...readable.filter((f) => priority.test(f.path)), ...readable.filter((f) => !priority.test(f.path))].slice(0, 8);

        const blocks = await Promise.all(
          picked.map(async (f) => {
            try {
              const r = await ghFetch(`${base}/contents/${encPath(f.path)}`, token, "application/vnd.github.raw");
              if (!r.ok) return "";
              const text = await r.text();
              const cut = text.length > 3000;
              return `--- ${f.path}${cut ? " (first 3000 characters only)" : ""} ---\n${text.slice(0, 3000)}`;
            } catch (_) {
              return "";
            }
          })
        );
        fileBlocks.push(...blocks.filter(Boolean));
      }
    }

    const readmeRes = await ghFetch(`${base}/readme`, token, "application/vnd.github.raw");
    if (readmeRes.ok) readmeSnippet = (await readmeRes.text()).slice(0, 2000);
  } catch (_) {}

  const verified = liveTree.length > 0;

  const contextText = verified
    ? `[VERIFIED GITHUB REPOSITORY: ${owner}/${repoName}]
- Branch: ${targetRepo.default_branch || "default"}
- Description: ${targetRepo.description || "none"}
- Files in tree (first 80):
  ${liveTree.join("\n  ")}
${readmeSnippet ? `\n- README preview:\n${readmeSnippet}\n` : ""}
${fileBlocks.length ? `\n- FILE CONTENTS I WAS ABLE TO READ:\n${fileBlocks.join("\n\n")}\n` : ""}
EVIDENCE BOUNDARY: You have only what is written above. Files listed in the tree but not shown under FILE CONTENTS have not been read; you only know they exist. Never quote or describe code that isn't shown above, and never invent line numbers.`
    : `[COULD NOT READ REPOSITORY: ${owner}/${repoName}]
Nothing was retrieved. Tell Loretta plainly that you couldn't read this repo (wrong name, private repo without a token, or GitHub unavailable). Do not guess at its contents.`;

  return { detectedRepo: targetRepo, contextText };
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
app.post("/api/patty/chat", async (req, res) => {
  try {
    const {
      prompt,
      history = [],
      activeRepo = null,
      fileContext = null,
      ownerOverride = false,
      expandDecision = false,
      modelTier = "flash",
      customGeminiApiKey,
      accounts = [],
      allRepos = [],
    } = req.body;

    const apiKeyToUse = (customGeminiApiKey || req.headers["x-gemini-api-key"] || "").toString().trim();

    if (!prompt && !fileContext) {
      return res.status(400).json({ error: "Prompt or file context is required." });
    }

    const repoInfo = await resolveRepoAndFetchDetails(prompt || "", activeRepo, accounts, allRepos);

    const contextLines: string[] = [];
    if (ownerOverride) {
      contextLines.push("[Loretta invoked an owner override. Follow her exact words right away.]");
    }
    if (repoInfo.contextText) {
      contextLines.push(repoInfo.contextText);
    } else if (activeRepo) {
      contextLines.push(
        `[Active repository (metadata only, contents not read): ${activeRepo.name}${activeRepo.description ? ` - ${activeRepo.description}` : ""}${activeRepo.language ? `, ${activeRepo.language}` : ""}]`
      );
    }
    if (fileContext) {
      contextLines.push(
        `[FILE LORETTA SHARED: ${fileContext.path || "code snippet"}]\n\`\`\`${fileContext.language || ""}\n${fileContext.content?.slice(0, 15000)}\n\`\`\``
      );
    }
    if (expandDecision) {
      contextLines.push("[Loretta asked you to elaborate on your previous reply. Go deeper, still in plain conversation.]");
    }

    const contents: any[] = [];
    for (const msg of history.slice(-10)) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: contextLines.length ? `${contextLines.join("\n\n")}\n\nLoretta: ${prompt}` : `Loretta: ${prompt}` }],
    });

    const outputText = await callGeminiWithFallback({
      contents,
      systemInstruction: PATTY_SYSTEM_INSTRUCTION,
      temperature: 0.7,
      preferredModel: modelTier === "pro" ? "gemini-3.1-pro-preview" : "gemini-3.8-flash",
      customApiKey: apiKeyToUse || undefined,
    });

    return res.json({
      text: outputText,
      sections: parsePattySections(outputText),
      detectedRepo: repoInfo.detectedRepo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in /api/patty/chat:", error);
    let readableError = error?.message || "Patty couldn't process that.";
    try {
      const parsed = JSON.parse(readableError);
      if (parsed?.error?.message) readableError = parsed.error.message;
    } catch (_) {}
    return res.status(500).json({ error: readableError });
  }
});

// Kept so the existing front end keeps working. Plain replies have no "###"
// headings, so everything lands in directive/response as normal text.
function parsePattySections(rawText: string) {
  const sections = {
    directive: "",
    response: "",
    prediction: "",
    primaryRisk: "",
    memoryNotes: "",
    decision: "",
    elaboration: "",
  };

  const directiveMatch = rawText.match(/###\s*(?:Directive|Response)\s*([\s\S]*?)(?=###\s*(?:Prediction|Primary\s*Risk|Risk|Memory\s*Notes|Memory|Decision|Elaboration)|$)/i);
  const riskMatch = rawText.match(/###\s*(?:Primary\s*Risk|Risk)\s*([\s\S]*?)(?=###\s*(?:Memory\s*Notes|Memory|Decision|Elaboration)|$)/i);
  const memoryMatch = rawText.match(/###\s*(?:Memory\s*Notes|Memory)\s*([\s\S]*?)(?=###\s*(?:Decision|Elaboration)|$)/i);
  const decisionMatch = rawText.match(/###\s*Decision\s*([\s\S]*?)(?=###\s*Elaboration|$)/i);
  const elaborationMatch = rawText.match(/###\s*Elaboration\s*([\s\S]*?$)/i);

  if (directiveMatch) {
    sections.directive = directiveMatch[1].trim();
    sections.response = sections.directive;
  }
  if (riskMatch) sections.primaryRisk = riskMatch[1].trim();
  if (memoryMatch) sections.memoryNotes = memoryMatch[1].trim();
  if (decisionMatch) sections.decision = decisionMatch[1].trim();
  if (elaborationMatch) sections.elaboration = elaborationMatch[1].trim();

  if (!sections.directive && !sections.primaryRisk && !sections.decision) {
    sections.directive = rawText.trim();
    sections.response = rawText.trim();
  }
  return sections;
}

// ---------------------------------------------------------------------------
// GitHub proxy endpoints (real data only; failures are reported, never faked)
// ---------------------------------------------------------------------------
app.post("/api/github/multi-repos", async (req, res) => {
  const { accounts } = req.body as {
    accounts: Array<{ id: string; username: string; label: string; token?: string; isConfigured?: boolean }>;
  };

  const targetAccounts =
    Array.isArray(accounts) && accounts.length > 0
      ? accounts
      : [{ id: "account_1", username: "Dessiidoo", label: "Primary GitHub", isConfigured: true }];

  const allRepos: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < targetAccounts.length; i++) {
    const acc = targetAccounts[i];
    if (!acc.username || !acc.username.trim()) continue;
    const username = acc.username.trim();
    const label = acc.label || username;
    let token = acc.token?.trim() || (i === 0 ? process.env.GITHUB_TOKEN : undefined);
    let loaded = false;

    // Authenticated user's own repos (includes private ones)
    if (token && (i === 0 || username.toLowerCase() === "dessiidoo")) {
      try {
        const r = await fetch(`${GH}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator`, {
          headers: ghHeaders(token),
        });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length > 0) {
            allRepos.push(...data.map((repo: any) => ({ ...repo, accountId: acc.id, accountLabel: label })));
            loaded = true;
          }
        } else if (r.status === 401) {
          token = undefined;
        }
      } catch (_) {}
    }

    // Public repos for the username
    if (!loaded) {
      try {
        const r = await ghFetch(`${GH}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, token);
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) {
            allRepos.push(...data.map((repo: any) => ({ ...repo, accountId: acc.id, accountLabel: label })));
            loaded = true;
          }
        } else {
          errors.push(`${username}: GitHub returned ${r.status}`);
        }
      } catch (_) {
        errors.push(`${username}: could not reach GitHub`);
      }
    }
  }

  const seen = new Set<string>();
  const repos = allRepos.filter((r) => {
    const key = `${r.owner?.login || ""}/${r.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return res.json({ repos, totalCount: repos.length, accountCount: targetAccounts.length, errors });
});

app.get("/api/github/repos", async (req, res) => {
  const username = (req.query.username as string) || "";
  const token = (req.headers["x-github-token"] as string) || process.env.GITHUB_TOKEN;
  if (!username) return res.status(400).json({ repos: [], error: "username is required" });

  try {
    const r = await ghFetch(`${GH}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, token);
    if (r.ok) return res.json({ repos: await r.json(), source: "live_github" });
    return res.status(r.status).json({ repos: [], error: `GitHub returned ${r.status}` });
  } catch (_) {
    return res.status(502).json({ repos: [], error: "Could not reach GitHub" });
  }
});

app.get("/api/github/tree", async (req, res) => {
  const { owner, repo } = req.query as { owner?: string; repo?: string };
  if (!owner || !repo) return res.status(400).json({ error: "owner and repo are required" });
  const token = (req.headers["x-github-token"] as string) || process.env.GITHUB_TOKEN;

  try {
    const r = await ghFetch(
      `${GH}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/HEAD?recursive=1`,
      token
    );
    if (r.ok) {
      const data = await r.json();
      return res.json({ tree: data.tree, truncated: data.truncated });
    }
    return res.status(r.status).json({ error: `Couldn't read ${owner}/${repo} from GitHub (status ${r.status}).` });
  } catch (e: any) {
    return res.status(502).json({ error: e.message || "Could not reach GitHub" });
  }
});

app.post("/api/github/file", async (req, res) => {
  const { owner, repo, path: filePath } = req.body || {};
  if (!owner || !repo || !filePath) return res.status(400).json({ error: "owner, repo and path are required" });
  const token = (req.headers["x-github-token"] as string) || process.env.GITHUB_TOKEN;

  try {
    const r = await ghFetch(
      `${GH}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encPath(filePath)}`,
      token,
      "application/vnd.github.v3.raw"
    );
    if (r.ok) return res.json({ content: await r.text(), path: filePath });
    return res.status(r.status).json({ error: `Couldn't read ${filePath} from GitHub (status ${r.status}).` });
  } catch (e: any) {
    return res.status(502).json({ error: e.message || "Could not reach GitHub" });
  }
});

// ---------------------------------------------------------------------------
// Assess / README / minor fix
// ---------------------------------------------------------------------------
app.post("/api/github/assess", async (req, res) => {
  try {
    const { repo, fileTree = [], action = "assess" } = req.body;

    const prompt = `
Action: ${String(action).toUpperCase()}
Repository: ${repo?.name || "unknown"}
Description: ${repo?.description || "none provided"}
Language: ${repo?.language || "unknown"}
Files (names only, contents not read): ${fileTree.map((f: any) => f.path).slice(0, 35).join(", ")}

If action is 'readme': write a clear README.md from what the file names and description support. Don't claim features you can't see.
If action is 'improvements': list likely improvements, and say which are guesses from file names.
If action is 'minor_fix': say what you'd need to see first; don't invent code.
`;

    const resultText = await callGeminiWithFallback({
      contents: prompt,
      systemInstruction: PATTY_SYSTEM_INSTRUCTION,
    });

    res.json({ result: resultText, timestamp: new Date().toISOString() });
  } catch (error: any) {
    let readableError = error?.message || "Failed to assess project";
    try {
      const parsed = JSON.parse(readableError);
      if (parsed?.error?.message) readableError = parsed.error.message;
    } catch (_) {}
    res.status(500).json({ error: readableError });
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Patty] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
