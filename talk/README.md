# 华为企业汇报风讲解文件

打开 [index.html](index.html) 即可演示。HTML 内含样式、脚本、正文和讲者备注，不依赖字体 CDN、图片服务器或本地 HTTP 服务。

- 本次只讲模型适配，计划用时 30 分钟，不含会后问答。
- 共 14 页，案例为 GLM-5.3-Flash。GLM-5.3 与 Flash 的架构不能混用。
- [完整讲稿](speaker-notes.md) 含逐页用时、累计时间表和可直接朗读的正文。

## 操作

左右方向键、PageUp / PageDown、空格翻页；Home / End 到首尾。ESC 打开或关闭索引。N 开关讲者备注，B 切换静态模式，F 全屏。桌面支持滚轮翻页，触屏支持横向滑动。竖屏可滚动当前页，建议横屏投影。

浏览器打印可按横向逐页导出。若打印对话框有“背景图形”选项，请开启以保留红灰主题。

## 修改

`slides.json` 定义每页内容、布局编号、主题、时长、备注和来源。`base.css` 派生自所参考模板；`deck.css` 和 `deck.js` 提供适配样式与离线交互。

在仓库根目录运行：

```bash
python export_talk.py
python export_talk.py --check
python -m unittest discover -s tests -v
npm test
```

模板来源和许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与 [LICENSE](LICENSE)。修改后的 HTML 内附完整模板许可证；对应源码可在本仓库获取。
