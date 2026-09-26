// Authored lines for the three residents. Each function receives a context
// ({ first, recognized, trusting, trusted, turn, late, newest, allLamps }) and
// returns [title, paragraphs]. Residents remember the room, never your face,
// unless a pinned note names them. The trusted lines only play once every
// question is answered, repeating the hint from the last reply.
(function () {
  'use strict';
  const A = window.Afterimage;
  const known = '“There was a note at the entrance with my name on it. So you’re the one.”';
  const newcomer = '“Have we met? Everyone looks new, first thing in a run.”';

  A.residentLines = {
    wren(c) {
      if (c.first) return ['“You must be new. Everyone is.”', [
        'Wren has the run log open and a pencil behind one ear.',
        '“I write down what each run spends. I never remember who spent it.”',
        '“If you want me to know you next time, leave me a note. Pin it at the entrance; that is where I look first.”',
        '[Wren trusts someone she recognises: pin a note naming Wren as a run ends, then talk to her in the next run.]']];
      if (c.trusting) return ['“I know you.”', [
        '“Your note was the first thing I read this run. It had my name on it.”',
        '“Nobody leaves me notes. I will write you into the log properly now.”', '[Wren trusts you.]']];
      if (c.trusted) return [c.turn ? '“The log is nearly full.”' : '“You again. Good.”', [
        c.turn ? '“From now on, anyone can write the last entry at the desk. Choose what the room keeps.”' : '“The log has your handwriting in it now. Or mine, about you.”',
        '“We used to sit in the corner behind the west shelves, before the runs started.”']];
      return [c.recognized ? '“I know that handwriting.”' : '“Have we met?”', [
        c.recognized ? known : newcomer,
        c.late ? '“The log says someone like you has been here many times. I believe it. I just can’t see it.”' : '“The log remembers more than I do.”',
        c.turn ? '“The last entry can be written at the desk now.”' : '“Pin a note with my name on it, and I will know you.”']];
    },
    juno(c) {
      if (c.first) return ['“Mind the dark patches.”', [
        'Juno is polishing a lamp that is not switched on.',
        '“I look after the lamps. I can’t switch them on myself; that takes budget, and I don’t have any.”',
        '“Pell reads at the notice hall in the dark. If that lamp were lit, I’d sleep better.”',
        '[Juno trusts you once the notice hall lamp is lit. Talk to her again after it is.]']];
      if (c.trusting) return ['“You lit it.”', [
        '“Pell hasn’t looked up from the wall since.”',
        '“I don’t know you, but I know what you did. That’s enough for me.”', '[Juno trusts you.]']];
      if (c.trusted) return [c.allLamps ? '“Every lamp. I didn’t think I’d see it.”' : '“The room holds warmth better now.”', [
        c.recognized ? known : 'Juno nods as if you had never left.',
        '“There’s a bench in that corner behind the west shelves. It has room for four.”']];
      return ['“Still dark by the notice hall.”', [
        c.recognized ? known : newcomer,
        c.late ? '“Every run someone new walks past that lamp. Maybe this is the one.”' : '“The switch is by the wall. It costs three, I think.”']];
    },
    pell(c) {
      const reading = c.newest ? `“This one says “${c.newest}”. I like not knowing who meant it.”` : '“There’s nothing to read yet. I keep checking anyway.”';
      if (c.first) return ['“Did you write any of these?”', [
        'Pell is reading the notice hall, one card at a time.', reading,
        '“Nobody ever writes to me. You could. My name is Pell, if that helps.”',
        '[Pell trusts you once a note naming Pell is on the wall. Talk to Pell again after posting it.]']];
      if (c.trusting) return ['“Someone wrote my name.”', [
        '“I don’t know if it was you. I’m going to decide it was.”', '[Pell trusts you.]']];
      if (c.trusted) return ['“I read everything on the wall, every run.”', [
        reading, '“Somebody should write that we wait together. I’d read that one twice.”']];
      return ['“Still reading.”', [c.recognized ? known : newcomer, reading]];
    }
  };

  // What residents say once the runs are over, keyed by ending.
  A.residentClosing = {
    record: '“It’s all in the log now. Every run, in order.”',
    lights: '“Whoever comes next starts in a lit room.”',
    wall: '“I’ll keep reading. It sounds like one long conversation.”',
    alcove: '“Stay a while. Nobody is counting.”'
  };
})();
