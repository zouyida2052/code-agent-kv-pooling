"""Build the self-contained, template-derived HTML lecture (AGPL-3.0)."""
import argparse
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TALK = ROOT / "talk"
SITE = "https://zouyida2052.github.io/code-agent-kv-pooling/"
BRAND = '<div class="brand-lockup"><span class="brand-mark" aria-hidden="true"></span><span>HUAWEI</span></div>'


def esc(text):
    return html.escape(str(text), quote=True)


def title(text):
    return esc(text).replace("\n", "<br>")


def clock(seconds):
    return f'{seconds // 60:02d}:{seconds % 60:02d}'


def duration(minutes):
    seconds = round(minutes * 60)
    whole, rest = divmod(seconds, 60)
    return ' '.join(part for part in [f'{whole} 分钟' if whole else '', f'{rest} 秒' if rest else ''] if part)


def card(block):
    return f'<div class="card flat" data-anim><h3 class="card-title">{esc(block["title"])}</h3><p class="card-body">{esc(block["text"])}</p><p class="card-detail">{esc(block["detail"])}</p></div>'


def body(s):
    kind = s["type"]
    heading = f'<div class="content-stack" data-anim><h2 class="h-xl">{title(s["title"])}</h2><p class="lead">{esc(s.get("lead", ""))}</p></div>'
    if kind == "cover":
        return f'<div class="cover-shell"><div class="cover-title-wrap"><div class="cover-badge"><span class="brand-mark" aria-hidden="true"></span></div><h1 class="h-hero" data-anim>{title(s["title"])}</h1><p class="lead cover-subtitle" data-anim>{esc(s["lead"])}</p><p class="cover-line">{esc(s["detail"])}</p></div><div class="cover-visual" aria-hidden="true"><span class="cover-code">AI</span></div></div><div class="cover-wave" aria-hidden="true"></div><div class="cover-meta"><span>技术交流</span><span>模型适配 · 30 分钟</span></div>'
    if kind == "agenda":
        items = ''.join(f'<div class="agenda-item" data-anim><div class="idx">{esc(i["number"])}</div><div class="txt">{esc(i["title"])}<small>{esc(i["text"])}</small><span class="agenda-status">{esc(i["status"])}</span></div></div>' for i in s["items"])
        return f'<div class="agenda-layout"><div class="red-panel" data-anim><h2 class="h-xl">专题安排</h2><div class="en">CONTENTS</div></div><div class="agenda-list">{items}<p class="small-note">{esc(s["lead"])}</p></div></div>'
    if kind == "divider":
        return f'<div class="section-layout"><div data-anim><div class="section-no">{esc(s["number"])}</div><h2 class="h-xl" style="margin-top:3vh">{title(s["title"])}</h2><p class="lead">{esc(s["lead"])}</p></div><div class="red-panel" data-anim><h3 class="h-md">{esc(s["statement"])}</h3></div></div>'
    if kind == "closing":
        steps = ''.join(f'<li class="workflow-step" data-anim><h3><span>{i:02d}</span>{esc(step["title"])}</h3><p>{esc(step["detail"])}</p></li>' for i, step in enumerate(s['workflow'],1))
        return f'<div class="closing-layout workflow-closing"><h2 class="h-xl" data-anim>{title(s["title"])}</h2><p class="lead" data-anim>{esc(s["lead"])}</p><ol class="grid-3 workflow-grid">{steps}</ol><p class="bottom-note">{esc(s["detail"])}</p><a class="website-link" href="{SITE}" target="_blank" rel="noopener noreferrer">{SITE}</a></div>'
    if kind == "quote":
        return f'<div class="quote-layout"><p class="kicker">{esc(s["title"])}</p><h2 class="lecture-quote" data-anim>{title(s["quote"])}</h2><p class="lead" data-anim>{esc(s["lead"])}</p></div>'
    if kind == "prompt":
        inner = f'<div class="grid-2" style="grid-template-columns:1.15fr 1fr"><div data-anim><pre class="prompt-block">{esc(s["prompt"])}</pre><p class="small-note" style="margin-top:1.5vh">复盘整理的指令模板</p></div><div class="prompt-side" data-anim><div><h3>Agent 应交付</h3><p>{esc(s["expect"])}</p></div><div><h3>人工检查</h3><p>{esc(s["check"])}</p></div></div></div><p class="followup-line" data-anim>{esc(s["followup"])}</p>'
    elif kind == "brief":
        terms = ''.join(f'<li data-anim><h3>{esc(t["title"])}</h3><p>{esc(t["detail"])}</p></li>' for t in s['terms'])
        receipt = ''.join(f'<li><p>{esc(item)}</p></li>' for item in s['receipt'])
        inner = f'<div class="grid-2 review-columns"><ol class="review-questions">{terms}</ol><aside class="review-examples brief-receipt" data-anim><h3>{esc(s["receipt_title"])}</h3><ul>{receipt}</ul><p class="brief-hint">{esc(s["receipt_hint"])}</p></aside></div>'
    elif kind == "matrix":
        columns = ''.join(f'<th scope="col">{esc(c)}</th>' for c in s['columns'])
        rows = ''.join('<tr>' + ''.join(f'<th scope="row">{esc(cell)}</th>' if i == 0 else f'<td>{esc(cell)}</td>' for i,cell in enumerate(row)) + '</tr>' for row in s['rows'])
        bottom = ''.join(f'<p>{esc(line)}</p>' for line in s['bottom_lines'])
        inner = f'<div class="matrix-wrap" data-anim><table class="matrix-table" aria-label="{esc(s["title"])}"><thead><tr>{columns}</tr></thead><tbody>{rows}</tbody></table></div><div class="matrix-bottom">{bottom}</div>'
    elif kind == "three":
        inner = '<div class="grid-3 same-size">' + ''.join(card(b) for b in s["blocks"]) + '</div>'
    elif kind == "experiment":
        cases = []
        for case in s['cases']:
            rows = ''.join(f'<div class="experiment-row"><dt>{esc(row["label"])}</dt><dd>{esc(row["text"])}</dd></div>' for row in case['rows'])
            cases.append(f'<section class="experiment-case" data-anim><h3>{esc(case["title"])}</h3><dl>{rows}</dl></section>')
        inner = f'<p class="experiment-fixed" data-anim>{esc(s["fixed"])}</p><div class="grid-2 same-size experiment-cases">{"".join(cases)}</div><p class="case-next">{esc(s["next_action"])}</p><p class="case-takeaway">{esc(s["conclusion"])}</p>'
    elif kind == "checkpoint":
        steps = ''.join(f'<li class="process-step" data-anim><h3>{esc(step["title"])}</h3><p class="checkpoint-position">{esc(step["position"])}</p><p>{esc(step["detail"])}</p><strong>{esc(step["status"])}</strong></li>' for step in s['steps'])
        inner = f'<p class="checkpoint-definition">{esc(s["definition"])}</p><ol class="process checkpoint-process" aria-label="实际执行顺序">{steps}</ol><div class="checkpoint-result"><p>{esc(s["before"])}</p><p>{esc(s["after"])}</p></div><p class="case-takeaway">{esc(s["conclusion"])}</p><p class="small-note">{esc(s["scope"])}</p>'
    elif kind == "review":
        questions = ''.join(f'<li data-anim><h3>{esc(q["title"])}</h3><p>{esc(q["detail"])}</p></li>' for q in s['questions'])
        examples = ''.join(f'<li><h4>{esc(e["title"])}</h4><p>{esc(e["detail"])}</p></li>' for e in s['examples'])
        inner = f'<div class="grid-2 review-columns"><ol class="review-questions">{questions}</ol><aside class="review-examples" data-anim><h3>{esc(s["examples_title"])}</h3><ul>{examples}</ul></aside></div><p class="case-takeaway">{esc(s["followup"])}</p>'
    elif kind == "handoff":
        inner = '<ul class="handoff-list">' + ''.join(f'<li data-anim>{esc(t)}</li>' for t in s["items"]) + f'</ul><p class="followup-line">{esc(s["statement"])}</p>'
    elif kind == "loop":
        left = ''.join(f'<div>{esc(x)}</div>' for x in s["agent"])
        right = ''.join(f'<div>{esc(x)}</div>' for x in s["review"])
        inner = f'<div class="grid-2 same-size" style="grid-template-columns:.8fr 1.2fr"><div class="content-stack" data-anim><p class="body-copy">人的任务是给出范围和判断依据。</p><p class="body-copy">Agent 负责连续探索、验证和整理。</p></div><div class="loop-board" data-anim><div class="loop-boundary">{esc(s["human"])}</div><div class="loop-center"><div class="loop-list">{left}</div><div class="loop-agent">Agent</div><div class="loop-list">{right}</div></div><div class="loop-boundary">{esc(s["gate"])}</div></div></div>'
    else:
        raise ValueError(kind)
    return f'<div class="slide-body {kind}-body">{heading}{inner}</div>'


def build():
    data = json.loads((TALK / "slides.json").read_text(encoding="utf8"))
    sources = json.loads((ROOT / "assets/content.json").read_text(encoding="utf8"))["sources"]
    sources = {key: dict(value, url=value["url"] if value["url"].startswith("https://") else SITE + value["url"]) for key, value in sources.items()}
    data["sources"] = sources
    sections = []
    elapsed = 0
    for s in data["slides"]:
        end = elapsed + round(s['minutes'] * 60)
        s['time_range'] = f'{clock(elapsed)}–{clock(end)}'
        s['duration'] = duration(s['minutes'])
        elapsed = end
        chrome = '' if s["layout"] in {"H01", "H02", "H03", "H10"} else f'<div class="chrome"><div class="l"><span class="square"></span><span>{esc(s.get("step", "模型适配"))}</span></div><div></div></div>'
        classes = 'slide ' + ('hw-cover ' if s["type"] == "cover" else '') + s["theme"]
        sections.append(f'<section class="{classes}" data-layout="{s["layout"]}" data-animate="{s["type"]}" id="slide-{s["id"]}" aria-label="{esc(s["title"].replace(chr(10), " "))}">{chrome}{BRAND}{body(s)}</section>')
    css = (TALK / "base.css").read_text(encoding="utf8") + '\n' + (TALK / "deck.css").read_text(encoding="utf8")
    js = (TALK / "deck.js").read_text(encoding="utf8")
    payload = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
    license_text = (TALK / "LICENSE").read_text(encoding="utf8")
    document = f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Code Agent 辅助池化开发，华为企业汇报风讲解文件。30 分钟模型适配专题。"><title>{esc(data['title'])}</title><style>{css}</style></head>
<body><a class="skip-link" href="#deck">跳到讲解内容</a><div id="hint">← → 翻页 · ESC 索引 · N 备注 · B 静态</div><main id="deck" tabindex="-1">{''.join(sections)}</main><nav id="nav" aria-label="逐页跳转"></nav><div id="controls"><button id="previous" type="button" aria-label="上一页">‹</button><button id="next" type="button" aria-label="下一页">›</button><button id="index-toggle" type="button">索引</button><button id="notes-toggle" type="button" aria-expanded="false">备注</button><button id="template-toggle" type="button" hidden>指令模板</button><button id="static-toggle" type="button" aria-pressed="false">静态</button><button id="screen-toggle" type="button">全屏</button></div><div id="overview" role="dialog" aria-label="幻灯片索引" aria-modal="true" aria-hidden="true" inert></div><aside id="speaker-panel" aria-label="讲者备注" hidden><button id="speaker-close" type="button">关闭</button><h2 id="note-title"></h2><p id="note-body"></p><section id="note-template" aria-labelledby="template-title" hidden><h3 id="template-title">备查指令模板（无需逐字朗读）</h3><p class="template-provenance">根据本次经历整理，可替换模型与环境后使用。</p><pre id="template-text" tabindex="0"></pre><button id="copy-template" type="button">复制指令</button><span id="template-copy-status" role="status"></span></section><div id="note-sources"></div></aside><noscript><div class="fallback">请启用 JavaScript 以横向翻页。全部页面文字已包含在本文件中。</div></noscript><script id="speaker-data" type="application/json">{payload}</script><script>{js}</script><script id="license" type="text/plain">{license_text}</script></body></html>'''
    lines = ['# ' + data['title'] + '：30 分钟完整讲稿', '', data['subtitle'], '',
             '本次只讲模型适配，共 14 页，计划用时 30 分钟，不含会后问答。',
             '每页正文可直接朗读。用时包含指向页面、停顿和翻页，实际语速请以彩排为准。',
             '带【】的小标题用于定位页面对应内容，无需朗读。',
             '指令模板为复盘整理，并非历史对话逐字记录。各页的备查模板和来源无需逐字朗读。', '',
             '## 时间安排', '', '| 页码 | 页面 | 本页用时 | 累计时间段 |', '| --- | --- | --- | --- |']
    for i, s in enumerate(data['slides'], 1):
        lines.append(f"| {i:02d} | {s['title'].replace(chr(10), ' ')} | {s['duration']} | {s['time_range']} |")
    lines += ['', '## 逐页讲稿', '']
    for i, s in enumerate(data['slides'], 1):
        lines += [f"### 第 {i:02d} 页：{s['title'].replace(chr(10), ' ')}", '',
                  f"**本页用时：{s['duration']}。累计时间：{s['time_range']}。**", '', s['notes'], '']
        if 'prompt' in s:
            lines += ['#### 备查指令模板（无需逐字朗读）', '', '```text', s['prompt'], '```', '']
        for key in s['sources']:
            v = sources[key]
            lines.append(f"- 来源：[{v['label']}]({v['url']})")
        lines.append('')
    return {'index.html': document, 'speaker-notes.md': '\n'.join(lines)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for name, text in build().items():
        path = TALK / name
        if args.check:
            if not path.exists() or path.read_text(encoding='utf8') != text:
                raise SystemExit(f'Stale generated file: {path.name}')
        else:
            path.write_text(text, encoding='utf8')
    print('Lecture files are current.' if args.check else 'Built HTML lecture and speaker notes.')
