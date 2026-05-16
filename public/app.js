(async()=>{
const r=await fetch('data.json').then(r=>r.json());
const scoreLabel=s => s===null || Number.isNaN(s) ? 'N/A' : Number(s).toFixed(1);
const scoreClass=s => s===null || Number.isNaN(s) ? 'na' : s>=3.8 ? 'good' : s>=2.8 ? 'mid' : 'low';
const dimOrder=['preparation','decouverte','demoArgumentation','gestionObjections','closingEngagement'];
const avg=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
const callScores=r.calls.filter(c=>c.score!==null);
const globalAvg=avg(callScores.map(c=>c.score));
const consequenceStatus=c=>{
  const text=[...(c.improvements||[]),...(c.moments||[]).map(m=>`${m.label} ${m.detail}`),c.priority||''].join(' ').toLowerCase();
  if(!c.score) return 'Non mesurable';
  if(text.includes('conséquence')||text.includes('impact')||text.includes('coût')) return c.scores?.decouverte>=4?'Oui partiellement':'À renforcer';
  return 'Non visible';
};

// KPIs
document.getElementById('kpi-total').textContent=r.corpus.totalCalls;
document.getElementById('kpi-demos').textContent=r.corpus.demoCalls;
document.getElementById('kpi-relances').textContent=r.corpus.followUpCalls;
document.getElementById('kpi-accounts').textContent=r.corpus.accountsCovered;

// Formula
const formula=[
  ['Attente','Ce que le client veut améliorer','« Qu’est-ce que vous attendez concrètement d’un outil comme celui-ci ? »'],
  ['Enjeu','Pourquoi ça compte maintenant','« Pourquoi ce sujet devient important pour votre cabinet ? »'],
  ['Conséquence','Ce que l’inaction coûte','« Si rien ne change, ça continue à vous coûter quoi ? »'],
  ['Décision','Qui valide, comment et quand','« Qui doit être convaincu et sur quels critères vous tranchez ? »']
];
document.getElementById('formula-steps').innerHTML=formula.map((f,i)=>`<article><b>${i+1}</b><h3>${f[0]}</h3><p>${f[1]}</p><em>${f[2]}</em></article>`).join('');

// Takeaways
document.getElementById('takeaways').innerHTML=r.keyTakeaways.map(t=>`<p>${t}</p>`).join('');

// Classification
document.getElementById('class-pills').innerHTML=r.callClassification.secondaryTypes.map(t=>`<span class="pill">${t}</span>`).join('');
document.getElementById('class-blockers').innerHTML=r.callClassification.typicalBlockers.map(b=>`<div class="dist"><span>${b.label}</span><b>${b.frequency}</b></div>`).join('');

function renderDimensionCard(k,v){
  const meta=r.scoringDimensions[k];
  const risk=k==='closingEngagement'?'Prioritaire':k==='decouverte'?'Racine du closing':'À préserver / surveiller';
  return `<article class="dimension-card">
    <div class="dimension-head"><div><span>${risk}</span><h3>${meta?.label||k}</h3></div><strong class="score ${scoreClass(v)}">${scoreLabel(v)}</strong></div>
    <div class="bar"><i style="width:${(v||0)*20}%"></i></div>
    <p>${meta?.description||''}</p>
  </article>`;
}

// Progression scores
const avgHost=document.getElementById('avg-scores');
avgHost.innerHTML=`<article class="dimension-card global"><div class="dimension-head"><div><span>Score global</span><h3>Moyenne des entretiens notés</h3></div><strong class="score ${scoreClass(globalAvg)}">${scoreLabel(globalAvg)}</strong></div><div class="bar"><i style="width:${(globalAvg||0)*20}%"></i></div><p>Lecture globale : excellent socle produit, progression prioritaire sur conséquences client + décision.</p></article>`+
Object.entries(r.transversalAverages).map(([k,v])=>renderDimensionCard(k,v)).join('');

const trend=document.getElementById('call-trend');
trend.innerHTML=`<div class="trend-chart">${callScores.map(c=>`<div class="trend-col"><div class="trend-bar"><i style="height:${c.score*20}%"></i></div><b>${scoreLabel(c.score)}</b><span>${c.id.replace('call-','Appel ')}</span><small>${c.account}</small></div>`).join('')}</div>`;

// Priority global
document.getElementById('priority-title').textContent=r.priorityGlobal.title;
document.getElementById('priority-desc').textContent=r.priorityGlobal.description;
document.getElementById('priority-target').textContent=r.priorityGlobal.targetBehavior;
document.getElementById('priority-indicator').textContent=r.priorityGlobal.indicator;
document.getElementById('priority-exercises').innerHTML=r.priorityGlobal.exercises.map(e=>`<div class="exercise"><h3>${e.title}</h3><p>${e.description}</p></div>`).join('');

function renderCall(c,idx){
  const moments=(c.moments||[]).map(m=>`<div class="moment"><b>${m.type==='rise'?'Ça monte':m.type==='break'?'Ça casse':m.type==='signal'?'Signal d’achat':'Moment'}</b><p>${m.label}</p><em>${m.detail}</em></div>`).join('');
  const correction=c.priority && !c.priority.startsWith('N/A')?c.priority:'Source non exploitable ou appel trop court : ne pas sur-interpréter.';
  return `<details class="call-detail" ${idx===0?'open':''}>
    <summary>
      <div><span class="eyebrow">${c.account}</span><h3>${c.type}</h3><p>${c.outcome}</p></div>
      <span class="score ${scoreClass(c.score)}">${scoreLabel(c.score)}</span>
    </summary>
    <div class="call-body">
      <div class="call-meta">
        <span>${c.duration}</span><span>${c.outcomeClass}</span><span>Conséquence client : ${consequenceStatus(c)}</span>
      </div>
      <div class="grid two">
        <div><h4>✅ Ce que Louis réussit</h4><ul>${(c.strengths||[]).map(s=>`<li>${s}</li>`).join('')||'<li class="muted">Non mesurable sur cette source.</li>'}</ul></div>
        <div><h4>⚠️ Ce qui limite l’avancée</h4><ul>${(c.improvements||[]).map(s=>`<li>${s}</li>`).join('')||'<li class="muted">Non mesurable sur cette source.</li>'}</ul></div>
      </div>
      <div class="priority"><span>Correction entraînable</span><strong>${correction}</strong></div>
      ${Object.keys(c.scores||{}).length?`<div class="scores-grid">${Object.entries(c.scores).map(([k,v])=>`<div class="metric"><div><span>${r.scoringDimensions[k]?.label||k}</span><b>${v}/5</b></div><div class="bar"><i style="width:${v*20}%"></i></div></div>`).join('')}</div>`:''}
      ${moments}
    </div>
  </details>`;
}

document.getElementById('calls-container').innerHTML=`<section class="calls-overview"><div><p class="eyebrow">Carte globale</p><h3>${r.coachee.name} — ${r.corpus.totalCalls} entretiens</h3><p>Les entretiens sont repliés pour garder une lecture claire. Ouvre un appel pour voir les preuves, les scores et la correction à tester.</p></div><span class="score ${scoreClass(globalAvg)}">${scoreLabel(globalAvg)}</span></section><div class="date-groups">${r.calls.map(renderCall).join('')}</div>`;

// Strengths / Weaknesses
document.getElementById('strengths-list').innerHTML=r.strengths.map(s=>`<li>${s}</li>`).join('');
document.getElementById('weaknesses-list').innerHTML=r.weaknesses.map(w=>`<li class="${w.severity}"><strong>${w.label}</strong> — ${w.frequency}. ${w.impact}.</li>`).join('');

// Leaderboard
const scored=[...callScores].sort((a,b)=>b.score-a.score);
document.getElementById('leaderboard').innerHTML=scored.slice(0,6).map((c,i)=>`<div class="rank"><span>${i+1}</span><div><b>${c.account}</b><small>${c.type} · ${c.outcomeClass}</small></div><span class="score ${scoreClass(c.score)}">${scoreLabel(c.score)}</span></div>`).join('');

// Toolbox
const toolbox=[
  {title:'Questions d’enjeu',when:'Après une attente fonctionnelle, avant la démo.',risk:'Sinon Louis répond au besoin sans savoir pourquoi il compte.',qs:['Pourquoi ce sujet devient important maintenant ?','Qu’est-ce que vous voulez éviter ou améliorer derrière cette demande ?','Si ce point était réglé, qu’est-ce que ça changerait pour le cabinet ?']},
  {title:'Questions de conséquence',when:'Dès qu’un client dit “gain de temps”, “séduisant”, “compliqué”, “pas mon job”.',risk:'Sinon l’intérêt reste abstrait et le prix arrive trop tôt.',qs:['Aujourd’hui, ça vous coûte quoi concrètement : temps, risque, retard, charge mentale ?','Si rien ne change dans 6 mois, qu’est-ce qui devient problématique ?','Combien de dossiers, d’heures ou d’allers-retours ça représente ?']},
  {title:'Questions de décision',when:'Avant le prix, puis avant de terminer l’appel.',risk:'Sinon la prochaine étape dépend du bon vouloir du prospect.',qs:['Qui doit être convaincu avec vous pour avancer ?','Sur quels critères vous allez décider ?','Qu’est-ce qui pourrait bloquer la décision même si la solution vous plaît ?','On se cale quel point de décision ?']}
];
document.getElementById('question-toolbox').innerHTML=toolbox.map(t=>`<article class="tool-card"><h3>${t.title}</h3><p><b>Timing :</b> ${t.when}</p><p><b>Risque si absent :</b> ${t.risk}</p><ul>${t.qs.map(q=>`<li>${q}</li>`).join('')}</ul></article>`).join('');

// Before / After
const ba=[
  ['Je vais vous montrer comment le module fonctionne.','Avant de vous le montrer, aujourd’hui quand ce traitement n’est pas automatisé, qu’est-ce que ça vous coûte concrètement ?'],
  ['C’est 99 € par mois avec les tokens inclus.','Vous m’avez dit que ce sujet faisait perdre du temps à l’assistante. Au regard de ce gain, qui doit valider et quand voulez-vous trancher ?'],
  ['Je vous renvoie la proposition et vous me direz.','Je vous renvoie la proposition. Pour éviter que ça reste en suspens, on se cale un point mardi pour décider si vous avancez ou non ?']
];
document.getElementById('before-after-grid').innerHTML=ba.map(x=>`<article class="ba-card"><div><span>Avant</span><p>${x[0]}</p></div><div><span>Après</span><p>${x[1]}</p></div></article>`).join('');

// Scoring dimensions
document.getElementById('scoring-grid').innerHTML=Object.entries(r.scoringDimensions).map(([k,v])=>`<div class="scale-card"><h3>${v.label}</h3><p style="font-size:13px;color:var(--muted);margin:4px 0">${v.description}</p>${Object.entries(v.scale).map(([lvl,desc])=>`<p style="font-size:12px;margin:3px 0"><b>${lvl}</b> ${desc}</p>`).join('')}</div>`).join('');

// Manager version
document.getElementById('manager-well').innerHTML=r.managerVersion.goingWell.map(s=>`<li>${s}</li>`).join('');
document.getElementById('manager-progress').innerHTML=r.managerVersion.needsProgress.map(s=>`<li>${s}</li>`).join('');
document.getElementById('manager-actions').innerHTML=r.managerVersion.managerialActions.map(s=>`<li>${s}</li>`).join('');

// Follow-up plan
document.getElementById('followup-cards').innerHTML=r.followUpPlan.map(f=>`<div class="followup-card"><b>${f.step}</b><span>${f.when}</span><p>${f.what}</p></div>`).join('');

console.log('Louis Bénézech dashboard V2 ready');
})();
