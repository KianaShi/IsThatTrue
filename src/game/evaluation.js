// End-of-case evaluation: scores a finished run on four measures and maps
// the result onto a candidate profile. Pure functions, no DOM, so the rules
// live in one place. Shown only after the case ends, never during play.

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
 * Evidence Selection: how much of the evidence was matched. A piece matches when
 * the player put it in a slot under the suspect it is about. The score averages
 * how many of the placed pieces matched (precision) with how much of the board
 * that could be matched was covered (recall, capped by the number of slots).
 * @param {Array<{tile: object, suspect: string}>} placed - Every piece under a suspect, with that suspect's key.
 * @param {Array<object>} deck - The full deck.
 * @param {number} slots - Total slots across all suspects.
 * @returns {{score: number, strong: boolean, note: string}}
 */
export function scoreSelection(placed, deck, slots) {
	const matchable = Math.min(slots, deck.filter(t => t.aboutSuspect).length);
	const matched = placed.filter(p => p.tile.aboutSuspect === p.suspect).length;
	const precision = placed.length ? matched / placed.length : 0;
	const recall = matchable ? matched / matchable : 0;
	const score = (precision + recall) / 2;
	return { score, strong: score >= STRONG, note: `${matched} of ${placed.length} placed sat under the right suspect · ${matched} of ${matchable} slots matched` };
}

/**
 * Reasoning Coherence: do the starred pieces point at the suspects the player
 * named in their answers? Each starred piece counts when it is about one of the
 * answered suspects, so a wrong answer can still be coherent with what was starred.
 * @param {Array<{key: string}>} questions - The accusation questions.
 * @param {Object<string, string|null>} answers - The player's answer per question key.
 * @param {Array<object>} starred - The deck tiles the player starred.
 * @returns {{score: number, strong: boolean, note: string}}
 */
export function scoreReasoning(questions, answers, starred) {
	const named = new Set(questions.map(q => answers[q.key]).filter(Boolean));
	const linked = starred.filter(t => named.has(t.aboutSuspect)).length;
	const score = starred.length ? linked / starred.length : 0;
	return { score, strong: score >= STRONG, note: starred.length ? `${linked} of ${starred.length} starred point to the suspects you named` : 'Nothing was starred' };
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
 * Score a finished run and pick its candidate profile. The overall percentage is
 * the mean of three scores: answers correct, evidence matched to the right
 * suspect, and starred evidence that points at the suspects named.
 * @param {object} run
 * @param {Array} run.questions - Accusation questions.
 * @param {object} run.answers - Answers by question key.
 * @param {Array<{tile: object, suspect: string}>} run.placed - Every piece under a suspect, with that suspect's key.
 * @param {Array<object>} run.starred - The deck tiles the player starred.
 * @param {Array} run.deck - Every deck tile.
 * @param {number} run.slots - Total slots across all suspects.
 * @param {number} run.elapsed - Seconds spent.
 * @param {number|null} run.limit - Time limit, null if untimed.
 * @param {boolean} run.timedOut - Whether the clock ran out.
 * @returns {{overall: number, measures: Array<{name: string, label: string, note: string}>, profile: {title: string, text: string}}}
 */
export function evaluate({ questions, answers, placed, starred, deck, slots, elapsed, limit, timedOut }) {
	const outcome = scoreOutcome(questions, answers);
	const selection = scoreSelection(placed, deck, slots);
	const reasoning = scoreReasoning(questions, answers, starred);
	const time = scoreTime(elapsed, limit, timedOut);
	const [title, text] = PROFILES[`${+outcome.correct}-${+selection.strong}-${+reasoning.strong}`];
	/** @param {{score: number}} s - A scored measure. @returns {string} Its score as a percentage. */
	const pct = s => `${Math.round(s.score * 100)}%`;
	return {
		overall: Math.round((outcome.score + selection.score + reasoning.score) / 3 * 100),
		measures: [
			{ name: 'Outcome Accuracy', label: pct(outcome), note: outcome.note },
			{ name: 'Evidence Selection', label: pct(selection), note: selection.note },
			{ name: 'Reasoning Coherence', label: pct(reasoning), note: reasoning.note },
			{ name: 'Time', label: time.label, note: time.note }
		],
		profile: { title, text }
	};
}
