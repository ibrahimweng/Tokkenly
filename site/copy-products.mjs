/* The eight product pages, in words.
   ---------------------------------------------------------------------------
   Separated from build-products.mjs on purpose: this file is the one a person
   reads and edits. Nothing in it is HTML. The builder turns it into pages.

   Voice: the client's revised landing-page document (September 2026). Titles
   and leads are lifted from it verbatim where it has them; everything below
   that is drafted here and is the client's to cut. Where a page states a fact
   about how Tokkenly behaves — a limit, a method, a hold, a fee — the fact is
   the app's, not an invention: it is what app/src does.

   `spine` is the page's shape, and no two are the same. That is the point.
   The old build gave all seven pages one template and the only difference
   between Convert and Pay bills was the sentences. */

export const APP_URL = 'https://app.tokkenly.com'   /* placeholder: the app is
   a separate Vercel project and is not deployed yet. Every Sign up on the site
   reads this one constant, so it is a one-line change when the URL is real. */

export const PRODUCTS = [
  /* ------------------------------------------------------------ flagship -- */
  {
    slug: 'tokenized-stocks',
    nav: 'Tokenized Stocks',
    eyebrow: 'Tokenized Stocks',
    title: 'From Nigeria to Wall Street.',
    lead:
      'The companies on your radar can be part of your portfolio. Invest in tokenized stocks linked ' +
      'to companies listed in Nigeria and the US, right from Tokkenly.',
    stage: 'stage-mint',
    shot: 'p-invest.webp',
    shotAlt: 'The Invest screen, listing tokenized stocks available to browse.',
    spine: [
      { type: 'stats', head: 'Two markets, one list.', items: [
        ['2', 'markets', 'Nigerian and US companies in the same search.'],
        ['24/7', 'trading', 'Tokenised, so the market does not keep office hours.'],
        ['$1', 'to start', 'Buy a slice. You do not have to afford a whole share.'],
      ] },
      { type: 'alt', head: 'What you actually do.', rows: [
        ['Find the company, not the ticker.',
         'Search a name and Tokkenly finds it. AAPLc is Apple, DANGCEMc is Dangote Cement, and the ' +
         'list says which is which rather than making you know.',
         'p-invest.webp', 'The Invest screen with a search for a company.'],
        ['Read the product before you buy it.',
         'Every tokenized stock has a page saying what it represents, what it costs and what can go ' +
         'wrong. It is in front of you before you commit, not linked from a footnote.',
         'stock.webp', 'A company screen with its price, details and terms.'],
        ['Keep it with the rest of your money.',
         'Your holdings, your naira and your stablecoins sit in one place. Sell, convert, send or pay ' +
         'a bill without moving money between apps first.',
         'p-wallet.webp', 'The Wallet screen with a spendable balance.'],
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

  /* -------------------------------------------------------------- new page -- */
  {
    slug: 'gifting-and-rewards',
    nav: 'Gifting &amp; Rewards',
    eyebrow: 'Gifting and Rewards',
    title: 'Make their day. Start their portfolio.',
    lead:
      'Give tokenized stocks for birthdays, graduations, or just because. Reward customers through ' +
      'referrals, cashback, and loyalty programs. Choose a future unlock date for a special occasion, ' +
      'or let every reward add to their portfolio.',
    stage: 'stage-peach',
    shot: 'p-gift.webp',
    shotAlt: 'The gifting screen, choosing a tokenized stock to send to someone.',
    spine: [
      { type: 'two', head: 'Two ways to give.', cols: [
        ['For people you know',
         'A birthday, a graduation, a new job, or no occasion at all. Pick a company they will ' +
         'recognise, write a line, and set the day it unlocks. They get something that is still worth ' +
         'something in ten years.',
         ['Choose any tokenized stock on Tokkenly',
          'Set a future unlock date, or send it now',
          'They open an account to claim it'] ],
        ['For people who buy from you',
         'Referrals, cashback and loyalty, paid in tokenized stocks instead of points nobody redeems. ' +
         'A reward that grows is a reward people remember.',
         ['Pay rewards in tokenized stocks',
          'Set it per referral, per order or per tier',
          'Your customers keep it in their own Tokkenly account'] ],
      ] },
      { type: 'steps', head: 'How a gift travels.', items: [
        ['Pick what to give', 'Choose a tokenized stock and an amount. A slice is fine — you do not have to give a whole share.', 'p-invest.webp'],
        ['Say when it opens', 'Send it now, or set a date. A gift with a date on it is a gift twice: once when it arrives, once when it opens.', 'p-gift.webp'],
        ['They claim it', 'They get a link, open an account, and it lands in their portfolio. From there it is theirs to keep, sell or add to.', 'p-signup.webp'],
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
    nav: 'Receive',
    eyebrow: 'Receive',
    title: 'Get paid. Get on with life.',
    lead:
      'Receive payments and transfers into Tokkenly. Put that money towards an investment, a bill, ' +
      'or someone who needs it.',
    stage: 'stage-yellow',
    shot: 'p-receive.webp',
    shotAlt: 'The Receive screen, showing the ways money can arrive.',
    spine: [
      { type: 'grid', head: 'Three ways in.', items: [
        ['A Nigerian bank account', 'Your own account number, in your own name, at a Nigerian bank. Anyone who can send a transfer can pay you.'],
        ['A crypto wallet', 'USDC or USDT, on the network you pick. The address is yours and it does not change.'],
        ['A debit card', 'Top up from a card you already hold. Paused while we finish the checks — the screen says so.'],
      ] },
      { type: 'alt', head: 'What happens when money lands.', rows: [
        ['You see it move before it settles.',
         'Money in transit gets a row of its own that says where it actually is — in route, at the bank, not landed yet. Not a balance that jumps with no explanation.',
         'p-addmoney.webp', 'The Add money screen with the account details to send naira to.'],
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
    nav: 'Send',
    eyebrow: 'Send',
    title: 'Make someone’s day.',
    lead:
      'Help family out. Pay a friend back. Send money from the same app where you keep and invest it.',
    stage: 'stage-mint',
    shot: 'p-send.webp',
    shotAlt: 'The Send screen, choosing where the money goes.',
    spine: [
      { type: 'steps', head: 'Three taps, not three apps.', items: [
        ['Say where it goes', 'A person on Tokkenly, a crypto wallet, or a Nigerian bank account. One screen asks the question once.', 'p-send.webp'],
        ['Say how much', 'Type it or pick it. Tokkenly shows what you have and will not let you send past it.', 'p-wallet.webp'],
        ['Send it', 'It leaves, and the row it makes says where it has got to until it lands.', 'p-home.webp'],
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
    nav: 'Pay bills',
    eyebrow: 'Pay bills',
    title: 'One less thing on your list.',
    lead:
      'Take care of everyday bills in Tokkenly and get back to your day. Your money is already here. ' +
      'Your bill payments can be too.',
    stage: 'stage-sand',
    shot: 'p-bills.webp',
    shotAlt: 'The Spend screen, showing airtime, data and electricity.',
    spine: [
      { type: 'grid', head: 'What you can pay.', items: [
        ['Airtime', 'Any Nigerian network. Your number is remembered so the second time is one tap.'],
        ['Data', 'Pick the bundle, not the price code. The screen says what you are buying.'],
        ['Electricity', 'Prepaid or postpaid. The token comes back on the receipt, where you can find it again.'],
      ] },
      { type: 'compare', head: 'Why it is here and not somewhere else.',
        before: ['Open a different app', 'Fund it from your bank', 'Wait for the transfer', 'Then pay the bill', 'Keep the receipt somewhere'],
        after: ['Open Tokkenly', 'Pay the bill', 'The receipt is in Activity'] },
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
    nav: 'Convert',
    eyebrow: 'Convert',
    title: 'Change currencies. Keep your plans.',
    lead:
      'Move between naira and stablecoins for the way you want to use your money. Spend, send, or ' +
      'invest from one app.',
    stage: 'stage-peach',
    shot: 'p-wallet.webp',
    shotAlt: 'The Convert screen, with naira on one side and dollars on the other.',
    spine: [
      { type: 'compare', head: 'The way it usually goes.',
        before: ['Ask around for a rate', 'Send naira and hope', 'Wait, and ask again', 'Find out the rate moved'],
        after: ['See the rate', 'It is held for ninety seconds', 'Convert', 'Both balances are yours, before and after'] },
      { type: 'alt', head: 'One amount, two faces.', rows: [
        ['Type in either currency.',
         '₦25,000 and $16.67 are not two amounts. They are one amount wearing the two faces it is ' +
         'passing between, so you can type whichever one you are actually thinking in and the other solves itself.',
         'p-wallet.webp', 'The Convert screen with naira above and dollars below.'],
      ] },
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
    nav: 'Earn',
    eyebrow: 'Earn',
    title: 'Put idle stablecoins to work.',
    lead:
      'Explore earning opportunities for the stablecoins you hold. Review the terms, choose an ' +
      'amount, and keep track in Tokkenly.',
    stage: 'stage-deep',
    shot: 'p-earn.webp',
    shotAlt: 'The Earn screen, showing what is committed and what it has earned.',
    spine: [
      { type: 'risk', lead: true },
      { type: 'alt', head: 'How it works.', rows: [
        ['Choose the amount, not the whole balance.',
         'You decide how much to commit and how much to keep spendable. What is committed is shown apart from what is not, so you always know which is which.',
         'p-earn.webp', 'The Earn screen with an amount committed.'],
        ['The terms are on the screen.',
         'The rate, what it is paid on, and what you have to do to get your money back. Before you agree, not after.',
         'p-wallet.webp', 'The Wallet screen showing money committed and money spendable.'],
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
    nav: 'Borrow',
    eyebrow: 'Borrow',
    title: 'Give yourself some breathing room.',
    lead:
      'When you need extra funds, explore borrowing in Tokkenly. Review the costs and repayment ' +
      'terms before choosing what works for you.',
    stage: 'stage-yellow',
    shot: 'p-borrow.webp',
    shotAlt: 'The Borrow screen, showing what is available to borrow.',
    spine: [
      { type: 'risk', lead: true },
      { type: 'facts', head: 'What you are agreeing to.', rows: [
        ['How much', 'What you can borrow is shown as a figure, not a promise. It depends on what you hold.'],
        ['What it costs', 'The rate and the total, in money, before you agree.'],
        ['Paying it back', 'The schedule is on the screen. So is what happens if you do not keep to it.'],
        ['What backs it', 'What you hold. If its value falls far enough, some of it may be sold to cover the loan — said here rather than found out later.'],
      ] },
      { type: 'steps', head: 'Start to finish.', items: [
        ['See what is available', 'A figure based on what you hold, with the terms beside it.', 'p-borrow.webp'],
        ['Read the cost', 'The rate, the total and the repayments, in money you can check.', 'p-borrow.webp'],
        ['Keep track', 'What you owe sits apart from what you have, so the two are never confused.', 'p-home.webp'],
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
