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
		// Deal order doubles as board position (row-major), so it's been run
		// through a scheduler that spreads each suspect's evidence across the
		// board — the original chronological/grouped order made it obvious
		// who a whole region of the board pointed to before reading a clue.
		deck: [
			{ id: "A1", kind: 'clue', label: "Anonymous Tip", real: false,
				relevance: "high", redHerring: true,
				aboutSuspect: "ethan", connectsTo: ["E4", "H3"],
				text: "An anonymous tip claimed Ethan bragged about the leak in a private chat.",
				digText: "A screenshot circulated online showing a chat message attributed to Ethan admitting to the leak." },
			{ id: "B1", kind: 'clue', label: "Contractor's Storage Device", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["F2", "D3"],
				text: "A temporary storage device found among a contractor's belongings contains traces of the Helix file structure.",
				digText: "File timestamps are consistent with the period immediately before the 11:47 PM upload." },
			{ id: "C1", kind: 'clue', label: "Video Call Witnesses", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["B2", "E1", "C3"],
				text: "Ethan was visibly present on the video call.",
				digText: "Multiple participants confirm seeing and speaking with him during the period when Lab 3 was accessed." },
			{ id: "D1", kind: 'clue', label: "The Second Video", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["D3", "G4"],
				text: "A second version of the leaked video appeared online at 11:54 PM.",
				digText: "The second file contains an additional segment not present in the original upload." },
			{ id: "E1", kind: 'clue', label: "Badge Swipe — Lab 3", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["B2", "G1"],
				text: "Ethan's badge entered Lab 3 at 11:31 PM.",
				digText: "The access system records the credential used, not the identity of the person carrying it." },
			{ id: "F1", kind: 'clue', label: "First to Escalate", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["F2", "H4"],
				text: "The security engineer was the one who discovered the leak had occurred and escalated it immediately.",
				digText: "Server monitoring alerts show Avery's account was first to flag anomalous outbound traffic at 11:49 PM." },
			{ id: "G1", kind: 'clue', label: "Missing Badge Report", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["E1", "A4"],
				text: "Ethan later reported that his badge had been missing.",
				digText: "Ethan last remembers having it before leaving Lab 3 earlier that evening." },
			{ id: "H1", kind: 'clue', label: "Recording Rumor", real: false,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "A rumor circulated that someone had been secretly recording internal meetings for weeks.",
				digText: "Two employees mention hearing this rumor in the days before the leak." },
			{ id: "A2", kind: 'clue', label: "Unlocked Workstation", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["C3", "A4"],
				text: "The Lab 3 workstation remained logged into Ethan's account after Ethan left.",
				digText: "Someone could access Project Helix without knowing Ethan's password." },
			{ id: "B2", kind: 'clue', label: "Ethan's Alibi", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["E1", "C1"],
				text: "Ethan says he was on a video call during the incident.",
				digText: "Meeting records show Ethan joined at 11:24 PM and remained connected until about 11:53 PM." },
			{ id: "C2", kind: 'clue', label: "Olivia's Laptop", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["E3", "B4"],
				text: "Olivia's laptop contains the editing environment consistent with the altered video.",
				digText: "Software activity shows editing shortly before the second upload." },
			{ id: "D2", kind: 'clue', label: "Avery's Own Logs", real: true,
				relevance: "low", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["F3", "H4"],
				text: "The security engineer's own system logs are the most complete record of the night, since she personally maintains the logging infrastructure.",
				digText: "As the security engineer, Avery configured and maintains every log referenced in this investigation." },
			{ id: "E2", kind: 'clue', label: "Unrelated Visitor Badge", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "A one-day visitor badge was issued earlier that day to an outside vendor unrelated to the four people still in the building.",
				digText: "Front desk logs show the visitor badge was issued at 2 PM for a scheduled equipment demo." },
			{ id: "F2", kind: 'clue', label: "Upload Origin", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["C3", "B1"],
				text: "The original leaked video was uploaded at 11:47 PM from Lab 3's network.",
				digText: "Network records identify the location of the connection, not the individual using it." },
			{ id: "G2", kind: 'clue', label: "Loading Dock Footage", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["F4", "A4"],
				text: "Loading-dock footage shows someone resembling Noah returning to the building.",
				digText: "Clothing and build are consistent with Noah, but the face is only partially visible." },
			{ id: "H2", kind: 'clue', label: "Olivia's Motive", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["C2", "B4"],
				text: "The product lead strongly wanted the launch to continue.",
				digText: "Internal messages show she feared a delay would jeopardize a major launch and partnership." },
			{ id: "A3", kind: 'clue', label: "Avery's Desk Logs", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["F3", "H4"],
				text: "Avery's badge and login activity that night were both located at her desk on a different floor.",
				digText: "Badge logs show Avery working from her own desk on the third floor from 10 PM until after midnight." },
			{ id: "B3", kind: 'clue', label: "Thermostat Quirk", real: false,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "The building's thermostat logged an unusual temperature drop in Lab 3 around midnight.",
				digText: "Facilities data shows the room cooled by four degrees starting at 11:40 PM." },
			{ id: "C3", kind: 'clue', label: "Folder Access Log", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["F2", "A2"],
				text: "Ethan's account accessed the confidential Project Helix folder at 11:39 PM.",
				digText: "No new password was entered. The workstation had already been logged into Ethan's account." },
			{ id: "D3", kind: 'clue', label: "File Match — Original", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["B1", "D1"],
				text: "The first leaked video matches the internal Helix demo.",
				digText: "File comparison shows no added clips or major modification before the first upload." },
			{ id: "E3", kind: 'clue', label: "Encoding Mismatch", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["G4", "C2"],
				text: "The second video uses different encoding settings from the first.",
				digText: "Metadata suggests the additional segment was edited on a different device shortly before 11:54 PM." },
			{ id: "F3", kind: 'clue', label: "Avery's Access Level", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: "avery", connectsTo: ["H4", "A3"],
				text: "The security engineer had administrator access to almost every system involved.",
				digText: "No logs show Avery using privileged access during the relevant period." },
			{ id: "G3", kind: 'clue', label: "Old Unrelated Incident", real: false,
				relevance: "low", redHerring: false,
				aboutSuspect: null, connectsTo: [],
				text: "An unrelated security incident from six months ago turned up in the same server logs.",
				digText: "The log viewer surfaces an entry from an old badge-cloning incident, unconnected to Project Helix." },
			{ id: "H3", kind: 'clue', label: "Ethan's Objection", real: true,
				relevance: "medium", redHerring: true,
				aboutSuspect: "ethan", connectsTo: ["B2", "C1", "A1"],
				text: "The lead researcher opposed the Project Helix launch and wanted it delayed.",
				digText: "Internal messages show Ethan repeatedly raised safety concerns about releasing the model too early." },
			{ id: "A4", kind: 'clue', label: "Noah's Opportunity", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["E1", "G1", "B1"],
				text: "Noah was near Ethan's belongings before the unauthorized Lab 3 entry.",
				digText: "Noah had an opportunity to take Ethan's badge before 11:31 PM." },
			{ id: "B4", kind: 'clue', label: "Olivia's Upload Trail", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["D1", "C2"],
				text: "Olivia's device connected to an external file-sharing service shortly before 11:54 PM.",
				digText: "The connection timing is consistent with the second upload, not the original 11:47 upload." },
			{ id: "C4", kind: 'clue', label: "Avery's Warning Ticket", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["H4"],
				text: "The security engineer flagged unusual login patterns days before the leak, but was told the issue was low priority.",
				digText: "An internal ticket shows Avery reported suspicious badge-sharing behavior three days before the incident." },
			{ id: "D4", kind: 'clue', label: "Same Source?", real: false,
				relevance: "critical", redHerring: false,
				aboutSuspect: null, connectsTo: ["D3", "D1", "E3"],
				text: "The two leaked videos probably came from the same person because they appeared seven minutes apart.",
				digText: "File structure, editing metadata, and upload behavior indicate two separate actions." },
			{ id: "E4", kind: 'clue', label: "The Converging Case", real: false,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["E1", "C3", "F2"],
				text: "Ethan's badge, account, and network location all independently point to Ethan.",
				digText: "All three signals could result from one person using Ethan's badge and already-authenticated workstation inside Lab 3." },
			{ id: "F4", kind: 'clue', label: "Exit Badge Record", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["A4", "G2"],
				text: "The contractor's badge indicates that he had already left the building.",
				digText: "His own badge was used to exit, but a loading-dock camera suggests he later re-entered behind another employee." },
			{ id: "G4", kind: 'clue', label: "The Extra Clip", real: false,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["D1", "E3"],
				text: "The additional unsafe-response clip appears to be part of Project Helix.",
				digText: "The clip does not exist anywhere in the original internal demo." },
			{ id: "H4", kind: 'clue', label: "Avery's Prior Warning", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["E1", "A2"],
				text: "The security engineer previously warned that the building's identity and access systems were insecure.",
				digText: "Her warnings specifically mention badge sharing and unattended authenticated workstations." },
			{ id: "A5", kind: 'clue', label: "Late-Night Delivery", real: false,
				relevance: "low", redHerring: false,
				aboutSuspect: null, connectsTo: [],
				text: "Someone ordered late-night food delivery to the building's side entrance at 11:15 PM.",
				digText: "A delivery service confirms a drop-off at the side entrance twenty minutes before the badge swipe." }
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
