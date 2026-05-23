# Paxos Visualizer

Interactive visualization of the Paxos consensus algorithm. Watch 3 proposers and 5 acceptors communicate via animated message particles across 4 increasingly sophisticated protocol variants.

<img width="1464" height="1074" alt="スクリーンショット 2026-05-23 18 22 23" src="https://github.com/user-attachments/assets/e5edf023-419d-46ef-aba9-40403f005d14" />

## Getting Started

```sh
bun install    # (if needed)
bun ./index.ts # starts dev server with HMR
```

Open the URL printed by Bun (default `http://localhost:3000`).

## Four Modes

The app progresses through 4 modes. Each builds on the previous one.

### P1 (Basic)

First-writer-wins register protocol. No proposal numbers. An acceptor accepts the first value it receives and ignores all subsequent ones. Whichever message arrives first wins globally.

### P2 (Numbered)

Introduces unique, monotonically increasing proposal numbers. An acceptor only accepts if the incoming N is greater than its stored `promisedN`. Lower-numbered proposals arriving later are rejected.

### P2b (Acceptor Info)

Same numbered proposals as P2, but acceptors send a promise reply (`OK:{value}`) back to the proposer. The proposer displays collected replies in its info panel.

### P2c (Promise)

Full two-phase Paxos protocol (Prepare + Accept). Proposers maintain state across steps, transition between phases, and implement the P2c invariant (adopting previously accepted values with higher proposal numbers).

**Phase flow:**
1. **Prepare** — Proposer broadcasts `Prepare(N)` to acceptors. Acceptors respond with `Promise` (including any previously accepted value and its N).
2. **prepare → accept** — After collecting 3+ Promise replies, proposer transitions to Accept phase. It adopts the value from the highest-N promise if one exists, otherwise uses its own default (A/B/C).
3. **Accept** — Proposer broadcasts `Accept(value, N)` to acceptors. Acceptors accept if `N >= promisedN`, otherwise reject.
4. **accept → done** — After collecting 3+ Accepted replies, proposer is done.
5. **accept → prepare** — After collecting 3 Rejected replies, proposer falls back to Prepare (retry with higher N).

## Controls

| Control | Description |
|---------|-------------|
| **P1 / P2 / P2b / P2c** | Switch mode (resets all state) |
| **Step** | Execute one round of message broadcasts |
| **Reset** | Reset all nodes, logs, and proposal numbers |
| **Conflict** | Toggle proposer gap between 100ms (High) and 400ms (Low) |
| **Network Fault** | When ON, 20% of messages are randomly dropped |

## Node Visual Reference

### Proposer (blue border)
- Shows `Infos: ...` listing collected promise/accepted messages
- In P2c mode, shows current `Phase: prepare / accept / done`

### Acceptor
- **Green border** — Idle (no value, no promise)
- **Yellow border** — Has accepted a value
- Shows `Promised: {N}` or `Val: {value}` or `Accepted: N={n}, Val={value}`

## Log Panel (bottom-right)

Color-coded event log:

| Color | Meaning |
|-------|---------|
| Blue | Info (step execution, message sends) |
| Green | Success (accepts, phase transitions, completion) |
| Red | Error (rejections, dropped messages, fallbacks) |
| Yellow | Warning (promise/accept replies) |

Tab buttons filter the log to show only messages relevant to a specific node.

## Message Timing Model

When Step is pressed, all proposers broadcast simultaneously with staggered delays:

- **First proposer**: starts at `500ms`
- **Each subsequent proposer**: `+ proposerGap` (100ms High / 400ms Low)
- **Each target within a proposer**: `+ 200ms` between consecutive targets

Message animation takes approximately 2.5 seconds to travel from source to destination.

## Architecture

The visualizer (`frontend.tsx`) implements its own Paxos logic inline in React state, optimized for visual demonstration. A separate core library (`src/paxos.ts`) provides a class-based Paxos implementation exercised by a console script (`src/index.ts`). The two are independent codebases sharing the project folder.
