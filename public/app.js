(async()=>{
const r=await fetch('data.json').then(r=>r.json());
const scoreLabel=s => s===null ? 'N/A' : s.toFixed(1);
const scoreClass=s => s===null ? 'na' : s>=3.8 ? 'good' : s>=2.8 ? 'mid' : 'low';
const outcomeLabel=o=>{const m={excellent:'Excellent',partiel:'Partiel',correct:'Correct',faible:'Faible','non applicable':'N/A'};return m[o]||o;};

// KPIs
document.getElementById('kpi-total').textContent=r.corpus.totalCalls;
document.getElementById('kpi-demos').textContent=r.corpus.demoCalls;
document.getElementById('kpi-relances').textContent=r.corpus.followUpCalls;
document.getElementById('kpi-accounts').textContent=r.corpus.accountsCovered;

// Key takeaways
document.getElementById('takeaways').innerHTML=r.keyTakeaways.map(t=>`<p>${t}</p>`).join('');

// Call classification
document.getElementById('class-pills').innerHTML=r.callClassification.secondaryTypes.map(t=>`<span class="pill">${t}</span>`).join('');
document.getElementById('class-blockers').innerHTML=r.callClassification.typicalBlockers.map(b=>`<div class="dist"><span>${b.label}</span><b>${b.frequency}</b></div>`).join('');

// Leaderboard
const scored=r.calls.filter(c=>c.score!==null).sort((a,b)=>b.score-a.score);
document.getElementById('leaderboard').innerHTML=scored.map((c,i)=>`
<div class="rank">
  <span>${i+1}</span>
  <div><b style="font-size:15px">${c.account}</b><small>${c.type} · ${c.outcomeClass}</small></div>
  <span class="score ${scoreClass(c.score)}">${scoreLabel(c.score)}</span>
</div>`).join('');

// Call cards
document.getElementById('calls-container').innerHTML=r.calls.map(c=>`
<article class="call-card">
  <div class="card-top">
    <div><span class="eyebrow">${c.account}</span><h3>${c.type}</h3></div>
    ${c.score!==null?`<span class="score ${scoreClass(c.score)}">${scoreLabel(c.score)}</span>`:`<span class="score na">N/A</span>`}
  </div>
  <p class="type">${c.type} · ${c.duration}</p>
  <p class="outcome"><b>Issue :</b> ${c.outcome}</p>
  <div class="grid two">
    <div><h4>Points forts</h4><ul>${c.strengths.map(s=>`<li>${s}</li>`).join('')||'<li class="muted">—</li>'}</ul></div>
    <div><h4>Axes d'amélioration</h4><ul>${c.improvements.map(s=>`<li>${s}</li>`).join('')||'<li class="muted">—</li>'}</ul></div>
  </div>
  <div class="priority"><span>Priorité</span><strong>${c.priority}</strong></div>
  ${Object.keys(c.scores).length?`<div class="scores-grid">
    ${Object.entries(c.scores).map(([k,v])=>`<div class="metric"><div><span>${r.scoringDimensions[k]?.label||k}</span><b>${v}/5</b></div><div class="bar"><i style="width:${v*20}%"></i></div></div>`).join('')}
  </div>`:''}
  ${c.moments.map(m=>`<div class="moment"><b>${m.type==='rise'?'Ça monte':m.type==='break'?'Ça casse':m.type==='signal'?'Signal':'Moment'}</b><p>${m.label}</p><em>${m.detail}</em></div>`).join('')}
</article>`).join('');

// Strengths
document.getElementById('strengths-list').innerHTML=r.strengths.map(s=>`<li>${s}</li>`).join('');

// Weaknesses
document.getElementById('weaknesses-list').innerHTML=r.weaknesses.map(w=>`<li class="${w.severity}"><strong>${w.label}</strong> — ${w.frequency}. ${w.impact}.</li>`).join('');

// Priority global
document.getElementById('priority-title').textContent=r.priorityGlobal.title;
document.getElementById('priority-desc').textContent=r.priorityGlobal.description;
document.getElementById('priority-target').textContent=r.priorityGlobal.targetBehavior;
document.getElementById('priority-indicator').textContent=r.priorityGlobal.indicator;
document.getElementById('priority-exercises').innerHTML=r.priorityGlobal.exercises.map(e=>`
<div class="exercise"><h3>${e.title}</h3><p>${e.description}</p></div>`).join('');

// Scoring dimensions
document.getElementById('scoring-grid').innerHTML=Object.entries(r.scoringDimensions).map(([k,v])=>`
<div class="scale-card"><h3>${v.label}</h3><p style="font-size:13px;color:var(--muted);margin:4px 0">${v.description}</p>
${Object.entries(v.scale).map(([lvl,desc])=>`<p style="font-size:12px;margin:3px 0"><b>${lvl}</b> ${desc}</p>`).join('')}
</div>`).join('');

// Manager version
document.getElementById('manager-well').innerHTML=r.managerVersion.goingWell.map(s=>`<li>${s}</li>`).join('');
document.getElementById('manager-progress').innerHTML=r.managerVersion.needsProgress.map(s=>`<li>${s}</li>`).join('');
document.getElementById('manager-actions').innerHTML=r.managerVersion.managerialActions.map(s=>`<li>${s}</li>`).join('');

// Follow-up plan
document.getElementById('followup-cards').innerHTML=r.followUpPlan.map(f=>`
<div class="followup-card"><b>${f.step}</b><span>${f.when}</span><p>${f.what}</p></div>`).join('');

// Transversal averages
document.getElementById('avg-scores').innerHTML=Object.entries(r.transversalAverages).map(([k,v])=>`
<div class="score-row"><span>${r.scoringDimensions[k]?.label||k}</span><div class="bar"><i style="width:${v*20}%"></i></div><b>${v.toFixed(1)}/5</b></div>`).join('');
})();
