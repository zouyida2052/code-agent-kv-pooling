'use strict';
let content, lessons, current = 0, mode = 'read', notesOpen = false;
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tag = (label, tone = '') => `<span class="tag ${tone}">${label}</span>`;
const code = value => `<pre><code>${escapeHTML(value)}</code></pre>`;
function figure(kind) {
  switch (kind) {
    case 'ladder': return `<div class="proof-ladder"><div><b>01</b><span>能响应<small>HTTP 200</small></span></div><div><b>02</b><span>真加载<small>外部命中＋加载完成</small></span></div><div><b>03</b><span>取对了<small>状态完整＋输出对照</small></span></div><div class="strong"><b>04</b><span>可交付<small>版本、范围、证据</small></span></div></div><p class="figure-caption">开发闭环的四级证据 · 后一级不能只由前一级推断</p>`;
    case 'model': return `<div class="model-unit"><div>KDA<small>状态 S₁</small></div><div>KDA<small>状态 S₂</small></div><div>KDA<small>状态 S₃</small></div><div class="mla">Sparse MLA<small>KV ＋ 索引</small></div></div><div class="diagram-note"><span>模型的重复单元</span><b>↓</b><span>缓存 spec → 张量布局 → 池化契约</span></div><p class="figure-caption">结构示意 · cache group 与模型层不是一一对应</p>`;
    case 'contract': return `<div class="terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>agent-task / before coding</span></div>${code('INPUT     模型 + 代码 + SDK + 拓扑\nBOUNDARY  修改范围 / 资源限制\nCONTROL   无池化 → 冷 → 热\nEVIDENCE  请求 + key + 状态 + 输出\nDONE      可复现结果，而非一句“通过”')}</div>`;
    case 'control': return `<div class="control-grid"><div>${tag('A / 带池化')}<h3>输出异常</h3><p>观察到症状</p></div><div>${tag('B / 去掉 connector')}<h3>仍然异常</h3><p>其余配置保持一致</p></div></div><div class="verdict">可以否定：症状必须依赖外部缓存加载<br><small>不能推出：池化所有功能已经正确</small></div>`;
    case 'checkpoint': return `<div class="interactive" data-demo="checkpoint"><div class="figure-top">${tag('真实日志的分步重构')}<span>粒度 4352 · 仅适用于该次配置</span></div><div class="segmented" role="group" aria-label="检查点阶段"><button data-checkpoint="0" aria-pressed="true">① 第一 chunk</button><button data-checkpoint="1" aria-pressed="false">② 继续计算</button><button data-checkpoint="2" aria-pressed="false">③ 最小修复</button></div><div class="checkpoint-display" aria-live="polite"></div><div class="boundary-line"><span>0</span><span>4352</span><span>8704</span><span>8705</span></div><p class="figure-caption">简化为一个 KDA group 展示；三个状态组出现相同的关键问题。</p></div>`;
    case 'shards': return `<div class="interactive" data-demo="shards"><div class="figure-top">${tag('逻辑示意，不是覆盖声明')}<span>无 CP / KVPP · PP1</span></div><div class="segmented" role="group" aria-label="选择 TP 数"><button data-tp="1" aria-pressed="false">TP1</button><button data-tp="4" aria-pressed="true">TP4</button></div><div class="shard-display" aria-live="polite"></div><p class="figure-caption">三端必须一致：保存权限 → key 命名 → 命中检查</p></div>`;
    case 'sdk': return `<div class="sdk-evolution"><div>${tag('早期工作假设','warm')}<h3>只观察 Get</h3><p>额外 Get → 回迁 → 查询 GVA</p></div><div>${tag('后续证据修正')}<h3>默认查询含 prefetch</h3><p>Get=0，仍可能发生 SSD 读取</p></div></div><div class="evidence-chain"><span>SSD read</span><b>→</b><span>DRAM commit</span><b>→</b><span>模型 load</span></div><p class="figure-caption">同 key、同 GVA、成功请求窗口 · SDK 版本与 flag 必须一起记录</p>`;
    case 'review': return `<div class="review-diff"><span class="diff-label">人工追问：这个分支修复了什么可达问题？</span>${code('- max(0, request.num_tokens - 1)\n+ request.num_tokens - 1\n\n- mapping.get(layer, layer)\n+ mapping[layer]\n\n- 生产代码特判裸 mock\n+ 测试 fixture 使用真实 Queue')}</div><p class="figure-caption">历史清理的简化差异 · 不是对所有调用点的通用删除建议</p>`;
    case 'acceptance': return `<div class="acceptance-grid"><div><span>基础</span><b>生成正确</b><small>先验证无池化对照</small></div><div><span>DRAM</span><b>冷写 · 热读</b><small>隔离 HBM 与重算</small></div><div><span>边界</span><b>状态与分片完整</b><small>完整／部分前缀</small></div><div><span>SSD</span><b>同 key 事件链</b><small>容量指标不够</small></div></div><p class="figure-caption">记录 A3 / A5、源码版本、TP / DP、runner、图模式、MTP 与 SDK</p>`;
    case 'workflow': return `<ol class="workflow-list">${['读懂缓存','固定基线','反证实验','观察链路','最小修复','分层回归','人工评审'].map((x,i)=>`<li><span>0${i+1}</span>${x}</li>`).join('')}</ol><div class="verdict">Agent 加速探索与执行<br><small>人审查契约、因果与范围</small></div>`;
    default: return '';
  }
}
function sourceLinks(ids) {
  return ids.map(id => {const s=content.sources[id]; return `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.label)} ↗</a>`;}).join('');
}
function chapter(c, index) {
  const related = {model:['model','shards'],checkpoint:['control','checkpoint'],review:['review','sdk'],acceptance:['acceptance']}[c.id] || [];
  return `<article class="chapter ${index===0?'opening':''}" id="${c.id}" data-index="${index}"><div class="chapter-meta"><span class="eyebrow">第一章 · 模型适配 / STEP ${String(index+1).padStart(2,'0')}</span><span>${c.minutes} MIN</span></div><h1>${escapeHTML(c.title).replace(/\n/g,'<br>')}</h1><p class="takeaway">${escapeHTML(c.takeaway)}</p><div class="agent-layout"><div class="prompt-panel"><div class="panel-heading"><span>你这样交给 Agent</span><button type="button" data-lesson-copy="${index}">复制指令</button></div>${code(c.prompt)}<small>根据本次经历整理的指令模板，并非历史对话逐字摘录。</small></div><div class="human-panel"><div><span>你应该收到</span><p>${escapeHTML(c.deliverable)}</p></div><div><span>你来判断</span><p>${escapeHTML(c.check)}</p></div></div></div><div class="followup"><span>发现这个信号 →</span><p>${escapeHTML(c.redflag)}</p><b>继续这样追问</b><p>“${escapeHTML(c.followup)}”</p></div><div class="reading-detail"><h2>怎么使用</h2>${c.reading.map(p=>`<p>${escapeHTML(p)}</p>`).join('')}${related.length?`<div class="case-jumps"><span>需要技术细节时再展开：</span>${related.map(id=>`<a href="#read/case-${id}">${escapeHTML(content.caseStudies.find(x=>x.id===id).label)} ↗</a>`).join('')}</div>`:''}<details><summary>讲者备注 · ${c.minutes} 分钟</summary><p>${escapeHTML(c.notes)}</p></details><div class="source-links">${sourceLinks(c.sources)}</div></div></article>`;
}
function chapterIntro() {
  return `<section class="chapter-cover" id="adaptation"><span class="eyebrow">CHAPTER 01 / 模型适配</span><h1>教会你使用 Agent，<br>完成一次新模型池化适配。</h1><p class="takeaway">GLM-5.3-Flash 是练习材料。你要带走的是怎么提要求、怎么检查、怎么追问。</p><div class="learning-outcome"><b>本章学会</b><span>交清任务</span><span>检查产物</span><span>证伪判断</span><span>审查修改</span><span>验收交接</span></div><p class="chapter-scope">第一章参考时长 20 分钟 · 6 个操作步骤 · 每步含指令、预期产物和人工检查点</p><a class="chapter-start" href="#present/opening">开始第一章演示 ↗</a></section>`;
}
function performanceChapter() {
  const c=content.chapters[1];
  return `<section class="chapter-cover planned-chapter" id="performance"><span class="eyebrow">CHAPTER 02 / 性能调优</span><h1>第二章 · 性能调优</h1><span class="tag">预留章节 · 待补充</span><p class="takeaway">${escapeHTML(c.description)}</p><p>本章暂不计入第一章的 20 分钟演示；具体案例、节奏与指令将在下一轮补充。</p><a href="#read/adaptation">回到第一章 ↗</a></section>`;
}
function caseMaterial() {
  return `<section class="appendix" id="cases"><span class="eyebrow">CASE LIBRARY / 技术资料</span><h1>用案例解释方法，<br>需要时再展开源码细节。</h1><p class="takeaway">这些是第一章的辅助材料，不是新的一级章节。演示主线始终是“你如何使用 Agent”。</p>${content.caseStudies.map(c=>`<details class="case-detail" id="case-${c.id}"><summary>${escapeHTML(c.label)}</summary><p>${escapeHTML(c.takeaway)}</p><div class="figure">${figure(c.visual)}</div>${c.reading.map(p=>`<p>${escapeHTML(p)}</p>`).join('')}<div class="source-links">${sourceLinks(c.sources)}</div></details>`).join('')}</section>`;
}
function appendix() {
  return `<section class="appendix" id="toolkit"><span class="eyebrow">APPENDIX / TAKE THE WORKFLOW</span><h1>下一个模型，<br>从这里开始。</h1><p class="takeaway">根据本次经历重新整理的任务模板，并非历史对话逐字摘录。</p>${content.templates.map((t,i)=>`<div class="template"><div><h2>${t.title}</h2><button type="button" data-copy="${i}">复制模板</button></div>${code(t.text)}</div>`).join('')}</section><section class="appendix" id="evidence"><span class="eyebrow">APPENDIX / EVIDENCE & LIMITS</span><h1>每个结论，<br>保留适用范围。</h1><p class="takeaway">来源核对：${content.date} · 本页是历史案例复盘，不是当前主线的兼容性声明。</p><div class="evidence-table"><table><caption>8705 修复后的 A3 DRAM 回归 · 每种长度一冷一热</caption><thead><tr><th>输入 token</th><th>冷命中</th><th>热命中</th><th>32-token 输出</th></tr></thead><tbody>${[[4353,4352],[8704,4352],[8705,4352],[8706,4352],[13057,13056]].map(([n,h])=>`<tr><td>${n}</td><td>0</td><td>${h}</td><td>冷热一致</td></tr>`).join('')}</tbody></table></div><p>A3 / DP16 / TP1 / EP / V1 eager / 无 MTP / HBM 前缀缓存关闭 / 加载失败策略 fail。10 个请求完成；这些结果不是完整数据集准确率，也不是 SSD 验收。</p><h2>三段证据，不合并成一句“全部通过”</h2><div class="timeline"><div><b>09.19 · 历史 A5</b><p>TP4＋EP、PD；non-layerwise 与 layerwise 的 DRAM／SSD 验收，叠加当时的量化、MTP、算子与 PD 修复。当时的 1152 对齐粒度不等于后续 A3 的 4352。</p></div><div><b>10.06 · A3 修复</b><p>无池化异常对照、#17828 基础修复、8705 边界回归。#17698 当日合入；单测通过数量不表示所有硬件组合已覆盖。</p></div><div><b>10.21 · SDK 认识更新</b><p>后续记录确认安装 SDK 默认 flag1 包含原生预取，修正仅以 Get 调用观察 SSD 的不完整方法。对早期断言按 SDK 版本重新审视。</p></div></div><h2>性能附注：8.69× 的边界</h2><p>后续 C32R1T101 记录的输入 token 吞吐比为 8.6923×。负载为约 128K 输入、1 token 输出、重复率 0.9，并经历前缀准备和参数调优。它是取消 TTFT 上限后的单次配对达标结果，包含正式成功请求的 SSD 证据；没有重复稳定性结论，也没有建立收益来自 readability 谓词补丁的因果关系。不得作为任意场景的稳定收益或 AI 人效提升比例。</p><h2>来源与公开范围</h2><div class="source-catalog">${Object.values(content.sources).map(s=>`<div><a href="${s.url}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.label)} ↗</a><p>${escapeHTML(s.detail)}</p></div>`).join('')}</div><p class="public-note">原始内部日志不公开。脱敏摘录提供来源文件名与 SHA-256，用于版本溯源；校验值本身不是外部可独立复现实验的证明。硬件资源、SDK 与权重环境不随本网站分发。</p><p class="closing">理解 → 假设 → 实验 → 最小修改 → 回归 → 人工审查 → 交付</p></section>`;
}
function updateCheckpoint(container, stage) {
  const states = [
    {status:'修复前 · 第一 chunk',endpoint:'4352',mask:'[False]',blocks:'[3]',message:'状态存在，但没有被保存。',detail:'prompt=8705 · target=4352 · save_end=4352',tone:'warm'},
    {status:'修复前 · 后一步',endpoint:'8705',mask:'[False, False]',blocks:'[3, 0, 8]',message:'8704 对应空槽，不能伪造检查点。',detail:'target=8705 · save_end=8704 · block ID 0 = null',tone:'warm'},
    {status:'修复后 · 第一 chunk',endpoint:'4352',mask:'[True]',blocks:'[3]',message:'及时保存有效 S4352，热请求命中 4352。',detail:'冷热各生成 32 token · 输出一致 · 不以重算冒充加载',tone:''}
  ];
  const s=states[stage];
  container.querySelectorAll('[data-checkpoint]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.checkpoint)===stage)));
  container.querySelector('.checkpoint-display').innerHTML=`<div class="checkpoint-heading">${tag(s.status,s.tone)}<b>${s.endpoint}<small>实际计算终点</small></b></div><dl><div><dt>物理 block IDs</dt><dd>${s.blocks}</dd></div><div><dt>保存 mask</dt><dd>${s.mask}</dd></div></dl><strong class="checkpoint-message">${s.message}</strong><p>${s.detail}</p>`;
}
function updateShards(container, tp) {
  container.querySelectorAll('[data-tp]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.tp)===tp)));
  container.querySelector('.shard-display').innerHTML=`<p class="shard-formula">num_kv_head = 1 · put_step = ${tp} · MLA 检查份数 = ${tp} / ${tp} = 1</p><div class="shard-row"><b>MLA<small>重复副本去重</small></b><div><span>glm@0@abc@0</span></div></div><div class="shard-row kda"><b>KDA<small>各 TP 分片不同</small></b><div>${Array.from({length:tp},(_,i)=>`<span>glm@2@abc@${i}</span>`).join('')}</div></div><p class="shard-compare">旧检查数量 <b>1</b> → 新检查数量 <b>${tp}</b>${tp===4?' · 缺任意一份，不能判完整命中':' · TP1 无法暴露分片遗漏'}</p>`;
}
function getRoute() {
  const [m,id]=location.hash.slice(1).split('/');
  const extra=['adaptation','performance','cases','toolkit','evidence',...content.caseStudies.map(c=>'case-'+c.id)];
  return {mode:m==='present'?'present':'read', id:lessons.some(c=>c.id===id)||extra.includes(id)?id:'adaptation'};
}
function render() {
  const route=getRoute();mode=route.mode;
  if(mode==='present'&&!lessons.some(c=>c.id===route.id)){location.hash=`read/${route.id}`;return;}
  const index=lessons.findIndex(c=>c.id===route.id);current=Math.max(0,index);
  document.body.classList.toggle('presenting',mode==='present');
  $('content').innerHTML=mode==='present'?chapter(lessons[current],current):chapterIntro()+lessons.map(chapter).join('')+performanceChapter()+caseMaterial()+appendix();
  $('mode').innerHTML=mode==='present'?'返回阅读 <span>↙</span>':'演示第一章 <span>↗</span>';
  $('deck-controls').hidden=mode!=='present';$('speaker').hidden=mode!=='present'||!notesOpen;
  $('counter').textContent=`1.${current+1} / 1.${lessons.length} · ${lessons[current].minutes} MIN`;
  $('prev').disabled=current===0;$('next').disabled=current===lessons.length-1;
  $('progress').style.width=`${(current+1)/lessons.length*100}%`;
  $('speaker').textContent=lessons[current].notes;
  document.title=`${index>=0?lessons[current].label:route.id==='performance'?'第二章 · 性能调优':route.id==='adaptation'?'第一章 · 模型适配':'附录与案例'} · Code Agent 辅助池化开发`;
  $('toc').querySelectorAll('a').forEach(a=>{
    const id=a.dataset.lesson;
    if(id)a.href=`#${mode}/${id}`;
    if((id&&id===route.id)||(!id&&a.hash===`#read/${route.id}`))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-demo="checkpoint"]').forEach(c=>updateCheckpoint(c,0));
  document.querySelectorAll('[data-demo="shards"]').forEach(c=>updateShards(c,4));
  document.body.classList.remove('menu-open');$('menu').setAttribute('aria-expanded','false');
  requestAnimationFrame(()=>{if(mode==='read'){const target=document.getElementById(route.id);if(target?.tagName==='DETAILS')target.open=true;target?.scrollIntoView({block:'start'});}else window.scrollTo(0,0);});
}
function move(delta){const i=Math.max(0,Math.min(lessons.length-1,current+delta));location.hash=`present/${lessons[i].id}`;}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').textContent='可使用浏览器全屏';}}
async function start(){
  try {
    const response=await fetch('assets/content.json');if(!response.ok)throw new Error('content');content=await response.json();lessons=content.chapters[0].lessons;
    $('toc').innerHTML=`<a class="chapter-link" href="#read/adaptation"><strong>第一章 · 模型适配</strong></a><div class="lesson-toc">${lessons.map((c,i)=>`<a data-lesson="${c.id}" href="#read/${c.id}"><span>1.${i+1}</span>${escapeHTML(c.label.split('：')[0])}<small>${c.minutes}′</small></a>`).join('')}</div><a class="chapter-link planned-link" href="#read/performance"><strong>第二章 · 性能调优</strong><small>待补充</small></a>`;
    render();window.addEventListener('hashchange',render);
    $('mode').addEventListener('click',()=>{const id=getRoute().id;location.hash=`${mode==='read'?'present':'read'}/${lessons.some(c=>c.id===id)?id:lessons[0].id}`;});
    $('prev').addEventListener('click',()=>move(-1));$('next').addEventListener('click',()=>move(1));$('fullscreen').addEventListener('click',fullscreen);
    $('notes-toggle').addEventListener('click',()=>{notesOpen=!notesOpen;$('speaker').hidden=!notesOpen;$('notes-toggle').setAttribute('aria-expanded',String(notesOpen));});
    $('menu').addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');$('menu').setAttribute('aria-expanded',String(open));});
    document.addEventListener('click',async e=>{
      const checkpoint=e.target.closest('[data-checkpoint]');if(checkpoint)updateCheckpoint(checkpoint.closest('[data-demo]'),Number(checkpoint.dataset.checkpoint));
      const tp=e.target.closest('[data-tp]');if(tp)updateShards(tp.closest('[data-demo]'),Number(tp.dataset.tp));
      const copy=e.target.closest('[data-copy], [data-lesson-copy]');if(copy){const text=copy.dataset.lessonCopy!==undefined?lessons[Number(copy.dataset.lessonCopy)].prompt:content.templates[Number(copy.dataset.copy)].text;try{await navigator.clipboard.writeText(text);copy.textContent='已复制';}catch{copy.textContent='请选中下方文本复制';}}
    });
    document.addEventListener('keydown',e=>{
      if(mode!=='present'||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
      if(e.key==='Escape'){if(!document.fullscreenElement)location.hash=`read/${lessons[current].id}`;return;}
      if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();move(1);}
      if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();move(-1);}
      if(e.key.toLowerCase()==='n'&&e.target.tagName!=='BUTTON')$('notes-toggle').click();
      if(e.key.toLowerCase()==='f'&&e.target.tagName!=='BUTTON')fullscreen();
    });
  }catch(error){$('content').innerHTML='<p class="loading">内容载入失败。请刷新，或阅读 <a href="speaker-notes.md">讲者备注</a>。本地预览需通过 HTTP 服务打开。</p>';console.error(error);}
}
start();
