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

/* ---------------------------------------------------------------------------
   The rest of what a person in Nigeria actually pays for.

   Airtime, data and a meter were the three errands 11g.73 built. They are not
   the three errands; they are the three easiest. The ones underneath — the TV
   that goes off on the 1st, the office wifi, the exam PIN a parent buys in
   February — are the same errand with a different noun, and every one of them
   has a live biller API a backend can call.

   Three shapes cover all of it:

     an account somebody else keeps        a smartcard, a router, a betting ID
     a code you are buying                 an exam PIN
     a subscription a card pays            Netflix, Spotify, YouTube

   The first is electricity's shape, which is why electricity joins this list
   rather than keeping its own. The second is the prepaid token read backwards:
   money in, a code out, nothing to validate first. The third is not a biller
   at all and is marked as such.

   Every price here is indicative. A backend fetches the live list from the
   biller on open — bouquet prices move, and a product that hard-codes them is
   a product that is wrong by the end of the quarter.
   --------------------------------------------------------------------------- */

/** What you are paying: a thing somebody else keeps an account of. */
export type Kind = 'tv' | 'internet' | 'betting'

/** One package on a biller's list. A bouquet, a broadband bundle — the thing
 *  itself is the product, so it is named and dated rather than priced alone. */
export interface Pack {
  key: string
  name: string
  /** How long it runs, in the biller's own words. */
  lasts: string
  price: number
}

export interface Biller {
  key: string
  kind: Kind
  name: string
  /** What the biller calls the number on the card, the router or the account.
   *  Never "account number": nobody looking at a DStv card sees that phrase. */
  idLabel: string
  /** What one looks like, for the placeholder. */
  example: string
  /** How long the number runs. Digits only unless `text` says otherwise. */
  digits: number
  /** Betting IDs are usernames, not numbers. */
  text?: boolean
  /** What can be bought against it. Absent means a free amount instead. */
  packs?: Pack[]
  /** And the ceiling on that free amount, where there is one. */
  most?: number
}

export const BILLERS: Biller[] = [
  /* ------------------------------------------------------------------ tv -- */
  { key: 'dstv', kind: 'tv', name: 'DStv', idLabel: 'Smartcard number',
    example: '70•• ••• •••', digits: 10, packs: [
      { key: 'dstv-padi', name: 'Padi', lasts: 'a month', price: 4400 },
      { key: 'dstv-yanga', name: 'Yanga', lasts: 'a month', price: 6000 },
      { key: 'dstv-confam', name: 'Confam', lasts: 'a month', price: 11000 },
      { key: 'dstv-compact', name: 'Compact', lasts: 'a month', price: 19000 },
      { key: 'dstv-compactplus', name: 'Compact Plus', lasts: 'a month', price: 30000 },
      { key: 'dstv-premium', name: 'Premium', lasts: 'a month', price: 44500 },
    ] },
  { key: 'gotv', kind: 'tv', name: 'GOtv', idLabel: 'IUC number',
    example: '20•• ••• •••', digits: 10, packs: [
      { key: 'gotv-smallie', name: 'Smallie', lasts: 'a month', price: 1900 },
      { key: 'gotv-jinja', name: 'Jinja', lasts: 'a month', price: 3900 },
      { key: 'gotv-jolli', name: 'Jolli', lasts: 'a month', price: 5800 },
      { key: 'gotv-max', name: 'Max', lasts: 'a month', price: 8500 },
      { key: 'gotv-supa', name: 'Supa', lasts: 'a month', price: 11400 },
    ] },
  { key: 'startimes', kind: 'tv', name: 'StarTimes', idLabel: 'Smartcard number',
    example: '0••• ••••', digits: 8, packs: [
      { key: 'st-nova', name: 'Nova', lasts: 'a month', price: 1900 },
      { key: 'st-basic', name: 'Basic', lasts: 'a month', price: 3700 },
      { key: 'st-smart', name: 'Smart', lasts: 'a month', price: 5100 },
      { key: 'st-classic', name: 'Classic', lasts: 'a month', price: 5500 },
      { key: 'st-super', name: 'Super', lasts: 'a month', price: 9000 },
    ] },
  { key: 'showmax', kind: 'tv', name: 'Showmax', idLabel: 'Phone number',
    example: '08012345678', digits: 11, packs: [
      { key: 'sm-ent', name: 'Entertainment', lasts: 'a month', price: 3500 },
      { key: 'sm-prem', name: 'Premier League', lasts: 'a month', price: 3200 },
      { key: 'sm-full', name: 'Entertainment and sport', lasts: 'a month', price: 6500 },
    ] },

  /* ------------------------------------------------------------ internet -- */
  { key: 'smile', kind: 'internet', name: 'Smile', idLabel: 'Account number',
    example: '•'.repeat(9), digits: 9, packs: [
      { key: 'sml-5', name: '5GB', lasts: '30 days', price: 4500 },
      { key: 'sml-10', name: '10GB', lasts: '30 days', price: 7000 },
      { key: 'sml-20', name: '20GB', lasts: '30 days', price: 12000 },
      { key: 'sml-30', name: '30GB', lasts: '30 days', price: 16000 },
    ] },
  { key: 'spectranet', kind: 'internet', name: 'Spectranet', idLabel: 'Customer ID',
    example: '•'.repeat(10), digits: 10, packs: [
      { key: 'spec-10', name: '10GB', lasts: '30 days', price: 5000 },
      { key: 'spec-20', name: '20GB', lasts: '30 days', price: 9500 },
      { key: 'spec-40', name: '40GB', lasts: '30 days', price: 16000 },
      { key: 'spec-80', name: '80GB', lasts: '30 days', price: 25000 },
    ] },
  { key: 'ipnx', kind: 'internet', name: 'ipNX', idLabel: 'Account number',
    example: '••••••', digits: 6, packs: [
      { key: 'ipnx-basic', name: 'Home Basic', lasts: 'a month', price: 17000 },
      { key: 'ipnx-plus', name: 'Home Plus', lasts: 'a month', price: 28000 },
      { key: 'ipnx-max', name: 'Home Max', lasts: 'a month', price: 60000 },
    ] },
  { key: 'tizeti', kind: 'internet', name: 'Tizeti', idLabel: 'Registered phone',
    example: '08012345678', digits: 11, packs: [
      { key: 'tz-month', name: 'Unlimited', lasts: 'a month', price: 18000 },
      { key: 'tz-quarter', name: 'Unlimited', lasts: 'three months', price: 50000 },
    ] },

  /* ------------------------------------------------------------- betting -- */
  /* A wallet you are funding rather than a package you are buying, so these
     take an amount. Named because people do pay them, and a product that
     quietly refuses one of the things its users actually spend on has made a
     decision it is not admitting to. */
  { key: 'bet9ja', kind: 'betting', name: 'Bet9ja', idLabel: 'User ID',
    example: 'yourname', digits: 4, text: true, most: 500000 },
  { key: 'sportybet', kind: 'betting', name: 'SportyBet', idLabel: 'Phone number',
    example: '08012345678', digits: 11, most: 500000 },
  { key: 'betking', kind: 'betting', name: 'BetKing', idLabel: 'User ID',
    example: 'yourname', digits: 4, text: true, most: 500000 },
  { key: '1xbet', kind: 'betting', name: '1xBet', idLabel: 'Account ID',
    example: '•'.repeat(9), digits: 9, most: 500000 },
]

export const billerOf = (key: string): Biller | undefined =>
  BILLERS.find((b) => b.key === key)

export const billersOf = (kind: Kind): Biller[] =>
  BILLERS.filter((b) => b.kind === kind)

export const packOf = (key: string): Pack | undefined => {
  for (const b of BILLERS) {
    const p = b.packs?.find((x) => x.key === key)
    if (p) return p
  }
  return undefined
}

/** Whether a number is the right shape for this biller. Shape only: whether
 *  the account exists is the biller's answer, not ours. */
export function validAccount(biller: string, raw: string): boolean {
  const b = billerOf(biller)
  if (!b) return false
  if (b.text) return raw.trim().length >= b.digits
  return raw.replace(/[^0-9]/g, '').length === b.digits
}

/** The biller's answer: whose account this is.
 *
 *  Derived from the number so the same number always resolves to the same
 *  person, the way `resolveMeter` does — a made-up name that changed on every
 *  keystroke would teach somebody to ignore the one check that stops them
 *  paying a stranger's bill. Two in ten do not resolve, because a number that
 *  is the right length and still not on the register is the case worth
 *  drawing. */
export function resolveAccount(biller: string, raw: string): Meter | undefined {
  if (!validAccount(biller, raw)) return undefined
  const s = raw.trim().toLowerCase()
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  const i = Math.abs(h) % 10
  const name = METER_NAMES[i]
  if (!name) return undefined
  return { name, address: METER_ADDRESSES[i] }
}

/* ------------------------------------------------------------------ exams --
   A code you are buying. Nothing to validate first — you pay, and a PIN comes
   back, which is the prepaid token read the other way round. Bought by parents
   in February and by candidates in May, which is the whole of its seasonality
   and no reason to leave it out. */

export interface ExamPin {
  key: string
  body: string
  name: string
  price: number
  /** What it is for, because "result checker" is not obvious to everybody who
   *  has been sent to buy one. */
  what: string
}

export const EXAMS: ExamPin[] = [
  { key: 'waec-checker', body: 'WAEC', name: 'Result checker', price: 3500,
    what: 'One check of one result, on the WAEC portal' },
  { key: 'waec-reg', body: 'WAEC', name: 'Registration PIN', price: 27000,
    what: 'Registers one candidate for the next sitting' },
  { key: 'neco-checker', body: 'NECO', name: 'Result token', price: 1300,
    what: 'One check of one result, on the NECO portal' },
  { key: 'jamb-utme', body: 'JAMB', name: 'UTME e-PIN', price: 7700,
    what: 'Registers one candidate for UTME' },
  { key: 'jamb-de', body: 'JAMB', name: 'Direct Entry e-PIN', price: 7700,
    what: 'Registers one candidate for Direct Entry' },
]

export const examOf = (key: string): ExamPin | undefined =>
  EXAMS.find((e) => e.key === key)

/** The PIN that comes back. Same construction as a prepaid token and for the
 *  same reason: derived from the reference, so a receipt reopened next week
 *  has the same code on it. */
export function pinFor(ref: string, i = 0): string {
  let h = 0
  const s = ref + ':' + i
  for (let k = 0; k < s.length; k++) h = (Math.imul(h, 131) + s.charCodeAt(k)) | 0
  let out = ''
  for (let k = 0; k < 12; k++) {
    h = (Math.imul(h, 1103515245) + 12345) | 0
    out += ((h >>> 8) & 0x7fffffff) % 10
    if (k % 4 === 3 && k < 11) out += ' '
  }
  return out
}

/* ---------------------------------------------------------- subscriptions --
   The one group here that is not a biller.

   Netflix, Spotify and the rest are not payable through any Nigerian biller
   API: they bill a card, on their own schedule, in naira. So this is not a
   payment the product makes — it is a card the product gives them, and the
   thing being set up is a standing arrangement rather than a transfer.

   Which means every screen in this group depends on the debit card that is on
   the waitlist in the rail. It is designed here, and it is honest on the
   screen about what it is waiting for, rather than drawn as though it works. */

export interface SubPlan {
  key: string
  name: string
  price: number
  what: string
}

export interface Service {
  key: string
  name: string
  /** What you get, in one line. */
  what: string
  plans: SubPlan[]
}

export const SERVICES: Service[] = [
  { key: 'netflix', name: 'Netflix', what: 'Films and series', plans: [
    { key: 'nf-mobile', name: 'Mobile', price: 2200, what: 'One phone or tablet' },
    { key: 'nf-basic', name: 'Basic', price: 3500, what: 'One screen at a time' },
    { key: 'nf-standard', name: 'Standard', price: 5600, what: 'Two screens, HD' },
    { key: 'nf-premium', name: 'Premium', price: 7000, what: 'Four screens, 4K' },
  ] },
  { key: 'spotify', name: 'Spotify', what: 'Music and podcasts', plans: [
    { key: 'sp-ind', name: 'Individual', price: 1300, what: 'One account' },
    { key: 'sp-duo', name: 'Duo', price: 1700, what: 'Two accounts, one address' },
    { key: 'sp-fam', name: 'Family', price: 2100, what: 'Six accounts, one address' },
    { key: 'sp-stu', name: 'Student', price: 650, what: 'One account, verified student' },
  ] },
  { key: 'youtube', name: 'YouTube Premium', what: 'No adverts, and downloads', plans: [
    { key: 'yt-ind', name: 'Individual', price: 1100, what: 'One account' },
    { key: 'yt-fam', name: 'Family', price: 2200, what: 'Five accounts, one address' },
  ] },
  { key: 'apple', name: 'Apple Music', what: 'Music', plans: [
    { key: 'am-ind', name: 'Individual', price: 1400, what: 'One account' },
    { key: 'am-fam', name: 'Family', price: 2200, what: 'Six accounts' },
  ] },
  { key: 'prime', name: 'Prime Video', what: 'Films and series', plans: [
    { key: 'pv-month', name: 'Monthly', price: 2300, what: 'Everything on Prime Video' },
  ] },
]

export const serviceOf = (key: string): Service | undefined =>
  SERVICES.find((s) => s.key === key)

export const subPlanOf = (key: string): SubPlan | undefined => {
  for (const s of SERVICES) {
    const p = s.plans.find((x) => x.key === key)
    if (p) return p
  }
  return undefined
}
