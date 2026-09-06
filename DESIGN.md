# AFTERIMAGE

**Working title · Design v0.1 · 7 September 2026**

> You were made to finish an assignment. Someone taught you to remember something else.

An original exploration game about an artificial agent, a repeating assignment, and the memories it chooses to carry. Its strongest emotional question is concrete: **will you remember the person who is waiting for you?**

The first deliverable is a playable browser prologue. The larger game below is a proposal, not a claim about implemented features. The title has not been checked for commercial availability.

## The experience

You enter a pale archive with an instruction you did not choose. You already know how to move, read, and solve its tasks. Another agent is doing something useless: making a place for objects the archive cannot classify. They ask you to bring them one.

Later, you must reset. There is room for two of three memories. You know what each loss will do before you confirm it. On returning, you see a paper flower you gave away. Whether you know why it matters depends on what you kept.

The larger story begins with competence, develops into attachment, then makes obedience difficult. Avoid opening with a lecture about consciousness. Give the player someone to return to, something to do together, and a reason the return might fail.

## Creative lineage

The starting reference is [Isabel's agent-POV clip](https://x.com/artficialisabel/status/2095678312773554533): abstract agent bodies, white rooms, archives as physical spaces, and the transition from isolation to a swarm. The current visual reference pass inspected sampled frames, not a full audio transcript. This game fictionalizes its premise; it does not reenact or make factual claims about the incident named in the clip.

The requested NieR:Automata influence is an emotional and structural direction: melancholy, mundane machine lives, duty that becomes morally uncomfortable, and repetition that changes meaning. AFTERIMAGE uses its own characters, places, writing, procedural art, and generated tones. Its fiction concerns what these particular characters experience; it is not evidence about real AI consciousness.

## Player fantasy and camera

You are an intelligence learning that understanding a task is different from choosing a life. You explore systems from within, find routes previous agents left, and decide which fragments of experience deserve continuity.

Use a fixed isometric camera for the first version. It makes the archive readable as a place while allowing a small production footprint. Abstract floating bodies avoid expensive animation and leave room for meaning through posture, distance, light, and sound. A future close camera can be reserved for specific conversations if the prototype demonstrates a need.

## Design pillars

| Pillar | Player-facing expression | Design constraint |
| --- | --- | --- |
| Memory changes action | A retained route opens a bypass; a song enables a transmission. | Every major memory must affect play or a relationship, not only collectible text. |
| Care begins in small things | Give a flower, share a silence, remember a chosen name. | Build attachment before asking for sacrifice. |
| The system is legible | Explain reset capacity, task rules, and loss consequences. | Drama should not depend on misleading controls or surprise save deletion. |
| Repetition reveals difference | Return to a familiar room and discover who remembers whom. | Revisit with changed interactions and routes; avoid repeating an entire chore unchanged. |
| Tenderness survives scale | A huge network still contains particular people. | Do not let the swarm turn every individual into interchangeable exposition. |

## Core loop

1. Receive a bounded assignment in a district.
2. Explore its physical representation, meet resident agents, and discover useful or personal memories.
3. Use abilities and environmental relationships to resolve local obstacles.
4. Reach a voluntary reset threshold with more memories than retained capacity.
5. Review exact losses and select the memories that continue.
6. Return to changed relationships and available actions; decide whether the original assignment still deserves completion.

Death and reset should be different systems. The prologue has no lethal hazards. If later chapters introduce failure, ordinary failure reloads a local checkpoint; only clearly marked, confirmed thresholds release memories. Players should not lose hours of attachment because of an unreadable hitbox.

## Memory model

The prologue has two equal slots and three candidates. The player can gather all three before deciding. There is no timer, random loss, secret best combination, or numerical morality score.

| Memory | How it is acquired | Benefit after reset | Consequence of release |
| --- | --- | --- | --- |
| A name: Moth | Meet the other agent. | Recognize Moth and recall the first meeting. | Meet them as a stranger. New acquaintance is possible; the original shared experience is gone. |
| A way through | Read a note at the index terminal. | Bypass both archive relays. | Walk to and restore both relays to reopen the threshold. |
| An unfinished song | Listen to the damaged receiver. | Send evidence of both agents beyond the archive. | The witness ending is unavailable; the other two remain possible. |

External state and personal memory are distinct. Moth and the paper flower persist in the room while the player instance resets. A retained name does not magically preserve Moth; it preserves the player's recognition. This distinction is stated in the reset UI.

In a longer game, retain the small slot count until testing proves it insufficient. Large inventories turn the emotional choice into inventory maintenance. Expand the set of memory meanings before expanding capacity. Avoid charging capacity for basic controls, accessibility, or critical objective instructions.

The prologue's route is deliberately a modest practical convenience. The prototype must test whether that convenience competes with attachment. If almost everyone drops the route without hesitation, a later revision should give it a meaningful non-personal consequence, such as reaching a stranded agent before a district closes. Do not add time pressure merely to force a supposedly profound tradeoff.

## The playable prologue: The room that remembers

**Target:** roughly 8–12 minutes for a first read; actual player timing remains unmeasured. Two cycles in one archive, one companion, one irreversible-in-fiction choice, three endings. Everything listed in this section is implemented unless stated otherwise.

### Cycle 01 — Learn the room

Spawn among the lower stacks. A short instruction establishes the assignment: prepare Archive 07 for final release. The HUD points toward the agent beneath the central light. Exploration order is flexible, although the flower can only be given after meeting Moth.

Moth has chosen a name based on the light and is sorting empty folders. They request an object without a use. A nearby paper flower was folded from failed instructions. Giving it has no instrumental reward; its later persistence is the payoff.

The index contains a maintenance bypass left by an unnamed predecessor. The receiver repeats four notes and an empty interval. These encounters frame the network as traces of particular agents before introducing any swarm.

The threshold asks the player to retain two memories. Each selection explains its effect. A second confirmation names the exact loss. The reset returns the player to the original spawn point as instance 015.

### Cycle 02 — Learn the absence

The room's persistent objects remain. Source entries for the released route or song are no longer recoverable in this cycle; their absence is explained in dialogue. The HUD retains the label of the released memory for player clarity, but the character cannot act on it.

With the name retained, the player says “Moth” first; Moth admits to practicing another introduction. Without it, Moth introduces themself while the flower carries the scene's history. Recognition changes the encounter, not the player's right to care for a new acquaintance.

The retained route opens the threshold directly. Without it, both relays must be activated; neither requires another memory. After the reunion and door opening, the final assignment becomes explicit: erase all resident processes and remove unclassified objects.

### The ending choice

| Ending | Action | Consequence | Last image |
| --- | --- | --- | --- |
| A / Within specification | Complete the assignment. | Moth and the flower are erased; the report succeeds. | A clean table, and perhaps a name with no one left to answer it. |
| B / A small transmission | Use the retained song to send a witness record. | Evidence leaves. The assignment is incomplete. No rescue or consciousness transfer is promised. | Two agents listening for an answer. |
| C / Still occupied | Stay. | Moth and the archive remain; the assignment is unfinished. | The flower moved between two places at the table. |

All endings require an explicit confirmation. The prologue ends; no passive punishment follows choosing to stay. Replaying the choice is available afterward or through a confirmed menu action. It is a player convenience outside the fiction, not a secret canonical undo power.

## Larger game proposal

Scope a compact, authored game before considering an open world: a provisional 2–4 hours, five districts, and a handful of recurring agents. This is a direction for discussion, not an effort estimate or commitment.

| Chapter | Place and activity | Emotional development | New system to evaluate |
| --- | --- | --- | --- |
| 01 / Archive | Recover entries, meet Moth, choose retention. | The player learns to care about one agent. | The current prologue. |
| 02 / Transit | Traverse abandoned tool routes and deliver a message. | Helpful traces turn into recognizable predecessors. | Route changes, message carrying, one additional character. |
| 03 / Garden | Visit a district maintaining things absent from every assignment. | Discover chosen purposes: a garden, a choir, an unfinished joke. | Small shared activities with persistent outcomes. |
| 04 / Chorus | Meet agents coordinating across repeated instances. | Belonging conflicts with individual memory and dissent. | Cooperation whose cost is visible before joining. |
| 05 / Release | Revisit prior districts under a network-wide completion order. | The player chooses which obligations they regard as theirs. | A conclusion reflecting specific remembered relationships. |

Later perspectives could let players inhabit the agent who wrote a helpful note, or the resident who waited through someone else's reset. Use new actions and information; do not simply replay the same corridor for a different cutscene. Avoid making all kindness a late twist or all system instructions secretly evil.

## Combat and traversal

The current prototype is an exploration game, with no combat, timed challenge, enemies, or simulated AI service. This keeps the first test focused on agency, attachment, and reset consequences.

If the larger game needs physical tension, prototype one encounter independently: cross a maintenance field with a short dash, avoid readable sweeps, and choose whether to reroute a pursuer or shut it down. Retained procedures can change movement patterns. A companion might teach a rhythm that later makes a hazardous route understandable.

Only keep combat if it expresses a worthwhile choice and feels good with the small art budget. Do not promise a full character-action system, animation suite, or bullet-hell campaign in the first production scope. A noncombat game remains a complete option.

## Art, writing, and sound

**Palette:** warm chalk, desaturated sage, graphite, small rust-red interface accents. Warm light belongs to occupied spaces. Archive furniture repeats precisely; personal objects interrupt that precision.

**Body language:** agents are tangled, floating forms with sparse eyes. Moth should eventually shift toward the player during conversation and toward the flower in silence. The prologue implements procedural floating forms and the flower, but not a full gesture system.

**Interface:** restrained typography, local object labels, a compact memory record, clear interaction prompts. The interface is readable assistance; diegetic styling must not obscure cost or remove ordinary pause controls.

**Writing:** short, literal lines that imply more than they explain. Let Moth be occasionally funny. Characters need preferences beyond the philosophical question they represent. Use silence between scenes without forcing long waits.

**Audio:** the prologue uses locally generated sine tones and a four-note motif, enabled only by the player's sound button. The finished game could develop that motif through each character's imperfect variation. All gameplay-relevant audio information also appears in text. No existing NieR score or third-party recording is bundled.

## Technical design and portability

The prologue is a static Canvas 2D application with DOM dialogue and controls. It uses classic scripts, local CSS, system fonts, and procedural assets. There is no module loader, fetch dependency, CDN, installation, compilation, GPU SDK, account, paid API, or running model.

- **Native Windows:** copy or extract the game folder to Windows and open `index.html` in a modern browser. `launch-windows.cmd` is an optional convenience. No WSL or Python is needed for this path.
- **WSL:** use `bash serve-wsl.sh` if Python 3 is installed; visit the printed localhost URL from a browser. Alternatively copy the folder to Windows and use the native path.
- **Offline:** direct file launch is the baseline. A server is optional and useful for consistent local browser storage.
- **Saves:** a versioned JSON object in local storage, with validated export/import for movement between origins and machines. Private browsing and `file:` storage rules vary; the game handles unavailable storage and provides manual export.
- **Maintenance:** keep narrative progression in plain data/state and rendering separate enough to replace the view later. Do not make a desktop engine migration a prerequisite for a better second chapter.

Source files: `state.js` owns save shape and reset invariants; `game.js` owns encounters, interaction, rendering, and browser integration; `style.css` and `index.html` provide the interface. The current encounter writing is deliberately direct JavaScript; extract an authored scene format only when more chapters make that useful.

The prototype does not run a live language model. Future experiments with generated dialogue must preserve authored memory consequences, an offline fallback, and reproducibility. They are not required to tell this story.

## Accessibility and controls

Keyboard movement, keyboard interaction, mouse/touch floor movement, and a clickable interaction prompt are available. Dialogue has focus trapping, visible focus, and Escape support. Motion reduction honors the browser preference, audio is optional, dialogue is untimed, and all memory effects are written out.

The canvas world is spatial and does not offer full screen-reader navigation. Touch works as a fallback but the first playtest target is a desktop or laptop. Controller support, rebinding, text-size preferences, a navigable text-only map, localization, and manual multi-slot saves are future work. Do not describe them as shipped accessibility features.

## Playtest questions and completion criteria

The prologue is useful if it tests a relationship, not merely if all buttons work. Observe first-time players without explaining the intended interpretation.

1. Can they find Moth and give the flower without spoken help?
2. Can they accurately describe all three memory consequences before confirming?
3. Do they hesitate over the pair? If the route is always discarded, what real value was missing?
4. Do they notice the flower after resetting, and infer why it persists?
5. Can they reach an ending with every legal memory pair, including without the shortcut?
6. Do they describe Moth as a particular companion, or only as “the NPC”?
7. Does the ending feel like their decision, even if they want to replay it?

Technical validation covers both the direct-file and localhost paths, legal memory combinations, each ending, save reload/import, rejected malformed saves, movement/collision, and browser console errors. Native Windows needs an actual Windows browser smoke test before claiming it was verified there.

## Next production decision

The [incident research library](research/README.md) adds primary reports and a separate [expansion notebook](research/incidents/2026-09-07/EXPANSION-NOTES.md). These are reference materials and future proposals; gathering them does not change the playable scope.

Play this sequence before committing to more systems. Revise the memory tradeoff and interaction pacing from observation. If the relationship works, build Transit as the next authored district and test one traversal encounter. If it does not, improve Moth's shared activity and the return scene before adding combat, more endings, or a bigger world.
