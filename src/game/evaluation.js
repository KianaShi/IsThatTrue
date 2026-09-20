// End-of-case evaluation: scores a finished run on four measures and maps
// the result onto a candidate profile. Pure functions, no DOM, so the rules
// live in one place. Shown only after the case ends, never during play.

const RELEVANT = new Set(['critical', 'high']);
const STRONG = 0.6;

/**
 * Outcome Accuracy: did the player reach the correct conclusion?
 * @param {Array<{key: string, answer: string}>} questions - The accusation questions.
 * @param {Object<string, string|null>} answers - The player's answer per question key.
 * @returns {{score: number, correct: boolean, note: string}} Fraction right; `correct` only if every answer is.
 */
export function scoreOutcome(questions, answers) {
	const right = questions.filter(q => answers[q.key] === q.answer).length;
	const score = right / questions.length;
	return { score, correct: right === questions.length, note: `${right} of ${questions.length} answers correct` };
}

/**
 * Evidence Selection Quality: of the evidence the player put on the board,
 * how much was truly relevant (precision), and how much of the relevant
 * evidence did they find (recall)? The score is the average of the two.
 * @param {Array<object>} chosen - Deck tiles the player placed under a suspect.
 * @param {Array<object>} deck - The full deck.
 * @returns {{score: number, strong: boolean, note: string}}
 */
export function scoreSelection(chosen, deck) {
	const totalRelevant = deck.filter(t => RELEVANT.has(t.relevance)).length;
	const hits = chosen.filter(t => RELEVANT.has(t.relevance)).length;
	const precision = chosen.length ? hits / chosen.length : 0;
	const recall = totalRelevant ? hits / totalRelevant : 0;
	const score = (precision + recall) / 2;
	return { score, strong: score >= STRONG, note: `${hits} of ${chosen.length} chosen were relevant · ${hits} of ${totalRelevant} relevant found` };
}

/**
 * Reasoning Coherence: given the evidence the player placed, does their
 * conclusion follow from it? Each accused suspect is compared with the
 * suspect who carries the most placed evidence.
 * @param {Array<{key: string}>} questions - The accusation questions.
 * @param {Object<string, string|null>} answers - The player's answer per question key.
 * @param {Object<string, Array>} assignments - Placed evidence per suspect key.
 * @returns {{score: number, strong: boolean, note: string}}
 */
export function scoreReasoning(questions, answers, assignments) {
	const counts = Object.fromEntries(Object.entries(assignments).map(([k, v]) => [k, v.length]));
	const most = Math.max(0, ...Object.values(counts));
	const per = questions.map(q => (most && answers[q.key] ? (counts[answers[q.key]] || 0) / most : 0));
	const score = per.reduce((a, b) => a + b, 0) / questions.length;
	return { score, strong: score >= STRONG, note: most ? 'How well your answers match where you placed evidence' : 'No evidence was placed to reason from' };
}

/**
 * Time: quick enough?
 * @param {number} elapsed - Seconds spent.
 * @param {number|null} limit - Seconds allowed, or null when the timer was off.
 * @param {boolean} timedOut - True if the clock ran out.
 * @returns {{label: string, note: string}}
 */
export function scoreTime(elapsed, limit, timedOut) {
	if (limit === null) return { label: 'Untimed', note: 'The timer was off' };
	if (timedOut) return { label: 'Out of time', note: 'The clock ran out' };
	const used = elapsed / limit;
	return { label: used <= 0.6 ? 'Quick' : used <= 0.9 ? 'Steady' : 'Just in time', note: `${Math.round(used * 100)}% of the time used` };
}

const PROFILES = {
	'1-1-1': ['Sharp Investigator', 'The player identified the right information, reasoned from it coherently, and reached the correct conclusion.'],
	'0-0-1': ['Led Astray', 'The player focused on misleading or incomplete evidence, but their conclusion was logically consistent with the information they selected.'],
	'0-1-0': ['Missed the Connection', 'The player found the important evidence but failed to connect or interpret it correctly.'],
	'1-0-0': ['Lucky Guess', 'The player reached the correct answer with little supporting evidence, suggesting the result may have been partly intuitive or accidental.'],
	'1-0-1': ['Efficient Reasoner', 'The player built a coherent argument from a limited subset of evidence and still reached the correct conclusion.'],
	'0-1-1': ['Misled by Ambiguity', 'The player processed relevant evidence coherently but was ultimately misled by ambiguity or conflicting information.'],
	'1-1-0': ['Right Answer, Loose Argument', 'The player found the important evidence and reached the correct answer, but their board does not fully support the conclusion.'],
	'0-0-0': ['Back to Square One', 'The player neither found the key evidence nor built a consistent argument, and reached the wrong conclusion.']
};

/**
 * Score a finished run and pick its candidate profile.
 * @param {object} run
 * @param {Array} run.questions - Accusation questions.
 * @param {object} run.answers - Answers by question key.
 * @param {object} run.assignments - Placed evidence per suspect.
 * @param {Array} run.deck - Every deck tile.
 * @param {Array} run.chosen - Deck tiles the player placed.
 * @param {number} run.elapsed - Seconds spent.
 * @param {number|null} run.limit - Time limit, null if untimed.
 * @param {boolean} run.timedOut - Whether the clock ran out.
 * @returns {{accuracy: {right: number, total: number, percent: number}, measures: Array<{name: string, label: string, note: string}>, profile: {title: string, text: string}}}
 */
export function evaluate({ questions, answers, assignments, deck, chosen, elapsed, limit, timedOut }) {
	const outcome = scoreOutcome(questions, answers);
	const selection = scoreSelection(chosen, deck);
	const reasoning = scoreReasoning(questions, answers, assignments);
	const time = scoreTime(elapsed, limit, timedOut);
	const [title, text] = PROFILES[`${+outcome.correct}-${+selection.strong}-${+reasoning.strong}`];
	/** @param {{strong: boolean}} s - A scored measure. @returns {'Strong'|'Weak'} Its display grade. */
	const grade = s => (s.strong ? 'Strong' : 'Weak');
	const right = questions.filter(q => answers[q.key] === q.answer).length;
	return {
		accuracy: { right, total: questions.length, percent: Math.round(outcome.score * 100) },
		measures: [
			{ name: 'Outcome Accuracy', label: `${Math.round(outcome.score * 100)}%`, note: outcome.note },
			{ name: 'Evidence Selection', label: grade(selection), note: selection.note },
			{ name: 'Reasoning Coherence', label: grade(reasoning), note: reasoning.note },
			{ name: 'Time', label: time.label, note: time.note }
		],
		profile: { title, text }
	};
}
