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
		// `digLevels` are what surface, in order, each time the player spends a Dig In.
		// Deal order maps onto two ranks at the top and two at the bottom of the
		// board (like a real opening position), run through a scheduler so no
		// two board neighbours point at the same suspect — grouping one
		// suspect's evidence together gave the game away by position alone.
		deck: [
			{ id: "A1", kind: 'clue', label: "Launch Objection", real: true,
				relevance: "medium", redHerring: true,
				aboutSuspect: "ethan", connectsTo: ["B7", "F2", "B2"],
				text: "A senior researcher had voiced strong reservations about the launch timeline.",
				digLevels: [
					"Internal messages show the concerns were about safety results not being ready for public release.",
					"Ethan Cole proposed delaying the launch by at least two weeks, in a message sent to the whole leadership team.",
					"Leadership declined the delay in writing, so his objection is on record as overruled."
				] },
			{ id: "B1", kind: 'clue', label: "Coat Rack Sighting", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["C1", "G1", "H1"],
				text: "Someone was seen near the coat rack outside a restricted lab shortly before an unexpected entry.",
				digLevels: [
					"A colleague passing the lab entrance noticed a person lingering by the coat rack.",
					"Noah Reed was seen near the jacket rack at 11:26 PM, about six minutes after Ethan Cole walked out of the lab.",
					"No one else is recorded near that rack between 11:20 PM and the badge entry at 11:31 PM."
				] },
			{ id: "C1", kind: 'clue', label: "Lab Entry Record", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["B7", "G7", "F7"],
				text: "The building's access system logged an entry into a restricted lab late that night.",
				digLevels: [
					"The entry was logged against a staff badge credential at one of the lab's door readers.",
					"The record reads: Ethan Cole — Lab 3 — 11:31 PM. Facilities confirms the readers have no camera or biometric check.",
					"The swipe was logged as a normal authorized entry, with no failed attempt beforehand and no alarm."
				] },
			{ id: "D1", kind: 'clue', label: "Encoding Profile", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["G2", "A2"],
				text: "The two leaked videos were analyzed for differences in how they were encoded.",
				digLevels: [
					"The second video's added segment uses different encoding settings from the rest of the file.",
					"The profile matches a commercial video-editing application, not the format used for internal demo recordings.",
					"That application is installed on exactly one company device."
				] },
			{ id: "E1", kind: 'clue', label: "Upload Origin", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: null, connectsTo: ["G7", "H1"],
				text: "The first leaked video was uploaded from a network inside the building.",
				digLevels: [
					"Network records place the upload at 11:47 PM on Lab 3's network.",
					"Those records identify the location of the connection, not the person using it.",
					"Lab 3's Wi-Fi range extends into the adjacent break room and stairwell, neither of which requires a badge."
				] },
			{ id: "F1", kind: 'clue', label: "Administrator Access", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: "avery", connectsTo: ["C2", "G8"],
				text: "Someone in the building holds administrator rights across most internal systems.",
				digLevels: [
					"A member of the security team has admin credentials for nearly every system involved.",
					"Avery Chen's admin credentials were not used on any Helix-related file, folder or system that night."
				] },
			{ id: "G1", kind: 'clue', label: "Lost Badge Report", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["C1", "B1"],
				text: "A staff member later reported a missing access badge.",
				digLevels: [
					"The report says the badge was last seen in a jacket left near a lab entrance earlier that evening.",
					"Ethan Cole filed it with the security team at 11:56 PM, three minutes after his video call ended.",
					"The report came before security had asked anyone to account for their badge."
				] },
			{ id: "H1", kind: 'clue', label: "Storage Device", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["E1", "H7"],
				text: "A small storage device turned up during a search of personal belongings.",
				digLevels: [
					"It holds traces of the same file structure as the Helix demo folder.",
					"File timestamps show the demo file was copied to it at 11:41 PM and removed at 11:48 PM.",
					"Serial records tie the device to equipment issued to Noah Reed."
				] },
			{ id: "A2", kind: 'clue', label: "Editing Software Trace", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["D1", "D7"],
				text: "A company laptop shows activity from a video-editing application around the time of the second upload.",
				digLevels: [
					"The application's autosave history shows a project file opened at 11:49 PM.",
					"The same project was exported at 11:53 PM, one minute before the second video appeared online.",
					"The laptop is Olivia Grant's company-issued device, and the application window matches the one named in the video's encoding metadata."
				] },
			{ id: "B2", kind: 'clue', label: "Anonymous Tip", real: false,
				relevance: "high", redHerring: true,
				aboutSuspect: "ethan", connectsTo: ["A1", "C1"],
				text: "An anonymous message circulating online claims to reveal who is behind the leak.",
				digLevels: [
					"It includes a screenshot of a chat message attributed to Ethan, in which he appears to admit to the leak.",
					"The screenshot's metadata shows it was created and edited after the leak was already spreading, and the username in it matches none of Ethan's registered accounts."
				] },
			{ id: "C2", kind: 'clue', label: "Security Warning", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["C1", "E8"],
				text: "A written warning about the building's identity and access systems was filed before the incident.",
				digLevels: [
					"It was filed eleven days before the leak and describes the systems as insecure.",
					"Avery Chen's warning specifically mentions badge sharing and unattended authenticated workstations.",
					"The scenario it describes matches how a badge and a logged-in workstation were used in Lab 3 that night."
				] },
			{ id: "D2", kind: 'clue', label: "Lab Temperature Log", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "The building's environmental system logged a change in one of the labs around midnight.",
				digLevels: [
					"Facilities data shows Lab 3 cooled by four degrees starting at 11:40 PM, and maintenance lists a scheduled nightly cycle for that zone at the same time."
				] },
			{ id: "E2", kind: 'clue', label: "Exit Swipe", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["B1", "C7"],
				text: "A badge record shows someone leaving the building earlier that evening.",
				digLevels: [
					"The exit was logged on a contractor badge, and the system shows no later entry on that badge.",
					"It was Noah Reed's badge, logged at 9:58 PM, nearly two hours before the leak.",
					"The loading-dock door has no individual badge reader, so a return through it would leave no badge record."
				] },
			{ id: "F2", kind: 'clue', label: "Call Participants", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["B7", "C1", "G7"],
				text: "Several colleagues joined a late-night video call with an outside research group.",
				digLevels: [
					"Participants say one of the researchers was visibly on camera for most of the meeting.",
					"Two colleagues recall Ethan Cole answering a direct question at 11:38 PM.",
					"One adds that the exchange ran into the next minute, the same minute the Helix folder was accessed from Lab 3."
				] },
			{ id: "G2", kind: 'clue', label: "Extra Clip", real: false,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["F8", "D1"],
				text: "The second video contains a short clip showing the model giving an unsafe response.",
				digLevels: [
					"The clip does not appear anywhere in the original internal demo recording.",
					"Engineers who ran the original demo say the model never produced that response in any recorded session.",
					"Frame and audio analysis show the clip was inserted into the file after the rest of the video had been assembled."
				] },
			{ id: "H2", kind: 'clue', label: "Priority Ticket", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["C2"],
				text: "A support ticket about unusual login behavior was opened a few days before the incident.",
				digLevels: [
					"The ticket, opened three days before the leak, reports suspicious badge-sharing behavior.",
					"Avery Chen filed it, and management marked it 'low priority, revisit next quarter.'"
				] },
			{ id: "A7", kind: 'clue', label: "Contract Status", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["B1", "H1"],
				text: "One of the people in the building that night had recently received difficult news about their employment.",
				digLevels: [
					"A temporary contractor was told his contract would not be renewed after the launch.",
					"Noah Reed had also been turned down for a permanent position a few weeks earlier.",
					"In a message to a colleague, he complained that his work on Helix would be presented without crediting him."
				] },
			{ id: "B7", kind: 'clue', label: "Meeting Log", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["C1", "F2"],
				text: "The company's meeting platform holds a record of a video call that ran through the time of the incident.",
				digLevels: [
					"The platform shows one participant joined from a conference room on a different floor.",
					"Ethan Cole joined at 11:24 PM and stayed connected until about 11:53 PM.",
					"The connection log shows no drops and no rejoins across those 29 minutes."
				] },
			{ id: "C7", kind: 'clue', label: "Loading Dock Footage", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["E2", "B1"],
				text: "Camera footage from the loading area shows a figure entering the building.",
				digLevels: [
					"The figure came in at 11:09 PM behind another employee who held open a door that needs no individual badge.",
					"Clothing and build are consistent with Noah Reed, but the face is only partly visible.",
					"The figure carries a bag similar in size and shape to one later found among Noah's belongings."
				] },
			{ id: "D7", kind: 'clue', label: "External Upload Session", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["F8", "A2"],
				text: "Network records show a company device connecting to an outside file-sharing service late that night.",
				digLevels: [
					"The connection opened shortly before 11:54 PM, not in the window around the first upload at 11:47 PM.",
					"The session matches the file-sharing service the second video was posted through, down to the session ID range.",
					"The device is registered to Olivia Grant and was still uploading at 11:54 PM."
				] },
			{ id: "E7", kind: 'clue', label: "Logging Infrastructure", real: true,
				relevance: "low", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["F1", "C2"],
				text: "Most of the night's records come from a single logging system.",
				digLevels: [
					"The security engineer configured and maintains the logging infrastructure behind every log used in this review.",
					"An independent cross-check of the logs found no tampering and no gaps around her own account."
				] },
			{ id: "F7", kind: 'clue', label: "Hallway Camera", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: null, connectsTo: ["C1", "G7"],
				text: "Security footage shows a person entering a hallway near the lab.",
				digLevels: [
					"The clip is timestamped 11:33 PM, two minutes after the lab entry record.",
					"The person wears a dark company hoodie, the same style Ethan Cole and several other staff own.",
					"The camera never captures a clear view of the face."
				] },
			{ id: "G7", kind: 'clue', label: "Folder Access Log", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["E1", "E8"],
				text: "The confidential demo folder was opened from a lab workstation during the evening.",
				digLevels: [
					"The log attributes the access to a user account, with no fresh login event.",
					"Ethan Cole's account accessed the Helix folder at 11:39 PM, and no password was entered at that time.",
					"The workstation's session had already been active for more than an hour before the access."
				] },
			{ id: "H7", kind: 'clue', label: "First Video Comparison", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["H1", "F8"],
				text: "The first leaked video was compared against the company's internal demo recording.",
				digLevels: [
					"The comparison finds no added or removed clips.",
					"Compression artifacts and audio levels match the internal master file in every section.",
					"The file's metadata shows it was copied from the internal demo shortly before the 11:47 PM upload."
				] },
			{ id: "A8", kind: 'clue', label: "Launch Pressure", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["A2", "D7"],
				text: "One team member pushed hard to keep the launch on schedule.",
				digLevels: [
					"Internal messages show concern that a delay would put a major partnership at risk.",
					"Olivia Grant wrote that a delay 'could cost us the partnership entirely,' three days before the leak.",
					"In the same thread she argued that the open safety findings could be addressed after release."
				] },
			{ id: "B8", kind: 'clue', label: "First Alert", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["E1", "C2"],
				text: "An automated alert about unusual outbound traffic was raised that night.",
				digLevels: [
					"The alert fired at 11:49 PM and was picked up first by the security team's monitoring account.",
					"Avery Chen escalated it to her manager within two minutes of the alert.",
					"That was before the video began spreading widely online."
				] },
			{ id: "C8", kind: 'clue', label: "Upload Accounts", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["H7", "F8", "D1"],
				text: "Both leaked videos were posted anonymously through public file-sharing services.",
				digLevels: [
					"The two uploads came from different accounts, each created within the hour before posting.",
					"They were sent from different networks: the first from Lab 3's network, the second from a device elsewhere in the building.",
					"No login, device or network detail is shared between the two uploads."
				] },
			{ id: "D8", kind: 'clue', label: "Older Security Report", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: "avery", connectsTo: [],
				text: "An older security incident report appeared in the same system logs pulled for this review.",
				digLevels: [
					"It describes a badge-cloning incident from six months earlier.",
					"The security team handled it and closed it at the time, and the employee involved has since left the company."
				] },
			{ id: "E8", kind: 'clue', label: "Open Workstation", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["G7", "B1"],
				text: "A shared lab workstation was left in an active session that evening.",
				digLevels: [
					"The machine's session timeout is set to 60 minutes, longer than most machines that handle confidential files.",
					"The session was opened under Ethan Cole's account before he left for his call.",
					"With the session already authenticated, anyone sitting down there could open Helix files without a password."
				] },
			{ id: "F8", kind: 'clue', label: "Second Upload", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["H7", "G2"],
				text: "A second version of the leaked video appeared online a few minutes after the first.",
				digLevels: [
					"The second file contains an additional segment that is not in the original upload.",
					"The added segment runs 47 seconds and shows an unsafe model response.",
					"Adding it required a copy of the leaked file and editing tools within the seven minutes after the first upload."
				] },
			{ id: "G8", kind: 'clue', label: "Third-Floor Activity", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["F1", "C2"],
				text: "Badge and login records show credential activity on a different floor throughout the incident window.",
				digLevels: [
					"Badge logs show a security engineer's badge used at third-floor readers from 10 PM until after midnight.",
					"Avery Chen's login sessions in that period match routine end-of-day security patch work.",
					"None of her recorded badge or login activity overlaps with the Lab 3 entry at 11:31 PM or the folder access at 11:39 PM."
				] },
			{ id: "H8", kind: 'clue', label: "Visitor Badge", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "A one-day visitor badge was issued earlier that day.",
				digLevels: [
					"Front desk logs show it was issued at 2 PM to an outside vendor for a scheduled equipment demo.",
					"The visitor signed out at 5:30 PM, when the badge was deactivated, and it shows no activity afterward."
				] }
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
	(story.deck || [
		...story.clues.map(text => ({ kind: 'clue', label: 'Evidence', real: true, text })),
		...DECOYS
	]).map(tile => ({ ...tile, digLevels: [...(tile.digLevels || [])], connectsTo: [...(tile.connectsTo || [])] }));

export const fmt = seconds => {
	const total = Math.max(0, Math.ceil(seconds));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
