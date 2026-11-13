---
name: 临床试验检索
description: 暖白纸感与玉绿色组成的公开研究信息界面
colors:
  brand: "#349e75"
  brand-deep: "#236b50"
  brand-ink: "#173e2d"
  paper: "#f7f7f2"
  surface: "#fff"
  ink: "#253a2e"
  muted: "#607166"
  line: "#dde5de"
  control-line: "#7f9b8a"
  action-hover: "#194e3b"
  table-tint: "#edf3ed"
  select-line: "#9db2a4"
  recruit-ink: "#256145"
  recruit-fill: "#e8f3eb"
  pending-ink: "#6b592c"
  pending-fill: "#f6f0de"
  complete-ink: "#53675b"
  complete-fill: "#edf1ed"
  error: "#9d3d25"
typography:
  display:
    fontFamily: '"Research Serif", "Noto Serif SC", "Songti SC", serif'
    fontSize: "clamp(40px, 3.5vw, 52px)"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-.025em"
  display-compact:
    fontFamily: '"Research Serif", "Noto Serif SC", "Songti SC", serif'
    fontSize: "clamp(32px, 8vw, 40px)"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-.025em"
  headline:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.65
    letterSpacing: "-.02em"
  title:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.7
    letterSpacing: "-.025em"
  item-title:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.6
  body:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  search:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  nav:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
  action:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.7
  label:
    fontFamily: '"Research Sans", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  tag: "5px"
  page: "7px"
  control: "8px"
  action: "10px"
  compact-surface: "12px"
  table: "14px"
  surface: "16px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.surface}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "11px 23px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.surface}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.brand-deep}"
    typography: "{typography.label}"
    padding: "8px 0"
  button-clear:
    backgroundColor: "transparent"
    textColor: "{colors.brand-deep}"
    typography: "{typography.label}"
    padding: "8px 0 8px 12px"
  button-retry:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  search-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.search}"
    padding: "0 4px"
    height: "48px"
  filter-select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 32px 8px 12px"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.nav}"
    padding: "10px 0"
  nav-current:
    textColor: "{colors.brand-deep}"
  recruit-tag:
    backgroundColor: "{colors.recruit-fill}"
    textColor: "{colors.recruit-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "3px 10px"
  recruit-tag-pending:
    backgroundColor: "{colors.pending-fill}"
    textColor: "{colors.pending-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "3px 10px"
  recruit-tag-complete:
    backgroundColor: "{colors.complete-fill}"
    textColor: "{colors.complete-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "3px 10px"
  search-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "12px 20px"
  table-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.table}"
  page-current:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.page}"
    padding: "6px 10px"
---

# Design System: 临床试验检索

## Overview

**Creative North Star: "研究基金会年刊"**

以暖白纸面、玉绿色和中文衬线标题建立研究刊物的阅读气质，再以无衬线正文、原生选择器、清晰边界和稳定的列表层级承载检索。“温和、克制、编辑感”是对已实现界面的描述性归纳，不是新增的用户承诺。用户指定的主色是品牌约束；具体首页构图与功能取舍记录在[检索表面简报](.impeccable/surfaces/trial-search.md)。

本文件从当前 HTML、CSS 与 JavaScript 提取；前置 YAML 是基础令牌的规范层，侧文件承载状态样例、动态与断点。当前界面直接以代码实现，没有获批的 UI 效果图。AI 科学与自然图片属于编辑性概念视觉，不能充当真实试验、机构或临床效果的证据。

**Key Characteristics:**

- 暖白底与白色信息面，以细线和浅色块划分内容。
- 衬线大标题与无衬线操作正文形成层级。
- 玉绿用于品牌强调，深绿用于动作、焦点与当前状态。
- 研究列表具有足够留白，详情长文保留清晰的标签与内容关系。
- 动态集中于科学主题轮播，并尊重暂停与减少动态效果偏好。

## Colors

色彩以柔和的纸面和植被色为基础；彩度主要集中在品牌、动作与具有文字说明的数据状态。

### Primary

- **玉绿**（`brand`）：用户指定的品牌色，用于品牌标记与首页标题中的强调片段。
- **深叶绿**（`brand-deep`）：主要搜索按钮、链接、当前导航、当前页码和焦点轮廓。
- **林荫墨绿**（`brand-ink`）：详情分组标题和页脚名称。
- **动作深绿**（`action-hover`）：主要按钮的悬停背景与边框。
- **招募绿**（`recruit-ink` / `recruit-fill`）：招募中标签的文字与浅色底。

### Secondary

- **等待麦色**（`pending-ink` / `pending-fill`）：仅用于尚未招募状态的文字与浅色底。

### Tertiary

- **错误陶红**（`error`）：详情读取失败等错误文本。

### Neutral

- **暖白纸面**（`paper`）与**纯白信息面**（`surface`）：分别承担页面底与搜索、桌面表格、详情内容底色。
- **研究墨色**（`ink`）与**灰绿说明色**（`muted`）：主体文字与辅助信息。
- **纸面细线**（`line`）：页头、页脚、表格容器与详情字段的结构边界。
- **控件焦点线**（`control-line`）与**选择器描边**（`select-line`）：可交互表单边界。
- **表格浅绿**（`table-tint`）：桌面表头与详情标签底。
- **灰绿状态**（`complete-ink` / `complete-fill`）：除招募中、尚未招募以外的状态；具体含义始终由标签文字表达，不能仅凭这个色组判断已完成。

**The Action Contrast Rule.** 白色小字动作使用深叶绿；玉绿保留为品牌强调，不替换当前主要按钮的深绿底。

## Typography

**Display Font:** 自托管 Noto Serif SC，以 `Research Serif` 为 CSS 字体名；回退到 Noto Serif SC、Songti SC 与 serif。

**Body Font:** 自托管 Noto Sans SC，以 `Research Sans` 为 CSS 字体名；回退到 Noto Sans SC、Microsoft YaHei、PingFang SC 与 sans-serif。

字体文件随页面本地提供，采用 SIL Open Font License 1.1；没有外部字体网络请求。衬线字体仅为展示标题提供编辑感，搜索、结果与详情使用更易扫描的无衬线字体。当前显示字体文件为中等字重，正文文件为常规字重，界面允许浏览器合成较粗字重。

### Hierarchy

- **Display / Display compact**：首页两行标题，使用前置令牌中的响应字号；中间宽度（不超过 1100px）固定为 43px，手机（不超过 760px）使用 compact 角色。
- **Headline**：详情标题；手机缩为 22px，行高为 1.7。
- **Title**：研究一览标题；手机为 23px。详情分组标题为 19px、中等字重。
- **Item title**：研究项目链接；下方试验题目为 13px、行高 1.8，限制为两行，完整内容可进入详情阅读。
- **Body**：基础正文。详情字段内容为 14px，长文行高为 1.9，段落宽度不超过 75ch；手机字段为 13px。
- **Search / Nav / Action / Label**：搜索输入、导航、主要动作与辅助信息分别使用其令牌。登记号、数量、页码和数据日期使用等宽数字排布（`tabular-nums`）。

**The Reading Hierarchy Rule.** 衬线字体留给展示性标题；表单、研究结果和长篇登记详情保持无衬线层级。

## Layout

整体使用居中的内容壳，最大宽度为 1280px。默认两侧共留 96px；不超过 1100px 时改为共 64px，不超过 760px 时改为共 40px。布局通过宽度、对齐和留白组织信息，不依赖满屏绿色页头。

当前首页的桌面实例为紧凑两列介绍区：文字与轮播的比例为 1.15:0.85、间距为 48px，搜索面板紧随其后。轮播图默认高度为 248px，中间宽度为 232px，1700px 及以上为 268px。快照信息放在介绍文字下方，搜索面板仅保留输入与筛选；研究区与搜索面板相隔 24px，工具栏下距 12px。桌面表格四列占比为 43%、27%、15%、15%，单元格内边距为纵向 16px、横向 24px。默认数据在 1440×900 视口首屏完整露出前两条研究，展示内容服务检索任务。

手机将介绍区改为单列，轮播使用 1.9 的宽高比；搜索按钮占满一行，四个直接筛选排为两列。结果仍由同一语义表格提供，视觉上转为纵向研究条目：项目与适应症各占整行，阶段与招募状态在底部左右对齐。表头不再显示，适应症补充可见字段名。此实现以重排承载窄屏阅读，不需要桌面列表横向滚动。

详情为独立内容视图，共用内容壳与页脚。字段标签列默认宽 190px，内容列可伸缩；手机改为上下堆叠。长文、编号标准、药物字段和终点表格各保留真实内容需要的结构。常用间距见前置令牌；这些数值来自现有声明，并非要求所有间距强制落在单一倍数网格上。

## Elevation & Depth

当前界面不使用投影、模糊玻璃或浮起卡片。暖白底上的白色信息面、浅绿标签区、细边界和内容留白构成平面层次。搜索获得焦点时改变边框与输入行底线；链接、按钮和行的悬停反馈不引入位移或阴影。侧文件中的阴影目录为空，明确表示没有已实现的阴影令牌。

**The Paper Layers Rule.** 以色面、细线和间距建立当前系统的层次；延续组件时不额外添加浮起阴影。

## Shapes

形状为轻柔圆角与细描边。大信息面和图片采用 surface 圆角，桌面表格使用 table 圆角，详情字段组与手机大面使用 compact-surface 圆角。按钮、选择器、页码和状态标签各使用对应的小圆角；状态标签不是胶囊按钮。小圆点仅用于轮播页点，选中点延长为短条。图标采用简洁的单色线条 SVG，随文字继承颜色。

## Components

### Buttons

主要搜索按钮使用深绿底、白字、右箭头与 action 圆角，最小高度为 48px；手机最小高度为 44px，宽度占满一行并使用 control 圆角。悬停切换至动作深绿。导出、返回与复制链接是带线条图标的文字动作，悬停出现下划线；清除筛选是持续带下划线的小文字动作。详情错误中的重试按钮使用白底和控件焦点线描边。禁用按钮以 0.45 不透明度表达，保留原生 disabled 语义。

### Inputs / Fields

关键词输入嵌入白色搜索面板，输入本身无边框，左侧放搜索图标；桌面高度为 48px，手机为 40px，字号都保持 search 角色。键盘焦点通过父面板描边与输入行深绿色底线共同表达。四个筛选为原生 select，修改即应用；排序使用同一选择器语言并去掉描边。选择器保留可见下拉箭头与键盘焦点，不另造弹层菜单。

### Navigation

页头保留轻量品牌、探索试验与数据说明锚点；当前入口为深绿，普通入口为灰绿，悬停带下划线。手机隐藏页头的数据说明入口，页脚仍保留数据说明与来源。站外业务导航已从该表面移除；来源链接仍位于页脚。

### Chips / Tags

招募状态是只读文字标签，使用 tag 圆角和对应的文字/底色配对。它们不应呈现为可点击筛选。招募中、尚未招募及其他状态的色组按现有映射使用，完整状态文字是含义的依据。

### Cards / Containers

搜索面板采用 search-surface 令牌，边框使用纸面细线；桌面研究表格为同样白底但更小的 table 圆角容器。手机研究列表回到纸面底与行分隔线，不逐条包成浮起卡片。详情以分组标题和标签/内容字段组构成阅读节奏。

### Research rows and pagination

每条研究先展示药物或登记号链接，再展示题目与登记号；其余列为适应症、阶段/药物类型、招募/试验状态。行悬停只作很轻的底色改变，链接仍是明确的详情入口。每页显示 20 项，分页保留上一页、下一页、首尾页和当前位置；当前页为深绿底白字，移动端数字按钮最小高度为 40px。切页后焦点移到研究一览标题，再滚动至结果工具栏；返回列表恢复先前项目或搜索框的焦点。

### Editorial science carousel

三张概念图采用覆盖裁切，下方为简短图注、手动页点和播放/暂停按钮。默认每 6500ms 自动切换，使用 800ms 透明度交叉淡入；页点长度变化为 300ms，二者使用 `cubic-bezier(.16,1,.3,1)`。手动选图会暂停自动播放；悬停、焦点进入、页面不可见和详情视图均暂停计时。减少动态效果偏好默认暂停轮播，关闭平滑滚动，并将过渡时长压缩到 0.01ms。非当前幻灯片通过 `aria-hidden` 和 `inert` 退出辅助技术与交互路径。

全局键盘焦点为深绿实线（2px），与元素相隔 4px；输入框使用前述父级焦点处理。保留跳到检索的跳转链接、原生控件和可感知的当前状态。没有为控件额外引入并不存在的默认动画。

## Do's and Don'ts

### Do:

- **Do** 保留玉绿品牌强调与深绿动作的角色分工。
- **Do** 使用自托管的衬线展示标题和无衬线操作正文。
- **Do** 通过白色信息面、浅色标签、细线与留白建立层次。
- **Do** 保持状态文字、键盘焦点和减少动态效果处理可感知。
- **Do** 将 AI 科学图片清楚标识为概念视觉。

### Don't:

- **Don't** 把尚未招募、其他状态或加载失败仅用颜色表达。
- **Don't** 在当前平面组件上添加浮起阴影或玻璃模糊。
- **Don't** 将科学概念图表达为具体试验、机构或临床效果的证据。
- **Don't** 在扩展检索表面时恢复已移除的站外业务导航、重复查询和重复排序动作。

本次布局收紧保留既有视觉世界：桌面页头高度 76px、手机 68px；手机介绍区上下留白为 20px、图片比例为 2.5，搜索面板内边距 12px，触控控件维持原有可用尺寸。
