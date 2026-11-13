# 图片与字体

轮播图片使用内置 image_gen 工具生成，均为概念性编辑视觉。

- images/research-glass.webp：实验室玻璃静物。
- images/research-nature.webp：透镜中的银杏叶。
- images/research-hands.webp：研究人员的双手与培养皿。

完整生成提示词见 image-prompts.json，每张图片另有同名 .json 来源侧文件。PNG 原图保留在 Codex 的 generated_images 目录，网站使用 WebP。

字体来自 Google Fonts 官方的 Noto Sans SC 与 Noto Serif SC，按本站实际字符拆分并自托管。授权文件位于 fonts/，采用 SIL Open Font License 1.1。无外部字体网络请求。
