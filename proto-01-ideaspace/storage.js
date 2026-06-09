const fs = require("fs");
const path = require("path");
const { put, head, get } = require("@vercel/blob");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const DB_FILE = path.join(DATA_DIR, "projects.json");
const PROJECTS_BLOB_PATH = "ideaspace/projects.json";
const WRITE_CACHE_MS = 15000;
let lastWrittenProjects = null;
let lastWrittenAt = 0;

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function readProjectsDisk() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeProjects(projects) {
  let changed = false;
  const next = projects.map((p) => {
    const copy = { ...p };
    if (copy.bannerPath && !/^https?:\/\//i.test(copy.bannerPath)) {
      const abs = path.join(ROOT, copy.bannerPath);
      if (useBlob() || !fs.existsSync(abs)) {
        copy.bannerPath = "";
        changed = true;
      }
    }
    if (copy.filePath && !/^https?:\/\//i.test(copy.filePath)) {
      const abs = path.join(ROOT, copy.filePath);
      if (useBlob() || !fs.existsSync(abs)) {
        copy.filePath = "";
        copy.fileName = copy.fileName || "";
        changed = true;
      }
    }
    return copy;
  });
  return { projects: next, changed };
}

async function readStreamBody(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readProjectsBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const result = await get(PROJECTS_BLOB_PATH, {
      access: "public",
      token,
    });
    if (result?.statusCode === 200 && result.stream) {
      const parsed = JSON.parse(await readStreamBody(result.stream));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fall back to head + fetch
  }

  const meta = await head(PROJECTS_BLOB_PATH, { token });
  const bust = meta.url.includes("?") ? "&" : "?";
  const res = await fetch(`${meta.url}${bust}t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load projects blob");
  const parsed = await res.json();
  return Array.isArray(parsed) ? parsed : [];
}

async function readProjects() {
  if (lastWrittenProjects && Date.now() - lastWrittenAt < WRITE_CACHE_MS) {
    const { projects: sanitized, changed } = sanitizeProjects(lastWrittenProjects);
    if (changed) await writeProjects(sanitized);
    return sanitized;
  }

  let projects;
  if (!useBlob()) {
    projects = readProjectsDisk();
  } else {
    try {
      projects = await readProjectsBlob();
    } catch {
      projects = readProjectsDisk();
      if (projects.length) await writeProjects(projects);
    }
  }
  const { projects: sanitized, changed } = sanitizeProjects(projects);
  if (changed) await writeProjects(sanitized);
  return sanitized;
}

async function writeProjects(projects) {
  if (!useBlob()) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(projects, null, 2), "utf8");
    lastWrittenProjects = projects;
    lastWrittenAt = Date.now();
    return;
  }
  await put(PROJECTS_BLOB_PATH, JSON.stringify(projects), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  lastWrittenProjects = projects;
  lastWrittenAt = Date.now();
}

async function storeUpload(file) {
  if (!file) return { filePath: "", fileName: "" };

  if (useBlob() && file.buffer) {
    const ext = path.extname(file.originalname || "");
    const key = `ideaspace/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const blob = await put(key, file.buffer, {
      access: "public",
      contentType: file.mimetype || "application/octet-stream",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { filePath: blob.url, fileName: file.originalname || "" };
  }

  return {
    filePath: path.posix.join("uploads", path.basename(file.filename)),
    fileName: file.originalname || "",
  };
}

function removeLocalFile(relativePath) {
  if (!relativePath || /^https?:\/\//i.test(relativePath)) return;
  const abs = path.join(ROOT, relativePath);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

function ensureLocalDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]", "utf8");
}

module.exports = {
  ROOT,
  UPLOAD_DIR,
  useBlob,
  readProjects,
  writeProjects,
  storeUpload,
  removeLocalFile,
  ensureLocalDirs,
};
