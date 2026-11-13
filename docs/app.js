const PAGE = 20;
const COL = { id: 0, drug: 1, ind: 2, title: 3, app: 4, type: 5, phase: 6, cls: 7, shard: 8, status: 9, recruit: 10 };
const GROUPS = [
  ["公示", ["试验状态", "招募状态", "首次公示信息日期", "相关登记号", "临床申请受理号", "备案号"]],
  ["药物", ["药物名称", "药物类型", "适应症", "方案是否为联合用药"]],
  ["题目与方案", ["试验通俗题目", "试验专业题目", "试验方案编号", "方案最新版本号", "版本日期"]],
  ["申请与联系", ["申请人名称", "申请人联系人", "联系人姓名", "联系人座机", "联系人手机号", "联系人Email", "联系人邮政地址", "联系人邮编"]],
  ["设计", ["试验分类", "试验分期", "设计类型", "随机化", "盲法", "试验范围"]],
  ["受试者", ["年龄", "性别", "健康受试者", "入选标准", "排除标准"]],
  ["用药与终点", ["试验药", "对照药", "主要终点指标及评价时间", "次要终点指标及评价时间"]],
  ["机构与研究者", ["主要研究者", "单位名称", "省（州）", "电话", "邮政地址", "邮编", "审查结论"]],
  ["入组", ["目标入组人数", "已入组人数", "实际入组总人数", "第一例受试者签署知情同意书日期", "第一例受试者入组日期", "试验完成日期"]],
];

const state = {
  meta: null,
  rows: [],
  matches: [],
  page: 1,
  sort: "id-desc",
  selected: -1,
  shards: new Map(),
  pendingShards: new Map(),
  activeId: "",
};

const q = document.querySelector("#q");
const filtersEl = document.querySelector("#filters");
const countEl = document.querySelector("#count");
const resultsEl = document.querySelector("#results");
const detailEl = document.querySelector("#detail");
const snapshotEl = document.querySelector("#snapshot");
const clearBtn = document.querySelector("#clearBtn");
const listView = document.querySelector("#listView");
const detailView = document.querySelector("#detailView");
const paginationEl = document.querySelector("#pagination");
const sortSelect = document.querySelector("#sortSelect");
const fieldInputs = [...document.querySelectorAll("[data-field]")];
const downloadBtn = document.querySelector("#downloadBtn");
const filterSelects = [];

function text(value) {
  return (value || "").toString().toLowerCase();
}

function rowBlob(row) {
  return text([row[COL.id], row[COL.drug], row[COL.ind], row[COL.title], row[COL.app]].join("\n"));
}

function currentFilters() {
  const picked = {};
  for (const select of filterSelects) {
    if (select.value) picked[select.dataset.col] = select.value;
  }
  return picked;
}

function hasQuery() {
  return q.value.trim() || filterSelects.some((select) => select.value) || fieldInputs.some((input) => input.value.trim());
}

function applySearch() {
  if (!state.meta) return;
  const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const picked = currentFilters();
  state.matches = state.rows.filter((row) => {
    if (picked.type && row[COL.type] !== picked.type) return false;
    if (picked.phase && row[COL.phase] !== picked.phase) return false;
    if (picked.cls && row[COL.cls] !== picked.cls) return false;
    if (picked.recruit && row[COL.recruit] !== picked.recruit) return false;
    if (fieldInputs.some((input) => !text(row[COL[input.dataset.field]]).includes(text(input.value.trim())))) return false;
    if (!terms.length) return true;
    const blob = rowBlob(row);
    return terms.every((term) => blob.includes(term));
  });
  state.page = 1;
  state.selected = -1;
  clearBtn.hidden = !hasQuery();
  sortMatches();
  renderResults();
}

function trialStatus(row) {
  return [row[COL.status], row[COL.recruit]].filter(Boolean).join(" ") || "状态未采集";
}

function sortMatches() {
  const byStatus = state.sort.startsWith("status");
  const direction = state.sort.endsWith("asc") ? 1 : -1;
  state.matches.sort((a, b) => {
    const primary = byStatus ? trialStatus(a).localeCompare(trialStatus(b), "zh-CN") : a[COL.id].localeCompare(b[COL.id]);
    return primary * direction || b[COL.id].localeCompare(a[COL.id]);
  });
  sortSelect.value = state.sort;
}

function renderResults() {
  const total = state.matches.length;
  const start = (state.page - 1) * PAGE;
  const visible = state.matches.slice(start, start + PAGE);
  countEl.textContent = `找到 ${total.toLocaleString("zh-CN")} 项研究`;
  downloadBtn.disabled = !total;
  if (!visible.length) {
    resultsEl.innerHTML = '<tr><td colspan="4" class="table-message">没有符合条件的登记。请更换关键词，或点击“清除筛选”重新查询。</td></tr>';
    paginationEl.innerHTML = "";
    return;
  }
  resultsEl.innerHTML = visible.map((row, index) => {
    const recruitment = row[COL.recruit] || row[COL.status] || "状态未采集";
    const tagClass = recruitment === "招募中" ? "" : recruitment === "尚未招募" ? "pending" : "complete";
    return `<tr>
      <td class="project-cell"><a class="result-link" data-index="${start + index}" href="#${encodeURIComponent(row[COL.id])}">${escapeHtml(cleanDrug(row[COL.drug]) || row[COL.id])}</a>
        <p class="trial-title">${escapeHtml(row[COL.title] || "本条试验题目尚未采集")}</p><span class="trial-id">${escapeHtml(row[COL.id])}</span></td>
      <td class="trial-indication">${escapeHtml(row[COL.ind] || "适应症尚未采集")}</td>
      <td class="phase-cell"><span class="phase-label">${escapeHtml(row[COL.phase] || "分期未采集")}</span><span class="drug-type">${escapeHtml(row[COL.type] || "")}</span></td>
      <td class="status-cell"><span class="recruit-tag ${tagClass}">${escapeHtml(recruitment)}</span><span class="trial-status">${escapeHtml(row[COL.status] || "")}</span></td>
    </tr>`;
  }).join("");
  renderPagination(total);
}

function renderPagination(total) {
  const pages = Math.ceil(total / PAGE);
  const pageButton = (page, label, disabled = false) => `<button type="button" data-page="${page}"${disabled ? " disabled" : ""}${page === state.page && !label ? ' aria-current="page"' : ""} aria-label="${label || `第 ${page} 页`}">${label || page}</button>`;
  const numbers = [...new Set([1, state.page - 1, state.page, state.page + 1, pages])].filter((p) => p > 0 && p <= pages).sort((a, b) => a - b);
  const links = numbers.map((page, index) => `${index && page > numbers[index - 1] + 1 ? '<span class="page-gap">…</span>' : ""}${pageButton(page)}`).join("");
  const start = (state.page - 1) * PAGE + 1;
  const end = Math.min(state.page * PAGE, total);
  paginationEl.innerHTML = `<span class="pagination-summary">显示 ${start}–${end} 项，共 ${total.toLocaleString("zh-CN")} 项研究</span><nav class="page-links" aria-label="结果分页">${pageButton(state.page - 1, "上一页", state.page === 1)}${links}${pageButton(state.page + 1, "下一页", state.page === pages)}</nav>`;
}

function goToPage(page) {
  if (!Number.isInteger(page) || page < 1 || page > Math.ceil(state.matches.length / PAGE)) return;
  state.page = page;
  renderResults();
  document.querySelector("#resultsHeading").focus({ preventScroll: true });
  document.querySelector(".results-toolbar").scrollIntoView({ block: "start" });
}

function showList(focus = false) {
  state.activeId = "";
  listView.hidden = false;
  detailView.hidden = true;
  document.querySelector("#breadcrumbCurrent").textContent = "查询结果";
  document.title = "临床试验检索 · 让研究更清晰可见";
  history.replaceState(null, "", location.pathname + location.search);
  updateCarouselTimer();
  if (focus) {
    const link = resultsEl.querySelector(`[data-index="${state.selected}"]`);
    (link || q).focus();
  }
}

function readableName(value) {
  const textValue = (value || "").trim();
  if (!textValue || /^[\d\s]+$/.test(textValue)) return "";
  return textValue;
}

function cleanDrug(value) {
  return (value || "").replace(/\s*曾用名:\s*(NA)?\s*$/i, "").trim();
}

function chainNumbers(text, re) {
  const marks = [];
  let match = re.exec(text);
  while (match) {
    marks.push({ n: Number(match[1]), start: match.index, contentStart: match.index + match[0].length });
    match = re.exec(text);
  }
  const chain = [];
  let expect = 1;
  for (const mark of marks) {
    if (mark.n !== expect) continue;
    chain.push(mark);
    expect += 1;
  }
  if (chain.length < 2) return null;
  return chain.map((mark, index) => {
    const end = index + 1 < chain.length ? chain[index + 1].start : text.length;
    return {
      n: mark.n,
      text: text.slice(mark.contentStart, end).trim().replace(/[；;]\s*$/, ""),
    };
  });
}

function splitNumbered(text) {
  return chainNumbers(text, /(?:^|(?<=[；;。]))\s*(\d{1,2})(?=\s)/g)
    || chainNumbers(text, /(?:^|\s)(\d{1,2})[）)]\s*/g)
    || chainNumbers(text, /(?:^|\s)(\d{1,2})(?=\s+\S)/g);
}

function renderNumbered(text) {
  const items = splitNumbered(text);
  if (!items) return `<p class="prose">${escapeHtml(text)}</p>`;
  const rows = items.map((item) => `<li><span class="num">${item.n}</span><span>${escapeHtml(item.text)}</span></li>`).join("");
  return `<ol class="criteria">${rows}</ol>`;
}

function renderDrugs(text) {
  const labels = ["中文通用名", "英文通用名", "商品名称", "剂型", "规格", "用法用量", "用药时程"];
  const body = text.replace(/^序号\s*名称\s*用法\s*/, "");
  const parts = body.split(/(?=\d+\s*中文通用名:)/).map((part) => part.trim()).filter(Boolean);
  const cards = parts.map((part) => {
    const cleaned = part.replace(/^\d+\s*/, "");
    const re = new RegExp(`(${labels.join("|")}):`, "g");
    const marks = [...cleaned.matchAll(re)];
    if (!marks.length) return "";
    const rows = marks.map((mark, index) => {
      const start = mark.index + mark[0].length;
      const end = index + 1 < marks.length ? marks[index + 1].index : cleaned.length;
      const value = cleaned.slice(start, end).trim();
      if (!value || value === "NA") return "";
      return `<div class="row"><dt>${escapeHtml(mark[1])}</dt><dd>${escapeHtml(value)}</dd></div>`;
    }).join("");
    return rows ? `<div class="drug-card"><dl>${rows}</dl></div>` : "";
  }).join("");
  return cards || `<p class="prose">${escapeHtml(text)}</p>`;
}

function renderEndpoints(text) {
  const body = text.replace(/^序号\s*指标\s*评价时间\s*终点指标选择\s*/, "");
  const single = body.match(/^(\d{1,2})\s+([\s\S]+)$/);
  const items = splitNumbered(body) || [{ n: single ? single[1] : "", text: single ? single[2] : body }];
  const parsed = items.map((item) => {
    const match = item.text.match(/^(.*)\s+(\S+)\s+(\S*指标\S*)$/);
    if (!match || !match[1] || match[3].length > 40) return { ...item, measure: item.text, when: "", kind: "" };
    return { n: item.n, measure: match[1], when: match[2], kind: match[3] };
  });
  if (!parsed.some((item) => item.when)) return renderNumbered(body);
  const rows = parsed.map((item) => `<tr><td class="num">${escapeHtml(item.n)}</td><td>${escapeHtml(item.measure)}</td><td>${escapeHtml(item.when)}</td><td>${escapeHtml(item.kind)}</td></tr>`).join("");
  return `<table class="endpoints"><thead><tr><th></th><th>指标</th><th>评价时间</th><th>终点</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const JUNK_VALUE = /^(国家或地区|城市|职称|序号|版本号|名称|用法)$/;
const LONG_FIELDS = new Set(["入选标准", "排除标准", "试验药", "对照药", "主要终点指标及评价时间", "次要终点指标及评价时间"]);

function renderField(key, value) {
  if (JUNK_VALUE.test(value.trim())) return "";
  if (key === "试验药" || key === "对照药") return renderDrugs(value);
  if (key === "主要终点指标及评价时间" || key === "次要终点指标及评价时间") return renderEndpoints(value);
  if (key === "入选标准" || key === "排除标准" || /(?:^|\s)\d{1,2}[）)]\s/.test(value)) return renderNumbered(value);
  return `<p class="prose">${escapeHtml(value)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function openRow(index) {
  const row = state.matches[index];
  if (!row) return;
  await openRecord(row, index);
}

async function openRecord(row, index = -1, updateUrl = true) {
  state.selected = index;
  state.activeId = row[COL.id];
  if (updateUrl && location.hash !== `#${encodeURIComponent(row[COL.id])}`) history.pushState(null, "", `#${encodeURIComponent(row[COL.id])}`);
  listView.hidden = true;
  detailView.hidden = false;
  updateCarouselTimer();
  document.querySelector("#breadcrumbCurrent").textContent = "试验详情";
  document.querySelector("#copyBtn span").textContent = "复制链接";
  document.title = `${row[COL.id]} · 试验登记详情`;
  window.scrollTo({ top: 0 });
  detailEl.innerHTML = `<p class="status">正在读取 ${escapeHtml(row[COL.id])} 的详情…</p>`;
  try {
    const record = await loadRecord(row);
    if (state.activeId !== row[COL.id]) return;
    renderDetail(row, record);
  } catch (error) {
    if (state.activeId !== row[COL.id]) return;
    detailEl.innerHTML = `<div class="status" data-kind="error"><p>详情加载失败。请检查网络后重试，或返回查询结果。</p><button type="button" class="plain-button" id="retryBtn">重新加载详情</button></div>`;
    document.querySelector("#retryBtn").addEventListener("click", () => openRecord(row, index, false));
  }
}

async function loadRecord(row) {
  const shardNo = row[COL.shard];
  if (!state.shards.has(shardNo)) {
    if (!state.pendingShards.has(shardNo)) {
      const promise = (async () => {
        const name = state.meta.shards[shardNo];
        const response = await fetch(name);
        if (!response.ok) throw new Error(`分片 ${name} 返回 ${response.status}`);
        state.shards.set(shardNo, await response.json());
      })();
      state.pendingShards.set(shardNo, promise);
    }
    try {
      await state.pendingShards.get(shardNo);
    } finally {
      state.pendingShards.delete(shardNo);
    }
  }
  const record = state.shards.get(shardNo)[row[COL.id]];
  if (!record) throw new Error("这条登记不在对应分片里。");
  return record;
}

function renderDetail(row, sourceRecord) {
  const id = row[COL.id];
  const incomplete = !Object.keys(sourceRecord).length;
  const record = {
    "药物名称": row[COL.drug], "适应症": row[COL.ind], "试验通俗题目": row[COL.title],
    "试验状态": row[COL.status], "招募状态": row[COL.recruit], ...sourceRecord,
  };
  const blocks = GROUPS.map(([heading, keys]) => {
    const rows = keys.filter((key) => record[key] && (key !== "申请人名称" || readableName(record[key])) && !JUNK_VALUE.test(String(record[key]).trim()));
    if (!rows.length) return "";
    const body = rows.map((key) => {
      const value = key === "药物名称" ? cleanDrug(record[key]) : record[key];
      return `<div class="row"><dt>${escapeHtml(key)}</dt><dd>${LONG_FIELDS.has(key) || value.length > 180 ? renderField(key, value) : escapeHtml(value)}</dd></div>`;
    }).join("");
    return `<section class="group"><h2>${heading}</h2><dl class="record-fields">${body}</dl></section>`;
  }).join("");
  detailEl.innerHTML = `
    <h1 class="detail-title" tabindex="-1">${escapeHtml(record["试验通俗题目"] || record["药物名称"] || id)}</h1>
    <p class="detail-meta"><span>登记号：${escapeHtml(id)}</span><span>试验状态：${escapeHtml(trialStatus(row))}</span><span>数据日期：${escapeHtml(state.meta.snapshot)}</span></p>
    ${incomplete ? '<p class="status">本条详情尚未采集成功，以下显示列表中的基本信息。</p>' : ""}
    ${blocks || '<p class="placeholder">这条记录没有可显示的字段。</p>'}
  `;
  document.querySelector(".detail-title").focus({ preventScroll: true });
}

function buildFilters() {
  const specs = [
    ["药物类型", "type", "全部药物类型"],
    ["试验分期", "phase", "全部试验分期"],
    ["招募状态", "recruit", "全部招募状态"],
    ["试验分类", "cls", "全部试验分类"],
  ];
  filtersEl.innerHTML = specs.map(([label, key, allLabel]) => {
    const options = state.meta.filters[label] || [];
    const items = options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    return `<label><span class="sr-only">${escapeHtml(label)}</span><select data-col="${key}"><option value="">${allLabel}</option>${items}</select></label>`;
  }).join("");
  filterSelects.push(...filtersEl.querySelectorAll("select"));
  for (const select of filterSelects) select.addEventListener("change", applySearch);
}

function moveSelection(delta) {
  if (!state.matches.length) return;
  const base = state.selected < 0 ? (state.page - 1) * PAGE : state.selected;
  const next = Math.min(state.matches.length - 1, Math.max(0, base + delta));
  const page = Math.floor(next / PAGE) + 1;
  if (page !== state.page) {
    state.page = page;
    renderResults();
  }
  state.selected = next;
  const button = resultsEl.querySelector(`[data-index="${next}"]`);
  button?.focus();
  button?.scrollIntoView({ block: "nearest" });
}

resultsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".result-link");
  if (!button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  openRow(Number(button.dataset.index));
});

function scheduleSearch() {
  window.clearTimeout(applySearch._timer);
  applySearch._timer = window.setTimeout(applySearch, 80);
}
q.addEventListener("input", scheduleSearch);
for (const input of fieldInputs) input.addEventListener("input", scheduleSearch);
document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.meta) return;
  window.clearTimeout(applySearch._timer);
  applySearch();
  document.querySelector(".results-panel").scrollIntoView({ block: "start" });
});
clearBtn.addEventListener("click", () => {
  q.value = "";
  for (const select of filterSelects) select.value = "";
  for (const input of fieldInputs) input.value = "";
  applySearch();
  q.focus();
});
document.addEventListener("keydown", (event) => {
  const editing = ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName);
  if (event.key === "/" && !editing && !listView.hidden) {
    event.preventDefault();
    q.focus();
  } else if (event.key === "ArrowDown" && document.activeElement === q) {
    event.preventDefault();
    moveSelection(state.selected < 0 ? 0 : 1);
  } else if (event.key === "ArrowDown" && event.target.classList?.contains("result-link")) {
    event.preventDefault();
    moveSelection(1);
  } else if (event.key === "ArrowUp" && event.target.classList?.contains("result-link")) {
    event.preventDefault();
    moveSelection(-1);
  }
});

async function main() {
  try {
    const [metaResponse, indexResponse] = await Promise.all([
      fetch("data/meta.json", { cache: "no-cache" }),
      fetch("data/index.json?v=3", { cache: "no-cache" }),
    ]);
    if (!metaResponse.ok || !indexResponse.ok) throw new Error("索引文件没有返回");
    state.meta = await metaResponse.json();
    const index = await indexResponse.json();
    state.rows = index.rows;
    snapshotEl.textContent = `数据快照 ${state.meta.snapshot.replaceAll("-", ".")} · 收录 ${state.meta.count.toLocaleString("zh-CN")} 项试验`;
    buildFilters();
    applySearch();
    openFromHash();
  } catch (error) {
    snapshotEl.textContent = "索引没有加载";
    countEl.textContent = "";
    resultsEl.innerHTML = `<tr><td colspan="4" class="table-message">索引加载失败。请刷新重试，并通过本地网站或 GitHub Pages 打开页面。</td></tr>`;
  }
}

function openFromHash() {
  if (!state.meta) return;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ""; }
  if (["main", "trials", "about"].includes(id)) {
    if (id !== "about" && listView.hidden) showList();
    document.querySelector(`#${id}`)?.scrollIntoView({ block: "start" });
    return;
  }
  if (!id) { showList(); return; }
  const row = state.rows.find((item) => item[COL.id] === id);
  if (row) {
    openRecord(row, state.matches.indexOf(row), false);
  } else {
    showList();
    q.value = id;
    applySearch();
  }
}

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  state.page = 1;
  state.selected = -1;
  sortMatches();
  renderResults();
});
paginationEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (button && !button.disabled) goToPage(Number(button.dataset.page));
});
document.querySelector("#backBtn").addEventListener("click", () => showList(true));
document.querySelector("#copyBtn").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(location.href);
    button.querySelector("span").textContent = "已复制";
  } catch { button.querySelector("span").textContent = "请从地址栏复制"; }
});
downloadBtn.addEventListener("click", () => {
  const quote = (value) => {
    let cell = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(cell)) cell = "'" + cell;
    return `"${cell.replaceAll('"', '""')}"`;
  };
  const rows = [["序号", "登记号", "试验状态", "药物名称", "适应症", "试验通俗题目"], ...state.matches.map((row, index) => [index + 1, row[COL.id], trialStatus(row), cleanDrug(row[COL.drug]), row[COL.ind], row[COL.title]])];
  const csv = "\uFEFF" + rows.map((row) => row.map(quote).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `临床试验_查询结果_${state.meta.snapshot}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener("hashchange", openFromHash);

const slides = [...document.querySelectorAll(".carousel-slide")];
const slideButtons = [...document.querySelectorAll("[data-slide]")];
const carousel = document.querySelector(".hero-carousel");
const carouselToggle = document.querySelector("#carouselToggle");
const captions = ["从细微之处，开启探索。", "在生命细节里，发现新的问题。", "每一步探索，都值得被看见。"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let carouselIndex = 0;
let carouselPaused = reducedMotion.matches;
let carouselHovered = false;
let carouselFocused = false;
let carouselTimer;

function showSlide(index) {
  carouselIndex = index;
  for (const [i, slide] of slides.entries()) {
    const active = i === index;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", String(!active));
    slide.inert = !active;
    slideButtons[i].toggleAttribute("aria-current", active);
    if (active) slideButtons[i].setAttribute("aria-current", "true");
  }
  document.querySelector("#carouselCaption").textContent = captions[index];
}

function updateCarouselTimer() {
  window.clearTimeout(carouselTimer);
  if (!carouselPaused && !carouselHovered && !carouselFocused && !document.hidden && !listView.hidden) {
    carouselTimer = window.setTimeout(() => {
      showSlide((carouselIndex + 1) % slides.length);
      updateCarouselTimer();
    }, 6500);
  }
}

function updateCarouselButton() {
  carouselToggle.setAttribute("aria-label", carouselPaused ? "播放轮播" : "暂停轮播");
  carouselToggle.innerHTML = carouselPaused
    ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6z"/></svg>'
    : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10"/></svg>';
}

for (const button of slideButtons) button.addEventListener("click", () => {
  showSlide(Number(button.dataset.slide));
  carouselPaused = true;
  updateCarouselButton();
  updateCarouselTimer();
});
carouselToggle.addEventListener("click", () => {
  carouselPaused = !carouselPaused;
  updateCarouselButton();
  updateCarouselTimer();
});
carousel.addEventListener("mouseenter", () => { carouselHovered = true; updateCarouselTimer(); });
carousel.addEventListener("mouseleave", () => { carouselHovered = false; updateCarouselTimer(); });
carousel.addEventListener("focusin", () => { carouselFocused = true; updateCarouselTimer(); });
carousel.addEventListener("focusout", (event) => { carouselFocused = carousel.contains(event.relatedTarget); updateCarouselTimer(); });
document.addEventListener("visibilitychange", updateCarouselTimer);
reducedMotion.addEventListener("change", (event) => {
  carouselPaused = event.matches;
  updateCarouselButton();
  updateCarouselTimer();
});
updateCarouselButton();
updateCarouselTimer();
main();
