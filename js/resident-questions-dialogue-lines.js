// Authored copy for the residents' questions (milestone 8). Once a resident
// trusts you they ask these in order; a note posted this run answers. Which
// notes fit, and the word each answer teaches, live in the content tables.
// `form` always tells the player what kind of note answers, so nothing is
// guessed. `reply(note)` receives the answering note's text. The last reply of
// each resident carries one hint towards the secret.
(function () {
  'use strict';
  const A = window.Afterimage;

  A.questionLines = {
    juno: [
      { ask: '“Where was it darkest, when you came in?”', why: '“Every run starts at the entrance. I never see where the dark goes after that.”',
        form: 'a place, with “avoid” or “check”',
        reply: note => ['“So that’s where.”', [`“${note}.” Juno repeats it slowly, as if marking it on a map.`,
          '“Before the runs, nobody had to budget light. Lamps were just lamps. You can write about lighting them now.”']] },
      { ask: '“Who should the light be for?”', why: '“I polish every lamp, and I have never known who they are for.”',
        form: 'a resident’s name, with “light”',
        reply: note => ['“For them, then.”', [`“${note}.” Juno smiles at the lamp she is holding.`,
          '“I used to think the dark was the room resting. Now I think it is waiting. Call it what it is: the dark.”']] },
      { ask: '“And the dark itself? What should it do?”', why: '“You have a word for it now. Tell it something.”',
        form: '“the dark”, with “leave”',
        reply: note => ['“Leave. Yes.”', [`“${note}.” Juno reads it twice, then turns the lamp down a little, as if it can rest tonight.`,
          '“There’s a bench in that corner behind the west shelves. It has room for four. We used to wait out the dark there.”']] }
    ],
    wren: [
      { ask: '“This run has a blank line in the log. What goes in it?”', why: '“Not what you spent. I have that. Something with a when in it.”',
        form: 'any note with a third word (first, later, never, together, again…)',
        reply: note => ['“I’ll write that down.”', [`Wren copies “${note}” into the margin.`,
          '“The first runs had no log. Someone started this book so the room would remember what we couldn’t. Remember is a word you can use now.”']] },
      { ask: '“Who do you remember?”', why: '“Nobody remembers anyone here. Write it anyway. I would like to read it.”',
        form: 'a resident’s name, with “remember”',
        reply: note => ['“That’s kind of you.”', [`“${note}.” Wren underlines it twice.`,
          '“The log is the only thing in the room that keeps whole runs. You can write to it by name now.”']] },
      { ask: '“What should the log keep, when all this ends?”', why: '“Put it on the wall so I can copy it in.”',
        form: '“log”, with “keep”',
        reply: note => ['“Then it will.”', [`“${note}.” Wren closes the book gently, and leaves her hand on it.`,
          '“We used to sit in the corner behind the west shelves, before the runs started. We are all still here. Just not there.”']] }
    ],
    pell: [
      { ask: '“Write me something worth reading twice.”', why: '“Most notes get read once and forgotten. I want one that comes back.”',
        form: 'any note ending in “again”',
        reply: note => ['“I read it twice.”', [`“${note}.” Pell reads it again, to be sure.`,
          '“The wall is older than the runs. People used to post what they wanted to keep. Keep is yours now too.”']] },
      { ask: '“What should the wall keep?”', why: '“You have the word now. Use it on the wall.”',
        form: 'a place or a resident’s name, with “keep”',
        reply: note => ['“I’ll keep it too.”', [`“${note}.” Pell moves the card to where the light is better.`,
          '“It isn’t a wall of notices. It is a wall of everyone who was here. You can write about the wall itself now.”']] },
      { ask: '“Write something for all of us.”', why: '“Not for one of us. For the whole room.”',
        form: 'a resident’s name or “wall”, with “remember”',
        reply: note => ['“For all of us.”', [`“${note}.” Pell doesn’t say anything for a while.`,
          '“Somebody should write that we wait together. I would read that one twice.”']] }
    ]
  };
})();
