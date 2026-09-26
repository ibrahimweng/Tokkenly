/* The company and legal pages, in words.
   ---------------------------------------------------------------------------
   Same split as copy-products.mjs: this file is the one a person reads and
   edits, build-pages.mjs turns it into HTML. Nothing here is markup.

   About, Blog and Contact are the words in their Figma frames — About us
   (397:559), Blog (391:559), Contact us (394:780) — with the departures noted
   where they happen.

   Terms of service (399:559) and Privacy policy (399:785) keep their frames'
   headings and shape, but the frames' body text was one placeholder sentence
   repeated thirty-odd times, and a placeholder that says "placeholder" is not
   something to publish on a money product. What is here instead is a
   plain-language DRAFT: each clause says what the product actually does, read
   off app/src — the details it asks for, the NIN or BVN check, the caps before
   it, how money comes in and goes out, what the Download my data button
   gives you. It is not legal advice and it is not binding. The page says so
   at the top, carries noindex until counsel's text replaces it, and names
   what the final version still has to add (the company, its licences, the
   dispute route, retention periods) rather than inventing those.

   The Contact frame shows Support@tokkenly.com and the frame is right. A
   support address is a role, not a person: nobody's name belongs in one, and
   an address on a public page outlives whoever happens to be reading it this
   month. Where the mail is actually delivered is configuration (CONTACT_TO on
   the site's Vercel project, read by api/contact.js), never page copy.

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
   own example.com address. Neither is a real mailbox. */

export const EMAIL = 'support@tokkenly.com'

/* The date both legal drafts were last written. Change it with the words. */
const UPDATED = '26 September 2026'

/* Shown above the clauses on both legal pages, calmly: it is a fact about the
   page, not an alarm. It goes when counsel's wording replaces the draft. */
const DRAFT = [
  'Draft — under legal review',
  'This is a plain-language draft of how Tokkenly works, written so you can read it now. Our lawyers are still reviewing it, and the final, binding version will replace it on this page. Until then, if anything here matters to a decision, ask us at ' + EMAIL + '.',
]

export const PAGES = {
  about: {
    slug: 'about',
    nav: 'About us',
    title: 'Building a wider world for your money.',
    meta: 'Tokkenly brings tokenized stocks and everyday money into one app, built on Base.',
    image: 'about/narrative.webp',
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
    title: 'Blog',
    meta: 'Plain explanations of tokenized stocks, naira and stablecoins, and the everyday money tools around them.',
    lead: 'Plain explanations of tokenized stocks, naira and stablecoins, and the everyday money tools around them.',
    filters: ['All', 'Tokenized stocks', 'Money basics', 'Product', 'Company'],
    /* The frame's thumbnails are empty #d9d9d9 rectangles — six posts drawn,
       no artwork chosen yet — so they ship as the same empty tiles.

       None of the six is written yet. The frame gave each a date and a reading
       time, which on a live page is a claim that the post exists and can be
       read; it cannot, and the cards are not links. So they are what they are,
       the posts that are coming, each marked as such, and the chips above them
       filter by the category on the card. */
    soon: 'Coming soon',
    posts: [
      ['Money basics', 'Naira, dollars, and the rate you actually get'],
      ['Tokenized stocks', 'Nigerian listings, US listings, one portfolio'],
      ['Product', 'Gifting a first investment'],
      ['Money basics', 'Putting idle stablecoins to work'],
      ['Product', 'Borrowing without selling your shares'],
      ['Company', 'Why we built Tokkenly on Base'],
    ],
    newsletter: {
      h: 'Get it in your inbox.',
      p: 'One email a month. What moved, what we shipped, and nothing else.',
      ph: 'you@example.com',
      btn: 'Subscribe',
      done: 'You are on the list. The first one arrives when there is something worth sending.',
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
    /* [name, label, placeholder, type, autocomplete, required] */
    form: [
      ['name', 'Your name', 'First and last name', 'text', 'name', true],
      ['email', 'Email', 'you@example.com', 'email', 'email', true],
      ['about', 'What is it about?', 'Account, a transaction, or something else', 'text', 'off', false],
      ['message', 'Message', 'Tell us what happened, and when', 'textarea', 'off', true],
    ],
    sent: 'Thank you. Your message is with us, and we reply within one working day.',
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
        ['What a tokenized share is', '/products/tokenized-stocks#s-faq'],
        ['The rate, and the ninety seconds it is held for', '/products/convert#s-faq'],
        ['Why there is a cap before your identity check', '/products/receive-and-send#s-transit'],
        ['Everything else people ask', '/#faq'],
      ]],
      ['Something has gone wrong',
       'Money that has not arrived, a payment stuck halfway, an account you cannot get into.', [
        ['Email us, with URGENT first', `mailto:${EMAIL}?subject=URGENT`],
        ['What we owe you when it does', '/terms'],
        ['What we do with your data', '/privacy'],
      ]],
    ],
  },

  terms: {
    slug: 'terms',
    nav: 'Terms of service',
    title: 'Terms of Service',
    meta: 'The agreement between you and Tokkenly: who can open an account, how money comes in and goes out, what it costs, and the risks involved.',
    eyebrow: 'Legal',
    sub: `Last updated: ${UPDATED} · Draft for legal review · Applies to the Tokkenly app and website`,
    warning: DRAFT,
    noindex: true,
    blocks: [
      ['part', '01', 'Getting started', 'Who we are, who can open an account, and what the words mean.'],
      ['sp'],
      ['clause', 1, 'Declarations and basic information',
        'These terms are the agreement between you and Tokkenly when you use the Tokkenly app or this website. By opening an account you accept them. The final version will name the company that provides the service, its registered address and the licences it operates under.'],
      ['clause', 2, 'About Tokkenly and its services',
        'Tokkenly is a money app for people in Nigeria. It lets you hold naira and stablecoins (USDC and USDT), convert between them, receive and send money, pay bills, earn on stablecoins, borrow against what you hold, give tokenized stocks as gifts, and buy tokenized stocks linked to companies listed in Nigeria and the US.'],
      ['defs', 3, 'Definitions', [
        ['Tokenized stock', 'A token that tracks the price of a share, or part of a share, in a listed company. It is not the share itself, and what each one represents is set out on its own page in the app.'],
        ['Stablecoin', 'A digital token designed to hold a steady value against the US dollar. Tokkenly supports USDC and USDT.'],
        ['Wallet', 'Your balances in Tokkenly — naira, stablecoins and the tokenized stocks you hold — shown together in the app.'],
        ['Naira balance', 'Naira you hold in Tokkenly. You add it by bank transfer and can withdraw it to a Nigerian bank account.'],
      ]],
      ['clause', 4, 'Account and registration',
        'You need an account to use Tokkenly, and during the pilot opening one needs an invite code. Give us accurate details — your full name as it appears on your NIN, your email, mobile number, date of birth and home address — and keep them up to date. Keep your password and your phone secure: you are responsible for what happens on your account until you tell us it has been compromised.'],
      ['clause', 5, 'Eligibility and verification',
        'You must be 18 or over and resident in Nigeria. Before you can hold a balance, Nigerian law requires us to confirm who you are with your NIN or BVN, and we also check sanctions and watchlists. Until that is done, the amounts you can move are capped, and the app shows you the cap rather than letting you find it when a payment fails.'],
      ['sp'],
      ['part', '02', 'Using Tokkenly', 'What the product does, what you can do with it, and what you cannot.'],
      ['sp'],
      ['clause', 6, 'Scope of the services',
        'What Tokkenly offers can change, and not every product is open to everyone or at all times: a tokenized stock marked Not open yet cannot be traded. We do not give investment, tax or legal advice. The app explains how a product works; it does not tell you whether to buy it.'],
      ['clause', 7, 'Transactions',
        'Before you confirm anything, the app shows you the amount, the fee and what you will get. When you confirm, we act on that instruction. Payments in stablecoins are recorded on a blockchain and generally cannot be reversed, so check who you are paying before you send.'],
      ['clause', 8, 'Deposits and withdrawals',
        'You can add naira by bank transfer and stablecoins from a crypto wallet on the network you choose; card top-ups may be paused. You can withdraw naira to a Nigerian bank account. We do not describe a withdrawal as complete until the bank has paid it out, and a payment may be held while we carry out checks the law requires.'],
      ['clause', 9, 'Customer responsibilities',
        `Keep your details current, keep your sign-in to yourself, check payment details before you confirm, and tell us straight away at ${EMAIL} if you see anything on your account you did not do.`],
      ['clause', 10, 'Prohibited uses',
        'You must not use Tokkenly for anything unlawful — including fraud, money laundering, financing terrorism or getting around sanctions — open an account for someone else, let someone else use yours, or interfere with the service. We may refuse a payment or close an account where we need to.'],
      ['sp'],
      ['part', '03', 'Money and risk', 'What it costs, what can go wrong, and what happens when it does.'],
      ['sp'],
      ['clause', 11, 'Fees and charges',
        'Any fee is shown on the screen before you confirm, in the currency you are paying in. If a fee changes, we will tell you before the change applies to you.'],
      ['callout', 12, 'Risk disclosure',
        'Tokenized stocks go up and down, and you can get back less than you put in. Earning products are not savings accounts, and returns are not guaranteed. If you borrow against what you hold and its value falls to the level shown when you borrowed, some of it may be sold to repay the loan. Stablecoins aim to hold their value against the dollar but can fail to. Only invest what you can afford to lose.'],
      ['sp'],
      ['clause', 13, 'Complaints',
        `If something has gone wrong, email ${EMAIL} with URGENT at the start of the subject. We reply within one working day and tell you how we are handling it. The final version will set out how long a full answer takes and where you can take a complaint we have not resolved.`],
      ['clause', 14, 'Exclusion of liability',
        'The final version will set out what Tokkenly is and is not responsible for, including when a bank, a blockchain network or another provider we rely on fails. Nothing in these terms takes away a right you have under Nigerian law.'],
      ['sp'],
      ['part', '04', 'The legal part', 'Rights, data, changes, and where any of this gets settled.'],
      ['sp'],
      ['clause', 15, 'Intellectual property',
        'The Tokkenly name, app, website and what is in them belong to Tokkenly or to those who licensed them to us. You may use them to use the service, and not copy or reuse them otherwise.'],
      ['callout', 16, 'Personal data and privacy',
        'We collect and use personal information to run your account, confirm who you are and meet our legal duties. The privacy policy says what we hold, why, who we share it with, and what you can ask us to do with it.'],
      ['sp'],
      ['clause', 17, 'Termination',
        'You can close your account at any time once your balances are withdrawn or moved out. We may suspend or close an account if the law requires it, if these terms are broken, or if we stop offering a service, and we will give you notice where we are allowed to.'],
      ['clause', 18, 'Changes to these terms',
        'We will tell you before a change to these terms takes effect, in the app or by email, and change the date at the top of this page. If you do not agree to a change, you can close your account before it applies.'],
      ['clause', 19, 'Jurisdiction and arbitration',
        'These terms are intended to be governed by the laws of the Federal Republic of Nigeria. How a dispute is settled — in court or by arbitration, and where — is being agreed with our lawyers and will be written here.'],
      ['clause', 20, 'General provisions',
        'If part of these terms cannot be enforced, the rest still applies. If we do not enforce a right straight away, we have not given it up. Your account is yours and cannot be transferred to someone else.'],
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
    meta: 'How Tokkenly collects, uses, shares and protects your information, and what you can ask us to do with it.',
    eyebrow: 'Legal',
    sub: `Last updated: ${UPDATED} · Draft for legal review · How Tokkenly collects, uses and protects your information`,
    warning: DRAFT,
    noindex: true,
    blocks: [
      ['part', '01', 'What we collect', 'The information you give us, and the information we observe.'],
      ['sp'],
      ['clause', 1, 'Who this policy covers',
        'Anyone who uses the Tokkenly app, opens an account, or writes to us through this website. It explains what information we hold about you, why, who else sees it, and what you can ask us to do with it.'],
      ['clause', 2, 'Information you provide',
        'Your full name, email, mobile number, date of birth and home address; your NIN or BVN for the identity check, and a government ID and a photo of you where the check asks for them; the bank accounts you pay into or withdraw to; the people you send money or gifts to; and anything you write to us, including through the contact form on this site.'],
      ['clause', 3, 'Information collected automatically',
        'Your payments, balances and holdings in Tokkenly; the device and app version you use; your IP address and roughly where you sign in from; and how you move through the app. We use it to keep your account secure, spot fraud and fix what breaks.'],
      ['defs', 4, 'Terms used in this policy', [
        ['Personal information', 'Anything that identifies you or could be linked to you, such as your name, your NIN or your payment history.'],
        ['Identity check', 'The checks the law requires before you hold a balance, sometimes called KYC: who you are, that you are 18 or over, that you live in Nigeria, and that you are not on a sanctions list.'],
        ['Service provider', 'A company that does part of the work for us — checking identity, moving bank payments, hosting our systems, sending email — and may only use your information for that work.'],
        ['Processing', 'Anything done with personal information: collecting it, storing it, using it, sharing it or deleting it.'],
      ]],
      ['sp'],
      ['part', '02', 'Why we hold it', 'The reasons we process information, and the legal basis for each.'],
      ['sp'],
      ['clause', 5, 'How we use your information',
        'To open and run your account, carry out the payments you ask for, show you your balances and history, keep your account secure, prevent fraud, reply when you contact us, and make the app better.'],
      ['clause', 6, 'Identity verification and KYC',
        'Nigerian law requires us to know who our customers are. We check your NIN or BVN, with the name and date of birth you gave us, against the official record, and may ask for a government ID and a photo of you. We also check sanctions and watchlists. We keep the result, and the last four digits of the number you used, as part of your record.'],
      ['clause', 7, 'Legal bases for processing',
        'We use your information because we need it to provide the service you signed up for, because the law requires it (identity checks, record keeping and reporting), because keeping Tokkenly secure is a legitimate interest, or because you agreed — and you can withdraw an agreement at any time. The final version will set these out against the Nigeria Data Protection Act 2023.'],
      ['clause', 8, 'Marketing and communications',
        'We send you messages about your account and your payments, which you cannot turn off while you have an account. We send marketing, such as the monthly newsletter, only if you ask for it, and every one has a way to stop.'],
      ['sp'],
      ['part', '03', 'Who else sees it', 'Service providers, regulators, and where information travels.'],
      ['sp'],
      ['clause', 9, 'Sharing with third parties',
        'Only what running the service needs: identity-check providers, banks and payment partners, the companies that host our systems and send our email, and regulators, law enforcement or courts when the law requires it. We do not sell your information.'],
      ['callout', 10, 'International transfers',
        'Some of our service providers store or process information outside Nigeria. Where they do, we will rely on the safeguards the law recognises. Stablecoin payments are recorded on a public blockchain: the wallet address and the amount can be seen there, though your name cannot.'],
      ['sp'],
      ['clause', 11, 'How long we keep it',
        'For as long as you have an account, and afterwards for as long as the law requires us to keep financial and identity records. The final version will state those periods.'],
      ['clause', 12, 'Security',
        'We protect your information with encryption, access controls and monitoring, and the app can lock itself and ask for your passcode. No system is perfectly secure; if a breach puts you at risk, we will tell you, and the regulator, as the law requires.'],
      ['sp'],
      ['part', '04', 'Your control', 'What you can ask us to do, and how to ask.'],
      ['sp'],
      ['callout', 13, 'Your rights',
        `You can have a copy of what we hold — the app's Download my data button gives you your details, every payment and every document you sent us — and you can ask us to correct it, to stop or limit a use of it, or to delete it where the law allows. Write to ${EMAIL}. You can also complain to the Nigeria Data Protection Commission.`],
      ['sp'],
      ['clause', 14, 'Cookies and similar technologies',
        'This website sets no cookies and runs no analytics or advertising scripts. The app keeps a little on your device, such as your preferences and whether it is unlocked, so that it works when you come back.'],
      ['clause', 15, 'Children',
        'Tokkenly is for people 18 and over, and we do not knowingly collect information from children. If you think a child has given us their details, tell us and we will delete them.'],
      ['clause', 16, 'Changes to this policy',
        'When we change this policy we change the date at the top, and for a change that matters we tell you in the app or by email before it applies.'],
      ['clause', 17, 'How to contact us',
        `Email ${EMAIL} with your question or request. The final version will also name our data protection officer and the company's registered address.`],
      ['sp'],
    ],
    cta: 'privacy',
    props: [['dangote', 'n-tl'], ['pen', 'n-bl'], ['notes', 'n-r']],
    close: ['Your data stays yours.',
      'Ask us anything about how we handle it, or open an account and set your own preferences.',
      'Contact us'],
  },
}
