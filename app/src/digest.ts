/** SHA-256, written out, because the one place it is needed cannot wait.
 *
 *  The PIN and the password used to be kept in localStorage exactly as typed,
 *  so anybody who could open the browser's storage could read them. They are
 *  kept as a salted digest now, and checked by digesting what was typed and
 *  comparing. `crypto.subtle.digest` would do this, but it answers with a
 *  promise, and the PIN is checked in the middle of a keypress by code that
 *  has to know the answer before the next digit lands. A synchronous digest of
 *  four digits costs nothing, so this is the standard algorithm, in full,
 *  rather than a promise threaded through every place that asks for the PIN.
 *
 *  A prototype with no server is still a prototype with no server: a digest
 *  of four digits can be reversed by trying all ten thousand. What it stops is
 *  the secret being readable at a glance, which is what was wrong. */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

/** The digest of a string, as sixty-four hex characters. */
export function sha256(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const bits = bytes.length * 8
  // The message, a one bit, zeros to 56 mod 64, and the length in bits.
  const size = Math.ceil((bytes.length + 9) / 64) * 64
  const m = new Uint8Array(size)
  m.set(bytes)
  m[bytes.length] = 0x80
  const view = new DataView(m.buffer)
  view.setUint32(size - 8, Math.floor(bits / 2 ** 32))
  view.setUint32(size - 4, bits >>> 0)

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  const W = new Uint32Array(64)
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  for (let off = 0; off < size; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4)
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3)
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10)
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, h] = H
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) >>> 0
      h = g; g = f; f = e; e = (d + t1) >>> 0
      d = c; c = b; b = a; a = (t1 + t2) >>> 0
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d
    H[4] += e; H[5] += f; H[6] += g; H[7] += h
  }
  return [...H].map((x) => x.toString(16).padStart(8, '0')).join('')
}

/** A salt for this device. Random where the browser can make one, so the same
 *  PIN on two devices is two different digests. */
export function newSalt(): string {
  const a = new Uint8Array(12)
  try { crypto.getRandomValues(a) } catch {
    for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256)
  }
  return [...a].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** What is stored in place of a secret. */
export const sealed = (salt: string, secret: string): string => sha256(salt + ':' + secret)
