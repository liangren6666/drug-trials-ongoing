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
      <span class="reg">${escapeHtml(row[COL.id])}</span><span class="drug">${escapeHtml(cleanDrug(row[COL.drug]) || "药物名称未公示")}</span>
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
    const rows = keys.filter((key) => record[key] && (key !== "申请人名称" || readableName(record[key])) && !JUNK_VALUE.test(String(record[key]).trim()));
    if (!rows.length) return "";
    const body = rows.map((key) => {
      const value = key === "药物名称" ? cleanDrug(record[key]) : record[key];
      if (LONG_FIELDS.has(key) || value.length > 180) {
        return `<div class="stack"><h4>${escapeHtml(key)}</h4>${renderField(key, value)}</div>`;
      }
      return `<div class="row"><span class="k">${escapeHtml(key)}</span><span class="v">${escapeHtml(value)}</span></div>`;
    }).join("");
    return `<section class="group"><h3>${heading}</h3>${body}</section>`;
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
