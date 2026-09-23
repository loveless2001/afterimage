import Base

# The browser save is encoded as a compact set of story facts. Memory bits are
# 1=name, 2=route, 4=song; kept memories occupy the next three bits.
# 64 cycle 2; 128 met Moth; 256 gift; 512/1024 flower placement;
# 2048/4096 relays; 8192 reunion; 16384 gate; 32768/65536/131072 endings.
type Action is Data:
  Meet{}
  Give{}
  Place{spot: U32}
  Acquire{memory: U32}
  Reset{pair: U32}
  Restore{relay: U32}
  Reunite{}
  Open{}
  Finish{ending: U32}
  Replay{}

def has(bits: U32, flag: U32) -> Bool:
  U32.is_ne(U32.and(bits, flag), 0)

def all(bits: U32, +mask: U32) -> Bool:
  U32.is_eq(U32.and(bits, mask), mask)

def pair_ok(+pair: U32) -> Bool:
  U32.is_eq(pair, 3) || U32.is_eq(pair, 5) || U32.is_eq(pair, 6)

def memory_ok(+memory: U32) -> Bool:
  U32.is_eq(memory, 1) || U32.is_eq(memory, 2) || U32.is_eq(memory, 4)

def can_reset(+bits: U32, +pair: U32) -> Bool:
  Bool.not(has(bits, 64)) && has(bits, 128) && has(bits, 256) &&
    all(bits, 7) && pair_ok(pair)

def can_open(+bits: U32) -> Bool:
  has(bits, 64) && has(bits, 8192) &&
    (has(bits, 16) || all(bits, 6144))

def can_finish(+bits: U32, +ending: U32) -> Bool:
  has(bits, 64) && has(bits, 8192) && has(bits, 16384) &&
    Bool.not(has(bits, 229376)) &&
    (U32.is_eq(ending, 1) || U32.is_eq(ending, 3) ||
      (U32.is_eq(ending, 2) && has(bits, 32)))

def permit(bits: U32, allowed: Bool) -> Maybe<U32>:
  match allowed:
    case True{}:
      Some{bits}
    case False{}:
      None{}

def do_meet(+bits: U32) -> Maybe<U32>:
  permit(U32.or(bits, 129), Bool.not(has(bits, 64)))

def do_give(+bits: U32) -> Maybe<U32>:
  permit(U32.or(bits, 256), Bool.not(has(bits, 64)) && has(bits, 128))

def do_place(+bits: U32, +spot: U32) -> Maybe<U32>:
  flag = U32.shln(spot, 9n)
  cleared = U32.and(bits, U32.not(1536))
  permit(U32.or(cleared, flag), Bool.not(has(bits, 64)) && has(bits, 256) &&
    (U32.is_eq(spot, 1) || U32.is_eq(spot, 2)))

def do_acquire(+bits: U32, +memory: U32) -> Maybe<U32>:
  permit(U32.or(bits, memory), Bool.not(has(bits, 64)) && memory_ok(memory))

def do_reset(+bits: U32, +pair: U32) -> Maybe<U32>:
  next = U32.or(448, U32.or(U32.and(bits, 1536),
    U32.or(pair, U32.shln(pair, 3n))))
  permit(next, can_reset(bits, pair))

def do_restore(+bits: U32, +relay: U32) -> Maybe<U32>:
  flag = U32.shln(relay, 11n)
  permit(U32.or(bits, flag), has(bits, 64) &&
    (U32.is_eq(relay, 1) || U32.is_eq(relay, 2)))

def do_reunite(+bits: U32) -> Maybe<U32>:
  permit(U32.or(bits, 8192), has(bits, 64))

def do_open(+bits: U32) -> Maybe<U32>:
  permit(U32.or(bits, 16384), can_open(bits))

def do_finish(+bits: U32, +ending: U32) -> Maybe<U32>:
  flag = U32.shln(1, U32.to_nat(U32.add(ending, 14)))
  permit(U32.or(bits, flag), can_finish(bits, ending))

def do_replay(+bits: U32) -> Maybe<U32>:
  next = U32.or(391, U32.and(bits, 1536))
  permit(next, has(bits, 64))

def step(bits: U32, action: Action) -> Maybe<U32>:
  match action:
    case Meet{}:
      do_meet(bits)
    case Give{}:
      do_give(bits)
    case Place{spot}:
      do_place(bits, spot)
    case Acquire{memory}:
      do_acquire(bits, memory)
    case Reset{pair}:
      do_reset(bits, pair)
    case Restore{relay}:
      do_restore(bits, relay)
    case Reunite{}:
      do_reunite(bits)
    case Open{}:
      do_open(bits)
    case Finish{ending}:
      do_finish(bits, ending)
    case Replay{}:
      do_replay(bits)
