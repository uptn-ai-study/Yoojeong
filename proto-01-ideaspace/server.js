const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  ROOT,
  UPLOAD_DIR,
  useBlob,
  readProjects,
  writeProjects,
  storeUpload,
  removeLocalFile,
  ensureLocalDirs,
} = require("./storage");

ensureLocalDirs();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/uploads", express.static(UPLOAD_DIR));

const upload = multer({
  storage: useBlob()
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOAD_DIR),
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname || "");
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
        },
      }),
});

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function projectOut(p) {
  return { ...p, comments: Array.isArray(p.comments) ? p.comments : [] };
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((err) => {
      console.error(err);
      res.status(500).json({ message: err.message || "서버 오류가 발생했습니다." });
    });
  };
}

async function applyFileUploads(project, files) {
  const projectFile = files.file?.[0];
  const bannerFile = files.banner?.[0];

  if (projectFile) {
    removeLocalFile(project.filePath);
    const stored = await storeUpload(projectFile);
    project.fileName = stored.fileName;
    project.filePath = stored.filePath;
  }

  if (bannerFile) {
    removeLocalFile(project.bannerPath);
    const stored = await storeUpload(bannerFile);
    project.bannerPath = stored.filePath;
  }
}

app.get(
  "/api/projects",
  asyncRoute(async (req, res) => {
    const projects = (await readProjects())
      .map(projectOut)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ projects });
  })
);

app.get(
  "/api/projects/:id",
  asyncRoute(async (req, res) => {
    const project = (await readProjects()).find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    res.json({ project: projectOut(project) });
  })
);

app.post(
  "/api/projects",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  asyncRoute(async (req, res) => {
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

    const projects = await readProjects();
    const project = {
      id: uid(),
      title: title.trim().slice(0, 30),
      description: description.trim().slice(0, 1000),
      version: version.trim() || "1.0",
      author: author.trim(),
      url: url.trim(),
      fileName: "",
      filePath: "",
      bannerPath: "",
      createdAt: Date.now(),
      comments: [],
    };

    await applyFileUploads(project, files);
    projects.push(project);
    await writeProjects(projects);
    res.status(201).json({ project: projectOut(project) });
  })
);

app.patch(
  "/api/projects/:id",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  asyncRoute(async (req, res) => {
    const { title = "", description = "", version = "", author = "", url = "" } = req.body;
    if (!title.trim() || !description.trim() || !author.trim()) {
      return res.status(400).json({ message: "서비스명, 설명, 올린 사람은 필수입니다." });
    }

    const projects = await readProjects();
    const idx = projects.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });

    const project = projects[idx];
    const files = req.files || {};
    const projectFile = files.file?.[0];
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

    await applyFileUploads(project, files);
    await writeProjects(projects);
    res.json({ project: projectOut(project) });
  })
);

app.post(
  "/api/projects/:id/save",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  asyncRoute(async (req, res) => {
    const { title = "", description = "", version = "", author = "", url = "" } = req.body;
    if (!title.trim() || !description.trim() || !author.trim()) {
      return res.status(400).json({ message: "서비스명, 설명, 올린 사람은 필수입니다." });
    }

    const projects = await readProjects();
    const idx = projects.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });

    const project = projects[idx];
    const files = req.files || {};
    const projectFile = files.file?.[0];
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

    await applyFileUploads(project, files);
    await writeProjects(projects);
    res.json({ project: projectOut(project) });
  })
);

app.delete(
  "/api/projects/:id",
  asyncRoute(async (req, res) => {
    const projects = await readProjects();
    const idx = projects.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    const [removed] = projects.splice(idx, 1);
    await writeProjects(projects);

    removeLocalFile(removed.filePath);
    removeLocalFile(removed.bannerPath);
    res.json({ ok: true });
  })
);

app.post(
  "/api/projects/:id/comments",
  asyncRoute(async (req, res) => {
    const { author = "", body = "" } = req.body;
    if (!body.trim()) return res.status(400).json({ message: "코멘트를 입력해 주세요." });
    const projects = await readProjects();
    const project = projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    project.comments = Array.isArray(project.comments) ? project.comments : [];
    const comment = {
      id: uid(),
      author: author.trim() || "익명",
      body: body.trim().slice(0, 400),
      createdAt: Date.now(),
    };
    project.comments.push(comment);
    await writeProjects(projects);
    res.status(201).json({ comment, project: projectOut(project) });
  })
);

app.patch(
  "/api/projects/:id/comments/:commentId",
  asyncRoute(async (req, res) => {
    const { body = "" } = req.body;
    if (!body.trim()) return res.status(400).json({ message: "수정할 내용을 입력해 주세요." });
    const projects = await readProjects();
    const project = projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    project.comments = Array.isArray(project.comments) ? project.comments : [];
    const comment = project.comments.find((c) => c.id === req.params.commentId);
    if (!comment) return res.status(404).json({ message: "코멘트를 찾을 수 없습니다." });
    comment.body = body.trim().slice(0, 400);
    await writeProjects(projects);
    res.json({ comment, project: projectOut(project) });
  })
);

app.delete(
  "/api/projects/:id/comments/:commentId",
  asyncRoute(async (req, res) => {
    const projects = await readProjects();
    const project = projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    project.comments = Array.isArray(project.comments) ? project.comments : [];
    const before = project.comments.length;
    project.comments = project.comments.filter((c) => c.id !== req.params.commentId);
    if (project.comments.length === before) {
      return res.status(404).json({ message: "코멘트를 찾을 수 없습니다." });
    }
    await writeProjects(projects);
    res.json({ ok: true, project: projectOut(project) });
  })
);

function sendPublicFile(res, fileName, contentType) {
  const abs = path.join(ROOT, fileName);
  if (!fs.existsSync(abs)) return res.status(404).send("Not found");
  if (contentType) res.type(contentType);
  return res.sendFile(abs);
}

app.get("/uploads/:name", (req, res) => {
  const abs = path.join(UPLOAD_DIR, path.basename(req.params.name));
  if (!fs.existsSync(abs)) return res.status(404).end();
  return res.sendFile(abs);
});

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
    console.log(useBlob() ? "Storage: Vercel Blob" : "Storage: local filesystem");
  });
}
