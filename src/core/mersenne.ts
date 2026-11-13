const N = 624;
const M = 397;
const TWO_32 = 4294967296;

export type Seed = number | ArrayLike<number>;

export interface RandomSource {
  int(min: number, max: number): number;
}

export class MersenneTwister implements RandomSource {
  #mt = new Uint32Array(N);
  #index = N;

  static secureSeed(words = N): Uint32Array {
    const c = globalThis.crypto;
    if (!c || typeof c.getRandomValues !== "function") {
      throw new Error("No cryptographic random source available");
    }
    return c.getRandomValues(new Uint32Array(words));
  }

  constructor(seed: Seed = MersenneTwister.secureSeed()) {
    if (typeof seed === "number") this.seed(seed);
    else this.seedArray(seed);
  }

  seed(s: number): this {
    const mt = this.#mt;
    mt[0] = s >>> 0;
    for (let i = 1; i < N; i++) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = Math.imul(1812433253, prev) + i;
    }
    this.#index = N;
    return this;
  }

  seedArray(key: ArrayLike<number>): this {
    if (key.length === 0) throw new RangeError("Seed array must not be empty");
    this.seed(19650218);
    const mt = this.#mt;
    let i = 1;
    let j = 0;
    for (let k = Math.max(N, key.length); k > 0; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (mt[i] ^ Math.imul(prev, 1664525)) + (key[j] >>> 0) + j;
      i++;
      j++;
      if (i >= N) {
        mt[0] = mt[N - 1];
        i = 1;
      }
      if (j >= key.length) j = 0;
    }
    for (let k = N - 1; k > 0; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (mt[i] ^ Math.imul(prev, 1566083941)) - i;
      i++;
      if (i >= N) {
        mt[0] = mt[N - 1];
        i = 1;
      }
    }
    mt[0] = 0x80000000;
    this.#index = N;
    return this;
  }

  #twist(): void {
    const mt = this.#mt;
    for (let k = 0; k < N; k++) {
      const y = (mt[k] & 0x80000000) | (mt[(k + 1) % N] & 0x7fffffff);
      mt[k] = mt[(k + M) % N] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
    }
    this.#index = 0;
  }

  nextUint32(): number {
    if (this.#index >= N) this.#twist();
    let y = this.#mt[this.#index++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError("min and max must be integers with min <= max");
    }
    const range = max - min + 1;
    if (range > TWO_32) throw new RangeError("Range must not exceed 2^32");
    const limit = TWO_32 - (TWO_32 % range);
    let r = this.nextUint32();
    while (r >= limit) r = this.nextUint32();
    return min + (r % range);
  }
}
