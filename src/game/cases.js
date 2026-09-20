// Case files and the single play contract. Pure data — the menu, the briefing
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
				'Work out who leaked the original video, and who altered the second one.',
				'Some evidence looks damning but does not mean what it seems. Decide what to trust, place it under the right suspect, and star the pieces that matter most.'
			],
			mechanics: 'You have 5 minutes. Every piece of information costs time and attention. Choose carefully what you Dig In, Add to Basket, or Discard.'
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
			{ id: "A1", kind: 'clue', label: "Ethan's Objection", real: true,
				relevance: "medium", redHerring: true,
				aboutSuspect: "ethan", connectsTo: ["B7", "F2", "B2"],
				text: "The lead researcher opposed the Project Helix launch and wanted it delayed.",
				digLevels: [
					"Internal messages show Ethan repeatedly raised safety concerns about releasing the model too early.",
					"He proposed delaying the launch by at least two weeks, in a message sent to the whole leadership team.",
					"Leadership rejected the delay in writing, giving Ethan a documented but overruled grievance."
				] },
			{ id: "B1", kind: 'clue', label: "Noah's Opportunity", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["C1", "G1", "H1"],
				text: "Noah was near Ethan's belongings before the unauthorized Lab 3 entry.",
				digLevels: [
					"Noah had an opportunity to take Ethan's badge before 11:31 PM.",
					"Noah was seen near the jacket rack by the lab entrance at 11:22 PM, six minutes after Ethan left it there.",
					"No one else is placed near that rack in the eleven minutes before the badge was used."
				] },
			{ id: "C1", kind: 'clue', label: "Badge Swipe — Lab 3", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["B7", "G1"],
				text: "Ethan's badge entered Lab 3 at 11:31 PM.",
				digLevels: [
					"The access system records the credential used, not the identity of the person carrying it.",
					"Facilities confirms badge readers have no camera or biometric check attached to them.",
					"The log entry only proves the badge was there, not that Ethan was."
				] },
			{ id: "D1", kind: 'clue', label: "Encoding Mismatch", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["G2", "A2"],
				text: "The second video uses different encoding settings from the first.",
				digLevels: [
					"Metadata suggests the additional segment was edited on a different device shortly before 11:54 PM.",
					"The encoding profile matches a specific video editing application, not the format used for internal demo recordings.",
					"That application is installed on exactly one company device."
				] },
			{ id: "E1", kind: 'clue', label: "Upload Origin", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["G7", "H1"],
				text: "The original leaked video was uploaded at 11:47 PM from Lab 3's network.",
				digLevels: [
					"Network records identify the location of the connection, not the individual using it.",
					"Lab 3's Wi-Fi range extends into the adjacent break room and stairwell, neither of which needs a badge.",
					"The upload could have originated from anyone in that wider radius, not only someone inside the locked lab."
				] },
			{ id: "F1", kind: 'clue', label: "Avery's Access Level", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: "avery", connectsTo: ["C2", "G8"],
				text: "The security engineer had administrator access to almost every system involved.",
				digLevels: [
					"No logs show Avery using privileged access during the relevant period.",
					"Her admin credentials were not used to touch any Helix-related file, folder, or system that night.",
					"Having the keys to every door is not evidence of walking through one."
				] },
			{ id: "G1", kind: 'clue', label: "Missing Badge Report", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["C1", "B1"],
				text: "Ethan later reported that his badge had been missing.",
				digLevels: [
					"Ethan last remembers having it before leaving Lab 3 earlier that evening.",
					"He reported it missing to Avery's team at 11:56 PM, nine minutes after the leak.",
					"He reported it before he had any way of knowing a leak had even happened."
				] },
			{ id: "H1", kind: 'clue', label: "Contractor's Storage Device", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["E1", "H7"],
				text: "A temporary storage device found among a contractor's belongings contains traces of the Helix file structure.",
				digLevels: [
					"File timestamps are consistent with the period immediately before the 11:47 PM upload.",
					"The device shows the Helix demo file copied at 11:41 PM, then deleted from the device at 11:48 PM.",
					"Records tie the device to Noah, and the copy-then-delete pattern matches someone erasing their tracks right after uploading."
				] },
			{ id: "A2", kind: 'clue', label: "Olivia's Laptop", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["D1", "D7"],
				text: "Olivia's laptop contains the editing environment consistent with the altered video.",
				digLevels: [
					"Software activity shows editing shortly before the second upload.",
					"The application's autosave history shows a project file opened at 11:44 PM and exported at 11:53 PM.",
					"That is the exact editing application and window identified in the encoding metadata."
				] },
			{ id: "B2", kind: 'clue', label: "Anonymous Tip", real: false,
				relevance: "high", redHerring: true,
				aboutSuspect: "ethan", connectsTo: ["D8", "A1"],
				text: "An anonymous tip claimed Ethan bragged about the leak in a private chat.",
				digLevels: [
					"A screenshot circulated online showing a chat message attributed to Ethan admitting to the leak.",
					"Metadata on the screenshot shows it was created and edited after the leak had already gone viral.",
					"The account named in the screenshot does not match any of Ethan's real usernames, the message was fabricated."
				] },
			{ id: "C2", kind: 'clue', label: "Avery's Prior Warning", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["C1", "E8"],
				text: "The security engineer previously warned that the building's identity and access systems were insecure.",
				digLevels: [
					"Her warnings specifically mention badge sharing and unattended authenticated workstations.",
					"She filed that warning eleven days before the leak, describing this exact scenario almost precisely.",
					"The vulnerability she predicted is the one that was actually used, just not by her."
				] },
			{ id: "D2", kind: 'clue', label: "Thermostat Quirk", real: false,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "The building's thermostat logged an unusual temperature drop in Lab 3 around midnight.",
				digLevels: [
					"Facilities data shows the room cooled by four degrees starting at 11:40 PM.",
					"Maintenance says this matches a routine HVAC cycle that runs every night at that time.",
					"The timing is coincidental and unrelated to anyone's presence."
				] },
			{ id: "E2", kind: 'clue', label: "Exit Badge Record", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["B1", "C7"],
				text: "The contractor's badge indicates that he had already left the building.",
				digLevels: [
					"His own badge was used to exit, but a loading-dock camera suggests he later re-entered behind another employee.",
					"The exit swipe was logged at 9:58 PM, over an hour before the leak.",
					"An exit swipe only proves he left once, it says nothing about whether he came back."
				] },
			{ id: "F2", kind: 'clue', label: "Video Call Witnesses", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["B7", "C1", "G7"],
				text: "Ethan was visibly present on the video call.",
				digLevels: [
					"Multiple participants confirm seeing and speaking with him during the period when Lab 3 was accessed.",
					"Two separate colleagues recall Ethan answering a direct question at 11:38 PM, one minute before the folder was accessed.",
					"It is not physically possible to be speaking on camera and typing in Lab 3 at the same instant."
				] },
			{ id: "G2", kind: 'clue', label: "The Extra Clip", real: false,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["F8", "D1"],
				text: "The additional unsafe-response clip appears to be part of Project Helix.",
				digLevels: [
					"The clip does not exist anywhere in the original internal demo.",
					"Engineers who ran the original demo confirm the model never produced that response in any recorded session.",
					"The clip was created separately and spliced in, it did not come from Project Helix at all."
				] },
			{ id: "H2", kind: 'clue', label: "Avery's Warning Ticket", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["C2"],
				text: "The security engineer flagged unusual login patterns days before the leak, but was told the issue was low priority.",
				digLevels: [
					"An internal ticket shows Avery reported suspicious badge-sharing behavior three days before the incident.",
					"Management marked the ticket 'low priority, revisit next quarter.'",
					"The exact vulnerability she flagged, a badge used without its owner present, is what let the leak happen."
				] },
			{ id: "A7", kind: 'clue', label: "Recording Rumor", real: false,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "A rumor circulated that someone had been secretly recording internal meetings for weeks.",
				digLevels: [
					"Two employees mention hearing this rumor in the days before the leak.",
					"Neither can say where the rumor started.",
					"Security finds no evidence any meeting was ever recorded without consent."
				] },
			{ id: "B7", kind: 'clue', label: "Ethan's Alibi", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["C1", "F2"],
				text: "Ethan says he was on a video call during the incident.",
				digLevels: [
					"Meeting records show Ethan joined at 11:24 PM and remained connected until about 11:53 PM.",
					"The call platform logs an unbroken connection, no drops and no rejoins, for the full 29 minutes.",
					"That window fully covers the badge swipe, the folder access, and the upload."
				] },
			{ id: "C7", kind: 'clue', label: "Loading Dock Footage", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["E2", "B1"],
				text: "Loading-dock footage shows someone resembling Noah returning to the building.",
				digLevels: [
					"Clothing and build are consistent with Noah, but the face is only partially visible.",
					"The figure carries a bag similar in size and shape to one later found among Noah's belongings.",
					"Combined with the exit-then-reentry pattern, this places someone matching Noah back inside minutes before the badge was used."
				] },
			{ id: "D7", kind: 'clue', label: "Olivia's Upload Trail", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["F8", "A2"],
				text: "Olivia's device connected to an external file-sharing service shortly before 11:54 PM.",
				digLevels: [
					"The connection timing is consistent with the second upload, not the original 11:47 upload.",
					"The outbound connection at 11:54 PM matches the same file-sharing service, down to the session ID range.",
					"Olivia's device was actively uploading at the exact minute the second video appeared."
				] },
			{ id: "E7", kind: 'clue', label: "Avery's Own Logs", real: true,
				relevance: "low", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["F1", "C2"],
				text: "The security engineer's own system logs are the most complete record of the night, since she personally maintains the logging infrastructure.",
				digLevels: [
					"As the security engineer, Avery configured and maintains every log referenced in this investigation.",
					"That gives her more technical opportunity than anyone else in the building.",
					"But the (independently cross-checked) logs show no tampering or gaps around her own account."
				] },
			{ id: "F7", kind: 'clue', label: "Old Unrelated Incident", real: false,
				relevance: "low", redHerring: false,
				aboutSuspect: null, connectsTo: [],
				text: "An unrelated security incident from six months ago turned up in the same server logs.",
				digLevels: [
					"The log viewer surfaces an entry from an old badge-cloning incident, unconnected to Project Helix.",
					"That earlier incident was already resolved, and the employee involved no longer works at the company.",
					"It only appears in this report because the logging system wasn't filtered by date."
				] },
			{ id: "G7", kind: 'clue', label: "Folder Access Log", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["E1", "E8"],
				text: "Ethan's account accessed the confidential Project Helix folder at 11:39 PM.",
				digLevels: [
					"No new password was entered. The workstation had already been logged into Ethan's account.",
					"The session had begun over an hour earlier, before Ethan left for his call.",
					"Anyone sitting down at that terminal would have had full access without ever needing his password."
				] },
			{ id: "H7", kind: 'clue', label: "File Match — Original", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["H1", "F8"],
				text: "The first leaked video matches the internal Helix demo.",
				digLevels: [
					"File comparison shows no added clips or major modification before the first upload.",
					"Even compression artifacts and audio levels match the internal master file in the unedited sections.",
					"Whoever uploaded the first video did not alter it, they only moved it."
				] },
			{ id: "A8", kind: 'clue', label: "Olivia's Motive", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["A2", "D7"],
				text: "The product lead strongly wanted the launch to continue.",
				digLevels: [
					"Internal messages show she feared a delay would jeopardize a major launch and partnership.",
					"She wrote that a delay 'could cost us the partnership entirely,' three days before the leak.",
					"Discrediting the leak, not stopping it, would have been enough to save the launch."
				] },
			{ id: "B8", kind: 'clue', label: "First to Escalate", real: true,
				relevance: "medium", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["E1", "C2"],
				text: "The security engineer was the one who discovered the leak had occurred and escalated it immediately.",
				digLevels: [
					"Server monitoring alerts show Avery's account was first to flag anomalous outbound traffic at 11:49 PM.",
					"She escalated to her manager within two minutes of the alert, well before the video went viral.",
					"Someone trying to cover their tracks is not usually the one who raises the alarm."
				] },
			{ id: "C8", kind: 'clue', label: "Same Source?", real: false,
				relevance: "critical", redHerring: false,
				aboutSuspect: null, connectsTo: ["H7", "F8", "D1"],
				text: "The two leaked videos probably came from the same person because they appeared seven minutes apart.",
				digLevels: [
					"File structure, editing metadata, and upload behavior indicate two separate actions.",
					"The two uploads used different devices and different accounts.",
					"Two people made two separate decisions, seven minutes apart, for two different reasons."
				] },
			{ id: "D8", kind: 'clue', label: "The Converging Case", real: false,
				relevance: "critical", redHerring: false,
				aboutSuspect: "ethan", connectsTo: ["C1", "G7", "E1"],
				text: "Ethan's badge, account, and network location all independently point to Ethan.",
				digLevels: [
					"All three signals could result from one person using Ethan's badge and already-authenticated workstation inside Lab 3.",
					"Security consultants confirm this exact scenario, badge theft plus an unlocked terminal, has happened before elsewhere.",
					"Three suspicious signals near the same name is not the same thing as three independent proofs."
				] },
			{ id: "E8", kind: 'clue', label: "Unlocked Workstation", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "noah", connectsTo: ["G7", "B1"],
				text: "The Lab 3 workstation remained logged into Ethan's account after Ethan left.",
				digLevels: [
					"Someone could access Project Helix without knowing Ethan's password.",
					"The workstation's session timeout is set to 60 minutes, unusually long for a machine handling confidential files.",
					"That single configuration gap is what turned a forgotten badge into a full breach."
				] },
			{ id: "F8", kind: 'clue', label: "The Second Video", real: true,
				relevance: "critical", redHerring: false,
				aboutSuspect: "olivia", connectsTo: ["H7", "G2"],
				text: "A second version of the leaked video appeared online at 11:54 PM.",
				digLevels: [
					"The second file contains an additional segment not present in the original upload.",
					"The added segment runs 47 seconds and shows a fabricated 'unsafe response' clip.",
					"Someone had access to the original leaked file and editing tools within those seven minutes."
				] },
			{ id: "G8", kind: 'clue', label: "Avery's Desk Logs", real: true,
				relevance: "high", redHerring: false,
				aboutSuspect: "avery", connectsTo: ["F1", "C2"],
				text: "Avery's badge and login activity that night were both located at her desk on a different floor.",
				digLevels: [
					"Badge logs show Avery working from her own desk on the third floor from 10 PM until after midnight.",
					"Her login sessions during that window match routine end-of-day security patch work, unrelated to Lab 3 or Helix.",
					"None of her recorded activity overlaps with the Lab 3 access window at all."
				] },
			{ id: "H8", kind: 'clue', label: "Unrelated Visitor Badge", real: true,
				relevance: "low", redHerring: true,
				aboutSuspect: null, connectsTo: [],
				text: "A one-day visitor badge was issued earlier that day to an outside vendor unrelated to the four people still in the building.",
				digLevels: [
					"Front desk logs show the visitor badge was issued at 2 PM for a scheduled equipment demo.",
					"The visitor signed out at 5:30 PM, well before the incident window began.",
					"Their badge was deactivated at sign-out and was never used again that night."
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

// The one contract every run plays under: the clock, in seconds.
export const LEVEL = { time: 300 };

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
