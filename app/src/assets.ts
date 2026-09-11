/** What the wallet actually holds, and how it travels.
 *
 *  Up to now "your money" was one number and one word: dollars, on Base. That
 *  was a simplification the product could afford while every screen only asked
 *  how much. It stops being affordable the moment somebody is paid — because
 *  what lands is a particular token, on a particular chain, and both of those
 *  are facts a person is responsible for getting right. USDT sent to a USDC
 *  address on the wrong network is gone, and no amount of clear typography
 *  after the fact undoes that.
 *
 *  So there are three things you can hold and they are named:
 *
 *    USDC   dollars, on Base or Ethereum
 *    USDT   dollars, on TRON or Ethereum
 *    Naira  not a token at all — money in a Nigerian bank rail, which is why
 *           it has no network and arrives by transfer rather than by address
 *
 *  Two of the three are dollars. They are separate accounts rather than one
 *  because they are separate instruments: different issuers, different chains,
 *  different things that can go wrong. The ledger counts them in USD and the
 *  trial balance still has to come to nothing, which is the point — a product
 *  that could not tell you which of two dollars you held would be a product
 *  that had lost track of one of them.
 *
 *  Reference data, not state: the same for everybody, and it does not change
 *  while somebody is using the app.
 */

export type Asset = 'usdc' | 'usdt' | 'ngn'

export interface AssetDef {
  key: Asset
  /** What it is called on screen. */
  name: string
  /** The short form, for a chip or a figure. */
  symbol: string
  /** What the ledger counts it in. Both stablecoins are dollars. */
  currency: 'USD' | 'NGN'
  /** One line about what it actually is. */
  what: string
  /** Where it can travel. Empty for naira, because naira does not travel on a
   *  chain — it moves between banks, which is a rail and not a network. */
  networks: string[]
}

export const ASSETS: AssetDef[] = [
  { key: 'usdc', name: 'USDC', symbol: 'USDC', currency: 'USD',
    what: 'Dollars, issued by Circle', networks: ['base', 'ethereum'] },
  { key: 'usdt', name: 'USDT', symbol: 'USDT', currency: 'USD',
    what: 'Dollars, issued by Tether', networks: ['tron', 'ethereum'] },
  { key: 'ngn', name: 'Naira', symbol: '₦', currency: 'NGN',
    what: 'In your Tokkenly account', networks: [] },
]

export const assetOf = (key: string): AssetDef | undefined =>
  ASSETS.find((a) => a.key === key)

/** The two that are dollars, in the order they are offered. */
export const DOLLARS: Asset[] = ['usdc', 'usdt']

export const isDollar = (a: Asset): boolean => a !== 'ngn'

/** The account in the ledger that holds it. One purse per asset, because two
 *  balances in one account is one balance. */
export const purseFor = (a: Asset): string => 'wallet.' + a

/* --------------------------------------------------------------- networks --
   Where a stablecoin travels, what an address on it looks like, and what it
   costs to move. The address shape is the load-bearing part: it is what turns
   "do not send USDT to a Base address" from a warning nobody reads into a
   refusal that happens before the money moves. */

export interface Net {
  key: string
  name: string
  /** How an address on it is written, so a paste can be checked. */
  shape: RegExp
  /** What an address on it looks like, for a placeholder. */
  example: string
  /** What it costs to send, in dollars, and who pays it. */
  fee: number
  /** How long it takes, in the words a person would use. */
  takes: string
  /** One line about why somebody would pick it. */
  why: string
}

export const NETS: Net[] = [
  { key: 'base', name: 'Base', shape: /^0x[0-9a-fA-F]{40}$/,
    example: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    fee: 0, takes: 'Seconds', why: 'Cheap and fast. What Tokkenly runs on' },
  { key: 'tron', name: 'TRON', shape: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    example: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    fee: 1, takes: 'Under a minute', why: 'Where most USDT in Nigeria moves' },
  { key: 'ethereum', name: 'Ethereum', shape: /^0x[0-9a-fA-F]{40}$/,
    example: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    fee: 6, takes: 'A few minutes', why: 'Where it started. Slower, and gas costs real money' },
]

export const netOf = (key: string): Net | undefined => NETS.find((n) => n.key === key)

/** Which networks carry this asset, as the objects rather than the keys. */
export const netsFor = (a: Asset): Net[] =>
  (assetOf(a)?.networks ?? []).map((k) => netOf(k)!).filter(Boolean)

/** The one a person gets unless they say otherwise: the cheapest that carries
 *  it, which for both stablecoins is also the one most people want. */
export const defaultNet = (a: Asset): Net | undefined => netsFor(a)[0]

/* Whether a pasted address could be on this network.
 *
 *  Base and Ethereum share a shape, which is the whole difficulty: an address
 *  that is valid on both is valid on both, and no amount of checking tells you
 *  which one the person on the other end is watching. TRON does not share it
 *  with either, so that mistake — the common one, because TRON is where USDT
 *  lives and Base is where this product does — is catchable, and is caught. */
export const addressFits = (net: string, raw: string): boolean => {
  const n = netOf(net)
  return !!n && n.shape.test(raw.trim())
}

/** Which network a pasted address is on, when the shape says so on its own.
 *  Undefined for an EVM address, because 0x is Base and Ethereum both and
 *  guessing between them is exactly the guess that loses money. */
export function netFromAddress(raw: string): Net | undefined {
  const v = raw.trim()
  const hits = NETS.filter((n) => n.shape.test(v))
  return hits.length === 1 ? hits[0] : undefined
}

/** The refusal, in the words that say what would happen.
 *
 *  Not "invalid address". An address can be perfectly valid and still be the
 *  wrong one to send to, and the difference between those two sentences is the
 *  difference between a person correcting a typo and a person losing a month's
 *  pay. */
export function wrongNetwork(net: string, raw: string): string | undefined {
  const v = raw.trim()
  if (!v) return undefined
  const n = netOf(net)
  if (!n) return undefined
  if (n.shape.test(v)) return undefined
  const other = netFromAddress(v)
  if (other) {
    return `That is a ${other.name} address, and this is set to send on ${n.name}. `
      + `Sent as it is, the money would not arrive and could not be recovered.`
  }
  return `That is not a ${n.name} address. A ${n.name} address looks like `
    + `${n.example.slice(0, 6)}…${n.example.slice(-4)}.`
}

/** A deposit address, for an asset on a network. Derived from both, so the
 *  screen cannot show one address and name another — which is the fault the
 *  whole of this file exists to make impossible. */
export function addressFor(asset: Asset, net: string): string {
  const n = netOf(net)
  if (!n) return ''
  let h = 0
  const seed = asset + ':' + net
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0
  // `Math.imul`, not `*`. A 32-bit multiply done in floating point loses the
  // low bits above 2^53, so every character drawn from `h % 16` came out zero
  // and every address read 0x0000…0000. It is the kind of bug that looks like
  // a formatting mistake and is arithmetic.
  const next = (): number => {
    h = (Math.imul(h, 1103515245) + 12345) | 0
    return (h >>> 8) & 0x7fffff
  }
  const hex = (len: number): string => {
    let out = ''
    for (let i = 0; i < len; i++) out += '0123456789abcdef'[next() % 16]
    return out
  }
  const b58 = (len: number): string => {
    const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let out = ''
    for (let i = 0; i < len; i++) out += A[next() % A.length]
    return out
  }
  return n.key === 'tron' ? 'T' + b58(33) : '0x' + hex(40)
}

/** How an address reads when there is no room for all of it. */
export const shortAddress = (a: string): string =>
  a.length > 14 ? a.slice(0, 6) + '…' + a.slice(-4) : a
