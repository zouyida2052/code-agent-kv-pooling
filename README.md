# Code Agent 辅助池化开发

教推理开发者怎样向 Agent 交任务、检查产物、追问、评审和验收。GLM-5.3-Flash 适配经历作为练习案例，技术复盘放在可展开的资料中。

- **第一章：模型适配**，参考时长 20 分钟。六步为交任务、看产物、做反证、审修改、验结果、做交接。每步包含可复制指令、预期产物、人工检查点、警示信号和追问示例。
- **第二章：性能调优**，预留章节，内容和时长后续补充。当前演示只覆盖第一章。

- 网站：https://zouyida2052.github.io/code-agent-kv-pooling/
- 新版讲解文件：[华为企业汇报风 · 单文件 HTML](talk/index.html)，附 [逐页备注](talk/speaker-notes.md)。离线可用，共 15 页，第一章参考时长 20 分钟；第二章预留。
- 演示：进入网站点击“开始演示”；左右方向键或 PageUp / PageDown 翻页，N 开关备注，F 全屏，Esc 在退出全屏后返回阅读。
- 阅读：默认显示全部章节，附任务模板、验收清单与证据索引。浏览器打印可导出阅读版 PDF。
- 讲稿：[speaker-notes.md](speaker-notes.md)
- 脱敏结果：[evidence/validated-results.json](evidence/validated-results.json)

## 本地预览

无需安装前端依赖。在仓库根目录执行：

```bash
python -m http.server 8765 --bind 127.0.0.1
```

打开本地 8765 端口的站点。不能直接使用文件协议打开，因为内容通过 fetch 载入。

## 修改内容

`assets/content.json` 是章节、步骤、阅读正文、讲者备注与来源的单一数据源。`chapters` 定义两章，每章的 `lessons` 定义教学步骤；`caseStudies` 保存辅助技术资料。`speaker-notes.md` 是其导出稿，修改内容后运行导出。`assets/app.js` 提供双模式和案例交互，所有站内资源使用项目相对路径。

```bash
python export_notes.py
python -m unittest discover -s tests -v
node --check assets/app.js
npm ci --ignore-scripts
npm test
```

向 main 推送后，GitHub Actions 校验并发布 Pages。仓库 Pages Source 使用 GitHub Actions。深链接采用 hash 路由，无需服务端重写。

Node 依赖仅用于 DOM 行为回归，不参与页面运行。DOM 测试不替代浏览器截图、手机实机与打印视觉检查。

## 事实与范围

这是历史开发过程复盘，不是当前软件版本的完整兼容性报告。A5 历史验收、A3 修复回归、后续 SDK 认识修正分别陈述。HTTP 成功、冷热输出一致和完整准确率是不同证据层级。8.69 倍只在附录记录为特定调优条件下的一次配对结果。

公开文件仅包含脱敏摘录，不分发原始内部日志、权重或 SDK。来源哈希用于保留材料的版本识别，不代表公开了完整复现环境。公开 PR 的代码与贡献归属以原仓库为准；本文中的简化代码仅用于讲解。
