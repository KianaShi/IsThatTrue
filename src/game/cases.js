// Case files and difficulty contracts. Pure data — the menu, the briefing
// screen and the result screen all read from here.

export const STORIES = {
	s1: {
		label: 'Story 1',
		name: 'The Leak',
		victim: 'Project Helix — the company’s best-kept secret',
		teaser: 'Project Helix — the company’s best-kept secret — just leaked. Demo footage. Eval results. Safety findings nobody outside the building was supposed to see.',
		brief: {
			where: 'Helix AI — a small AI company’s headquarters. The leak came from inside the building.',
			when: '11:47 PM — less than twelve hours before the Project Helix launch event, tomorrow morning.',
			paragraphs: [
				'Tomorrow morning, a small AI company is set to unveil Project Helix, a highly confidential new AI model.',
				'At 11:47 PM, less than twelve hours before the launch, a private demonstration video containing unreleased capabilities, internal evaluation results, and serious safety concerns suddenly appeared online.',
				'The leak appears to have come from inside the company. Four employees were still connected to the building that night.'
			],
			suspectsNote: 'The initial digital evidence seems to point strongly toward one person. But as the investigation unfolds, some evidence may not mean what it first appears to mean.',
			suspects: [
				{ name: 'Ethan Cole', role: 'Research Scientist', img: './assets/ethan-cole.jpg', note: 'Built Helix’s core model. Fought hardest over the safety findings.' },
				{ name: 'Avery Chen', role: 'Security Engineer', img: './assets/avery-chen.jpg', note: 'Holds the keys to every log, badge reader and camera in the building.' },
				{ name: 'Olivia Grant', role: 'Product Manager', img: './assets/olivia-grant.jpg', note: 'Owns tomorrow’s launch. A leak could sink it — or supercharge it.' },
				{ name: 'Noah Reed', role: 'Temporary Contractor', img: './assets/noah-reed.jpg', note: 'Two weeks into the job. The easiest person in the building to frame.' }
			],
			mission: [
				'Who leaked the original video?',
				'And if new evidence changes the story — what is true, what is misleading, and who can you trust?'
			],
			mechanics: 'You have 5 minutes. Every piece of information costs time and attention. Choose carefully what you Dig In, Hold, or Discard.'
		},
		clues: [
			'The export log — 4.2 GB pulled to an external drive at 21:47.',
			'A badge swiped into the Helix lab by someone who “left at six”.',
			'Demo footage cached on a machine that shouldn’t have access.',
			'An unsent draft: “They need to see the safety findings.”',
			'A printer log — one page, sent at 21:52, never collected.',
			'The camera gap: eleven minutes, one floor, no footage.'
		],
		// The board deck: each square holds one piece of evidence. `real` marks
		// whether the underlying fact is genuine (it can still be misleading).
		// `digText` is what surfaces when the player spends a Dig In on it.
		deck: [
			{ id: 'E01', kind: 'clue', label: "Ethan's Objection", real: true,
				relevance: 'medium', aboutSuspect: 'ethan', connectsTo: ['E08'],
				text: 'Ethan opposed the Project Helix launch and wanted it delayed.',
				digText: 'Internal messages show Ethan repeatedly raised safety concerns about releasing the model too early. True, but motive alone proves nothing.' },
			{ id: 'E02', kind: 'clue', label: 'Badge Swipe — Lab 3', real: true,
				relevance: 'critical', aboutSuspect: 'ethan', connectsTo: ['E08'],
				text: "Ethan's badge entered Lab 3 at 11:31 PM.",
				digText: 'The access system records the credential used, not the identity of the person carrying it. True, but misleading.' },
			{ id: 'E08', kind: 'clue', label: "Ethan's Alibi", real: true,
				relevance: 'critical', aboutSuspect: 'ethan', connectsTo: ['E01', 'E02'],
				text: 'Ethan says he was on a video call during the incident.',
				digText: 'Meeting records show Ethan joined at 11:24 PM and remained connected until about 11:53 PM.' },
			{ id: 'E13', kind: 'clue', label: "Noah's Storage Device", real: true,
				relevance: 'critical', aboutSuspect: 'noah', connectsTo: ['E15'],
				text: 'A temporary storage device associated with Noah contains traces of the Helix file structure.',
				digText: 'File timestamps are consistent with the period immediately before the 11:47 PM upload.' },
			{ id: 'E15', kind: 'clue', label: 'Exit Badge Record', real: true,
				relevance: 'high', aboutSuspect: 'noah', connectsTo: ['E13'],
				text: "Noah's contractor badge indicates that he had already left the building.",
				digText: 'His own badge was used to exit, but a loading-dock camera suggests he later re-entered behind another employee. True record, misleading conclusion.' },
			{ id: 'E20', kind: 'clue', label: "Olivia's Laptop", real: true,
				relevance: 'critical', aboutSuspect: 'olivia', connectsTo: ['E22'],
				text: "Olivia's laptop contains the editing environment consistent with the altered video.",
				digText: 'Software activity shows editing shortly before the second, 11:54 PM upload.' },
			{ id: 'E22', kind: 'clue', label: "Olivia's Motive", real: true,
				relevance: 'medium', aboutSuspect: 'olivia', connectsTo: ['E20'],
				text: 'Olivia strongly wanted the product launch to continue.',
				digText: 'Internal messages show she feared a delay would jeopardize a major launch and partnership.' },
			{ id: 'E23', kind: 'clue', label: "Avery's Access Level", real: true,
				relevance: 'low', aboutSuspect: 'avery', connectsTo: [],
				text: 'Avery had administrator access to almost every system involved.',
				digText: 'No logs show Avery using privileged access during the relevant period. True, but low relevance.' }
		]
	},
	s2: {
		label: 'Story 2',
		name: 'The Silent Clearing',
		victim: 'Mira Voss — cartographer of the northern passes',
		teaser: 'Her map was left on the stone table. One landmark was crossed out in red.',
		briefing: 'Mira crossed the clearing alone, against advice, carrying the only true map of the passes. By morning the map was still here. She was not.',
		clues: [
			'A compass needle, snapped clean off.',
			'Charcoal marks on the stone — a map redrawn in haste.',
			'A red wax seal, crushed underfoot.',
			'Three silver buttons in a line toward the treeline.',
			'Her satchel strap — cut, not torn.',
			'A letter unsent: “I know what the map hides.”'
		]
	},
	s3: {
		label: 'Story 3',
		name: 'Blood on the Snow',
		victim: 'A traveller with no name and no tracks',
		teaser: 'No tracks lead in. None lead out. Yet someone was here, waiting.',
		briefing: 'Six lanterns burned that night; by morning two were out, and a stranger lay between them. Whoever did this knew the clearing better than the people who built it.',
		clues: [
			'A bloodied scarf, hidden inside the lantern cage.',
			'Two sets of prints entered. Only one ever left.',
			'A pocket watch, stopped at 2:40.',
			'An invitation card — unsigned, its edge singed.',
			'Candle wax pooled far from any lantern.',
			'A revolver, one chamber empty, frozen to the stone.'
		]
	}
};

export const LEVELS = {
	easy:   { label: 'Easy',   clues: 3, time: 300, note: 'A stroll through the snow' },
	medium: { label: 'Medium', clues: 4, time: 240, note: 'The trail is warm' },
	hard:   { label: 'Hard',   clues: 5, time: 180, note: 'The snow keeps its secrets' },
	hell:   { label: 'Hell',   clues: 6, time: 120, note: 'No mercy. No mistakes.', subtle: true }
};

// Decoy tiles used to pad a deck when a story ships only raw clue strings.
// They waste the detective's time — that is their whole job.
const DECOYS = [
	{ kind: 'false', label: 'Torn Ticket',
		text: 'A train stub from three winters ago. Old paper, older alibi.' },
	{ kind: 'false', label: 'Dropped Glove',
		text: 'Left-handed, well worn. Every suspect is right-handed — or wants you to think so.' },
	{ kind: 'false', label: 'Scorch Mark',
		text: 'The frost is burned black here. A prank from last week’s bonfire, most likely.' },
	{ kind: 'false', label: 'Anonymous Note',
		text: '“Look at the quiet one.” No signature, no date, no help.' }
];

// Build the playable board deck for a story. A hand-authored `deck` is used
// as-is; a story with only raw clue strings gets each clue dealt as a real
// tile plus a handful of decoys to keep the board dangerous.
export const buildDeck = story =>
	story.deck || [
		...story.clues.map(text => ({ kind: 'clue', label: 'Evidence', real: true, text })),
		...DECOYS
	];

export const fmt = seconds => {
	const total = Math.max(0, Math.ceil(seconds));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
