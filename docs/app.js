const PAGE = 40;
const COL = { id: 0, drug: 1, ind: 2, title: 3, app: 4, type: 5, phase: 6, cls: 7, shard: 8 };
const GROUPS = [
  ["公示", ["试验状态", "首次公示信息日期", "相关登记号", "临床申请受理号", "备案号"]],
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
  shown: PAGE,
  selected: -1,
  shards: new Map(),
  activeId: "",
};

const q = document.querySelector("#q");
const filtersEl = document.querySelector("#filters");
const countEl = document.querySelector("#count");
const resultsEl = document.querySelector("#results");
const detailEl = document.querySelector("#detail");
const snapshotEl = document.querySelector("#snapshot");
const clearBtn = document.querySelector("#clearBtn");
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
  return q.value.trim() || filterSelects.some((select) => select.value);
}

function applySearch() {
  const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const picked = currentFilters();
  state.matches = state.rows.filter((row) => {
    if (picked.type && row[COL.type] !== picked.type) return false;
    if (picked.phase && row[COL.phase] !== picked.phase) return false;
    if (picked.cls && row[COL.cls] !== picked.cls) return false;
    if (!terms.length) return true;
    const blob = rowBlob(row);
    return terms.every((term) => blob.includes(term));
  });
  state.shown = PAGE;
  state.selected = -1;
  clearBtn.hidden = !hasQuery();
  renderResults();
}

function renderResults() {
  const total = state.matches.length;
  const visible = state.matches.slice(0, state.shown);
  if (!hasQuery()) {
    countEl.textContent = `共 ${state.meta.count.toLocaleString("zh-CN")} 条，先显示最新登记`;
  } else {
    countEl.textContent = `命中 ${total.toLocaleString("zh-CN")} 条`;
  }
  if (!visible.length) {
    resultsEl.innerHTML = '<p class="status">没有符合条件的登记。换一个关键词，或清除筛选。</p>';
    return;
  }
  const html = visible.map((row, index) => {
    const selected = index === state.selected ? ' aria-selected="true"' : ' aria-selected="false"';
    return `<button type="button" class="result" role="option" data-index="${index}"${selected}>
      <span class="reg">${escapeHtml(row[COL.id])}</span><span class="drug">${escapeHtml(row[COL.drug] || "药物名称未公示")}</span>
      <span class="title">${escapeHtml(row[COL.title] || row[COL.ind] || "")}</span>
      <span class="sub">${escapeHtml([row[COL.ind], readableName(row[COL.app])].filter(Boolean).join(" · "))}</span>
    </button>`;
  }).join("");
  const more = state.shown < total
    ? `<button type="button" class="more" id="moreBtn">再显示 ${Math.min(PAGE, total - state.shown)} 条</button>`
    : "";
  resultsEl.innerHTML = html + more;
  document.querySelector("#moreBtn")?.addEventListener("click", () => {
    state.shown += PAGE;
    renderResults();
  });
}

function readableName(value) {
  const textValue = (value || "").trim();
  if (!textValue || /^[\d\s]+$/.test(textValue)) return "";
  return textValue;
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
  state.selected = index;
  state.activeId = row[COL.id];
  history.replaceState(null, "", `#${encodeURIComponent(row[COL.id])}`);
  document.body.dataset.open = "true";
  for (const button of resultsEl.querySelectorAll(".result")) {
    button.setAttribute("aria-selected", button.dataset.index === String(index) ? "true" : "false");
  }
  detailEl.innerHTML = `<p class="status">正在读取 ${escapeHtml(row[COL.id])} 的详情…</p>`;
  try {
    const record = await loadRecord(row);
    renderDetail(row[COL.id], record);
  } catch (error) {
    detailEl.innerHTML = `<p class="status" data-kind="error">详情没有读出来。${escapeHtml(error.message || "请再选一次。")}</p>`;
  }
}

async function loadRecord(row) {
  const shardNo = row[COL.shard];
  if (!state.shards.has(shardNo)) {
    const name = state.meta.shards[shardNo];
    const response = await fetch(name);
    if (!response.ok) throw new Error(`分片 ${name} 返回 ${response.status}`);
    state.shards.set(shardNo, await response.json());
  }
  const record = state.shards.get(shardNo)[row[COL.id]];
  if (!record) throw new Error("这条登记不在对应分片里。");
  return record;
}

function renderDetail(id, record) {
  const blocks = GROUPS.map(([heading, keys]) => {
    const rows = keys.filter((key) => record[key] && (key !== "申请人名称" || readableName(record[key])));
    if (!rows.length) return "";
    const body = rows.map((key) => `<div class="row"><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(record[key])}</dd></div>`).join("");
    return `<section class="group"><h3>${heading}</h3><dl>${body}</dl></section>`;
  }).join("");
  detailEl.innerHTML = `
    <button type="button" class="back" id="backBtn">返回列表</button>
    <p class="reg">${escapeHtml(id)}</p>
    <h2>${escapeHtml(record["试验通俗题目"] || record["药物名称"] || id)}</h2>
    <div class="detail-tools">
      <span class="seal">${escapeHtml(record["试验状态"] || "进行中")}</span>
      <button type="button" class="ghost" id="copyBtn">复制本条链接</button>
    </div>
    ${blocks || '<p class="placeholder">这条记录没有可显示的字段。</p>'}
  `;
  document.querySelector("#backBtn")?.addEventListener("click", () => {
    document.body.dataset.open = "false";
    q.focus();
  });
  document.querySelector("#copyBtn")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(location.href);
      button.textContent = "已复制";
    } catch {
      button.textContent = "复制失败，请从地址栏复制";
    }
  });
}

function buildFilters() {
  const specs = [
    ["药物类型", "type"],
    ["试验分期", "phase"],
    ["试验分类", "cls"],
  ];
  filtersEl.innerHTML = specs.map(([label, key]) => {
    const options = state.meta.filters[label] || [];
    const items = options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    return `<label>${escapeHtml(label)}<select data-col="${key}"><option value="">全部</option>${items}</select></label>`;
  }).join("");
  filterSelects.push(...filtersEl.querySelectorAll("select"));
  for (const select of filterSelects) select.addEventListener("change", applySearch);
}

function moveSelection(delta) {
  if (!state.matches.length) return;
  const next = Math.min(state.matches.length - 1, Math.max(0, state.selected + delta));
  if (next >= state.shown) {
    state.shown = next + 1;
    renderResults();
  }
  const button = resultsEl.querySelector(`[data-index="${next}"]`);
  button?.focus();
  button?.scrollIntoView({ block: "nearest" });
  openRow(next);
}

resultsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".result");
  if (!button) return;
  openRow(Number(button.dataset.index));
});

q.addEventListener("input", () => {
  window.clearTimeout(applySearch._timer);
  applySearch._timer = window.setTimeout(applySearch, 80);
});
document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  applySearch();
  if (state.matches.length) openRow(0);
});
clearBtn.addEventListener("click", () => {
  q.value = "";
  for (const select of filterSelects) select.value = "";
  applySearch();
  q.focus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== q) {
    event.preventDefault();
    q.focus();
  } else if (event.key === "ArrowDown" && document.activeElement === q) {
    event.preventDefault();
    moveSelection(state.selected < 0 ? 0 : 1);
  } else if (event.key === "ArrowDown" && event.target.classList?.contains("result")) {
    event.preventDefault();
    moveSelection(1);
  } else if (event.key === "ArrowUp" && event.target.classList?.contains("result")) {
    event.preventDefault();
    moveSelection(-1);
  }
});

async function main() {
  try {
    const [metaResponse, indexResponse] = await Promise.all([fetch("data/meta.json"), fetch("data/index.json")]);
    if (!metaResponse.ok || !indexResponse.ok) throw new Error("索引文件没有返回");
    state.meta = await metaResponse.json();
    const index = await indexResponse.json();
    state.rows = index.rows;
    snapshotEl.innerHTML = `<strong>${escapeHtml(state.meta.snapshot)}</strong><br>${escapeHtml(state.meta.query)} · ${state.meta.count.toLocaleString("zh-CN")} 条`;
    buildFilters();
    applySearch();
    const wanted = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (wanted) {
      const found = state.rows.findIndex((row) => row[COL.id] === wanted);
      if (found >= 0) {
        q.value = wanted;
        applySearch();
        const matchIndex = state.matches.findIndex((row) => row[COL.id] === wanted);
        if (matchIndex >= 0) openRow(matchIndex);
      }
    }
  } catch (error) {
    snapshotEl.textContent = "索引没有加载";
    countEl.textContent = "";
    resultsEl.innerHTML = `<p class="status" data-kind="error">${escapeHtml(error.message || "读取失败")}。请通过本地网站或 GitHub Pages 打开，不要直接双击 HTML 文件。</p>`;
  }
}

main();
