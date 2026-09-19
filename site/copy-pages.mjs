/* The company and legal pages, in words.
   ---------------------------------------------------------------------------
   Same split as copy-products.mjs: this file is the one a person reads and
   edits, build-pages.mjs turns it into HTML. Nothing here is markup.

   EVERY STRING BELOW IS THE STRING IN FIGMA. These five frames are fully
   written in the file — About us (397:559), Blog (391:559), Contact us
   (394:780), Terms of service (399:559) and Privacy policy (399:785) — so
   there is nothing here to draft. Where a heading reads "placeholder", that
   is what the frame says, and the page ships saying it.

   The Contact frame shows Support@tokkenly.com and the frame is right. A
   support address is a role, not a person: nobody's name belongs in one, and
   an address on a public page outlives whoever happens to be reading it this
   month. The owner's personal address is where this mail is really delivered,
   and it is not what the page says.

   Frame → this file:
     hero/eyebrow/leads .... the Head or Masthead group
     blocks ................ the Clauses column, in frame order, including the
                             20px spacers, which fall in an irregular enough
                             pattern that carrying them as data is safer than
                             deriving them from a rule
     index ................. derived from blocks, because the frame's index is
                             exactly its clause list

   Where a form asks a visitor for THEIR address, the placeholder is
   you@example.com. Where the product invents a person, that person gets their
   own example.com address. Neither is this one. */

export const EMAIL = 'support@tokkenly.com'

/* Every clause body in both legal frames is this same sentence. */
const CLAUSE = 'Placeholder body text. The clause that belongs here has not been drafted — this block exists so the page can be reviewed at the right length and rhythm. Replace with the wording your counsel provides.'

/* And every definition is this. */
const DEFS = [
  ['Tokenized stock', 'placeholder definition'],
  ['Stablecoin', 'placeholder definition'],
  ['Wallet', 'placeholder definition'],
  ['Naira balance', 'placeholder definition'],
]

const WARNING = [
  'PLACEHOLDER — NOT LEGAL COPY',
  'Layout only. Every clause below is a real heading with placeholder body text so the page can be reviewed. Binding wording for a regulated money product has to come from your lawyers — none of it is written here.',
]

export const PAGES = {
  about: {
    slug: 'about',
    nav: 'About us',
    title: 'Building a wider world for your money.',
    meta: 'Tokkenly brings tokenized stocks and everyday money into one app, built on Base.',
    eyebrow: 'About us',
    leads: [
      'Our goal is to give people in Nigeria more control over what their money can do.',
      'From everyday spending and bills to converting naira and dollars and investing in tokenized stocks listed in Nigeria and the US, we make managing money simple, open and secure — built on Base.',
    ],
    statement: {
      h: 'Built on Base.',
      p: 'Tokkenly brings tokenized stocks and everyday money into one app. Invest across Nigerian and US markets, receive and send money, pay bills, earn, borrow, and convert currencies through a simple, familiar experience.',
      stats: [
        ['Two markets', 'Nigerian and US listings, in one portfolio'],
        ['One app', 'Invest, receive, send, pay, earn, borrow, convert'],
        ['Naira and stablecoins', 'Convert between them as your plans change'],
      ],
    },
    /* Stand for (397:599). The frame's six cards, in the frame's order, each
       with the 3D icon that sits above its words. The category labels the
       earlier version carried are gone: the headings say what the label said. */
    values: {
      eyebrow: 'How we look after you',
      h: 'Six things we do so this feels easy.',
      intro: 'From the day you join to the day you sell, here is what you can count on from us.',
      items: [
        ['shares', 'We hold the real shares for you', 'Every token you buy tracks a real share we hold. You get the price moves and the dividends.'],
        ['markets', 'We put both markets in one list', 'Nigerian and US companies side by side, so you pick a company rather than a market.'],
        ['costs', 'We show every cost up front', 'The amount, the fee and exactly what you get, on the screen before you press the button.'],
        ['rate', 'We give you the rate on the screen', 'Your balance sits in dollars, and the rate you are shown is the rate you get, in and out.'],
        ['plain', 'We tell you how it really works', 'Shares go up and down, and this is not a savings account. We say so on the screen, not in a footnote.'],
        ['oneplace', 'We keep it all in one place', 'Investing sits beside receiving, sending, paying bills, earning, borrowing and converting.'],
      ],
    },
    narrative: {
      eyebrow: 'Why we built it',
      h: 'Getting paid is only the beginning.',
      ps: [
        'Put your money to work, send it where it matters, and take care of the essentials. Your portfolio, your naira and your stablecoins belong in the same conversation — not in four different apps that never speak to each other.',
        'That is the whole idea. Invest, then get on with life, with the tools to receive, send, pay, earn, borrow and convert close at hand.',
      ],
    },
    cta: 'about',
    props: [['dangote', 'n-tl'], ['pen', 'n-bl'], ['notes', 'n-r']],
    /* The frame breaks this headline by hand after "for". */
    close: ['Come along for\nthe rest of it.',
      'Open a Tokkenly account and hold naira, dollars and stocks in one place.',
      'Get started'],
  },

  blog: {
    slug: 'blog',
    nav: 'Blog',
    title: 'Blogs',
    meta: 'Plain explanations of tokenized stocks, naira and stablecoins, and the everyday money tools around them.',
    lead: 'Plain explanations of tokenized stocks, naira and stablecoins, and the everyday money tools around them.',
    filters: ['All', 'Tokenized stocks', 'Money basics', 'Product', 'Company'],
    /* The frame's thumbnails are empty #d9d9d9 rectangles — six posts drawn,
       no artwork chosen yet — so they ship as the same empty tiles. */
    posts: [
      ['Money basics', 'Naira, dollars, and the rate you actually get', '5 Sept 2026 · 5 min read'],
      ['Tokenized stocks', 'Nigerian listings, US listings, one portfolio', '29 Aug 2026 · 6 min read'],
      ['Product', 'Gifting a first investment', '22 Aug 2026 · 4 min read'],
      ['Money basics', 'Putting idle stablecoins to work', '15 Aug 2026 · 7 min read'],
      ['Product', 'Borrowing without selling your shares', '8 Aug 2026 · 6 min read'],
      ['Company', 'Why we built Tokkenly on Base', '1 Aug 2026 · 5 min read'],
    ],
    newsletter: {
      h: 'Get it in your inbox.',
      p: 'One email a month. What moved, what we shipped, and nothing else.',
      ph: 'you@example.com',
      btn: 'Subscribe',
    },
    cta: 'blog',
    props: [['dangote', 'n-tl'], ['pen', 'n-bl'], ['notes', 'n-r']],
    close: ['Put what you read to work.',
      'Open a Tokkenly account and make your first investment in minutes.',
      'Get started'],
  },

  contact: {
    slug: 'contact',
    nav: 'Help',
    title: 'Get in touch.',
    meta: 'Questions about your account, a transaction, or the product. A real person reads these.',
    lead: 'Questions about your account, a transaction, or the product. A real person reads these.',
    cta: 'contact',
    props: [['dangote', 'n-tl'], ['pen', 'n-bl'], ['notes', 'n-r']],
    close: ['Or skip the wait and start.',
      'You don’t need to hear back from us to open a Tokkenly account and make your first move.',
      'Sign up'],
    form: [
      ['name', 'Your name', 'First and last name', 'text'],
      ['email', 'Email', 'you@example.com', 'email'],
      ['about', 'What is it about?', 'Account, a transaction, or something else', 'text'],
      ['message', 'Message', 'Tell us what happened, and when', 'textarea'],
    ],
    /* The frame draws the second and third columns as a heading and a sentence
       with nothing to click, and marks the third — registered address, support
       line, socials — with a dashed rule, meaning still to come. Those details
       are not in this repository and are not the kind of thing to invent for a
       money product, so both columns carry links to things that do exist. This
       is the one place the page departs from 394:780. */
    channels: [
      [EMAIL, 'We reply within one working day.'],
      ['Answers to the common ones',
       'Some of it is already written down, and reading it is faster than waiting for us.', [
        ['What a tokenized share is', './products/tokenized-stocks.html#s-faq'],
        ['The rate, and the ninety seconds it is held for', './products/convert.html#s-faq'],
        ['Why there is a cap before your identity check', './products/send.html#s-facts'],
        ['Everything else people ask', './index.html#faq'],
      ]],
      ['Something has gone wrong',
       'Money that has not arrived, a payment stuck halfway, an account you cannot get into.', [
        ['Email us, with URGENT first', `mailto:${EMAIL}?subject=URGENT`],
        ['What we owe you when it does', './terms.html'],
        ['What we do with your data', './privacy.html'],
      ]],
    ],
  },

  terms: {
    slug: 'terms',
    nav: 'Terms of service',
    title: 'Terms of Service',
    meta: 'The agreement between you and Tokkenly. The frame is laid out; the binding wording comes from counsel.',
    eyebrow: 'Legal',
    sub: 'Last updated: placeholder date · Applies to the Tokkenly app and website',
    warning: WARNING,
    blocks: [
      ['part', '01', 'Getting started', 'Who we are, who can open an account, and what the words mean.'],
      ['sp'],
      ['clause', 1, 'Declarations and basic information', CLAUSE],
      ['clause', 2, 'About Tokkenly and its services', CLAUSE],
      ['defs', 3, 'Definitions', DEFS],
      ['clause', 4, 'Account and registration', CLAUSE],
      ['clause', 5, 'Eligibility and verification', CLAUSE],
      ['sp'],
      ['part', '02', 'Using Tokkenly', 'What the product does, what you can do with it, and what you cannot.'],
      ['sp'],
      ['clause', 6, 'Scope of the services', CLAUSE],
      ['clause', 7, 'Transactions', CLAUSE],
      ['clause', 8, 'Deposits and withdrawals', CLAUSE],
      ['clause', 9, 'Customer responsibilities', CLAUSE],
      ['clause', 10, 'Prohibited uses', CLAUSE],
      ['sp'],
      ['part', '03', 'Money and risk', 'What it costs, what can go wrong, and what happens when it does.'],
      ['sp'],
      ['clause', 11, 'Fees and charges', CLAUSE],
      ['callout', 12, 'Risk disclosure', CLAUSE],
      ['sp'],
      ['clause', 13, 'Complaints', CLAUSE],
      ['clause', 14, 'Exclusion of liability', CLAUSE],
      ['sp'],
      ['part', '04', 'The legal part', 'Rights, data, changes, and where any of this gets settled.'],
      ['sp'],
      ['clause', 15, 'Intellectual property', CLAUSE],
      ['callout', 16, 'Personal data and privacy', CLAUSE],
      ['sp'],
      ['clause', 17, 'Termination', CLAUSE],
      ['clause', 18, 'Changes to these terms', CLAUSE],
      ['clause', 19, 'Jurisdiction and arbitration', CLAUSE],
      ['clause', 20, 'General provisions', CLAUSE],
      ['sp'],
    ],
    cta: 'terms',
    props: [['dangote', 'n-tl'], ['pen', 'n-bl'], ['notes', 'n-r']],
    close: ['Still have questions?',
      'Talk to us about anything on this page, or open an account and start when you’re ready.',
      'Contact us'],
  },

  privacy: {
    slug: 'privacy',
    nav: 'Privacy policy',
    title: 'Privacy Policy',
    meta: 'How Tokkenly collects, uses and protects your information. The frame is laid out; the binding wording comes from counsel.',
    eyebrow: 'Legal',
    sub: 'Last updated: placeholder date · How Tokkenly collects, uses and protects your information',
    warning: WARNING,
    blocks: [
      ['part', '01', 'What we collect', 'The information you give us, and the information we observe.'],
      ['sp'],
      ['clause', 1, 'Who this policy covers', CLAUSE],
      ['clause', 2, 'Information you provide', CLAUSE],
      ['clause', 3, 'Information collected automatically', CLAUSE],
      ['defs', 4, 'Terms used in this policy', DEFS],
      ['sp'],
      ['part', '02', 'Why we hold it', 'The reasons we process information, and the legal basis for each.'],
      ['sp'],
      ['clause', 5, 'How we use your information', CLAUSE],
      ['clause', 6, 'Identity verification and KYC', CLAUSE],
      ['clause', 7, 'Legal bases for processing', CLAUSE],
      ['clause', 8, 'Marketing and communications', CLAUSE],
      ['sp'],
      ['part', '03', 'Who else sees it', 'Service providers, regulators, and where information travels.'],
      ['sp'],
      ['clause', 9, 'Sharing with third parties', CLAUSE],
      ['callout', 10, 'International transfers', CLAUSE],
      ['sp'],
      ['clause', 11, 'How long we keep it', CLAUSE],
      ['clause', 12, 'Security', CLAUSE],
      ['sp'],
      ['part', '04', 'Your control', 'What you can ask us to do, and how to ask.'],
      ['sp'],
      ['callout', 13, 'Your rights', CLAUSE],
      ['sp'],
      ['clause', 14, 'Cookies and similar technologies', CLAUSE],
      ['clause', 15, 'Children', CLAUSE],
      ['clause', 16, 'Changes to this policy', CLAUSE],
      ['clause', 17, 'How to contact us', CLAUSE],
      ['sp'],
    ],
    cta: 'privacy',
    props: [['dangote', 'n-tl'], ['pen', 'n-bl'], ['notes', 'n-r']],
    close: ['Your data stays yours.',
      'Ask us anything about how we handle it, or open an account and set your own preferences.',
      'Contact us'],
  },
}
