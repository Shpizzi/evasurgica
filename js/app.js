/* EVA NAVI — application logic */
/* ---------- device cluster: unified colorblind-safe chips ---------- */
const ICONS = {
  cam:'<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 8l4-2v6l-4-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  track:'<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M9 2v3M9 13v3M2 9h3M13 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.5"/></svg>',
  pedal:'<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="3" y="6" width="12" height="7" rx="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M6 9.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mouse:'<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="5" y="2" width="8" height="14" rx="4" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
};
const STATE_ICON = {
  ok:'<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  visible:'<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="7" r="1.6" fill="currentColor"/></svg>',
  hidden:'<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4s2 4 5 4 5-4 5-4M4 8l-1 2M10 8l1 2M7 9v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  off:'<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
};
/* topbar pills: dot color + background tint per state.
   Each chip is clickable and surfaces its current status as a toast. */
const devices = [
  {name:'INDICATOR', state:'warn', toast:'warn', title:'Puntatore non visibile', msg:'Sposta il puntatore nel campo della camera per riprenderne il tracciamento.'},
  {name:'CAM',       state:'ok',   toast:'info', title:'Camera collegata',       msg:'Il feed della camera è attivo e pronto all’uso.'},
  {name:'PEDALE',    state:'ok',   toast:'info', title:'Pedale collegato',       msg:'Il pedale risponde correttamente. Usalo per confermare i punti.'},
  {name:'3D MOUSE',  state:'err',  toast:'warn', title:'Space Mouse scollegato', msg:'Ricollega lo Space Mouse alla porta USB per usare la navigazione 3D.'}
];
const devCluster = document.getElementById('devCluster');
devCluster.innerHTML = devices.map((d,i)=>`
  <button class="dev-chip s-${d.state}" data-dev="${i}" title="${d.title}">
    <span class="dot"></span>
    <span class="nm">${d.name}</span>
  </button>`).join('');
devCluster.querySelectorAll('.dev-chip').forEach(chip=>chip.addEventListener('click',()=>{
  const d = devices[+chip.dataset.dev];
  topToast(d.toast, d.title, d.msg);
}));

/* System detail cards reuse same model */
const sysDevices = [
  {glyph:'track', name:'Tracker (puntatore + piastra)', desc:'Stati: spento · collegato non visibile · visibile', state:'warn', word:'Non visibile', si:'hidden'},
  {glyph:'cam',   name:'Camera', desc:'Stati: collegata · scollegata', state:'ok', word:'Collegata', si:'ok'},
  {glyph:'pedal', name:'Pedale', desc:'Stati: collegato · scollegato', state:'ok', word:'Collegato', si:'ok'},
  {glyph:'mouse', name:'Space Mouse', desc:'Stati: collegato · scollegato', state:'err', word:'Scollegato', si:'off'}
];
document.getElementById('hwGrid').innerHTML = sysDevices.map(d=>`
  <div class="hw-card s-${d.state}">
    <div class="ico">${ICONS[d.glyph]}</div>
    <div class="info"><div class="nm">${d.name}</div><div class="desc">${d.desc}</div></div>
    <div class="hw-state"><span class="si">${STATE_ICON[d.si]}</span>${d.word}</div>
  </div>`).join('');

/* ---------- 3D models panel: data-driven, per-element transparency ---------- */
/* single source of truth — visibility + opacity live here, every visual
   (mini %, group count, eye, sliders, global avg) is derived from it. */
const MODEL_GROUPS = [
  {name:'Vessels', items:[
    {name:'Arteries',               color:'#C666C7', visible:true,  opacity:80},
    {name:'Veins',                  color:'#789FD6', visible:true,  opacity:80},
    {name:'Ureters',                color:'#FEBD09', visible:true,  opacity:80}
  ]},
  {name:'Organs', items:[
    {name:'Left kidney',            color:'#C666C7', visible:true,  opacity:80},
    {name:'Left collecting system', color:'#789FD6', visible:true,  opacity:80},
    {name:'Liver',                  color:'#8B5E3C', visible:true,  opacity:70},
    {name:'Pelvis',                 color:'#475569', visible:false, opacity:50}
  ]}
];
const EYE_ON  = '<path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.3"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/>';
const EYE_OFF = '<path d="M2 4s2 3.5 5 3.5 5-3.5 5-3.5M3.2 7.2l-1 1.7M10.8 7.2l1 1.7M7 8.6v1.9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>';

/* drag helper shared by per-item + global sliders (mouse + touch via pointer events) */
function dragSlider(slider, onPct){
  const pctOf = e => {
    const r = slider.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - r.left;
    return Math.max(0, Math.min(100, Math.round(x / r.width * 100)));
  };
  slider.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    slider.setPointerCapture?.(e.pointerId);
    onPct(pctOf(e));
    const move = ev => onPct(pctOf(ev));
    const up = () => { slider.removeEventListener('pointermove',move); slider.removeEventListener('pointerup',up); slider.removeEventListener('pointercancel',up); };
    slider.addEventListener('pointermove', move);
    slider.addEventListener('pointerup', up);
    slider.addEventListener('pointercancel', up);
  });
}

/* build a fully interactive models panel inside `container`
   (container must hold a `.models-tree` and a `.tp-block`).
   each panel keeps its own independent state copy. */
function createModelsPanel(container){
  if(!container) return;
  const tree = container.querySelector('.models-tree');
  const tpBlock = container.querySelector('.tp-block');
  if(!tree || !tpBlock) return;
  const groups = MODEL_GROUPS.map(g => ({name:g.name, items:g.items.map(it => ({...it}))}));
  const countEl = (tree.closest('.panel-section') || container).querySelector('.panel-section-label .count');
  const tpVal  = tpBlock.querySelector('.tp-val');
  const tpSlider = tpBlock.querySelector('.tp-slider');
  const tpFill = tpSlider.querySelector('.fill');
  const tpKnob = tpSlider.querySelector('.knob');

  tree.innerHTML = groups.map((g,gi) => `
    <div class="model-group">
      <div class="model-group-header"><svg class="chev" width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${g.name}</span><span class="grp-count"></span></div>
      <div class="model-group-items">${g.items.map((it,ii) => `
        <div class="model-item" data-g="${gi}" data-i="${ii}">
          <div class="mi-row">
            <div class="swatch" style="background:${it.color}"></div>
            <span class="mi-name">${it.name}</span>
            <span class="opacity-mini"></span>
            <button class="eye" type="button" aria-label="Mostra / nascondi"><svg width="15" height="15" viewBox="0 0 14 14" fill="none"></svg></button>
          </div>
          <div class="mi-opacity"><div class="op-slider"><div class="fill"></div><div class="knob"></div></div></div>
        </div>`).join('')}</div>
    </div>`).join('');

  if(countEl) countEl.textContent = groups.reduce((n,g) => n + g.items.length, 0);

  const itemEls = {};
  tree.querySelectorAll('.model-item').forEach(el => { itemEls[el.dataset.g+':'+el.dataset.i] = el; });

  const avgVisible = () => {
    let sum=0, n=0;
    groups.forEach(g => g.items.forEach(it => { if(it.visible){ sum+=it.opacity; n++; } }));
    return n ? Math.round(sum/n) : 0;
  };

  function paintItem(gi, ii){
    const it = groups[gi].items[ii], el = itemEls[gi+':'+ii];
    el.classList.toggle('is-on', it.visible);
    el.querySelector('.opacity-mini').textContent = it.visible ? it.opacity+'%' : '—';
    el.querySelector('.eye svg').innerHTML = it.visible ? EYE_ON : EYE_OFF;
    el.querySelector('.swatch').style.opacity = it.visible ? Math.max(.35, it.opacity/100) : .25;
    el.querySelector('.op-slider .fill').style.width = it.opacity+'%';
    el.querySelector('.op-slider .knob').style.left  = it.opacity+'%';
  }
  function paintMeta(){
    tree.querySelectorAll('.model-group').forEach((gEl,gi) => {
      const vis = groups[gi].items.filter(x => x.visible).length;
      gEl.querySelector('.grp-count').textContent = vis+'/'+groups[gi].items.length;
    });
    const gv = avgVisible();
    if(tpVal) tpVal.textContent = gv+'%';
    tpFill.style.width = gv+'%';
    tpKnob.style.left  = gv+'%';
  }

  groups.forEach((g,gi) => g.items.forEach((_,ii) => paintItem(gi,ii)));
  paintMeta();

  tree.querySelectorAll('.model-group-header').forEach(h =>
    h.addEventListener('click', () => h.classList.toggle('collapsed')));

  tree.querySelectorAll('.model-item').forEach(el => {
    const gi = +el.dataset.g, ii = +el.dataset.i, it = groups[gi].items[ii];
    /* click row → reveal this item's opacity slider (one open at a time) */
    el.querySelector('.mi-row').addEventListener('click', e => {
      if(e.target.closest('.eye')) return;
      const open = !el.classList.contains('is-expanded');
      tree.querySelectorAll('.model-item.is-expanded').forEach(x => x.classList.remove('is-expanded'));
      el.classList.toggle('is-expanded', open);
    });
    /* eye → toggle visibility (independent of the row) */
    el.querySelector('.eye').addEventListener('click', e => {
      e.stopPropagation();
      it.visible = !it.visible;
      paintItem(gi,ii); paintMeta();
    });
    /* per-element transparency: dragging implies the element should be shown */
    dragSlider(el.querySelector('.op-slider'), pct => {
      it.opacity = pct;
      it.visible = true;
      paintItem(gi,ii); paintMeta();
    });
  });

  /* global slider → set every element uniformly */
  dragSlider(tpSlider, pct => {
    groups.forEach((g,gi) => g.items.forEach((it,ii) => { it.opacity = pct; paintItem(gi,ii); }));
    paintMeta();
  });
}

/* VR / AR panels reuse the same panel shell, then get wired by createModelsPanel */
const modelsPanel = `
  <div class="panel-header">
    <div class="ico"><svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3l6 3.5v7L10 17l-6-3.5v-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></div>
    <div class="panel-title">VR / AR Navigation<small>Peppa Pig · 202507-8077</small></div>
  </div>
  <div class="panel-section">
    <div class="panel-section-label"><span>3D Models</span><span class="count"></span></div>
    <div class="models-tree"></div>
  </div>
  <div class="tp-block">
    <div class="tp-row"><span class="tp-label">Trasparenza globale</span><span class="tp-val"></span></div>
    <div class="tp-slider"><div class="fill"></div><div class="knob"></div></div>
  </div>`;
/* VR adds a "Visualizzazione" mode selector that AR doesn't have */
const vizSection = `
  <div class="panel-section">
    <div class="panel-section-label"><span>Visualizzazione</span></div>
    <div class="viz-list">
      <button class="viz-btn is-active"><span class="viz-ic"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.4" stroke="currentColor" stroke-width="1.4"/><path d="M3 13a5 5 0 0 1 10 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>Prima persona</button>
      <button class="viz-btn"><span class="viz-ic"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.2" stroke="currentColor" stroke-width="1.4"/><rect x="3.5" y="9.5" width="9" height="4" rx="2" stroke="currentColor" stroke-width="1.4"/></svg></span>Terza persona</button>
      <button class="viz-btn"><span class="viz-ic"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="8" r="1.6" fill="currentColor"/></svg></span>Interattivo</button>
    </div>
  </div>`;
document.getElementById('vrPanel').innerHTML = modelsPanel + vizSection;
document.getElementById('arPanel').innerHTML = modelsPanel;

/* wire all three models panels (patient / VR / AR) — each independent */
createModelsPanel(document.getElementById('patientPanel'));
createModelsPanel(document.getElementById('vrPanel'));
createModelsPanel(document.getElementById('arPanel'));

/* ---------- view switching ---------- */
const views = document.querySelectorAll('.view');
document.querySelectorAll('.sb-item[data-view]').forEach(item=>{
  item.addEventListener('click',()=>{
    const v = item.dataset.view;
    document.querySelectorAll('.sb-item').forEach(s=>s.classList.remove('is-active'));
    item.classList.add('is-active');
    views.forEach(s=>s.classList.toggle('is-active', s.dataset.view===v));
  });
});

/* ---------- topbar interactions ---------- */
document.querySelectorAll('.tb-toggle button').forEach(b=>{
  b.addEventListener('click',()=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active')});
});
document.querySelectorAll('.seg button').forEach(b=>{
  b.addEventListener('click',()=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active')});
});
document.querySelectorAll('.toggle').forEach(t=>t.addEventListener('click',()=>t.classList.toggle('is-on')));
/* .model-group-header / .model-item interactions are wired per-panel in createModelsPanel */
document.querySelectorAll('.dicom-item').forEach(d=>d.addEventListener('click',()=>{
  d.parentElement.querySelectorAll('.dicom-item').forEach(x=>x.classList.remove('is-active'));d.classList.add('is-active');
}));

/* assistant */
const assistant=document.getElementById('assistant');
document.getElementById('assistBtn').addEventListener('click',function(){assistant.classList.toggle('show');this.classList.toggle('is-on')});
document.getElementById('astClose').addEventListener('click',()=>{assistant.classList.remove('show');document.getElementById('assistBtn').classList.remove('is-on')});

/* blob reacts to impulses (open/click) */
function pokeBlob(el){const b=el.querySelector?.('.ai-blob')||el;if(!b)return;b.classList.remove('react');void b.offsetWidth;b.classList.add('react');setTimeout(()=>b.classList.remove('react'),700);}
document.querySelectorAll('.ai-blob').forEach(b=>b.addEventListener('click',()=>pokeBlob(b)));
document.getElementById('assistBtn').addEventListener('click',function(){pokeBlob(this);});
/* periodic idle impulse */
setInterval(()=>document.querySelectorAll('.ai-blob').forEach(b=>pokeBlob(b)),6000);

/* immersive mode: entry button removed; exit via Esc / exit button stays */
const app=document.getElementById('app'),immersiveExit=document.getElementById('immersiveExit');
function setImmersive(on){ app.classList.toggle('is-immersive',on); }
immersiveExit.addEventListener('click',()=>setImmersive(false));
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && app.classList.contains('is-immersive')) setImmersive(false); });

/* ---------- dialog + toast system ---------- */
const overlay=document.getElementById('overlay'),dialogHost=document.getElementById('dialogHost'),toastStack=document.getElementById('toastStack');
const DI={
  err:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 7v6M12 16v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>',
  ask:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 9a3 3 0 1 1 4 2.8c-.7.4-1 .9-1 1.7M12 17v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>'
};
function blockingDialog(type, opts={}){
  const remaining = opts.remaining ?? 0;
  const cfg = type==='err'
    ? {cls:'d-err', title:'Calibrazione incompleta', msg:`Devi acquisire tutti i punti anatomici prima di procedere sul paziente. ${remaining>0?`Mancano ancora ${remaining} ${remaining===1?'punto':'punti'}.`:''}`, actions:'<button class="btn btn-secondary" data-close>Chiudi</button><button class="btn btn-primary" data-close>Continua calibrazione</button>'}
    : {cls:'d-ask', title:'Salvare la sessione?', msg:'Hai modifiche non salvate alla configurazione dei modelli. Vuoi salvarle prima di uscire?', actions:'<button class="btn btn-secondary" data-close>Non salvare</button><button class="btn btn-primary" data-close>Salva</button>'};
  dialogHost.innerHTML=`<div class="dialog ${cfg.cls}"><div class="dialog-top"></div><div class="dialog-body"><div class="dialog-ic">${DI[type]}</div><h3>${cfg.title}</h3><p>${cfg.msg}</p></div><div class="dialog-actions">${cfg.actions}</div></div>`;
  overlay.classList.add('show');
  dialogHost.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>overlay.classList.remove('show')));
}
const TI={
  warn:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 6v3M8 11v.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 2l6.5 11.5h-13z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  info:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 7v4M8 5v.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.5"/></svg>'
};
function topToast(type, title, msg){
  const def = type==='warn'
    ? {title:'Puntatore non visibile', msg:'Sposta il puntatore nel campo della camera per continuare la calibrazione.'}
    : {title:'Vista acquisita', msg:'La vista è stata registrata correttamente. Procedi con la successiva.'};
  const cfg = {title: title || def.title, msg: msg || def.msg};
  const el=document.createElement('div');
  el.className=`toast t-${type}`;
  el.innerHTML=`<span class="ic">${TI[type]}</span><div class="bd"><p class="tt">${cfg.title}</p><p class="mg">${cfg.msg}</p></div><button class="x"><svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>`;
  el.querySelector('.x').addEventListener('click',()=>el.remove());
  toastStack.appendChild(el);
  setTimeout(()=>el.remove(),5000);
}

/* ---------- calibration: single source of truth ---------- */
/* every visual (points, progress bar, count, stepper, quality, acq feedback)
   is derived from `calib.acquired`, so nothing can desync. */
const CHECK_SVG='<svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CALIB_POINTS=[{x:'50%',y:'20%'},{x:'60%',y:'38%'},{x:'39%',y:'38%'},{x:'50%',y:'60%'}];
const QUALITY=[
  {lvl:1, label:'Insufficiente', sub:'acquisisci altri punti'},
  {lvl:1, label:'Insufficiente', sub:'acquisisci altri punti'},
  {lvl:2, label:'Discreta',      sub:'migliora la copertura'},
  {lvl:3, label:'Ottimo',        sub:'puoi proseguire'},
  {lvl:4, label:'Eccellente',    sub:'calibrazione completa'}
];
const calib={acquired:2, total:4};
const $=id=>document.getElementById(id);
const calibPoints=$('calibPoints'), acq=$('acq'), acqMain=$('acqMain'), acqSub=$('acqSub'),
      acqCount=$('acqCount'), acqBar=$('acqBar'), acqEta=$('acqEta'),
      quality=$('quality'), qLabel=$('qLabel'), qSub=$('qSub'),
      step4=$('step4'), step5=$('step5'), stepConn4=$('stepConn4'),
      continuePatient=$('continuePatient'), undoPoint=$('undoPoint'), cancelCalib=$('cancelCalib');

function renderCalib(){
  const {acquired,total}=calib, done=acquired>=total;

  /* points */
  calibPoints.innerHTML = CALIB_POINTS.map((p,i)=>{
    const cls = i<acquired ? 'cp done' : (i===acquired ? 'cp current' : 'cp');
    const inner = i<acquired ? CHECK_SVG : (i+1);
    return `<div class="${cls}" data-pt="${i}" style="left:${p.x};top:${p.y}">${inner}</div>`;
  }).join('');
  calibPoints.querySelectorAll('.cp.current').forEach(el=>el.addEventListener('click',acquirePoint));

  /* progress */
  acqCount.textContent=`${acquired}/${total}`;
  acqBar.style.width=`${acquired/total*100}%`;
  acqEta.textContent = done ? 'completata' : `~${(total-acquired)*15}s rimanenti`;

  /* acquisition feedback */
  acq.classList.toggle('idle', done);
  acqMain.textContent = done ? 'Calibrazione completata' : `Acquisizione vista ${acquired+1} di ${total}`;
  acqSub.textContent  = done ? 'tutte le viste acquisite' : 'tocca il punto evidenziato per acquisire';

  /* quality */
  const q=QUALITY[acquired];
  quality.dataset.level=q.lvl; qLabel.textContent=q.label; qSub.textContent=q.sub;

  /* stepper: step 4 done + step 5 current once finished */
  step4.classList.toggle('is-current', !done);
  step4.classList.toggle('is-done', done);
  step4.querySelector('.step-circle').innerHTML = done ? CHECK_SVG : '4';
  stepConn4.classList.toggle('is-done', done);
  step5.classList.toggle('is-current', done);

  /* continue button only meaningful when complete */
  continuePatient.classList.toggle('is-disabled', !done);
  undoPoint.disabled = acquired<=0;
}

function acquirePoint(){
  if(calib.acquired>=calib.total) return;
  calib.acquired++;
  renderCalib();
  if(calib.acquired>=calib.total)
    topToast('info','Calibrazione completata',`Tutte le ${calib.total} viste sono state acquisite. Puoi continuare sul paziente.`);
  else
    topToast('info','Vista acquisita',`Vista ${calib.acquired} di ${calib.total} registrata correttamente. Procedi con la successiva.`);
}

undoPoint.addEventListener('click',()=>{ if(calib.acquired>0){calib.acquired--; renderCalib();} });
cancelCalib.addEventListener('click',()=>{ calib.acquired=0; renderCalib(); document.querySelector('.sb-item[data-view="config"]').click(); });
continuePatient.addEventListener('click',()=>{
  if(calib.acquired<calib.total){ blockingDialog('err',{remaining:calib.total-calib.acquired}); return; }
  document.querySelector('.sb-item[data-view="patient"]').click();
  topToast('info','Navigazione pronta','Calibrazione applicata. I modelli sono allineati al paziente.');
});
renderCalib();

/* ---------- patient selection modal ---------- */
const patientsOverlay=document.getElementById('patientsOverlay');
function openPatients(){patientsOverlay.classList.add('show')}
function closePatients(){patientsOverlay.classList.remove('show')}
document.getElementById('openPatients').addEventListener('click',openPatients);
document.getElementById('patientsClose').addEventListener('click',closePatients);
document.getElementById('ptCancel').addEventListener('click',closePatients);
patientsOverlay.addEventListener('click',e=>{if(e.target===patientsOverlay)closePatients()});
document.querySelectorAll('#ptList .pt-item').forEach(it=>it.addEventListener('click',()=>{
  document.querySelectorAll('#ptList .pt-item').forEach(x=>x.classList.remove('is-active'));it.classList.add('is-active');
}));
/* remove button: don't trigger row selection */
document.querySelectorAll('#ptList .pt-remove').forEach(b=>b.addEventListener('click',e=>{
  e.stopPropagation();const it=b.closest('.pt-item');it.remove();
}));
/* error prevention: block save until required fields are filled */
document.getElementById('ptSave').addEventListener('click',()=>{
  const req=[...document.querySelectorAll('#patientsOverlay .inp[data-required]')];
  let ok=true;
  req.forEach(i=>{const empty=!i.value.trim();i.classList.toggle('err',empty);if(empty)ok=false;});
  if(ok)closePatients();
});
document.querySelectorAll('#patientsOverlay .inp[data-required]').forEach(i=>
  i.addEventListener('input',()=>i.classList.remove('err')));
/* gender radio (single select) */
document.querySelectorAll('.radio-row').forEach(row=>row.querySelectorAll('.radio').forEach(r=>
  r.addEventListener('click',()=>{row.querySelectorAll('.radio').forEach(x=>x.classList.remove('is-on'));r.classList.add('is-on');})));

/* ---------- config setup: endoscope select + feed ---------- */
const endoTrigger=document.getElementById('endoTrigger'),endoMenu=document.getElementById('endoMenu'),
      endoValue=document.getElementById('endoValue'),feedNoSignal=document.getElementById('feedNoSignal');
endoTrigger.addEventListener('click',e=>{e.stopPropagation();endoMenu.classList.toggle('open')});
endoMenu.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  endoValue.textContent=b.dataset.val;endoValue.classList.remove('is-empty');
  endoMenu.classList.remove('open');
  feedNoSignal.classList.add('connected');
}));
document.addEventListener('click',()=>endoMenu.classList.remove('open'));

/* advanced functions disclosure */
const advToggle=document.getElementById('advToggle');
advToggle.addEventListener('click',()=>advToggle.classList.toggle('open'));

/* launch calibration → switch to calib view */
function goCalib(){document.querySelector('.sb-item[data-view="config"]').click();
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('is-active',s.dataset.view==='calib'));}
document.querySelectorAll('[data-go-calib]').forEach(b=>b.addEventListener('click',goCalib));

/* config assistant dismiss */
const cfgAssist=document.getElementById('cfgAssist');
document.getElementById('cfgAssistClose').addEventListener('click',()=>cfgAssist.classList.remove('show'));
document.getElementById('cfgAssistSkip').addEventListener('click',()=>cfgAssist.classList.remove('show'));

/* settings tabs */
document.querySelectorAll('.stab').forEach(t=>t.addEventListener('click',()=>{
  const tab=t.dataset.tab;
  document.querySelectorAll('.stab').forEach(x=>x.classList.toggle('is-active',x.dataset.tab===tab));
  document.querySelectorAll('.stab-panel').forEach(p=>p.classList.toggle('is-active',p.dataset.tab===tab));
}));

/* checkbox rows */
document.querySelectorAll('.check').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('is-on')));

/* colorblind preset selector (single active) */
document.querySelectorAll('.cb-preset').forEach(b=>b.addEventListener('click',()=>{
  b.parentElement.querySelectorAll('.cb-preset').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');
}));

/* VR visualization mode selector */
document.querySelectorAll('.viz-btn').forEach(b=>b.addEventListener('click',()=>{
  b.parentElement.querySelectorAll('.viz-btn').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');
}));

/* power-off: confirm before leaving with unsaved changes */
document.getElementById('powerBtn').addEventListener('click',()=>blockingDialog('ask'));
