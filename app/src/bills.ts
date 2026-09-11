/** What Spend can pay, and who it pays.
 *
 *  These are the three errands that send somebody out of a dollar account and
 *  into a naira one more often than anything else: topping up a phone, buying
 *  data, and putting units on a meter. None of them is a large amount and all
 *  of them are urgent, which is exactly the shape of errand that makes a
 *  person keep a naira balance "just in case" — and a person who keeps a naira
 *  balance just in case has already left.
 *
 *  Reference data, not state. It does not change while somebody is using the
 *  app and it is the same for everybody, so it lives here rather than in the
 *  record that resets.
 */

/* --------------------------------------------------------------- networks --
   The four that matter, and the prefixes that identify them. A person types
   their own number from memory and should not then have to tell us which
   network it is on — the number already says. They can still change it, for
   the case the prefix does not cover: a number ported to another network
   keeps the prefix it was born with, so the guess is a good default and never
   an assertion. */

export interface Network {
  key: string
  name: string
  /** The first four digits, in the form people write them. */
  prefixes: string[]
}

export const NETWORKS: Network[] = [
  { key: 'mtn', name: 'MTN',
    prefixes: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'] },
  { key: 'airtel', name: 'Airtel',
    prefixes: ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'] },
  { key: 'glo', name: 'Glo',
    prefixes: ['0805', '0807', '0705', '0815', '0811', '0905', '0915'] },
  { key: '9mobile', name: '9mobile',
    prefixes: ['0809', '0817', '0818', '0908', '0909'] },
]

export const networkOf = (key: string): Network | undefined =>
  NETWORKS.find((n) => n.key === key)

/** Digits only, so a number pasted with spaces or a +234 on the front still
 *  reads as the same number. A Nigerian mobile number is eleven digits
 *  starting with a zero; the international form is thirteen starting 234. */
export function digitsOf(raw: string): string {
  const d = raw.replace(/[^0-9]/g, '')
  if (d.startsWith('234')) return '0' + d.slice(3)
  return d
}

export const validNumber = (raw: string): boolean =>
  /^0[789][01]\d{8}$/.test(digitsOf(raw))

/** Which network a number is on, by its prefix. Undefined when the number is
 *  too short to tell, which is most of the time somebody is typing. */
export function guessNetwork(raw: string): Network | undefined {
  const d = digitsOf(raw)
  if (d.length < 4) return undefined
  return NETWORKS.find((n) => n.prefixes.includes(d.slice(0, 4)))
}

/** How a number reads back: 0803 123 4567. */
export function prettyNumber(raw: string): string {
  const d = digitsOf(raw)
  if (d.length !== 11) return raw
  return d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7)
}

/* ------------------------------------------------------------------ data --
   Plans are a naira price for an amount of data over a number of days, which
   is how every network in Nigeria sells it. The price is the price: there is
   no amount to compose, so Data is a list and not a keypad. */

export interface Plan {
  key: string
  /** What you get. */
  size: string
  /** How long it lasts, in the words the networks use. */
  lasts: string
  /** Naira. */
  price: number
}

const PLANS: Record<string, Plan[]> = {
  mtn: [
    { key: 'mtn-1', size: '1.5GB', lasts: '30 days', price: 1000 },
    { key: 'mtn-2', size: '3GB', lasts: '30 days', price: 1500 },
    { key: 'mtn-3', size: '6GB', lasts: '30 days', price: 2500 },
    { key: 'mtn-4', size: '10GB', lasts: '30 days', price: 4000 },
    { key: 'mtn-5', size: '25GB', lasts: '30 days', price: 8000 },
    { key: 'mtn-6', size: '1GB', lasts: '1 day', price: 350 },
  ],
  airtel: [
    { key: 'air-1', size: '1.5GB', lasts: '30 days', price: 1000 },
    { key: 'air-2', size: '3GB', lasts: '30 days', price: 1500 },
    { key: 'air-3', size: '8GB', lasts: '30 days', price: 3000 },
    { key: 'air-4', size: '13GB', lasts: '30 days', price: 5000 },
    { key: 'air-5', size: '35GB', lasts: '30 days', price: 10000 },
    { key: 'air-6', size: '1GB', lasts: '1 day', price: 300 },
  ],
  glo: [
    { key: 'glo-1', size: '1.8GB', lasts: '30 days', price: 1000 },
    { key: 'glo-2', size: '3.9GB', lasts: '30 days', price: 1500 },
    { key: 'glo-3', size: '7.5GB', lasts: '30 days', price: 2500 },
    { key: 'glo-4', size: '13.25GB', lasts: '30 days', price: 4000 },
    { key: 'glo-5', size: '29.5GB', lasts: '30 days', price: 8000 },
    { key: 'glo-6', size: '1.25GB', lasts: '1 day', price: 300 },
  ],
  '9mobile': [
    { key: '9m-1', size: '1.5GB', lasts: '30 days', price: 1000 },
    { key: '9m-2', size: '4.5GB', lasts: '30 days', price: 2000 },
    { key: '9m-3', size: '11GB', lasts: '30 days', price: 4000 },
    { key: '9m-4', size: '15GB', lasts: '30 days', price: 5000 },
    { key: '9m-5', size: '40GB', lasts: '30 days', price: 10000 },
    { key: '9m-6', size: '1GB', lasts: '1 day', price: 300 },
  ],
}

export const plansFor = (network: string): Plan[] => PLANS[network] ?? []

export const planOf = (key: string): Plan | undefined =>
  Object.values(PLANS).flat().find((p) => p.key === key)

/** Which network a plan belongs to, for a review screen rebuilt from an
 *  address that only carries the plan. */
export const networkOfPlan = (key: string): string | undefined =>
  Object.keys(PLANS).find((n) => PLANS[n].some((p) => p.key === key))

/* ----------------------------------------------------------- electricity --
   The distribution companies, by the names on the bills people actually
   receive. Prepaid buys a token; postpaid pays down what is owed. The two are
   different errands with different outcomes, so the screen asks which rather
   than guessing. */

export interface Disco {
  key: string
  name: string
  /** Where it supplies, so somebody who only knows their city can find it. */
  where: string
}

export const DISCOS: Disco[] = [
  { key: 'ikeja', name: 'Ikeja Electric', where: 'Lagos, north of the lagoon' },
  { key: 'eko', name: 'Eko Electric', where: 'Lagos Island, Lekki, Ajah' },
  { key: 'abuja', name: 'Abuja Electric', where: 'Abuja, Niger, Kogi, Nasarawa' },
  { key: 'ph', name: 'Port Harcourt Electric', where: 'Rivers, Bayelsa, Cross River, Akwa Ibom' },
  { key: 'ibadan', name: 'Ibadan Electric', where: 'Oyo, Ogun, Osun, Kwara' },
  { key: 'enugu', name: 'Enugu Electric', where: 'Enugu, Abia, Anambra, Ebonyi, Imo' },
  { key: 'kano', name: 'Kano Electric', where: 'Kano, Jigawa, Katsina' },
  { key: 'benin', name: 'Benin Electric', where: 'Edo, Delta, Ondo, Ekiti' },
]

export const discoOf = (key: string): Disco | undefined =>
  DISCOS.find((d) => d.key === key)

export type MeterKind = 'prepaid' | 'postpaid'

export const validMeter = (raw: string): boolean =>
  /^\d{11,13}$/.test(raw.replace(/[^0-9]/g, ''))

/* Whose meter it is.
 *
 *  A meter number is checked with the disco before anybody pays, and the
 *  answer is a name — which is the whole point of the step, because paying
 *  the wrong meter is money gone. This prototype has no disco to ask, so it
 *  answers from a table indexed by the last digit, the same way a bank
 *  account resolves. The step is real, the refusal is real, and the register
 *  is not: see design.md.
 *
 *  Two of the ten do not resolve, because a meter number that is one digit
 *  wrong is the failure this step exists to catch, and a validator that
 *  always says yes has not validated anything. */
const METER_NAMES = [
  'CHINAZA OKORO', 'OKAFOR NGOZI B', null, 'IBRAHIM SULEIMAN A',
  'ADEBAYO FUNMILAYO', 'ELEANYA CHIDINMA', 'MUSA ABDULKAREEM', null,
  'OGUNDIPE TEMITOPE', 'NWACHUKWU EMEKA J',
]

export interface Meter {
  name: string
  address: string
}

const METER_ADDRESSES = [
  '12 Awolowo Road, Ikoyi', '7 Adeniyi Jones, Ikeja', '', '22 Gana Street, Maitama',
  '3 Bode Thomas, Surulere', '48 Aba Road, Port Harcourt', '9 Ahmadu Bello Way, Kaduna', '',
  '31 Ring Road, Ibadan', '5 Zik Avenue, Enugu',
]

/** The disco's answer. Undefined means the number is not on their register,
 *  which is a refusal and not an error. */
/** How a meter number reads back: 4512 3456 780. Fours, because that is how
 *  the digits are printed on a meter and on the card people copy them from. */
export function prettyMeter(raw: string): string {
  const d = raw.replace(/[^0-9]/g, '')
  return d.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function resolveMeter(raw: string): Meter | undefined {
  const d = raw.replace(/[^0-9]/g, '')
  if (!validMeter(d)) return undefined
  const i = Number(d.slice(-1))
  const name = METER_NAMES[i]
  if (!name) return undefined
  return { name, address: METER_ADDRESSES[i] }
}

/** A prepaid token, which is what you actually buy. Twenty digits in groups
 *  of four, derived from the reference so the same payment always shows the
 *  same token and a receipt reopened tomorrow has not changed. */
export function tokenFor(ref: string): string {
  let h = 0
  for (let i = 0; i < ref.length; i++) h = (Math.imul(h, 31) + ref.charCodeAt(i)) | 0
  let out = ''
  for (let i = 0; i < 5; i++) {
    // `Math.imul` rather than `*`: a 32-bit multiply done in floating point
    // loses its low bits, so every group here came out even. Nobody would ever
    // have noticed, which is the argument for fixing it.
    h = (Math.imul(h, 1103515245) + 12345) | 0
    out += (((h >>> 8) & 0x7fffff) % 10000).toString().padStart(4, '0') + (i < 4 ? ' ' : '')
  }
  return out
}
