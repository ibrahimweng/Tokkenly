/* The six product pages, in words.
   ---------------------------------------------------------------------------
   Separated from build-products.mjs on purpose: this file is the one a person
   reads and edits. Nothing in it is HTML. The builder turns it into pages.

   Voice: the client’s revised landing-page document (September 2026) and the
   product frames in Figma. Where a page states a fact about how Tokkenly
   behaves — a limit, a method, a hold, a fee — the fact is the app’s, not an
   invention: it is what app/src does.

   Each product is:

     slug       the URL, /products/<slug>
     nav        the product’s name, in sentence case, as the bar, the footer
                and the sibling cards all write it
     title      the one-line promise under the name in the Products menu
     lead       the page’s meta description
     image      the picture a shared link shows, a path under img/
     close      the closing slab: headline, lead and, optionally, the button
     sections   the page, band by band, in the order the frame draws it; each
                `type` is a renderer in build-products.mjs (KIT2)

   PRODUCTS is in the order the site lists them everywhere — the bar, the
   phone menu and the footer — so that order is changed here and nowhere
   else. */

/* Every Sign up on the site reads this one constant. The app is its own Vercel
   project at this address; signed out, it sends a visitor to /login. */
export const APP_URL = 'https://app.tokkenly.com'

/* The site’s own address. Nothing in the repository wrote it down, so this is
   an assumption to confirm: tokkenly.com, with the app on its app. subdomain.
   Canonical links, og:url, og:image, robots.txt and sitemap.xml all read it,
   so a different domain is a one-line change here and in index.html’s head. */
export const SITE_URL = 'https://tokkenly.com'

export const PRODUCTS = [
  /* ------------------------------------------------------------ flagship -- */
  {
    slug: 'tokenized-stocks',
    image: 'ts/coins-us.webp',
    close: ['Make your next investment now.', 'Explore tokenized stocks with Tokkenly and bring the rest of your money along.'],
    nav: 'Tokenized stocks',
    title: 'From Nigeria to Wall Street.',
    lead:
      'The companies on your radar can be part of your portfolio. Invest in tokenized stocks linked ' +
      'to companies listed in Nigeria and the US, right from Tokkenly.',
    /* ---------------------------------------------------------------------
       The frame (529:681) redraws this page around seven bands rather than
       the old spine. `sections` is what the builder reads when it is here;
       `spine` below is the previous page and stays until every product has
       been rebuilt, so the site keeps building one page at a time. */
    sections: [
      { type: 'phero',
        eyebrow: 'Tokenized stocks',
        h: 'Invest in Nigerian\nand US stocks',
        lead: 'The companies on your radar can be part of your portfolio. Invest in tokenized stocks linked to companies listed in Nigeria and the US, right from Tokkenly.',
        ctas: [['Get started', 'ink', null], ['See how it works', 'white', '#more']],
        wash: ['#f7c9fe', '#d1cbc2 58.5%', '#eaeae9'],
        /* The coins do not sit still. They run the arc the frame lays them
           on, left to right, growing as they cross the middle and shrinking
           away at both edges, on an 18 second loop.

           So a coin is no longer a box. It is a width and a place in that
           loop: the width it would have AT THE MIDDLE, as a share of the
           1920, and the delay that puts it exactly where the frame draws it
           at the start. Run the clock to zero and the eight of them compose
           the frame again, which is what the negative delays are for — and
           what a paused animation falls back to when the reader has asked
           for less motion.

           The path itself is in the stylesheet, because it is one set of
           keyframes every coin shares. Only the phase differs.

           The last three numbers are the frame's own box — left, top and
           width — which is what a reader who has asked for less motion gets
           instead. Pausing would have done it, except the stylesheet's
           blanket reduced-motion rule cuts every animation to 0.01ms, so a
           paused coin lands on the last keyframe rather than on its phase.
           The static box is not a second guess at the arrangement; it is the
           same eight boxes the frame draws.

           The eight share one width and are spaced evenly round the loop,
           2.25 seconds apart. The first pass gave each coin the width and the
           phase that put it exactly on its frame box, and it looked wrong
           moving: the frame spaces them by eye, so as a procession they
           bunched in the middle and left a hole behind them. Evenly spaced,
           with the path doing all of the sizing, the only thing that changes
           as a coin crosses is how near it is — which is the point.

              [name, width %, delay s, mirrored, left %, top vw, width %] */
        coins: [
          ['apple',    22.917,   0.00, 0, -3.750, 30.938, 14.813],
          ['tesla',    22.917,  -2.25, 1,  8.750, 35.156, 13.146],
          ['dangote2', 22.917,  -4.50, 0, 20.781, 39.427, 13.281],
          ['nasdaq',   22.917,  -6.75, 0, 31.979, 34.010, 26.891],
          ['nvidia',   22.917,  -9.00, 0, 54.844, 35.156, 19.943],
          ['spy',      22.917, -11.25, 0, 72.917, 35.156, 12.771],
          ['intel',    22.917, -13.50, 0, 83.490, 27.604, 12.859],
          ['sandisk',  22.917, -15.75, 0, 93.594, 22.344, 12.859],
        ] },

      { type: 'cards3',
        h: 'What you can buy.',
        lead: 'Nigerian and US companies come back in the same search, and you choose an amount of money rather than a number of shares.',
        cards: [
          { grad: ['#2bbd9b', '#c7e1ff 46%', '#d1cbc2'], foot: false,
            h: 'Nigerian companies', p: 'Dangote, MTN, GTCO and the rest of the NGX.',
            list: [['D', 'Dangote Cement', 'DANGCEMc', '&#8358;512.00'],
                   ['M', 'MTN Nigeria', 'MTNNc', '&#8358;289.50'],
                   ['G', 'GTCO', 'GTCOc', '&#8358;62.30']] },
          { grad: ['#f7b79a', '#f8c8ff 48%', '#d1cbc2'], foot: false,
            h: 'Any amount from $1', p: 'A slice is a real position. No whole share required.',
            stack: { rows: [['You buy', '$1.00'], ['You get', '0.0044 AAPLc']],
                     note: 'No minimum. A dollar is a real position.' } },
          { grad: ['#c7e1ff', '#f8c8ff 58%', '#d1cbc2'], foot: true,
            h: 'American companies', p: 'Apple, Tesla and the names you already follow.',
            list: [['A', 'Apple', 'AAPLc', '$226.40'],
                   ['T', 'Tesla', 'TSLAc', '$412.90'],
                   ['N', 'Nvidia', 'NVDAc', '$184.20']] },
        ] },

      { type: 'prow', side: 'a', pill: 'Search',
        h: 'Search a name,\nnot a ticker.',
        p: 'AAPLc is Apple and DANGCEMc is Dangote Cement. The list says which is which rather than making you already know.',
        btn: 'Explore the list',
        slot: { grad: ['#c7e1ff', '#c7e1ff 40%', '#f8c8ff 63%', '#d1cbc2 82%', '#eaeae9 96%'],
                photo: 'ts/portrait-search.webp',
                chips: [['Dangote Cement', 'DANGCEMc', 46.06, 71.67, 23.79],
                        ['MTN Nigeria', 'MTNNc', 52.12, 57.50, 18.94],
                        ['GTCO', 'GTCOc', 73.79, 65.33, 12.12]],
                prop: ['ts/frag-coin.webp', 0, 64.17, 33.52] } },

      { type: 'prow', side: 'b', pill: 'Fractions',
        h: 'Buy a slice,\nnot a whole share.',
        p: 'You choose an amount of money, not a number of shares. A dollar is a real starting position.',
        btn: 'See what a dollar buys',
        slot: { grad: ['#c7e1ff', '#f8c8ff 45%', '#d1cbc2'],
                slab: ['ts/slab-fractions.webp', 4.85, 20.30, 85.61, 81.49] } },

      { type: 'pfaq', eyebrow: 'Questions', h: 'A few things you might be wondering.',
        items: [
          ['What does it cost to buy?',
           'The price on the screen. Any fee is on the same screen, before you confirm.'],
          ['Do I own the actual share?',
           'No. You own a tokenized stock that tracks the share price. What it represents is written on the product\u2019s own page, and it is worth reading before you buy.'],
          ['What happens if the company\u2019s price falls?',
           'Your holding falls with it. Investments can lose value, and Tokkenly does not guarantee a return.'],
          ['Can I buy part of a share?',
           'Yes. You choose an amount of money rather than a number of shares.'],
        ] },

      { type: 'siblings', eyebrow: 'The rest of it', h: 'There is more\nin the app.',
        /* This frame keeps the older sibling band: icon chips and a short
           line each, where the newer pages use a letter and a sentence. */
        cards: [
          ['gifting-and-rewards', 'gift', 'Gifting and rewards', 'Make their day. Start their portfolio.', 'Explore Gifting and rewards'],
          ['receive-and-send', 'updown', 'Receive and send', 'Get paid. Make someone\u2019s day.', 'Explore Receive and send'],
          ['borrow-and-earn', 'split', 'Borrow and earn', 'Put it to work, or borrow against it.', 'Explore Borrow and earn'],
        ] },

      { type: 'pclose' },
    ],

  },

  /* ------------------------------------------------------------ new page -- */
  {
    slug: 'gifting-and-rewards',
    image: 'gift/hero-portrait.webp',
    /* Frame 640:1611. Seven bands: a hero with the words on the left and a
       portrait running off the right, two ways to give, the unlock, three
       steps, the questions, the siblings and the close. */
    sections: [
      { type: 'phero', align: 'left', h: 'Give stocks as gifts or rewards',
        lead: 'Give tokenized stocks for birthdays, graduations, or just because.\nReward customers through referrals, cashback, and loyalty programs.',
        ctas: [['Get started', 'ink', null], ['See how it works', 'white', '#more']],
        wash: ['#c7e1ff', '#c7e1ff 20%', '#f8c8ff 58%', '#eaeae9'],
        washH: 39.583, height: 53.333,
        /* Boxes as shares of the 1920 hero: left, top, width. The portrait
           starts above the section and ends below it; the section clips. */
        art: [
          ['photo', 'gift/hero-portrait.webp', 46.302, -15.052, 47.953],
          ['inset', 'gift/hero-inset.webp', 58.333, 40.156, 12.714],
        ],
        panel: { l: 77.969, t: 26.563, w: 19.375, head: ['You are gifting', '$25.00'],
          pairs: [['To', 'Chidi Umeh'], ['Gift', 'Apple &#183; AAPLc'],
                  ['Unlocks', '14 March 2027'], ['Fee', 'No fee']],
          note: '\u201CHappy birthday. Start somewhere.\u201D', btn: 'Send gift' } },

      { type: 'cards3', cols: 2, centred: true,
        h: 'Two ways to give.',
        lead: 'One for the people you know, one for the people who buy from you. Both land in a real portfolio.',
        cards: [
          { grad: ['#f8c8ff 4%', '#f7b79a 57%', '#d1cbc2'], big: true,
            h: 'For people you know', p: 'A birthday, a graduation, or no occasion at all.',
            gift: { badge: 'C', name: 'Chidi Umeh', sub: 'Gift \u00B7 Apple \u00B7 AAPLc',
                    note: '\u201CHappy birthday. Start somewhere.\u201D' } },
          { grad: ['#2bbd9b', '#c7e1ff 50%', '#d1cbc2'], big: true,
            h: 'For people who buy from you', p: 'Referrals, cashback and loyalty, paid in stock.',
            rules: { k: 'Reward rule', v: '2% back',
                     rows: [['Per order', '2% in AAPLc'], ['Per referral', '$5.00'], ['Tier 3', '3% back']] } },
        ] },

      { type: 'psplit', side: 'a',
        h: 'A gift with a date on it.',
        p: 'Pick a company they will recognize, write a line, and set the day it opens. A gift with a date on it arrives twice \u2014 once when it lands, and once when it unlocks.',
        btn: 'Start a gift',
        photo: 'gift/unlock-portrait.webp', ratio: '660 / 617' },

      { type: 'steps3', h: 'How a gift travels.',
        steps: [
          { grad: ['#f7b79a', '#f8c8ff 51%', '#d1cbc2'], h: 'Pick what to give',
            p: 'Choose a tokenized stock and an amount. A slice is fine \u2014 you do not have to give a whole share.',
            frag: { k: 'Gift', v: '$25.00', rows: [['Company', 'Apple \u00B7 AAPLc'], ['Amount', '$25.00']] } },
          { grad: ['#d1cbc2', '#ff9900'], h: 'Say when it opens',
            p: 'Send it now, or set a date. Until that day it sits in their portfolio, tracking the price.',
            frag: { k: 'Unlocks in', v: '540 days', rows: [['From', 'Aunty Nsozi'], ['Opens', '14 March 2027']] } },
          { grad: ['#2bbd9b', '#c7e1ff 61%', '#d1cbc2'], h: 'They claim it',
            p: 'They get a link, open an account, and it lands in their portfolio. Theirs to keep, sell or add to.',
            frag: { k: 'Claimed', v: 'In their portfolio', rows: [['Holding', '0.11 AAPLc'], ['Worth', '$25.00']] } },
        ] },

      /* The frame sets this heading at 90 in an 830 column, with 46 before
         the questions rather than the 200 the other pages leave. */
      { type: 'pfaq', h: 'A few things you might be wondering.', pad: [140, 120],
        cols: [54.583, 42.391, 3.026], h2: [90, 0.978],
        items: [
          ['What if they already use Tokkenly?',
           'It lands straight in their portfolio. No link to claim, no account to open.'],
          ['Can I take a gift back?',
           'Not once it has been claimed. Before it is claimed, an unclaimed gift returns to you.'],
          ['Is a gift taxed?',
           'That depends on where the two of you are and what you do with it. Tokkenly does not give tax advice \u2014 talk to someone who does.'],
          ['What can I pay rewards in?',
           'Any tokenized stock on the list, or a dollar amount. The rule is yours to set, and it is on the screen before anyone earns against it.'],
        ] },

      { type: 'siblings', h: 'There is more in the app.', badge: 'letter', hSize: [32, 1.281],
        gap: 34, cardGap: 24, cardH: 260,
        cards: ['tokenized-stocks', 'receive-and-send', 'borrow-and-earn'] },

      { type: 'pclose', tall: true },
    ],
    close: ['Give something that grows.', 'Pick a company, set the day it opens, and let the gift do the rest.'],
    nav: 'Gifting and rewards',
    title: 'Make their day. Start their portfolio.',
    lead:
      'Give tokenized stocks for birthdays, graduations, or just because. Reward customers through ' +
      'referrals, cashback, and loyalty programs.',
  },

  /* ------------------------------------------------------------- everyday -- */
  {
    slug: 'receive-and-send',
    image: 'rs/receipt.webp',
    /* Frame 644:1611. The frame merges receive and send into one page: the
       hero, then money in and money out side by side, then what happens while
       it is moving, then the questions, the siblings and the close. */
    sections: [
      { type: 'phero', align: 'left', eyebrow: 'Receive and send',
        h: 'Receive and send money',
        lead: 'Get paid, support loved ones, or move money where you need it.\nKeep it in Tokkenly, ready for whatever comes next.',
        ctas: [['Get started', 'ink', null], ['See how it works', 'white', '#more']],
        wash: ['#c7e1ff', '#c7e1ff 20%', '#f8c8ff 58%', '#eaeae9'],
        washH: 42.344, height: 53.333,
        panel: { l: 62.604, t: 11.823, w: 26.563, big: true,
          head: ['You are sending', '$120.00'],
          pairs: [['To', 'Adaeze Okonkwo'], ['Paying with', 'USDC'],
                  ['They receive', '$120.00'], ['Fee', 'No fee']],
          rows: [['Arrives', 'In about a minute']],
          btn: 'Send $120.00' } },

      { type: 'twoside',
        h: 'Money in, and money out.',
        lead: 'Three ways it can reach you, and three places it can go. Both sides sit in the same balance.',
        btn: 'See how to get paid',
        cards: [
          { grad: ['#2bbd9b', '#c7e1ff 53%', '#d1cbc2'], foot: true, pill: 'Money in',
            h: 'However they pay you.',
            p: 'Your own account number, in your own name, at a Nigerian bank. For stablecoins, an address on the network you chose.',
            panel: { l: 7.661, t: -16.317, w: 84.812,
              head: ['Your account number', '7043 118 220'],
              list: [['N', 'Wema Bank', '7043 118 220 \u00B7 Amara Nwosu', 'Naira'],
                     ['B', 'Base', '0x7a2f\u20264c19', 'USDC'],
                     ['T', 'Tron', 'TJmv\u20269Qp4', 'USDT']],
              note: 'Nothing to receive, whichever route they use.' } },
          { grad: ['#f7b79a', '#f8c8ff 64%', '#d1cbc2 82%'], pill: 'Money out',
            h: 'Wherever it needs to go.',
            p: 'A person on Tokkenly, a crypto wallet, or a Nigerian bank account. One screen asks the question once.',
            panel: { l: 4.973, t: 40.226, w: 107.258,
              head: ['You are sending', '$120.00'],
              list: [['A', 'Adaeze Okonkwo', 'On Tokkenly', 'Instant'],
                     ['W', 'A crypto wallet', 'Base \u00B7 USDC', 'Network fee'],
                     ['B', 'A Nigerian account', 'GTBank \u00B7 0221\u2026', 'Minutes']],
              note: 'The fee is on the screen, in money, before you confirm.' } },
        ] },

      { type: 'intransit',
        h: 'What happens while it is moving.',
        lead: 'Money in transit gets a row of its own, so a balance never jumps without an explanation.',
        btn: 'Sign up',
        /* Every placement below is the frame's own box over its card's:
           645:1617 the mini, 697:1729 the gun, 696:878 the receipt,
           666:1641 the frag and 679:1643 the cursor. Two of them are meant
           to run off the card and be cut by it \u2014 the mini past the foot,
           the frag over the head \u2014 so the tops and heights are the
           frame's, not what fits. */
        rows: [
          [{ wide: true, bg: '#d1cbc2', h: 'It says where it actually is.',
             p: 'En route, at the bank, not landed yet \u2014 not a balance that jumps with no explanation.',
             mini: { l: 4.846, t: 50, w: 90.308, h: 77.778,
                     rows: [['Sent', '14:02'], ['At the bank', '14:03'], ['Landed', '\u2014']] } },
           { grad: ['#d1cbc2', '#fac6ff'], h: 'Still moving is not spendable.',
             p: 'The screen keeps the two apart until it lands, so one is never mistaken for the other.',
             art: { src: 'hero/gun.webp', l: 17.625, t: 16.944, w: 70.646, ar: [353.230, 452.701] } }],
          [{ grad: ['#d1cbc2', '#c8e1ff'], tight: true, h: 'It ends in a receipt.',
             p: 'When it lands the row becomes a record you can find again in Activity.',
             art: { src: 'rs/receipt.webp', l: 7.2, t: 37.222, w: 76.123, ar: [380.617, 427.057] } },
           { wide: true, bg: '#d1cbc2', h: 'Your limit is on the screen.',
             p: 'Until your identity check is done, outgoing payments are capped \u2014 and the cap is shown rather than discovered when a payment fails.',
             textAt: { l: 4.846, t: 54.444, w: 90.308 },
             cursor: { l: 86.712, t: 53.748, w: 3.109 },
             mini: { l: 6.057, t: -11.944, w: 90.308, h: 60, tone: 'tan',
                     rows: [['Sent today', '$120.00'], ['Daily cap', '$500.00'], ['Left today', '$380.00']] } }],
        ] },

      { type: 'pfaq', h: 'A few things you might be wondering.',
        items: [
          ['What do I give someone so they can pay me?',
           'Your account number at a Nigerian bank, in your own name, or an address on the network you chose. Both are on the same screen.'],
          ['Why is money I received not spendable yet?',
           'It is still moving. The row says where it is, and the screen keeps what is in transit apart from what you can spend until it lands.'],
          ['What happens if a payment fails?',
           'It comes back to your balance and the row says why. Nothing is held quietly.'],
          ['Can I send to a bank that is not mine?',
           'Yes. A person on Tokkenly, a crypto wallet or any Nigerian account \u2014 one screen asks the question once.'],
        ] },

      { type: 'siblings', h: 'There is more in the app.', badge: 'letter', hSize: 34,
        pad: [20, 140], gap: 34, cardGap: 24,
        cards: ['tokenized-stocks', 'pay-bills', 'convert'] },

      { type: 'pclose', tall: true },
    ],
    close: ['Give out your details once.', 'Then get paid into the same app you invest and spend from.'],
    nav: 'Receive and send',
    title: 'Get paid. Get on with life.',
    lead:
      'Receive payments and transfers into Tokkenly. Put that money towards an investment, a bill, ' +
      'or someone who needs it.',
  },


  {
    slug: 'pay-bills',
    image: 'pb/receipt-portrait.webp',
    /* Frame 647:1611. A centred hero over a masked screenshot, the three
       bills as tiles, the receipt, the questions and the close. No sibling
       band on this one. */
    sections: [
      { type: 'phero', align: 'mid', pill: 'Pay bills', caps: true,
        h: 'Pay airtime, data and electricity without leaving Tokkenly.',
        lead: 'Your money is already here, so your bill payments can be too. The receipt keeps the token where you can find it again.',
        ctas: [['Pay a bill', 'ink', null]],
        height: 69.271, padTop: 190, hW: 85.395, leadW: 46.053,
        /* A photograph behind the words. The frame fades it out with a mask
           of its own, so the export already carries the fade and sits on the
           page's own ground: it goes in flat, at the mask group's box. */
        mask: { src: 'pb/hero-bulb.webp', l: 32.935, t: 35.729, w: 34.130, h: 33.371 },
        panel: { l: 39.167, t: 52.415, w: 21.719, pay: true,
          head: ['Ikeja Electric', '&#8358;5,000'],
          pairs: [['Meter', '4512 8890 22'], ['Type', 'Prepaid'],
                  ['Paying with', 'Naira'], ['Fee', '&#8358;0']],
          btn: 'Pay &#8358;5,000' } },

      { type: 'tiles3', h: 'What you can pay.',
        lead: 'The three that actually come up, paid from the balance you already hold.',
        btn: 'Pay a bill',
        tiles: [
          { grad: ['#2bbd9b', '#2bbd9b 40%', '#c7e1ff 62%', '#d1cbc2 80%', '#eaeae9 94%'],
            h: 'Airtime', p: 'Any Nigerian network. Your number is remembered, so the second time is one tap.',
            l: 19.467, w: 60.656,
            frag: { k: 'Airtime', v: '&#8358;1,000',
                    rows: [['Number', '0803 411 2290'], ['Network', 'MTN'], ['Saved', 'One tap next time']] } },
          { grad: ['#c7e1ff', '#c7e1ff 40%', '#f8c8ff 63%', '#d1cbc2 81%', '#eaeae9 94%'],
            h: 'Data', p: 'The screen says how much data and how long it lasts, not a price code you decode.',
            l: 12.500, w: 74.385,
            frag: { k: 'Data', v: '6GB \u00B7 30 days',
                    rows: [['Bundle', '6GB monthly'], ['Costs', '&#8358;2,500'], ['Expires', '30 days']] } },
          { grad: ['#f7b79a', '#f7b79a 42%', '#f8c8ff 64%', '#d1cbc2 82%', '#eaeae9 94%'],
            h: 'Electricity', p: 'Prepaid or postpaid. The token comes back on the receipt, where you can find it.',
            l: 14.549, w: 70.902,
            frag: { k: 'Token', v: '8842 1190\u2026',
                    rows: [['Meter', '4512 8890 22'], ['Type', 'Prepaid'], ['Kept in', 'Activity']] } },
        ] },

      { type: 'psplit', side: 'a', pill: 'After you pay', caps: true,
        cols: [46.711, 46.053, 7.237], h2: [68, 1.0735], gaps: [-22, -14],
        h: 'The receipt keeps\nthe token.',
        p: 'A token is no use if you cannot find it later. It sits on the receipt, in Activity.',
        btn: 'Open a receipt',
        stage: { photo: 'pb/receipt-portrait.webp', ratio: '700 / 800',
          panel: { l: 15.714, t: 57.875, w: 68.571, pay: true,
            head: ['Paid', '&#8358;5,000'],
            rows: [['Token', '8842 1190 5573 2041'], ['Meter', '4512 8890 22'], ['Kept in', 'Activity']],
            note: 'Open it again any time from Activity.' } } },

      /* The frame sizes the heading column to its own three lines (491) and
         leaves 200 before the questions. */
      { type: 'pfaq', h: 'A few things you might be wondering.', pad: [110, 120],
        cols: [32.323, 54.519, 13.158], h2: [82, 1.0732],
        items: [
          ['Which networks can I top up?',
           'All four Nigerian networks. The number you used last is remembered, so the second time is one tap.'],
          ['Where do I find a prepaid token again?',
           'On the receipt, and the receipt stays in Activity. You do not have to write it down.'],
          ['What happens if the biller is down?',
           'The payment does not go out and the money stays in your balance. The row says what happened.'],
          ['Can I pay a bill that is not mine?',
           'Yes. Any meter number or phone number \u2014 it does not have to be your own.'],
        ] },

      { type: 'pclose', tall: true },
    ],
    close: ['Clear the whole list in one app.',
            'Airtime, data and electricity, beside the rest of your money.', 'Pay a bill'],
    nav: 'Pay bills',
    title: 'One less thing on your list.',
    lead:
      'Take care of everyday bills in Tokkenly and get back to your day. Your money is already here. ' +
      'Your bill payments can be too.',
  },

  {
    slug: 'convert',
    image: 'pr/convert.webp',
    /* Frame 648:1611. The swap panel sits beside the words, then the two ways
       of doing it side by side over a portrait, the balances slab, the
       questions, the siblings and the close. */
    sections: [
      { type: 'phero', align: 'left', pill: 'Convert', caps: true,
        h: 'Move between naira and stablecoins.',
        lead: 'Type the amount in whichever currency you are already thinking in. The ' +
              'other one solves itself, and the rate on the screen is the rate you get.',
        ctas: [['See today\u2019s rate', 'ink', null]],
        height: 41.146, padTop: 176, padBot: 54, hW: 45.921, leadW: 45.921,
        hSize: [100, 1.06], gaps: [24, 48], leadLh: 1.55,
        /* Lilac at the top, the page's own ground at the foot. */
        wash: 'linear-gradient(to bottom, #f0d7f4, #f1d9f3 25%, #efdcf1 51%, ' +
              '#ede3ed 76%, #ebe6eb 89%, #eaeae9)',
        washH: 41.146,
        art: [['coin', 'cta/coin.webp', 85.630, 8.724, 10.625]],
        panel: { l: 61.406, t: 11.615, w: 29.167, pay: true,
          swap: [['You convert', '&#8358;25,000', 'Naira'], ['You get', '$16.67', 'USDC']],
          stack: [['Rate', '&#8358;1,500 to $1'], ['Held for', '89 seconds'], ['Fee', 'None']],
          btn: 'Convert' } },

      { type: 'cmp2',
        h: 'The way it usually goes,\nand the way it goes here.',
        lead: 'Same money, fewer apps and no arithmetic in the middle.',
        btn: 'See today\u2019s rate',
        photo: 'cv/compare-portrait.webp',
        a: { pill: 'Usually', items: [
          'Open a second app, or message someone',
          'Agree a rate you cannot see move',
          'Send, wait, and hope the other leg lands',
          'Work out what you actually got'] },
        b: { pill: 'In Tokkenly', items: [
          'Type the amount in either currency',
          'The rate is on the screen and counts down',
          'Both legs post in the same app',
          'The row says which stage it is at'] },
        frag: { k: 'Rate held', v: '89s',
                rows: [['You convert', '&#8358;25,000'], ['You get', '$16.67'], ['Fee', 'None']] } },

      { type: 'cvband',
        eyebrow: 'One amount, two faces',
        h: 'Type in either\ncurrency.',
        lead: '&#8358;25,000 and $16.67 are not two amounts. They are one amount wearing ' +
              'the two faces it is passing between, so you type whichever one you are ' +
              'thinking in and the other solves itself.',
        points: [
          ['The rate is held while you decide',
           'Ninety seconds, counted down on the screen. If you take longer, Tokkenly asks for a fresh one.'],
          ['Both balances stay yours', 'Before and after. Nothing leaves the app in between.'],
        ],
        btn: 'See what it costs',
        panel: { head: ['Your balances', '$1,024.86'],
          bar: [['Naira', '&#8358;312,000', 61.42], ['USDC', '$616.20', 37.63]],
          note: 'One balance becomes the other. Neither leaves Tokkenly.' } },

      { type: 'pfaq', h: 'A few things you might be wondering.', pad: [144, 144],
        cols: [32.895, 53.947, 13.158], h2: [82, 1.0732],
        items: [
          ['What if the rate moves while I am deciding?',
           'It does not. The rate you are shown is held for ninety seconds. If you take longer, Tokkenly asks for a fresh one rather than quietly using a different number.'],
          ['Can I convert straight into an investment?',
           'Yes. Convert, then buy \u2014 both are in the same app, and your balance does not leave it in between.'],
          ['Why does the second leg sometimes lag?',
           'The first leg posts immediately. The second lands when the desk settles it, and the row says which stage it is at.'],
          ['Is there a minimum?',
           'A small one, so a conversion is worth the network fee. The screen says what it is before you confirm.'],
        ] },

      { type: 'siblings', h: 'There is more in the app.', badge: 'letter', divided: true,
        pad: [20, 140], gap: 34, hSize: [32, 1.281],
        cards: ['tokenized-stocks', 'pay-bills', 'receive-and-send'] },

      { type: 'pclose', tall: true },
    ],
    close: ['See what the rate is today.',
            'Move between naira and stablecoins without leaving Tokkenly.', 'See today\u2019s rate'],
    nav: 'Convert',
    title: 'Change currencies. Keep your plans.',
    lead:
      'Move between naira and stablecoins for the way you want to use your money. Spend, send, or ' +
      'invest from one app.',
  },

  /* ---------------------------------------------------------- with a risk -- */
  {
    slug: 'borrow-and-earn',
    image: 'be/cloud.webp',
    /* Frame 560:1129. The frame merges earning and borrowing into one page: a
       hero with both panels on a stage, the two halves, three steps, the
       questions, the siblings and the close. */
    sections: [
      { type: 'behero', eyebrow: 'Borrow and earn',
        h: 'Earn more, or\nborrow against it.',
        lead: 'Earn on your stablecoins or borrow when you need flexibility.\n' +
              'Review the terms, choose an amount, and pick what fits your plans.',
        ctas: [['Get started', 'ink', null], ['See how it works', 'ghost', '#s-steps']],
        height: 78.021, padTop: 184, hW: 63.158, gaps: [18, 32],
        wash: ['#c7e1ff 0%', '#c7e1ff 20.5%', '#f8c8ff 58.5%', '#eaeae9 100%'], washH: 45.833,
        stage: {
          top: 36.146, cloud: { l: 30.000, t: 6.996, w: 33.789, h: 68.029 },
          panels: [
            { l: 5.921, t: 11.452, w: 36.842, spread: true,
              head: ['You are committing', '$500.00'],
              pairs: [['Rate', '5.2% a year'], ['Paid', 'Daily'],
                      ['Term', 'No lock-in'], ['End it', 'Any time']],
              note: 'Not a deposit, and not guaranteed. Rates change.',
              btn: 'Commit $500.00' },
            { l: 57.763, t: 33.953, w: 36.842,
              head: ['You are borrowing', '$200.00'],
              stack: [['Rate', '9.4% a year'], ['Costs you', 'About $1.57 a month'],
                      ['Repay', 'Any time, no fee'], ['Sold if shares fall below', '$812.00']],
              note: 'Your shares stay yours. They are only sold if they fall to that level.',
              btn: 'Borrow $200.00' },
          ] } },

      { type: 'halves', h: 'Two things to do with what you hold.',
        lead: 'Committed, spendable and owed are counted apart on every screen.',
        sides: [
          { pill: 'Earn',
            grad: ['#2bbd9b', '#2bbd9b 40%', '#c7d9ed 66%', '#d1cbc2 80%', '#eaeae9 94%'],
            h: 'You choose the amount.',
            p: 'Money at work and money you can spend are two different things. Tokkenly ' +
               'never adds them into one number.',
            btn: ['See earning terms', 'deep'],
            panel: { head: ['Your stablecoins', '$840.20'],
              bar: [['Committed $500.00', 49.837], ['Spendable $340.20', 50.163]],
              note: 'Earned so far: $4.31' } },
          { pill: 'Borrow', low: true,
            grad: ['#f7b79a', '#f7b79a 42%', '#f8c8ff 65%', '#d1cbc2 81%', '#eaeae9 94%'],
            h: 'What you hold stays yours.',
            p: 'What you hold backs the loan and keeps tracking its price. If it falls far ' +
               'enough, some may be sold.',
            btn: ['See what you could borrow', 'mint'],
            panel: { head: ['What you owe', '$201.57'],
              stack: [['Borrowed', '$200.00'], ['Interest so far', '$1.57'],
                      ['Backed by', '$1,624.00 in shares']],
              note: 'Sold if that falls below $812.00.' } },
        ] },

      { type: 'besteps', h: 'Start to finish.',
        /* The frame leaves these three cards empty. They carry the same
           written-out fragment the rest of the site uses, one per step. */
        steps: [
          { n: '01', fill: '#d9d5ce', h: 'See what is available',
            p: 'A figure based on what you hold, with the terms beside it.',
            frag: { k: 'You could borrow', v: '$812.00',
                    rows: [['Backed by', '$1,624.00'], ['Rate', '9.4% a year'], ['Ready', 'Now']] } },
          { n: '02', fill: 'linear-gradient(to bottom, #f8c8ff, #e0cbd9)', h: 'Read the cost',
            p: 'The rate, the total and the repayments, in money you can check.',
            frag: { k: 'Before you agree', v: '9.4%',
                    rows: [['You borrow', '$200.00'], ['A month', 'About $1.57'], ['Total', '$201.57']] } },
          { n: '03', fill: '#d9d5ce', h: 'Keep track',
            p: 'What you owe sits apart from what you have, so the two are never confused.',
            frag: { k: 'What you owe', v: '$201.57',
                    rows: [['Borrowed', '$200.00'], ['Interest so far', '$1.57'], ['Repay', 'Any time']] } },
        ] },

      { type: 'pfaq', loose: true, eyebrow: 'Questions', h: 'Worth asking.',
        items: [
          ['Is this a savings account?',
           'No. It is not a deposit, it is not guaranteed, and the rate can change. The terms say what it is and what it is not, and they are on the screen before you commit.'],
          ['Can I take it out?',
           'The terms say how and when. Most of what is here has no lock-in.'],
          ['What happens if I miss a repayment?',
           'The terms say, and they say it before you borrow. Interest keeps running, and if what backs the loan falls far enough, some of it may be sold.'],
          ['Does borrowing affect my investments?',
           'What you hold backs the loan and keeps tracking its price. You still own it, and you still get the moves — but it is spoken for while the loan is open.'],
        ] },

      { type: 'siblings', h: 'There is more in the app.', badge: 'letter', divided: true,
        pad: [20, 140], gap: 34, hSize: [32, 1.281],
        cards: ['tokenized-stocks', 'convert', 'receive-and-send'] },

      { type: 'pclose', pad: 96, h2: [58, 1.017] },
    ],
    close: ['See what you could earn, or borrow.',
            'The figure, the rate and the terms, before you agree to anything.', 'Get started'],
    nav: 'Borrow and earn',
    title: 'Earn more, or borrow against it.',
    lead:
      'Earn on your stablecoins or borrow when you need flexibility. Review the terms, choose an ' +
      'amount, and pick what fits your plans.',
  },
]
