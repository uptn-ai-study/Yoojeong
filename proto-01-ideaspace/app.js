function createElement(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function showToast(message, durationMs = 1800) {
  const toast = createElement(`<div class="toast"><span class="toast-dot"></span><span>${message}</span></div>`);
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 220);
  }, durationMs);
}

const uiState = {
  editingComment: null,
};

function openConfirmModal(message) {
  return new Promise((resolve) => {
    const modal = createElement(`
      <div class="modal-backdrop">
        <div class="modal-card">
          <p class="modal-message">${message}</p>
          <div class="modal-actions">
            <button class="ghost-button" data-modal-action="cancel">취소</button>
            <button class="primary-button" data-modal-action="confirm"><span class="icon">✔</span><span>확인</span></button>
          </div>
        </div>
      </div>
    `);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-modal-action]");
      if (!actionEl) {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
        return;
      }
      const action = actionEl.dataset.modalAction;
      modal.remove();
      resolve(action === "confirm");
    });
  });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function getRoute() {
  const hash = location.hash.replace(/^#/, "") || "/";
  if (hash === "/") return { name: "home" };
  if (hash === "/new") return { name: "new" };
  const detail = hash.match(/^\/project\/([^/]+)$/);
  if (detail) return { name: "detail", id: decodeURIComponent(detail[1]) };
  const comments = hash.match(/^\/project\/([^/]+)\/comments$/);
  if (comments) return { name: "comments", id: decodeURIComponent(comments[1]) };
  return { name: "home" };
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const text = await res.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = {};
    }
  }
  if (!res.ok) {
    const hint =
      res.status === 404 && options.method && options.method !== "GET"
        ? " 서버를 재시작해 주세요. (npm run dev)"
        : "";
    throw new Error((body.message || "요청에 실패했습니다.") + hint);
  }
  return body;
}

function fileUrl(filePath) {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `/${filePath.replace(/^\/+/, "")}`;
}

const BANNER_PLAIN_CLASS = "banner-thumbnail--plain";

function bannerStyle(project) {
  if (project.bannerPath) {
    const url = fileUrl(project.bannerPath);
    return `style="background-image:url('${url.replace(/'/g, "%27")}')"`;
  }
  return `style="background-color:rgb(245, 240, 230)"`;
}

function escAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;");
}

function formatUrlLabel(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const label = `${host}${path}`;
    return label.length > 36 ? `${label.slice(0, 36)}…` : label;
  } catch {
    return url.length > 36 ? `${url.slice(0, 36)}…` : url;
  }
}

function renderLayout(content, { home = false, formPage = false, hideAddButton = false, showHeaderClose = false, commentsOverlay = false } = {}) {
  let header = "";
  if (home) {
    const rightControl = showHeaderClose
      ? `<button type="button" class="close-toggle home-header-close" data-action="go-home" aria-label="닫기">×</button>`
      : hideAddButton
        ? `<span class="home-header-spacer" aria-hidden="true"></span>`
        : `<button class="primary-button home-add-btn" data-action="new-project" aria-label="새 아이디어 올리기">
          <span class="icon">＋</span>
        </button>`;
    header = `<header class="home-header">
        <span class="home-header-spacer" aria-hidden="true"></span>
        ${rightControl}
      </header>`;
  } else if (!formPage) {
    header = `<header>
        <div class="brand">
          <div class="brand-text">
            <div class="brand-title">IDEA SPACE</div>
            <div class="brand-subtitle">아이디어를 공유하고 함께 실험하는 공간</div>
          </div>
        </div>
        <div class="primary-actions">
          <div class="pill"><span class="pill-dot"></span><span>실험실 베타</span></div>
          <button class="primary-button" data-action="new-project"><span class="icon">＋</span><span>새 아이디어 올리기</span></button>
        </div>
      </header>`;
  }

  const pageClass = [
    home ? "page-home" : "",
    formPage ? "page-form" : "",
    home && formPage ? "page-overlay-open" : "",
    commentsOverlay ? "page-comments-overlay" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="page${pageClass ? ` ${pageClass}` : ""}">
      ${header}
      ${content}
    </div>
  `;
}

function renderHomeHero() {
  return `<section class="home-hero">
    <p class="hero-eyebrow">IDEA SPACE</p>
    <h1 class="hero-title">IDEA SPACE</h1>
    <p class="hero-tagline">Once you try, you will eventually make it happen.</p>
  </section>`;
}

function overlayRouteMeta(route) {
  if (route.name === "new") return { overlayKind: "new", commentsOverlay: false };
  if (route.name === "detail") return { overlayKind: "detail", commentsOverlay: false };
  if (route.name === "comments") return { overlayKind: "comments", commentsOverlay: true };
  return null;
}

function renderOverlayPlaceholder(overlayKind) {
  const labels = { new: "새 아이디어 등록", detail: "아이디어 상세", comments: "코멘트" };
  const body = `<div class="overlay-loading" aria-busy="true"><span class="overlay-loading-text">불러오는 중…</span></div>`;
  return renderOverlayShell(labels[overlayKind] || "로딩", body, {
    showCloseButton: overlayKind === "comments",
  });
}

function renderOverlayShell(ariaLabel, bodyHtml, { showCloseButton = true } = {}) {
  const closeBtn = showCloseButton
    ? `<button type="button" class="close-toggle form-overlay-close" data-action="go-home" aria-label="닫기">×</button>`
    : "";
  return `<div class="form-overlay" role="dialog" aria-modal="true" aria-label="${ariaLabel}">
    <button type="button" class="form-overlay-backdrop" data-action="go-home" aria-label="닫기"></button>
    <div class="form-overlay-panel${showCloseButton ? "" : " form-overlay-panel-no-close"}">
      ${closeBtn}
      ${bodyHtml}
    </div>
  </div>`;
}

function renderFormOverlay() {
  const formHtml = `<section class="form-card form-card-overlay"><form id="projectForm" enctype="multipart/form-data">
        <div class="form-grid">
          <div>
            <div class="field-group"><label class="field-label">서비스명 <span>최대 30자</span></label><input type="text" name="title" class="input" maxlength="30" required /></div>
            <div class="field-group"><label class="field-label">설명 <span>최대 1,000자</span></label><textarea name="description" class="textarea" maxlength="1000" required></textarea></div>
            <div class="inline-fields">
              <div class="field-group"><label class="field-label">버전</label><input type="text" name="version" class="input" placeholder="1.0" /></div>
              <div class="field-group"><label class="field-label">올린 사람</label><input type="text" name="author" class="input" required /></div>
            </div>
          </div>
          <div>
            <div class="field-group"><label class="field-label">공유 URL (선택)</label><input type="url" name="url" class="input" placeholder="https://..." /></div>
            <div class="field-group"><label class="field-label">파일 업로드 (선택)</label><input type="file" name="file" class="input" /></div>
            <div class="field-group"><label class="field-label">배너 업로드 (선택)</label><input type="file" name="banner" accept="image/*" class="input" /></div>
            <div class="banner-preview" id="bannerPreview">기본 배너가 사용됩니다.</div>
          </div>
        </div>
        <div class="form-footer"><button type="button" class="ghost-button" data-action="go-home">취소</button><button type="submit" class="primary-button"><span class="icon">✔</span><span>등록</span></button></div>
      </form></section>`;
  return renderOverlayShell("새 아이디어 등록", formHtml, { showCloseButton: false });
}

function renderDetailOverlay(project) {
  const bannerPreview = project.bannerPath
    ? `<img src="${fileUrl(project.bannerPath)}" alt="배너 미리보기" />`
    : `<div class="banner-preview-plain" aria-hidden="true">기본 배너</div>`;
  const fileHint = project.filePath
    ? `<div class="hint">현재 파일: <a href="${fileUrl(project.filePath)}" target="_blank">${project.fileName || "다운로드"}</a> (새 파일 선택 시 교체됩니다)</div>`
    : `<div class="hint">등록된 파일이 없습니다. 새 파일을 선택해 주세요.</div>`;

  const formHtml = `<section class="form-card form-card-overlay"><form id="editProjectForm" data-project-id="${project.id}" data-has-file="${project.filePath ? "true" : "false"}" enctype="multipart/form-data">
        <div class="form-grid">
          <div>
            <div class="field-group"><label class="field-label">서비스명 <span>최대 30자</span></label><input type="text" name="title" class="input" maxlength="30" required value="${escAttr(project.title)}" /></div>
            <div class="field-group"><label class="field-label">설명 <span>최대 1,000자</span></label><textarea name="description" class="textarea" maxlength="1000" required>${escText(project.description)}</textarea></div>
            <div class="inline-fields">
              <div class="field-group"><label class="field-label">버전</label><input type="text" name="version" class="input" value="${escAttr(project.version || "1.0")}" /></div>
              <div class="field-group"><label class="field-label">올린 사람</label><input type="text" name="author" class="input" required value="${escAttr(project.author)}" /></div>
            </div>
          </div>
          <div>
            <div class="field-group"><label class="field-label">공유 URL (선택)</label><input type="url" name="url" class="input" placeholder="https://..." value="${escAttr(project.url)}" /></div>
            <div class="field-group"><label class="field-label">파일 업로드 (선택)</label><input type="file" name="file" class="input" />${fileHint}</div>
            <div class="field-group"><label class="field-label">배너 업로드 (선택)</label><input type="file" name="banner" accept="image/*" class="input" /></div>
            <div class="banner-preview" id="bannerPreview">${bannerPreview}</div>
          </div>
        </div>
        <div class="form-footer form-footer-with-delete">
          <button type="button" class="ghost-button danger-text" data-action="delete-project" data-project-id="${project.id}">아이디어 삭제</button>
          <div class="form-footer-actions">
            <button type="button" class="ghost-button" data-action="go-home">취소</button>
            <button type="button" class="primary-button" data-action="save-project" data-project-id="${project.id}"><span class="icon">✔</span><span>저장</span></button>
          </div>
        </div>
      </form></section>`;
  return renderOverlayShell("아이디어 상세", formHtml, { showCloseButton: false });
}

function renderHome(projects, { overlayKind = null, overlayProject = null, overlayLoading = false } = {}) {
  const sorted = [...projects].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const grid = sorted.length
    ? `<section class="banner-grid">${sorted
        .map((p) => {
          const plainThumb = !p.bannerPath ? ` ${BANNER_PLAIN_CLASS}` : "";
          const urlRow = p.url?.trim()
            ? `<ul class="banner-card-meta banner-card-meta-url">
                <li class="banner-card-url-item">
                  <span class="meta-label">URL</span>
                  <span class="banner-card-url" role="link" tabindex="0" data-action="open-url" data-url="${escAttr(p.url.trim())}">${escText(formatUrlLabel(p.url.trim()))}</span>
                </li>
              </ul>`
            : "";
          return `<article class="banner-card">
            <button type="button" class="banner-thumbnail banner-thumbnail-btn${plainThumb}" data-action="open-detail" data-project-id="${p.id}" ${bannerStyle(p)} aria-label="${escAttr(p.title)} 배너 — 상세 보기"></button>
            <div class="banner-card-body">
              <button type="button" class="banner-card-detail-trigger" data-action="open-detail" data-project-id="${p.id}">
                <h3 class="banner-card-title">${escText(p.title)}</h3>
                <ul class="banner-card-meta">
                  <li><span class="meta-label">버전</span> v${p.version || "1.0"}</li>
                  <li><span class="meta-label">작성자</span> ${escText(p.author)}</li>
                  <li><span class="meta-label">등록일</span> ${formatDate(p.createdAt)}</li>
                </ul>
              </button>
              ${urlRow}
              <div class="banner-card-footer">
                <button type="button" class="comment-chip" data-action="open-comments" data-project-id="${p.id}"><span class="comment-chip-icon">💬</span><span>${(p.comments || []).length}</span></button>
              </div>
            </div>
          </article>`;
        })
        .join("")}</section>`
    : "";

  let overlayHtml = "";
  if (overlayLoading && overlayKind) overlayHtml = renderOverlayPlaceholder(overlayKind);
  else if (overlayKind === "new") overlayHtml = renderFormOverlay();
  else if (overlayKind === "detail" && overlayProject) overlayHtml = renderDetailOverlay(overlayProject);
  else if (overlayKind === "comments" && overlayProject) overlayHtml = renderCommentsOverlay(overlayProject);

  const hasOverlay = Boolean(overlayHtml);

  return renderLayout(
    `<main class="home-main">
      ${renderHomeHero()}
      <section class="home-projects home-projects-backdrop">${grid}</section>
      ${overlayHtml}
    </main>`,
    {
      home: true,
      formPage: hasOverlay,
      hideAddButton: hasOverlay,
      showHeaderClose: overlayKind === "comments",
      commentsOverlay: overlayKind === "comments",
    }
  );
}

function renderCommentList(project) {
  const list = (project.comments || []).length
    ? project.comments
        .map((c) => {
          const isEditing =
            uiState.editingComment &&
            uiState.editingComment.projectId === project.id &&
            uiState.editingComment.commentId === c.id;
          const bodyPart = isEditing
            ? `<div class="comment-editor">
                <textarea class="textarea comment-edit-input" id="editCommentBody" maxlength="400">${escText(uiState.editingComment.body)}</textarea>
                <div class="comment-actions">
                  <button data-action="save-comment-edit" data-project-id="${project.id}" data-comment-id="${c.id}" class="primary-button"><span class="icon">✔</span><span>저장</span></button>
                  <button data-action="cancel-comment-edit" class="ghost-button">취소</button>
                </div>
              </div>`
            : `<div class="comment-body">${escText(c.body)}</div><div class="comment-actions"><button data-action="edit-comment" data-project-id="${project.id}" data-comment-id="${c.id}" class="secondary-link">수정</button><button data-action="delete-comment" data-project-id="${project.id}" data-comment-id="${c.id}" class="ghost-button danger-text">삭제</button></div>`;
          return `<div class="comment-item"><div class="comment-meta"><span class="comment-author">${c.author || "익명"}</span><span>·</span><span>${formatDate(c.createdAt)}</span></div>${bodyPart}</div>`;
        })
        .join("")
    : `<div class="comment-empty">아직 코멘트가 없습니다.</div>`;
  const composeBox = `<div class="comment-compose">
      <textarea id="commentBody" class="textarea comment-compose-input" maxlength="400" rows="4" placeholder="코멘트를 입력하세요. Enter로 줄바꿈" data-project-id="${project.id}"></textarea>
      <div class="comment-compose-footer">
        <input id="commentAuthor" class="input comment-compose-author" placeholder="이름 (선택)" />
        <div class="comment-compose-actions">
          <span class="comment-compose-hint">Enter 줄바꿈 · Cmd+Enter 등록</span>
          <button type="button" class="primary-button comment-compose-submit" data-action="submit-comment" data-project-id="${project.id}">
            <span class="icon">✔</span><span>등록</span>
          </button>
        </div>
      </div>
    </div>`;

  return { composeBox, list };
}

function renderCommentsOverlay(project) {
  const { composeBox, list } = renderCommentList(project);
  const bodyHtml = `<section class="comment-thread comment-thread-overlay">
      ${composeBox}
      <div class="comment-list">${list}</div>
    </section>`;
  return renderOverlayShell("코멘트", bodyHtml, { showCloseButton: false });
}

function renderNotFound() {
  return renderLayout(`<main><h2 class="page-title">아이디어를 찾을 수 없습니다</h2><button class="primary-button" data-action="go-home"><span class="icon">←</span><span>메인으로</span></button></main>`);
}

async function refreshCommentsOverlay(projectId, project) {
  const app = document.getElementById("app");
  const listData = await api(`/api/projects?_=${Date.now()}`);
  app.innerHTML = renderHome(listData.projects || [], {
    overlayKind: "comments",
    overlayProject: project,
    commentsOverlay: true,
  });
  attachHandlers();
}

async function refreshDetailOverlay(project) {
  const app = document.getElementById("app");
  const listData = await api(`/api/projects?_=${Date.now()}`);
  app.innerHTML = renderHome(listData.projects || [], {
    overlayKind: "detail",
    overlayProject: project,
  });
  attachHandlers();
}

async function render({ skipOverlayLoading = false } = {}) {
  const app = document.getElementById("app");
  const route = getRoute();
  const overlayMeta = overlayRouteMeta(route);

  if (overlayMeta && !skipOverlayLoading) {
    app.innerHTML = renderHome([], {
      overlayKind: overlayMeta.overlayKind,
      overlayLoading: true,
      commentsOverlay: overlayMeta.commentsOverlay,
    });
  }

  try {
    if (route.name === "new") {
      const data = await api("/api/projects");
      app.innerHTML = renderHome(data.projects || [], { overlayKind: "new" });
    } else if (route.name === "detail") {
      const listData = await api(`/api/projects?_=${Date.now()}`);
      const detailData = await api(`/api/projects/${encodeURIComponent(route.id)}?_=${Date.now()}`);
      if (!detailData.project) {
        app.innerHTML = renderHome(listData.projects || []);
        showToast("아이디어를 찾을 수 없습니다.");
      } else {
        app.innerHTML = renderHome(listData.projects || [], {
          overlayKind: "detail",
          overlayProject: detailData.project,
        });
      }
    } else if (route.name === "comments") {
      const listData = await api(`/api/projects?_=${Date.now()}`);
      const commentData = await api(`/api/projects/${encodeURIComponent(route.id)}?_=${Date.now()}`);
      if (!commentData.project) {
        app.innerHTML = renderHome(listData.projects || []);
        showToast("아이디어를 찾을 수 없습니다.");
      } else {
        app.innerHTML = renderHome(listData.projects || [], {
          overlayKind: "comments",
          overlayProject: commentData.project,
        });
      }
    } else {
      const data = await api("/api/projects");
      app.innerHTML = renderHome(data.projects || []);
    }
  } catch (err) {
    if (overlayMeta) {
      app.innerHTML = renderHome([], {
        overlayKind: overlayMeta.overlayKind,
        overlayLoading: true,
        commentsOverlay: overlayMeta.commentsOverlay,
      });
      showToast(err.message);
    } else {
      app.innerHTML = renderLayout(`<main><p class="danger-text">${err.message}</p></main>`, { home: true });
    }
  }
  attachHandlers();
}

function attachHandlers() {
  const root = document.querySelector(".page");
  if (!root) return;

  root.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const projectId = el.dataset.projectId;
    const commentId = el.dataset.commentId;

    if (action === "new-project") return navigate("#/new");
    if (action === "go-home") return navigate("#/");
    if (action === "open-detail") return navigate(`#/project/${encodeURIComponent(projectId)}`);
    if (action === "open-comments") return navigate(`#/project/${encodeURIComponent(projectId)}/comments`);

    if (action === "open-url") {
      const url = el.dataset.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "submit-comment") {
      try {
        await submitComment(projectId);
      } catch (err) {
        showToast(err.message);
      }
      return;
    }

    if (action === "save-project") {
      const form = document.getElementById("editProjectForm");
      if (!form) return;
      await saveEditProject(form);
      return;
    }

    if (action === "delete-project") {
      const ok = await openConfirmModal("프로젝트를 삭제할까요? 삭제 후 복구할 수 없습니다.");
      if (!ok) return;
      await api(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
      showToast("프로젝트를 삭제했습니다.");
      return navigate("#/");
    }

    if (action === "delete-comment") {
      const ok = await openConfirmModal("이 코멘트를 삭제할까요?");
      if (!ok) return;
      await api(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
      if (
        uiState.editingComment &&
        uiState.editingComment.projectId === projectId &&
        uiState.editingComment.commentId === commentId
      ) {
        uiState.editingComment = null;
      }
      showToast("코멘트를 삭제했습니다.");
      return render({ skipOverlayLoading: true });
    }

    if (action === "edit-comment") {
      const commentBodyEl = el.closest(".comment-item")?.querySelector(".comment-body");
      const currentBody = commentBodyEl ? commentBodyEl.textContent.replace(/\r\n/g, "\n") : "";
      uiState.editingComment = { projectId, commentId, body: currentBody };
      return render({ skipOverlayLoading: true });
    }

    if (action === "cancel-comment-edit") {
      uiState.editingComment = null;
      return render({ skipOverlayLoading: true });
    }

    if (action === "save-comment-edit") {
      const text = document.getElementById("editCommentBody")?.value.trim() || "";
      if (!text) return showToast("수정할 내용을 입력해 주세요.");
      await api(`/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      uiState.editingComment = null;
      showToast("코멘트를 수정했습니다.");
      return render({ skipOverlayLoading: true });
    }

  });

  bindCommentComposer();
  bindProjectForm(document.getElementById("projectForm"), { mode: "create" });
  bindProjectForm(document.getElementById("editProjectForm"), { mode: "edit" });
}

async function submitComment(projectId) {
  const bodyEl = document.getElementById("commentBody");
  const authorEl = document.getElementById("commentAuthor");
  if (!bodyEl) return;
  const body = bodyEl.value.trim();
  const author = authorEl?.value.trim() || "";
  if (!body) return showToast("코멘트를 입력해 주세요.");
  const data = await api(`/api/projects/${encodeURIComponent(projectId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, author }),
  });
  showToast("코멘트를 등록했습니다.");
  const route = getRoute();
  if (route.name === "comments" && route.id === projectId) {
    let project = data.project;
    if (!project) {
      const fresh = await api(`/api/projects/${encodeURIComponent(projectId)}?_=${Date.now()}`);
      project = fresh.project;
    }
    if (project) return refreshCommentsOverlay(projectId, project);
  }
  return render({ skipOverlayLoading: true });
}

function bindCommentComposer() {
  const bodyEl = document.getElementById("commentBody");
  if (!bodyEl) return;
  const projectId = bodyEl.dataset.projectId;
  if (!projectId) return;

  bodyEl.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey)) return;
    e.preventDefault();
    try {
      await submitComment(projectId);
    } catch (err) {
      showToast(err.message);
    }
  });
}

async function saveEditProject(form) {
  const data = new FormData(form);
  const url = (data.get("url") || "").toString().trim();
  const newFile = data.get("file");
  const hasNewFile = newFile instanceof File && newFile.name;
  const projectId = form.dataset.projectId;
  const hasExistingFile = form.dataset.hasFile === "true";

  if (!url && !hasExistingFile && !hasNewFile) {
    showToast("URL 또는 파일 중 하나를 입력해 주세요.");
    return;
  }

  try {
    const result = await api(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      body: data,
    });
    showToast("저장되었습니다.", 2000);
    const route = getRoute();
    let project = result.project;
    if (!project) {
      const fresh = await api(`/api/projects/${encodeURIComponent(projectId)}?_=${Date.now()}`);
      project = fresh.project;
    }
    if (route.name === "detail" && route.id === projectId && project) {
      return refreshDetailOverlay(project);
    }
    if (route.name !== "detail" || route.id !== projectId) {
      navigate(`#/project/${encodeURIComponent(projectId)}`);
      return;
    }
    await render({ skipOverlayLoading: true });
  } catch (err) {
    showToast(err.message);
  }
}

function bindProjectForm(form, { mode }) {
  if (!form) return;

  const banner = form.elements.banner;
  const preview = document.getElementById("bannerPreview");
  const defaultPreviewHtml =
    mode === "edit" && preview?.querySelector("img")
      ? preview.innerHTML
      : "기본 배너가 사용됩니다.";

  banner?.addEventListener("change", () => {
    const file = banner.files?.[0];
    if (!file || !preview) {
      if (preview) preview.innerHTML = defaultPreviewHtml;
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.innerHTML = `<img src="${ev.target.result}" alt="배너 미리보기" />`;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const url = (data.get("url") || "").toString().trim();
    const newFile = data.get("file");
    const hasNewFile = newFile instanceof File && newFile.name;

    if (mode === "create") {
      if (!url && !hasNewFile) return showToast("URL 또는 파일 중 하나를 입력해 주세요.");
      try {
        await api("/api/projects", { method: "POST", body: data });
        showToast("아이디어가 등록되었습니다.");
        navigate("#/");
      } catch (err) {
        showToast(err.message);
      }
      return;
    }

    await saveEditProject(form);
  });
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
