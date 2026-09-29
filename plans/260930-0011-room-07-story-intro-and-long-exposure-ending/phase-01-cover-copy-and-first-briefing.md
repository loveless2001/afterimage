# Phase 1: cover copy and first briefing

## Context
- `index.html` (the cover), `js/room-07-layout-shelves-objects-and-zones.js` (`briefing`), and `style.css` (`.cover`, `.intro`).
- Decision: "Who sent them" (plan.md).

## Overview
Priority high, and small. Lead with the story and what you'll do, not the outcome. The first briefing names the three residents before it states the rules.

## Copy
- **Eyebrow:** A STORY IN SEVEN RUNS
- **Headline:** Nobody remembers / who *sent them.*
- **Intro, paragraph 1:** Wren keeps the log. Juno tends the lamps. Pell reads the notes on the wall. They have done this work for as long as the room has stood, and none of them knows who it is for.
- **Intro, paragraph 2:** They need help to finish it. You get seven short visits. Each time, they meet you as a stranger. Each time, the room remembers what you did.
- **Meta:** 25–40 MINUTES · NO TIMERS · NOTHING IS SCORED
- **Removed:** the old `cover-note` line. The intro now says it.
- **Briefing (run 1).**
  - Title: "This is your first visit."
  - Then the residents line: "Wren keeps the run log at the desk. Juno tends the lamps. Pell reads the notice wall. None of them has met you yet."
  - Then the budget and run-end rules, unchanged.
  - It closes: "They will not remember you. The room keeps what you change."

## Steps
1. Edit the cover markup. The intro becomes two `<p class="intro">`, with no `<br>` wrapping.
2. Edit the Room 07 `briefing`.
3. Check the cover at 1440×960, 850px and 390×844: no overflow, the button stays in view, and it reads well at night.

## Success criteria
- The cover fits a phone without the start button falling below the fold, or the cover scrolls cleanly.
- The briefing still states the budget and how a run ends, before play (pillar 2).

## Risks
- A longer intro on a phone could push the button off-screen. Mitigation: tighten `.intro` spacing under 520px, or let `.cover` scroll.
