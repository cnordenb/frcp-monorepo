import assert from "node:assert/strict";
import { test } from "node:test";
import { MersenneTwister } from "../../src/core/logic.ts";
import { CIVS, MOST, allBut, countPicks, logic, makeState, play, range, seeded, unevenPicks } from "./core-fixture.ts";

const { createPicker, drawCandidates, freshMax, poolIds } = logic;
const twoCivs = () => makeState({ edition: "AOK", off: allBut("Britons", "Celts") });
const rounds = (draws: number[], size: number): number[][] =>
  range(0, draws.length / size).map((r) => draws.slice(r * size, (r + 1) * size));

test("Test 10: the Mersenne Twister gives the reference outputs of mt19937ar.c", () => {
  const mt = new MersenneTwister([0x123, 0x234, 0x345, 0x456]);
  const outputs = [new MersenneTwister(5489).nextUint32(), ...range(0, 5).map(() => mt.nextUint32())];
  assert.deepEqual(outputs, [3499211612, 1067595299, 955945823, 477289528, 4107218783, 4228976476]);
});

test("Test 11: every civ in the pool comes up once a round, before any repeats", () => {
  const everyThirdOff = CIVS.filter((c) => c.id % 3 === 0).map((c) => c.name);
  const pools = [{}, { edition: "HD" }, { off: everyThirdOff }, { off: allBut("Celts") }].map(makeState);
  const settings = [{ fresh: true, freshN: MOST }, { fresh: true, freshN: 5 }, { fresh: false, freshN: MOST }];
  const broken: string[] = [];
  for (const start of [...pools, twoCivs()]) {
    for (const set of settings) {
      const s = structuredClone(start);
      const pool = poolIds(s);
      const played = rounds(play(s, set, seeded(), pool.length * 12), pool.length);
      const whole = played.filter((r) => String([...r].sort((a, b) => a - b)) === String(pool));
      if (whole.length !== 12) broken.push(`${12 - whole.length} rounds of ${pool.length} with ${JSON.stringify(set)}`);
    }
  }
  assert.deepEqual(broken, []);
});

test("Test 12: continuous freshness keeps the newest civs out of the next round's first draws", () => {
  const repeats: string[] = [];
  for (const [start, freshN] of [[makeState(), 1], [makeState(), 5], [makeState(), MOST], [twoCivs(), MOST]] as const) {
    const size = poolIds(start).length;
    const n = Math.min(freshN, freshMax(size));
    const draws = play(start, { fresh: true, freshN }, seeded(), size * 30);
    for (let first = size; first < draws.length; first += size) {
      for (let j = 0; j < n; j++) {
        const sittingOut = draws.slice(first - (n - j), first);
        if (sittingOut.includes(draws[first + j])) repeats.push(`pool ${size}, freshness ${freshN}, draw ${first + j}`);
      }
    }
  }
  assert.deepEqual(repeats, []);
});

test("Test 13: without continuous freshness, a round can start with the civ the last one ended on", () => {
  const draws = play(twoCivs(), { fresh: false, freshN: MOST }, seeded(), 400);
  assert.ok(draws.some((id, i) => i > 0 && id === draws[i - 1]));
});

test("Test 14: an empty pool has nothing to draw", () => {
  const none = makeState({ off: allBut() });
  assert.equal(createPicker(seeded()).next(drawCandidates(none, { fresh: true, freshN: MOST })), null);
});

test("Test 15: without a random source there's no pick", () => {
  assert.equal(createPicker(null).next([1, 2, 3]), null);
});

test("Test 16: the next draw is an even pick from the civs it can be", () => {
  const rng = seeded();
  const counts = countPicks(range(0, 12), 24000, () => createPicker(rng).next(range(0, 12)));
  assert.equal(unevenPicks(counts), null);
});

test("Test 17: the next draw stays an even pick when civs join", () => {
  const rng = seeded();
  const counts = countPicks(range(0, 15), 30000, () => {
    const picker = createPicker(rng);
    picker.next(range(0, 10));
    return picker.next(range(0, 15));
  });
  assert.equal(unevenPicks(counts), null);
});

test("Test 18: the next draw stays an even pick when civs drop out", () => {
  const rng = seeded();
  const counts = countPicks(range(0, 10), 20000, () => {
    const picker = createPicker(rng);
    picker.next(range(0, 15));
    return picker.next(range(0, 10));
  });
  assert.equal(unevenPicks(counts), null);
});

test("Test 19: the next draw stays an even pick when civs join and others drop out", () => {
  const rng = seeded();
  const counts = countPicks(range(5, 15), 20000, () => {
    const picker = createPicker(rng);
    picker.next(range(0, 10));
    return picker.next(range(5, 15));
  });
  assert.equal(unevenPicks(counts), null);
});

test("Test 20: the next draw stays put while it can, so its jingle only loads once", () => {
  const rng = seeded();
  const moved: string[] = [];
  for (let i = 0; i < 200; i++) {
    const picker = createPicker(rng);
    const from = range(0, 20);
    const id = picker.next(from) ?? -1;
    if (picker.next([...from].reverse()) !== id) moved.push(`${i}: the same civs in another order`);
    if (picker.next(from.filter((x) => x % 2 === id % 2)) !== id) moved.push(`${i}: other civs dropping out`);
  }
  assert.deepEqual(moved, []);
});
