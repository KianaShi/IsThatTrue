// Unified evaluation: PR #11's four measures plus the complete evidence audit.
// Pure functions; the renderer and gameplay never compute competing totals.
const fraction = (n, d) => d > 0 ? Math.min(1, Math.max(0, n / d)) : 0;
const pct = n => `${Math.round(n * 100)}%`;
const unique = records => [...new Map(records.map((t, i) => [t.evidenceId || t.id || `row:${i}`, t])).values()];

export function scoreOutcome(questions = [], answers = {}) {
 const theory = questions.map(q => ({ ...q, chosen: answers[q.key], correct: Boolean(q.answer) && answers[q.key] === q.answer }));
 const right = theory.filter(q => q.correct).length;
 return { theory, right, score: fraction(right, theory.length), correct: theory.length > 0 && right === theory.length,
  note: `${right} of ${theory.length} answers correct` };
}

export function scoreSelection(records = []) {
 const clues = unique(records).map(tile => {
  const chosen = Boolean(tile.discarded || tile.held || tile.placedTo || tile.starred);
  const matched = !tile.placedTo || (Boolean(tile.aboutSuspect) && tile.placedTo === tile.aboutSuspect);
  const correct = chosen && (tile.discarded ? tile.real === false : tile.real === true && matched);
  return { ...tile, chosen, correct };
 });
 const correct = clues.filter(t => t.correct).length;
 const chosen = clues.filter(t => t.chosen).length;
 const precision = fraction(correct, chosen);
 const coverage = fraction(correct, clues.length);
 // Harmonic mean: one correct guess cannot earn half the selection score.
 const score = precision + coverage ? 2 * precision * coverage / (precision + coverage) : 0;
 const placed = clues.filter(t => t.placedTo && !t.discarded);
 const matched = placed.filter(t => t.correct).length;
 return { clues, correct, chosen, precision, coverage, score,
  matched, placed: placed.length, strong: score >= .6,
  note: `${correct} of ${chosen} decisions correct · ${chosen} of ${clues.length} clues decided` };
}

export function scoreReasoning(questions = [], answers = {}, records = []) {
 // Support groups describe actual case relationships. Merely mentioning a
 // named suspect (or starring fabricated/discarded evidence) earns no credit.
 const stars = unique(records).filter(t => t.starred && !t.discarded);
 const admissible = stars.filter(t => t.real === true && (!t.placedTo || t.placedTo === t.aboutSuspect));
 const ids = new Set(admissible.map(t => t.evidenceId || t.id));
 const claims = questions.filter(q => q.supportGroups?.length).map(q => ({
  key: q.key, text: q.text,
  supported: answers[q.key] === q.answer && q.supportGroups.every(group => group.some(id => ids.has(id)))
 }));
 const supported = claims.filter(q => q.supported).length;
 const coverage = fraction(supported, claims.length);
 const relevantIds = new Set(questions.filter(q => answers[q.key] === q.answer).flatMap(q => (q.supportGroups || []).flat()));
 const relevant = admissible.filter(t => relevantIds.has(t.evidenceId || t.id)).length;
 const precision = fraction(relevant, stars.length);
 const score = coverage * precision;
 return { claims, supported, starred: stars.length, score, strong: score >= .6,
  note: `${supported} of ${claims.length} evidence-backed claims supported · ${relevant} of ${stars.length} stars relevant and genuine` };
}

export function scoreTime(elapsed = 0, limit = null, timedOut = false) {
 const seconds = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
 if (!Number.isFinite(limit) || limit <= 0) return {label:'Untimed',note:'The timer was off; speed does not change the score.'};
 if (timedOut) return {label:'Out of time',note:'The clock ran out; submitted choices are still evaluated.'};
 const used = fraction(seconds, limit);
 return {label:used <= .6 ? 'Quick' : used <= .9 ? 'Steady' : 'Just in time', note:`${pct(used)} of the time used; speed does not change the score.`};
}

function profileFor(outcome, selection, reasoning) {
 if (outcome.correct && selection.strong && reasoning.strong) return {title:'Sharp Investigator',text:'Your conclusions, evidence choices, and starred support agree with the case.'};
 if (outcome.correct && !reasoning.strong) return {title:'Correct conclusions, support to strengthen',text:'Your answers are correct. Star the specific evidence that supports each claim to make your reasoning visible.'};
 if (!outcome.correct && selection.strong) return {title:'Good evidence, theory to revisit',text:'You made strong evidence choices. Compare your final answers with the timeline to find the missing connections.'};
 if (outcome.correct) return {title:'Focused Investigator',text:'Your theory and supporting evidence are strong. Reviewing more of the board would strengthen the overall investigation.'};
 return {title:'Investigation in progress',text:'Review the undecided and incorrect choices below, then compare the two uploads and Ethan’s alibi.'};
}

export function evaluate({ records = [], questions = [], answers = {}, elapsed = 0, limit = null, timedOut = false } = {}) {
 const outcome = scoreOutcome(questions, answers);
 const selection = scoreSelection(records);
 const reasoning = scoreReasoning(questions, answers, records);
 const time = scoreTime(elapsed, limit, timedOut);
 const overall = Math.round(100 * (.4 * outcome.score + .4 * selection.score + .2 * reasoning.score));
 return { overall, profile:profileFor(outcome,selection,reasoning), outcome, selection, reasoning, time,
  measures:[
   {name:'Outcome Accuracy',label:pct(outcome.score),note:outcome.note},
   {name:'Evidence Selection',label:pct(selection.score),note:selection.note},
   {name:'Reasoning Coherence',label:pct(reasoning.score),note:reasoning.note},
   {name:'Time',label:time.label,note:time.note}
  ] };
}
