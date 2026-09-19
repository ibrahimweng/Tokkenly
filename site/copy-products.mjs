/* The eight product pages, in words.
   ---------------------------------------------------------------------------
   Separated from build-products.mjs on purpose: this file is the one a person
   reads and edits. Nothing in it is HTML. The builder turns it into pages.

   Voice: the client's revised landing-page document (September 2026). Titles
   and leads are lifted from it verbatim where it has them; everything below
   that is drafted here and is the client's to cut. Where a page states a fact
   about how Tokkenly behaves — a limit, a method, a hold, a fee — the fact is
   the app's, not an invention: it is what app/src does.

   `spine` is the page's shape, and no two are the same.

   ---------------------------------------------------------------------------
   PANELS

   A `panel` is a small piece of the product, written out rather than
   photographed. The first version of these pages put whole 780x1600 phone
   screenshots on coloured slabs: 656px tall against a paragraph of 90 words,
   so the picture was four times the copy and no page fitted a screen.

   The landing page never shows a whole phone. It shows a receipt — the white
   panel on the two wide product cards — which is four rows and a button, is
   about 300 tall, and says more about what the product does than a screenshot
   of the screen it came from. That is what a panel is here.

   A panel is a list of blocks, in order:

     ['head', 'You are sending', '$120.00']     caps label over a figure
     ['rows', [[k, v], ...]]                    a sunken block of pairs
     ['pairs', [[k, v], ...]]                   the same, two across
     ['list', [[badge, name, sub, value, tone], ...]]
     ['swap', [[k, big, unit], [k, big, unit]]] two fields and a flip
     ['bar',  [[label, value, percent], ...]]   one bar, split by share
     ['note', 'small print']
     ['btn',  'Buy $50.00']

   Every figure below is one the app would actually show. */

export const APP_URL = 'https://app.tokkenly.com'   /* placeholder: the app is
   a separate Vercel project and is not deployed yet. Every Sign up on the site
   reads this one constant, so it is a one-line change when the URL is real. */

/* ------------------------------------------------------------- the props --
   The 3-D objects the landing page bleeds off the edge of its cards. Each
   placement is fitted once, here, and referred to by name, so a card asks for
   `coins` rather than carrying four percentages of its own. */
export const PROPS = {
  coins:   { src: 'ts/coins-us.webp',     l: '2.17%',   t: '19.447%', w: '74.552%', r: '3.25deg', w2: '56%' },
  dangote: { src: 'ts/coin-dangote.webp', l: '12.686%', t: '-8.232%', w: '59.298%', w2: '48%' },
  pen:     { src: 'ts/pen.webp',          l: '-1.018%', t: '-4.133%', w: '77.024%', w2: '62%', r2: '16deg' },
  penback: { src: 'ts/pen.webp',          l: '28.13%',  t: '40.355%', w: '52.795%', r: '-100.9deg', fx: -1 },
  notes:   { src: 'ts/notes-green.webp',  l: '-2%',     t: '8%',      w: '104%',    w2: '58%' },
  purple:  { src: 'pr/notes-purple.webp', l: '-6%',     t: '6%',      w: '112%',    w2: '58%' },
  /* The one object that is about its own page: a naira sign, a dollar sign,
     and the arrows between them. It is drawn small inside a lot of empty
     canvas, so it needs more of a slab than the others to read at all. */
  convert: { src: 'pr/convert.webp',      l: '-8%',     t: '-2%',     w: '116%',    w2: '94%', r2: '0deg' },
  coin:    { src: 'cta/coin.webp',        l: '18%',     t: '10%',     w: '64%',     w2: '50%' },
}

/* The money gun, the purse and the two duplicate note renders are in
   site/img and deliberately not listed: a toy gun on a page about sending
   money to family reads as a joke at the reader's expense, and `purse` and
   `naira` are the same drawing as `purple`. */

export const PRODUCTS = [
  /* ------------------------------------------------------------ flagship -- */
  {
    slug: 'tokenized-stocks',
    close: ['Make your next investment now.', 'Explore tokenized stocks with Tokkenly and bring the rest of your money along.'],
    nav: 'Tokenized Stocks',
    eyebrow: 'Tokenized Stocks',
    title: 'From Nigeria to Wall Street.',
    lead:
      'The companies on your radar can be part of your portfolio. Invest in tokenized stocks linked ' +
      'to companies listed in Nigeria and the US, right from Tokkenly.',
    stage: 'stage-mint',
    prop: 'coins',
    panel: [
      ['head', 'You are buying', '$50.00'],
      ['pairs', [['Company', 'Apple &#183; AAPLc'], ['Price', '$226.40'],
                 ['You get', '0.2208 AAPLc'], ['Fee', 'No fee']]],
      ['btn', 'Buy $50.00'],
    ],
    /* ---------------------------------------------------------------------
       The frame (529:681) redraws this page around seven bands rather than
       the old spine. `sections` is what the builder reads when it is here;
       `spine` below is the previous page and stays until every product has
       been rebuilt, so the site keeps building one page at a time. */
    sections: [
      { type: 'phero',
        eyebrow: 'Tokenized Stocks',
        h: 'Invest in Nigerian\nand US Stocks',
        lead: 'The companies on your radar can be part of your portfolio. Invest in tokenized stocks linked to companies listed in Nigeria and the US, right from Tokkenly.',
        ctas: [['Get Started', 'ink', null], ['See how it works', 'white', '#more']],
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
                   ['N', 'NVIDIA', 'NVDAc', '$184.20']] },
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
        cards: [
          ['gifting-and-rewards', 'gift', 'Gifting &amp; Rewards', 'Make their day. Start their portfolio.', 'Explore Gifting &amp; Rewards'],
          ['receive', 'updown', 'Receive and send', 'Get paid. Make someone\u2019s day.', 'Explore Receive and send'],
          ['earn', 'split', 'Borrow and earn', 'Put it to work, or borrow against it.', 'Explore Borrow and earn'],
        ] },

      { type: 'pclose' },
    ],

    spine: [
      { type: 'stats', head: 'Two markets, one list.', items: [
        ['2', 'markets', 'Nigerian and US companies in the same search.'],
        ['24/7', 'trading', 'Tokenised, so the market does not keep office hours.'],
        ['$1', 'to start', 'Buy a slice. You do not have to afford a whole share.'],
      ] },
      { type: 'bento', eyebrow: 'What you actually do', head: 'Three screens, and you own a slice.',
        lead: 'No brokerage account in another country. No minimum you have to save up for.',
        rows: [
          ['a',
           { chip: 'mint', icon: 'search', h: 'Find the company, not the ticker.',
             p: ['Search a name and Tokkenly finds it. AAPLc is Apple, DANGCEMc is Dangote Cement, and the list says which is which rather than making you know.',
                 'Nigerian and US companies come back in the same list, in the same search, so you are not choosing a market before you have chosen a company.'],
             panel: [['list', [
               ['A', 'Apple', 'AAPLc', '$226.40', 'up'],
               ['D', 'Dangote Cement', 'DANGCEMc', '&#8358;512.00', 'up'],
               ['T', 'Tesla', 'TSLAc', '$412.90', 'down'],
             ]]] },
           { chip: 'yellow', icon: 'book', h: 'Read it before you buy it.',
             p: ['Every tokenized stock has a page saying what it represents, what it costs and what can go wrong. In front of you before you commit, not linked from a footnote.'],
             prop: 'purple' }],
          ['b',
           { chip: 'orange', icon: 'clock', h: 'Buy a slice, not a share.',
             p: ['An amount of money, not a number of shares. A dollar is a real starting position.'],
             prop: 'coins' },
           { chip: 'mint', icon: 'wallet', h: 'Keep it with the rest of your money.',
             p: ['Your holdings, your naira and your stablecoins sit in one place. Sell, convert, send or pay a bill without moving money between apps first.',
                 'What is invested and what is spendable are counted separately on every screen, so one is never mistaken for the other.'],
             panel: [['head', 'Your portfolio', '$1,284.60'],
                     ['rows', [['In tokenized stocks', '$444.40'], ['Spendable', '$340.20'], ['Committed to earn', '$500.00']]]] }],
        ] },
      { type: 'facts', head: 'The plain version.', rows: [
        ['What you own', 'A tokenized stock that tracks the company’s share price. Not the share itself, and not a vote at its AGM.'],
        ['What it costs', 'The price on the screen. Any fee is stated on the same screen before you confirm.'],
        ['When you can sell', 'Any time the product is open for trading. Some are marked Not open yet and say so on the row.'],
        ['Where the money goes', 'Into your Tokkenly balance, in the currency you sold for.'],
      ] },
      { type: 'risk' },
      { type: 'faq', items: [
        ['Do I own the actual share?',
         'No. You own a tokenized stock that tracks the share price. What it represents is written on the product’s own page, and it is worth reading before you buy.'],
        ['What happens if the company’s price falls?',
         'Your holding falls with it. Investments can lose value, and Tokkenly does not guarantee a return.'],
        ['Can I buy part of a share?',
         'Yes. You choose an amount of money rather than a number of shares.'],
      ] },
      { type: 'related' },
    ],
  },

  /* ------------------------------------------------------------ new page -- */
  {
    slug: 'gifting-and-rewards',
    /* Frame 640:1611. Seven bands: a hero with the words on the left and a
       portrait running off the right, two ways to give, the unlock, three
       steps, the questions, the siblings and the close. */
    sections: [
      { type: 'phero', align: 'left', h: 'Give stocks as gifts or rewards',
        lead: 'Give tokenized stocks for birthdays, graduations, or just because.\nReward customers through referrals, cashback, and loyalty programs.',
        ctas: [['Get Started', 'ink', null], ['See how it works', 'white', '#more']],
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
        p: 'Pick a company they will recognise, write a line, and set the day it opens. A gift with a date on it arrives twice \u2014 once when it lands, and once when it unlocks.',
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

      { type: 'pfaq', h: 'A few things you might be wondering.',
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

      { type: 'siblings', h: 'There is more in the app.', badge: 'letter', hSize: 34,
        gap: 34, cardGap: 24,
        cards: [
          ['tokenized-stocks', 'T', 'Tokenized stocks', 'Invest in Nigerian and US companies from one app.', 'Explore tokenized stocks'],
          ['receive', 'R', 'Receive and send', 'Get paid into Tokkenly, and send from the same place.', 'Explore receive and send'],
          ['earn', 'B', 'Borrow and earn', 'Put stablecoins to work, or borrow against what you hold.', 'Explore borrow and earn'],
        ] },

      { type: 'pclose', tall: true },
    ],
    close: ['Give something that grows.', 'Pick a company, set the day it opens, and let the gift do the rest.'],
    nav: 'Gifting &amp; Rewards',
    eyebrow: 'Gifting and Rewards',
    title: 'Make their day. Start their portfolio.',
    lead:
      'Give tokenized stocks for birthdays, graduations, or just because. Reward customers through ' +
      'referrals, cashback, and loyalty programs.',
    stage: 'stage-peach',
    prop: 'dangote',
    panel: [
      ['head', 'You are gifting', '$25.00'],
      ['pairs', [['To', 'Chidi Umeh'], ['Gift', 'Apple &#183; AAPLc'],
                 ['Unlocks', '14 March 2027'], ['Fee', 'No fee']]],
      ['note', '&#8220;Happy birthday. Start somewhere.&#8221;'],
      ['btn', 'Send gift'],
    ],
    spine: [
      { type: 'split', side: 'b',
        eyebrow: 'A gift with a date on it',
        head: 'Worth something<br />in ten years.',
        lead:
          'Pick a company they will recognise, write a line, and set the day it opens. A gift with a ' +
          'date on it is a gift twice: once when it arrives, once when it unlocks.',
        points: [
          ['Any tokenized stock on Tokkenly', 'A slice is fine. You do not have to give a whole share.'],
          ['Now, or on the day that matters', 'Send it today or set it for a birthday two years out.'],
        ],
        cta: ['See what you could give', '#s-steps'],
        stage: 'stage-mint', prop: 'purple',
        panel: [['head', 'Unlocks in', '540 days'],
                ['rows', [['Gift', 'Apple &#183; AAPLc'], ['From', 'Aunty Ngozi'], ['Opens', '14 March 2027']]],
                ['note', 'Until then it sits in their portfolio and keeps tracking the price.']] },
      { type: 'two', head: 'Two ways to give.', cols: [
        ['For people you know',
         'A birthday, a graduation, a new job, or no occasion at all. They get something that is ' +
         'still worth something in ten years.',
         ['Choose any tokenized stock on Tokkenly',
          'Set a future unlock date, or send it now',
          'They open an account to claim it'] ],
        ['For people who buy from you',
         'Referrals, cashback and loyalty, paid in tokenized stocks instead of points nobody ' +
         'redeems. A reward that grows is a reward people remember.',
         ['Pay rewards in tokenized stocks',
          'Set it per referral, per order or per tier',
          'Your customers keep it in their own Tokkenly account'] ],
      ] },
      { type: 'steps', head: 'How a gift travels.', items: [
        ['Pick what to give', 'Choose a tokenized stock and an amount. A slice is fine — you do not have to give a whole share.'],
        ['Say when it opens', 'Send it now, or set a date. Until that day it sits in their portfolio, tracking the price.'],
        ['They claim it', 'They get a link, open an account, and it lands in their portfolio. Theirs to keep, sell or add to.'],
      ] },
      { type: 'faq', items: [
        ['What if they already use Tokkenly?',
         'It lands straight in their portfolio. No link to claim, no account to open.'],
        ['Can I take a gift back?',
         'Not once it has been claimed. Before it is claimed, an unclaimed gift returns to you.'],
        ['Is a gift taxed?',
         'That depends on where the two of you are and what you do with it. Tokkenly does not give tax advice — talk to someone who does.'],
      ] },
      { type: 'related' },
    ],
  },

  /* ------------------------------------------------------------- everyday -- */
  {
    slug: 'receive',
    /* Frame 644:1611. The frame merges receive and send into one page: the
       hero, then money in and money out side by side, then what happens while
       it is moving, then the questions, the siblings and the close. */
    sections: [
      { type: 'phero', align: 'left', eyebrow: 'Receive and send',
        h: 'Receive and send money',
        lead: 'Get paid, support loved ones, or move money where you need it.\nKeep it in Tokkenly, ready for whatever comes next.',
        ctas: [['Get Started', 'ink', null], ['See how it works', 'white', '#more']],
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
        btn: 'Signup now',
        rows: [
          [{ wide: true, bg: '#d1cbc2', h: 'It says where it actually is.',
             p: 'In route, at the bank, not landed yet \u2014 not a balance that jumps with no explanation.',
             mini: [['Sent', '14:02'], ['At the bank', '14:03'], ['Landed', '\u2014']] },
           { grad: ['#d1cbc2', '#fac6ff'], h: 'Still moving is not spendable.',
             p: 'The screen keeps the two apart until it lands, so one is never mistaken for the other.' }],
          [{ grad: ['#d1cbc2', '#c8e1ff'], h: 'It ends in a receipt.',
             p: 'When it lands the row becomes a record you can find again in Activity.' },
           { wide: true, bg: '#d1cbc2', foot: true, h: 'Your limit is on the screen.',
             p: 'Until your identity check is done, outgoing payments are capped \u2014 and the cap is shown rather than discovered when a payment fails.',
             mini: [['Sent today', '$120.00'], ['Daily cap', '$500.00'], ['Left today', '$380.00']] }],
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
        cards: [
          ['tokenized-stocks', 'T', 'Tokenized stocks', 'Invest in Nigerian and US companies from one app.', 'Explore tokenized stocks'],
          ['pay-bills', 'P', 'Pay bills', 'Airtime, data and electricity from the balance you hold.', 'Explore pay bills'],
          ['convert', 'C', 'Convert', 'Move between naira and stablecoins without leaving the app.', 'Explore convert'],
        ] },

      { type: 'pclose', tall: true },
    ],
    close: ['Give out your details once.', 'Then get paid into the same app you invest and spend from.'],
    nav: 'Receive',
    eyebrow: 'Receive',
    title: 'Get paid. Get on with life.',
    lead:
      'Receive payments and transfers into Tokkenly. Put that money towards an investment, a bill, ' +
      'or someone who needs it.',
    stage: 'stage-yellow',
    prop: 'purple',
    panel: [
      ['head', 'Your account number', '7043 118 220'],
      ['pairs', [['Bank', 'Wema Bank'], ['Name', 'Amara Nwosu'],
                 ['Currency', 'Naira'], ['To receive', 'No fee']]],
      ['btn', 'Copy details'],
    ],
    spine: [
      { type: 'bento', eyebrow: 'Three ways in', head: 'However they pay you.',
        lead: 'A bank transfer, a wallet, or a card. All of it lands in the same balance.',
        rows: [
          ['b',
           { chip: 'yellow', icon: 'card', h: 'A debit card',
             p: ['Top up from a card you already hold. Paused while we finish the checks — and the screen says so rather than failing quietly.'],
             prop: 'notes' },
           { chip: 'mint', icon: 'down', h: 'A Nigerian account, and a wallet address.',
             p: ['Your own account number, in your own name, at a Nigerian bank. Anyone who can send a transfer can pay you.',
                 'For stablecoins, an address on the network you pick. It is yours, it does not change, and you can hand it out once.'],
             panel: [['list', [
               ['N', 'Wema Bank', '7043 118 220 &#183; Amara Nwosu', 'Naira', 'flat'],
               ['B', 'Base', '0x7a2f&#8230;4c19', 'USDC', 'flat'],
               ['T', 'Tron', 'TJmv&#8230;9Qp4', 'USDT', 'flat'],
             ]]] }],
        ] },
      { type: 'trio', eyebrow: 'While it is moving', head: 'Money in transit gets a row of its own.',
        cards: [
          ['It says where it actually is', 'In route, at the bank, not landed yet. Not a balance that jumps with no explanation.', 'notes'],
          ['It is counted honestly', 'Money still moving is not spendable, and the screen keeps the two apart until it lands.', 'penback,pen'],
          ['It ends in a receipt', 'When it lands the row becomes a record you can find again in Activity.', 'purple'],
        ] },
      { type: 'facts', head: 'Before you ask.', rows: [
        ['What it costs', 'Nothing to receive.'],
        ['How long it takes', 'A Nigerian transfer is usually minutes. A crypto transfer takes as long as the network does.'],
        ['What you need first', 'An account and a completed NIN or BVN check. Nigerian law requires it before you can hold a balance.'],
      ] },
      { type: 'related' },
    ],
  },

  {
    slug: 'send',
    close: ['Send your first one today.', 'From the same app you keep, invest and spend your money in.'],
    nav: 'Send',
    eyebrow: 'Send',
    title: 'Make someone’s day.',
    lead:
      'Help family out. Pay a friend back. Send money from the same app where you keep and invest it.',
    stage: 'stage-mint',
    prop: 'coin',
    panel: [
      ['head', 'You are sending', '$120.00'],
      ['pairs', [['To', 'Adaeze Okonkwo'], ['Paying with', 'USDC'],
                 ['They receive', '$120.00'], ['Fee', 'No fee']]],
      ['rows', [['Arrives', 'In about a minute']]],
      ['btn', 'Send $120.00'],
    ],
    spine: [
      { type: 'split', side: 'a',
        eyebrow: 'One screen, one question',
        head: 'Where is it<br />going?',
        lead:
          'A person on Tokkenly, a crypto wallet, or a Nigerian bank account. Tokkenly asks once, ' +
          'then gets out of the way.',
        points: [
          ['It shows what you have', 'And will not let you send past it, so nothing bounces at the last step.'],
          ['The fee is in money', 'Stated on the screen before you confirm, not a percentage you have to work out.'],
        ],
        cta: ['Read the rules', '#s-facts'],
        stage: 'stage-sand', prop: 'purple',
        panel: [['list', [
          ['A', 'Adaeze Okonkwo', 'On Tokkenly', 'Instant', 'flat'],
          ['W', 'A crypto wallet', 'Base &#183; USDC', 'Network fee', 'flat'],
          ['B', 'A Nigerian account', 'GTBank &#183; 0221&#8230;', 'Minutes', 'flat'],
        ]]] },
      { type: 'steps', head: 'Three taps, not three apps.', items: [
        ['Say where it goes', 'A person, a wallet, or a bank account. One screen asks the question once.'],
        ['Say how much', 'Type it or pick it. Tokkenly shows what you have and will not let you send past it.'],
        ['Send it', 'It leaves, and the row it makes says where it has got to until it lands.'],
      ] },
      { type: 'facts', head: 'The rules, stated once.', rows: [
        ['Who you can send to', 'Another Tokkenly account, a crypto wallet, or a Nigerian bank account.'],
        ['What it costs', 'The fee is on the screen before you confirm, in money — not a percentage you have to work out.'],
        ['Your limit', 'Until your identity check is done, outgoing payments are capped. The cap is shown on the screen rather than discovered when a payment fails.'],
        ['Sending shares', 'You can send a tokenized stock to another Tokkenly user from the holding itself.'],
      ] },
      { type: 'quote', text:
        'Moving your own money between your own balances is not sending it. Converting naira to ' +
        'dollars inside Tokkenly does not touch your sending limit.' },
      { type: 'related' },
    ],
  },

  {
    slug: 'pay-bills',
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
    eyebrow: 'Pay bills',
    title: 'One less thing on your list.',
    lead:
      'Take care of everyday bills in Tokkenly and get back to your day. Your money is already here. ' +
      'Your bill payments can be too.',
    stage: 'stage-sand',
    prop: 'notes',
    panel: [
      ['head', 'Ikeja Electric', '&#8358;5,000'],
      ['pairs', [['Meter', '4512 8890 22'], ['Type', 'Prepaid'],
                 ['Paying with', 'Naira'], ['Fee', '&#8358;0']]],
      ['btn', 'Pay &#8358;5,000'],
    ],
    spine: [
      { type: 'trio', eyebrow: 'What you can pay', head: 'Airtime, data, and the light bill.',
        cards: [
          ['Airtime', 'Any Nigerian network. Your number is remembered, so the second time is one tap.', 'purple'],
          ['Data', 'Pick the bundle, not the price code. The screen says what you are buying.', 'penback,pen'],
          ['Electricity', 'Prepaid or postpaid. The token comes back on the receipt, where you can find it again.', 'notes'],
        ] },
      { type: 'compare', head: 'Why it is here and not somewhere else.',
        before: ['Open a different app', 'Fund it from your bank', 'Wait for the transfer', 'Then pay the bill', 'Keep the receipt somewhere'],
        after: ['Open Tokkenly', 'Pay the bill', 'The receipt is in Activity'] },
      { type: 'bento', eyebrow: 'After you pay', head: 'The token does not go missing.',
        lead: 'A receipt you can open again, and a failure that says what happened.',
        rows: [
          ['a',
           { chip: 'mint', icon: 'receipt', h: 'The receipt keeps the number.',
             p: ['A prepaid token is no use if you cannot find it twenty minutes later. It sits on the receipt, in Activity, where you left it.',
                 'So does the meter number, the amount and the date, which is the difference between a payment and a piece of paper you have lost.'],
             panel: [['head', 'Paid', '&#8358;5,000'],
                     ['rows', [['Token', '8842 1190 5573 2041'], ['Meter', '4512 8890 22'], ['Kept in', 'Activity']]]] },
           { chip: 'orange', icon: 'back', h: 'A failure is a row, not a silence.',
             p: ['If a payment does not go through the money comes back, and Activity says so.'],
             prop: 'coins' }],
        ] },
      { type: 'facts', head: 'Details.', rows: [
        ['What it costs', 'The bill, and any fee stated on the screen before you confirm.'],
        ['What you pay with', 'Any balance you hold. Pick a default once and it stops asking.'],
        ['If it fails', 'The money comes back. A failed payment is a row in Activity that says what happened, not a silence.'],
      ] },
      { type: 'related' },
    ],
  },

  {
    slug: 'convert',
    close: ['See what the rate is today.', 'Move between naira and stablecoins without leaving Tokkenly.'],
    nav: 'Convert',
    eyebrow: 'Convert',
    title: 'Change currencies. Keep your plans.',
    lead:
      'Move between naira and stablecoins for the way you want to use your money. Spend, send, or ' +
      'invest from one app.',
    stage: 'stage-peach',
    prop: 'notes',
    panel: [
      ['swap', [['You convert', '&#8358;25,000', 'Naira'], ['You get', '$16.67', 'USDC']]],
      ['rows', [['Rate', '&#8358;1,500 to $1'], ['Held for', '89 seconds'], ['Fee', 'None']]],
      ['btn', 'Convert'],
    ],
    spine: [
      { type: 'compare', head: 'The way it usually goes.',
        before: ['Ask around for a rate', 'Send naira and hope', 'Wait, and ask again', 'Find out the rate moved'],
        after: ['See the rate', 'It is held for ninety seconds', 'Convert', 'Both balances are yours, before and after'] },
      { type: 'split', side: 'b',
        eyebrow: 'One amount, two faces',
        head: 'Type in either<br />currency.',
        lead:
          '&#8358;25,000 and $16.67 are not two amounts. They are one amount wearing the two faces it ' +
          'is passing between, so you type whichever one you are thinking in and the other solves itself.',
        points: [
          ['The rate is held while you decide', 'Ninety seconds, counted down on the screen. If you take longer, Tokkenly asks for a fresh one.'],
          ['Both balances stay yours', 'Before and after. Nothing leaves the app in between.'],
        ],
        cta: ['See what it costs', '#s-facts'],
        stage: 'stage-deep', prop: 'coin',
        panel: [['head', 'Your balances', '$1,024.86'],
                ['bar', [['Naira', '&#8358;312,000', 62], ['USDC', '$616.20', 38]]],
                ['note', 'One balance becomes the other. Neither leaves Tokkenly.']] },
      { type: 'facts', head: 'What it costs you.', rows: [
        ['Fee', 'None.'],
        ['Rate', 'The one on the screen. It is held for ninety seconds while you decide, and the screen counts it down.'],
        ['Your limits', 'Untouched. Moving your own money between your own balances is not a payment out of your account.'],
        ['How long', 'The first leg posts immediately. The second lands when the desk settles it, and the row says which stage it is at.'],
      ] },
      { type: 'faq', items: [
        ['What if the rate moves while I am deciding?',
         'It does not. The rate you are shown is held for ninety seconds. If you take longer, Tokkenly asks for a fresh one rather than quietly using a different number.'],
        ['Can I convert straight into an investment?',
         'Yes. Convert, then buy — both are in the same app and your balance does not leave it in between.'],
      ] },
      { type: 'related' },
    ],
  },

  /* ---------------------------------------------------------- with a risk -- */
  {
    slug: 'earn',
    close: ['Put some of it to work.', 'Read the terms, choose an amount, and keep track in Tokkenly.'],
    nav: 'Earn',
    eyebrow: 'Earn',
    title: 'Put idle stablecoins to work.',
    lead:
      'Explore earning opportunities for the stablecoins you hold. Review the terms, choose an ' +
      'amount, and keep track in Tokkenly.',
    stage: 'stage-deep',
    prop: 'pen',
    panel: [
      ['head', 'You are committing', '$500.00'],
      ['pairs', [['Rate', '5.2% a year'], ['Paid', 'Daily'],
                 ['Term', 'No lock-in'], ['End it', 'Any time']]],
      ['note', 'Not a deposit, and not guaranteed. Rates change.'],
      ['btn', 'Commit $500.00'],
    ],
    spine: [
      { type: 'risk', lead: true },
      { type: 'bento', eyebrow: 'How it works', head: 'You choose the amount.<br />Not the whole balance.',
        lead: 'What is committed is shown apart from what is not, so you always know which is which.',
        rows: [
          ['a',
           { chip: 'mint', icon: 'split', h: 'Committed and spendable, side by side.',
             p: ['Money at work and money you can spend are two different things, and Tokkenly never adds them up into one comforting number.',
                 'End it and the commitment comes back to spendable, on the terms you were shown before you started.'],
             panel: [['head', 'Your stablecoins', '$840.20'],
                     ['bar', [['Committed', '$500.00', 60], ['Spendable', '$340.20', 40]]],
                     ['note', 'Earned so far: $4.31']] },
           { chip: 'yellow', icon: 'book', h: 'The terms are on the screen.',
             p: ['The rate, what it is paid on, and what you have to do to get your money back. Before you agree, not after.'],
             prop: 'purple' }],
        ] },
      { type: 'facts', head: 'Plainly.', rows: [
        ['What you commit', 'Stablecoins you already hold.'],
        ['What you are told first', 'The rate, the term, and how to end it.'],
        ['What is not promised', 'A return. Rates change and this is not a deposit.'],
      ] },
      { type: 'faq', items: [
        ['Is this a savings account?',
         'No. It is not a deposit, it is not guaranteed, and it is not protected the way a bank deposit is. That is the honest answer and it is on the screen too.'],
        ['Can I take it out?',
         'The terms say how and when, and they are shown before you commit.'],
      ] },
      { type: 'related' },
    ],
  },

  {
    slug: 'borrow',
    close: ['Find out what you could borrow.', 'The figure, the rate and the terms, before you agree to anything.'],
    nav: 'Borrow',
    eyebrow: 'Borrow',
    title: 'Give yourself some breathing room.',
    lead:
      'When you need extra funds, explore borrowing in Tokkenly. Review the costs and repayment ' +
      'terms before choosing what works for you.',
    stage: 'stage-yellow',
    prop: 'dangote',
    panel: [
      ['head', 'You are borrowing', '$200.00'],
      ['rows', [['Rate', '9.4% a year'], ['Costs you', 'About $1.57 a month'],
                ['Repay', 'Any time, no fee'], ['Sold if shares fall below', '$812.00']]],
      ['note', 'Your shares stay yours and keep earning. We only sell if they fall to that level.'],
      ['btn', 'Borrow $200.00'],
    ],
    spine: [
      { type: 'risk', lead: true },
      { type: 'split', side: 'a',
        eyebrow: 'What backs it',
        head: 'Your shares stay<br />yours.',
        lead:
          'What you hold backs the loan and keeps tracking its price while you owe. If it falls far ' +
          'enough, some of it may be sold to cover the loan — said here rather than found out later.',
        points: [
          ['The level is a number, not a feeling', 'Tokkenly shows the price your holding would have to fall to, before you borrow.'],
          ['What you owe sits apart', 'It is never mixed into what you have, on any screen.'],
        ],
        cta: ['Read the terms', '#s-facts'],
        stage: 'stage-mint', prop: 'coin',
        panel: [['head', 'What you owe', '$201.57'],
                ['rows', [['Borrowed', '$200.00'], ['Interest so far', '$1.57'], ['Backed by', '$1,624.00 in shares']]],
                ['note', 'Sold if that falls below $812.00.']] },
      { type: 'facts', head: 'What you are agreeing to.', rows: [
        ['How much', 'What you can borrow is shown as a figure, not a promise. It depends on what you hold.'],
        ['What it costs', 'The rate and the total, in money, before you agree.'],
        ['Paying it back', 'The schedule is on the screen. So is what happens if you do not keep to it.'],
        ['What backs it', 'What you hold. If its value falls far enough, some of it may be sold to cover the loan.'],
      ] },
      { type: 'steps', head: 'Start to finish.', items: [
        ['See what is available', 'A figure based on what you hold, with the terms beside it.'],
        ['Read the cost', 'The rate, the total and the repayments, in money you can check.'],
        ['Keep track', 'What you owe sits apart from what you have, so the two are never confused.'],
      ] },
      { type: 'faq', items: [
        ['What happens if I miss a repayment?',
         'The terms say, and they say it before you borrow. Missing repayments costs money and can mean some of what you hold is sold.'],
        ['Does borrowing affect my investments?',
         'What you hold backs the loan, so yes — it is not free of consequence. The screen shows what is pledged.'],
      ] },
      { type: 'related' },
    ],
  },
]
