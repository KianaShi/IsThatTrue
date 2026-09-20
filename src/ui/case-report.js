import { SOLUTION } from '../game/solution.js';

import { evaluate } from '../game/evaluation.js';

// Compatibility helper delegates to the single scoring engine.
export function scoreInvestigation(records, questions, answers) {
 const report = evaluate({ records, questions, answers });
 return { ...report.selection, theory: report.outcome.theory, theoryCorrect: report.outcome.right,
  score: report.overall, accuracy: report.selection.chosen ? Math.round(100 * report.selection.precision) : null,
  level: report.profile.title };
}
const names = {noah:'Noah Reed',olivia:'Olivia Grant',ethan:'Ethan Cole',avery:'Avery Chen'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderCaseReport(host, { records, questions, answers, solutionAvailable, elapsed, limit, timedOut }) {
 if (!solutionAvailable) { host.textContent = 'A complete solution and evidence score are not available for this case yet.'; return; }
 const report = evaluate({records, questions, answers, elapsed, limit, timedOut});
 const r = { ...report.selection, theory: report.outcome.theory, theoryCorrect: report.outcome.right,
  score: report.overall, accuracy: report.selection.chosen ? Math.round(100 * report.selection.precision) : null };
 const ring = 2 * Math.PI * 52;
 const answerLabel = (q,key) => q.choices?.find(c => c.key === key)?.name || names[key] || 'Not answered';
 host.innerHTML = `
 <section class="insight-summary" aria-label="Investigation score">
  <p class="report-kicker">Your insight this round</p>
  <div class="evaluation-heading"><div class="eval-ring" role="img" aria-label="Insight score ${r.score} out of 100"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="eval-ring-track" cx="60" cy="60" r="52"/><circle class="eval-ring-fill" cx="60" cy="60" r="52" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1-r.score/100)}"/></svg><b>${r.score}<small>/100</small></b></div><div class="eval-profile"><h3>${esc(report.profile.title)}</h3><p>${esc(report.profile.text)}</p></div></div>
  <div class="eval-measures">${report.measures.map(m => `<div class="eval-row"><b>${esc(m.name)}</b><div><strong>${esc(m.label)}</strong><p>${esc(m.note)}</p></div></div>`).join('')}</div>
  <div class="report-metrics"><p><b>${r.correct} / ${r.chosen}</b> clue choices correct</p><p><b>${r.theoryCorrect} / ${questions.length}</b> theory answers correct</p><p><b>${r.chosen} / ${records.length}</b> clues decided</p></div>
  <p>${r.chosen ? `Choice accuracy: ${r.accuracy}%.` : 'No clue choices were made; accuracy is not yet available.'} ${records.length-r.chosen} clues were left undecided.</p>
  <p class="report-note">This score describes this round: 40% outcome accuracy + 40% evidence selection + 20% reasoning coherence. Selection balances choice accuracy with coverage of all ${records.length} clues using their harmonic mean. Reasoning requires relevant, genuine starred clues supporting specific answers. Speed is reported separately.</p>
  <p class="report-note">Keep or star genuine evidence and discard fabricated evidence. If you pin a genuine clue, match it to the person it concerns—even when it supports their innocence. A wrong suspect assignment earns no credit. Opening a clue alone is not a decision.</p>
 </section>
 <section><h3>Your final theory</h3><p>Evidence-backed claims: ${report.reasoning.supported} / ${report.reasoning.claims.length}.</p>${r.theory.map(q => `<div class="theory-review"><b>${q.correct?'✓ Correct':'○ Review'} — ${esc(q.text)}</b><p>Your answer: ${esc(answerLabel(q,q.chosen))}<br>Case solution: ${esc(answerLabel(q,q.answer))}</p></div>`).join('')}
 <p class="insight-lesson"><strong>The central insight:</strong> the early evidence against Ethan was mostly authentic. The conclusion drawn from it was wrong. Credentials identify an account or badge—not necessarily the person using it.</p></section>
 <details class="reasoning-review"><summary>How your starred evidence supports the theory</summary>${report.reasoning.claims.map(claim => {
 const q = questions.find(q => q.key === claim.key);
 return `<article><h4>${claim.supported?'✓ Supported':'○ Needs support'} — ${esc(claim.text)}</h4><p>Requires a correct answer plus a genuine star from each group: ${q.supportGroups.map(g => g.map(esc).join(' or ')).join('; and ')}.</p></article>`;
 }).join('')}</details>
 <details class="clue-review"><summary>Review all ${records.length} clue decisions</summary>
 ${r.clues.map(t => `<article><h4>${esc(t.evidenceId || t.id || 'Evidence')}${t.pieceType ? ` · ${t.side==='obsidian'?'Black':'White'} ${esc(t.pieceType)}` : ''} — ${esc(t.label)}</h4><p><b>${!t.chosen?'Undecided':t.correct?'Correct choice':'Incorrect choice'}</b> · ${t.discarded?'Discarded':t.placedTo?`Pinned to ${esc(names[t.placedTo])}`:t.held?'Kept in basket':t.starred?'Starred':'No final choice'} · ${t.real?'REAL':'FAKE'}${t.starred && !t.discarded?' · ★ Starred':''}</p><p>${(t.digLevels || []).map(esc).join('<br>')}</p><p>${t.real?`Keep as genuine evidence${t.aboutSuspect?`; it concerns ${esc(names[t.aboutSuspect])}`:''}.`:'Discard: this item was fabricated.'}</p></article>`).join('')}</details>
 <section class="solution-timeline"><h3>The complete case solution</h3><p>Noah leaked the original. Olivia altered the second video. Ethan was wrongly accused. Avery’s security concerns were legitimate.</p>
 ${SOLUTION.map(s => `<article><h4>${esc(s.heading)}</h4>${s.paragraphs.map(p => `<p>${esc(p.replace(/^> /gm,'').replace(/^-\s+/gm,'• '))}</p>`).join('')}</article>`).join('')}</section>`;
}
