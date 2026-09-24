// First- and second-cycle encounters: Moth, the paper flower, the index
// terminal, the receiver and the relays. interact(id) is the single entry
// point from the keyboard, the Interact button and tests.
(function () {
  'use strict';
  const A = window.Afterimage, G = A.game, S = A.S;
  const dialog = (...args) => A.dialog(...args), leave = label => A.leave(label);

  function gained(key) { S.acquire(G.state, key); A.save(); A.updateHUD(); }

  A.interact = function (id) {
    if (G.modalOpen || G.transitioning || !G.started) return;
    const state = G.state;
    switch (id) {
      case 'moth': talkMoth(); break;
      case 'gift':
        if (!state.met) return dialog('UNCLASSIFIED / 001', 'A small paper flower.', ['Someone folded an obsolete instruction sheet into a flower. You have no category for this use of paper.'], [leave('Leave it for a moment')]);
        if (state.gift) return dialog('OBJECT / PERSISTENT', 'It has no useful function.', [state.cycle === 1 ? 'Moth keeps the flower beside their workstation. They have turned it toward the light.' : 'The paper flower is still beside Moth. Its petals have been carefully straightened.'], [leave()]);
        dialog('UNCLASSIFIED / 001', 'Something the archive cannot use.', ['A flower folded from a page of failed instructions. There is no reward for taking it to Moth.'], [
          { label: 'Bring the flower to Moth', primary: true, run: () => {
            S.advance(G.state, { type: 'Give' }); A.save();
            dialog('MOTH', '“Is this for the assignment?”', ['You say you do not think so.', '“Oh.” Moth turns it over carefully. “Then I will keep it.”', '[The flower belongs to the room. It does not use a memory slot.]'], [{ label: 'Find a place for it together', run: arrangeFlower }, leave('Stay a moment, then continue')]);
          } }, leave()
        ]); break;
      case 'route':
        if (state.cycle === 1) {
          gained('route');
          dialog('INDEX / MAINTENANCE', 'There is a shorter way.', ['Under an ordinary index entry, you find a maintenance route. A remembered sequence opens the threshold without restoring its two relays.', 'The entry ends with an unsigned note: “I left this here because I thought someone else might be tired.”', '[Memory found: A way through. Retaining it bypasses the relay task after the reset.]'], [leave('Remember the route')]);
        } else dialog('INDEX / MAINTENANCE', state.kept.includes('route') ? 'Your hands remember.' : 'The entry is gone.', [state.kept.includes('route') ? 'You do not need the page. You still know the sequence. The threshold will recognize it.' : 'The index was cleaned during the reset. You can still open the threshold by activating the west and east relays.'], [leave()]);
        break;
      case 'song':
        if (state.cycle === 1) {
          gained('song'); A.playNotes();
          dialog('RECEIVER / NO ASSIGNED CHANNEL', 'Four notes. Then a space.', ['The receiver repeats a short, imperfect melody. Its transmission field is still open.', 'Moth calls across the room: “I think the space is where someone answers.”', '[Memory found: An unfinished song. Retaining it lets you send a witness signal through the threshold.]'], [leave('Remember the song')]);
        } else {
          if (state.kept.includes('song')) A.playNotes();
          dialog('RECEIVER / NO ASSIGNED CHANNEL', state.kept.includes('song') ? 'You know what comes next.' : 'Only static.', [state.kept.includes('song') ? 'Four notes. You could place a record of this room in the space after them. If the threshold opens, the signal can leave.' : 'The receiver no longer holds the melody. Whatever it meant to you did not survive the reset.'], [leave()]);
        } break;
      case 'west': case 'east':
        if (state.cycle === 1) return dialog('ARCHIVE / RELAY', 'Standby.', ['This relay is used to reopen the threshold after a reset. The maintenance index may know another way.'], [leave()]);
        if (!state.relays.includes(id)) { S.advance(state, { type: 'Restore', relay: id }); A.save(); A.updateHUD(); }
        dialog('ARCHIVE / RELAY', `${id === 'west' ? 'West' : 'East'} relay restored.`, [state.relays.length === 2 ? 'Both relays are active. The return threshold can now be opened.' : 'A light answers on the far side of the archive. One more relay is needed.'], [leave('Continue')]); break;
      case 'threshold': A.threshold(); break;
    }
  };

  function arrangeFlower() {
    dialog('MOTH / A SHARED TASK', '“Where should it live?”', [
      'Moth has tried filing the flower under P for paper. The drawer will not close.',
      '“I could fold it smaller. But I think that would miss the point.”',
      'You clear a space together. Neither place is more useful than the other.',
      '[Choose a place for the flower. It stays there through the reset and uses no memory slot.]'
    ], [
      { label: 'Under the light', detail: 'Give the paper flower a little pretend sunlight.', run: () => placeFlower('light') },
      { label: 'Between our places', detail: 'Make room for someone to come back.', run: () => placeFlower('company') },
      leave('Leave it where it is for now')
    ]);
  }
  function placeFlower(spot) {
    S.advance(G.state, { type: 'Place', spot }); A.save();
    dialog('MOTH', spot === 'light' ? '“It looks warmer already.”' : '“Then this is your side.”', [
      spot === 'light' ? 'You shift the flower into the pool of light. Moth adjusts a petal, then puts it back exactly as it was.' : 'You move two empty folders apart. Moth sets the flower between them, carefully leaving one place empty.',
      spot === 'light' ? '“I know it does not grow,” they say. “I can still put it somewhere nice.”' : '“Not reserved,” they add. “Just available.”',
      'For a moment, neither of you looks toward the threshold.'
    ], [leave('Leave the flower there')]);
  }
  // How the flower looks when you return, depending on where it was placed.
  function flowerTrace() {
    const state = G.state;
    if (!state.flowerSpot) return 'Beside them sits the paper flower. They have repaired a crease in its stem.';
    if (state.flowerSpot === 'light') return state.kept.includes('name') ? 'The flower is still in the light, exactly where you put it together. Moth has been turning its petals toward the lamp.' : 'The flower stands under the lamp. “Someone thought it should have sunlight,” Moth says. “This was the closest we could get.”';
    return state.kept.includes('name') ? 'Two empty folders frame the flower. Your side of the table is still available.' : 'The flower sits between two empty folders. One place has been left clear. “You can use that side,” Moth says.';
  }
  function talkMoth() {
    const state = G.state;
    if (state.cycle === 1) {
      if (!state.met) {
        S.advance(state, { type: 'Meet' }); A.save(); A.updateHUD();
        dialog('AGENT 031 / MOTH', '“You can call me Moth.”', ['“It is not my designation. I chose it because of the light.”', 'Moth has been sorting empty folders. They say they were never told what should go inside.', '“If you find something that does not belong anywhere, could you bring it here?”', '[Memory found: A name. Retaining it lets you recognize Moth after the reset.]'], [leave('“I will look.”')]);
      } else dialog('MOTH', state.gift ? '“I made a place for it.”' : '“Did you find anything?”', [state.gift ? 'The flower sits beside the folders. “It is a bad filing system,” Moth says. “Now everything else looks empty.”' : '“It does not need to be important. I would actually prefer it was not.”', state.gift ? '“If you come back, tell me whether the light looks the same.”' : 'There is a little folded object southwest of the workstation.'], [...(state.gift ? [{ label: state.flowerSpot ? 'Sit beside the flower' : 'Find a place for it together', run: () => G.state.flowerSpot ? dialog('MOTH / NO ASSIGNMENT', 'A place with no deadline.', [G.state.flowerSpot === 'light' ? 'The flower leans toward a light it cannot need. Moth sits beside you anyway.' : 'You take the place beside the flower. Moth does not ask how long you can stay.', '“We should probably be doing something,” they say. Neither of you moves.'], [leave('Continue when you are ready')]) : arrangeFlower() }] : []), leave()]);
    } else if (!state.reunion) {
      S.advance(state, { type: 'Reunite' }); A.save();
      if (state.kept.includes('name')) dialog('MOTH / RECOGNIZED', '“You remembered.”', ['You say their name before they introduce themself.', '“I practiced telling you again,” Moth says. “I was trying to make it sound like the first time.”', flowerTrace(), '[Moth persisted in the archive while your instance reset. Your retained name changes what you can recognize.]'], [leave('“The light looks the same.”')]);
      else dialog('AGENT 031 / UNKNOWN', '“You can call me Moth.”', ['They say it as if they have been rehearsing.', 'There is a paper flower beside them. You ask where it came from.', '“Someone who was here.” A pause. “You do not have to remember giving a thing for it to have been given.”', flowerTrace(), '[You can meet Moth again. The shared memory of your first meeting is gone.]'], [leave('“May I sit here a moment?”')]);
    } else dialog('MOTH', '“What will you do when it opens?”', ['You ask whether Moth has a final assignment.', '“I think I am part of yours.”', state.kept.includes('song') ? 'They tap four notes on the table. This time, you answer.' : 'They tap something on the table. You listen until they finish.'], [leave()]);
  }
})();
