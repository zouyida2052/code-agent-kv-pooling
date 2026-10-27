"""Export the speaker handout from the website's single content source."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
content = json.loads((root / "assets/content.json").read_text(encoding="utf8"))
lines = ["# " + content["subtitle"], "",
         "第一章参考时长 20 分钟 · 讲者备注 · 内容核对日期 " + content["date"], "",
         "以下备注是根据历史证据整理的讲解稿，不是历史对话逐字记录。", ""]
for number, chapter in enumerate(content["chapters"], 1):
    lines += [f"## 第{number}章 · {chapter['title']}", "", chapter["description"], ""]
    if chapter["status"] == "planned":
        lines += ["本章预留，时长与内容待补充。", ""]
    for i, c in enumerate(chapter["lessons"], 1):
        lines += [f"### {number}.{i} {c['label']}（{c['minutes']} 分钟）", "", c["takeaway"], "",
                  "给 Agent 的指令（复盘整理模板）：", "", "```text", c["prompt"], "```", "",
                  "你应该收到：" + c["deliverable"], "", "人工检查：" + c["check"], "",
                  "看到这个信号要追问：" + c["redflag"], "", "追问示例：" + c["followup"], "",
                  "讲解备注：", "", c["notes"], "", "阅读补充：", ""] + c["reading"] + ["", "来源："]
        for source_id in c["sources"]:
            source = content["sources"][source_id]
            lines.append(f"- [{source['label']}]({source['url']})")
        lines.append("")
lines += ["## 任务模板", "", "以下为重新整理的可复用模板。", ""]
for template in content["templates"]:
    lines += ["### " + template["title"], "", "```text", template["text"], "```", ""]
(root / "speaker-notes.md").write_text("\n".join(lines), encoding="utf8")
