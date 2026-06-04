const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const DB_FILE = path.join(DATA_DIR, "projects.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]", "utf8");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({ storage });

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readProjects() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  fs.writeFileSync(DB_FILE, JSON.stringify(projects, null, 2), "utf8");
}

function projectOut(p) {
  return { ...p, comments: Array.isArray(p.comments) ? p.comments : [] };
}

app.get("/api/projects", (req, res) => {
  const projects = readProjects()
    .map(projectOut)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ projects });
});

app.get("/api/projects/:id", (req, res) => {
  const project = readProjects().find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
  res.json({ project: projectOut(project) });
});

app.post(
  "/api/projects",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  (req, res) => {
    const { title = "", description = "", version = "", author = "", url = "" } = req.body;
    if (!title.trim() || !description.trim() || !author.trim()) {
      return res.status(400).json({ message: "서비스명, 설명, 올린 사람은 필수입니다." });
    }

    const files = req.files || {};
    const projectFile = files.file?.[0];
    const bannerFile = files.banner?.[0];

    if (!url.trim() && !projectFile) {
      return res.status(400).json({ message: "URL 또는 파일 중 하나를 입력해 주세요." });
    }

    const projects = readProjects();
    const project = {
      id: uid(),
      title: title.trim().slice(0, 30),
      description: description.trim().slice(0, 1000),
      version: version.trim() || "1.0",
      author: author.trim(),
      url: url.trim(),
      fileName: projectFile?.originalname || "",
      filePath: projectFile ? path.posix.join("uploads", path.basename(projectFile.filename)) : "",
      bannerPath: bannerFile ? path.posix.join("uploads", path.basename(bannerFile.filename)) : "",
      createdAt: Date.now(),
      comments: [],
    };
    projects.push(project);
    writeProjects(projects);
    res.status(201).json({ project: projectOut(project) });
  }
);

app.patch(
  "/api/projects/:id",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  (req, res) => {
    const { title = "", description = "", version = "", author = "", url = "" } = req.body;
    if (!title.trim() || !description.trim() || !author.trim()) {
      return res.status(400).json({ message: "서비스명, 설명, 올린 사람은 필수입니다." });
    }

    const projects = readProjects();
    const idx = projects.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });

    const project = projects[idx];
    const files = req.files || {};
    const projectFile = files.file?.[0];
    const bannerFile = files.banner?.[0];
    const nextUrl = url.trim();
    const hasExistingFile = Boolean(project.filePath);

    if (!nextUrl && !hasExistingFile && !projectFile) {
      return res.status(400).json({ message: "URL 또는 파일 중 하나를 입력해 주세요." });
    }

    project.title = title.trim().slice(0, 30);
    project.description = description.trim().slice(0, 1000);
    project.version = version.trim() || "1.0";
    project.author = author.trim();
    project.url = nextUrl;

    if (projectFile) {
      const oldFile = project.filePath;
      project.fileName = projectFile.originalname;
      project.filePath = path.posix.join("uploads", path.basename(projectFile.filename));
      if (oldFile) {
        const abs = path.join(ROOT, oldFile);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    }

    if (bannerFile) {
      const oldBanner = project.bannerPath;
      project.bannerPath = path.posix.join("uploads", path.basename(bannerFile.filename));
      if (oldBanner) {
        const abs = path.join(ROOT, oldBanner);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    }

    writeProjects(projects);
    res.json({ project: projectOut(project) });
  }
);

app.post(
  "/api/projects/:id/save",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  (req, res) => {
    const { title = "", description = "", version = "", author = "", url = "" } = req.body;
    if (!title.trim() || !description.trim() || !author.trim()) {
      return res.status(400).json({ message: "서비스명, 설명, 올린 사람은 필수입니다." });
    }

    const projects = readProjects();
    const idx = projects.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });

    const project = projects[idx];
    const files = req.files || {};
    const projectFile = files.file?.[0];
    const bannerFile = files.banner?.[0];
    const nextUrl = url.trim();
    const hasExistingFile = Boolean(project.filePath);

    if (!nextUrl && !hasExistingFile && !projectFile) {
      return res.status(400).json({ message: "URL 또는 파일 중 하나를 입력해 주세요." });
    }

    project.title = title.trim().slice(0, 30);
    project.description = description.trim().slice(0, 1000);
    project.version = version.trim() || "1.0";
    project.author = author.trim();
    project.url = nextUrl;

    if (projectFile) {
      const oldFile = project.filePath;
      project.fileName = projectFile.originalname;
      project.filePath = path.posix.join("uploads", path.basename(projectFile.filename));
      if (oldFile) {
        const abs = path.join(ROOT, oldFile);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    }

    if (bannerFile) {
      const oldBanner = project.bannerPath;
      project.bannerPath = path.posix.join("uploads", path.basename(bannerFile.filename));
      if (oldBanner) {
        const abs = path.join(ROOT, oldBanner);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    }

    writeProjects(projects);
    res.json({ project: projectOut(project) });
  }
);

app.delete("/api/projects/:id", (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
  const [removed] = projects.splice(idx, 1);
  writeProjects(projects);

  for (const filePath of [removed.filePath, removed.bannerPath]) {
    if (!filePath) continue;
    const abs = path.join(ROOT, filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
  res.json({ ok: true });
});

app.post("/api/projects/:id/comments", (req, res) => {
  const { author = "", body = "" } = req.body;
  if (!body.trim()) return res.status(400).json({ message: "코멘트를 입력해 주세요." });
  const projects = readProjects();
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
  project.comments = Array.isArray(project.comments) ? project.comments : [];
  const comment = { id: uid(), author: author.trim() || "익명", body: body.trim().slice(0, 400), createdAt: Date.now() };
  project.comments.push(comment);
  writeProjects(projects);
  res.status(201).json({ comment });
});

app.patch("/api/projects/:id/comments/:commentId", (req, res) => {
  const { body = "" } = req.body;
  if (!body.trim()) return res.status(400).json({ message: "수정할 내용을 입력해 주세요." });
  const projects = readProjects();
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
  project.comments = Array.isArray(project.comments) ? project.comments : [];
  const comment = project.comments.find((c) => c.id === req.params.commentId);
  if (!comment) return res.status(404).json({ message: "코멘트를 찾을 수 없습니다." });
  comment.body = body.trim().slice(0, 400);
  writeProjects(projects);
  res.json({ comment });
});

app.delete("/api/projects/:id/comments/:commentId", (req, res) => {
  const projects = readProjects();
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
  project.comments = Array.isArray(project.comments) ? project.comments : [];
  const before = project.comments.length;
  project.comments = project.comments.filter((c) => c.id !== req.params.commentId);
  if (project.comments.length === before) return res.status(404).json({ message: "코멘트를 찾을 수 없습니다." });
  writeProjects(projects);
  res.json({ ok: true });
});

function sendPublicFile(res, fileName, contentType) {
  const abs = path.join(ROOT, fileName);
  if (!fs.existsSync(abs)) return res.status(404).send("Not found");
  if (contentType) res.type(contentType);
  return res.sendFile(abs);
}

app.get("/app.js", (req, res) => sendPublicFile(res, "app.js", "application/javascript"));
app.get("/styles.css", (req, res) => sendPublicFile(res, "styles.css", "text/css"));
app.get("/bg_01.png", (req, res) => sendPublicFile(res, "bg_01.png", "image/png"));
app.get("/", (req, res) => sendPublicFile(res, "index.html", "text/html"));

app.use(express.static(ROOT));

app.get(/.*/, (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  return sendPublicFile(res, "index.html", "text/html");
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Idea Space server running: http://localhost:${PORT}`);
  });
}
