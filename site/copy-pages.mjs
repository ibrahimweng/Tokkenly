/* The company and legal pages, in words.
   ---------------------------------------------------------------------------
   Same split as copy-products.mjs: this file is the one a person reads and
   edits, build-pages.mjs turns it into HTML. Nothing here is markup.

   Shapes come from the Figma frames — Contact us (394:780), Terms of service
   (399:559), Privacy policy (399:785). Words are drafted here in the voice the
   product pages use, and are the client's to cut.

   The site's own address is support@tokkenly.com — a role, not a person. The
   owner's personal address is where this mail is actually read, but it is not
   what the page shows: nobody's name belongs in a support address, and an
   address on a public page outlives whoever is reading it this month.

   Where a form asks a visitor for THEIR address, the placeholder is
   you@example.com. Where the product invents a person, that person gets their
   own example.com address. Neither is this one. */

export const EMAIL = 'support@tokkenly.com'

export const PAGES = {
  contact: {
    slug: 'contact',
    nav: 'Help',
    title: 'Get in touch.',
    meta: 'Questions about your account, a transaction, or the product. A real person reads these.',
    lead: 'Questions about your account, a transaction, or the product. A real person reads these.',
    cta: 'contact',
    props: [['globe', 'n-tl'], ['coin', 'n-tr']],
    close: ['Or skip the wait and start.',
      'You don’t need to hear back from us to open a Tokkenly account and make your first move.'],
    form: [
      ['name', 'Your name', 'First and last name', 'text'],
      ['email', 'Email', 'you@example.com', 'email'],
      ['about', 'What is it about?', 'Account, a transaction, or something else', 'text'],
      ['message', 'Message', 'Tell us what happened, and when', 'textarea'],
    ],
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
    title: 'Terms of service.',
    meta: 'The agreement between you and Tokkenly: what we do, what you agree to, and what happens when something goes wrong.',
    lead: 'The agreement between you and Tokkenly. Plain where it can be, exact where it has to be.',
    updated: 'Last updated 17 September 2026',
    cta: 'terms',
    props: [['coin', 'n-tl'], ['gun', 'n-r']],
    close: ['Ready when you are.',
      'Open an account in two minutes and read the fine print at your own pace.'],
    sections: [
      ['Who we are', [
        'Tokkenly is a product for holding, moving and investing money in one place. These terms are the agreement between you and us. Opening an account means you accept them.',
        'Where a term below conflicts with something we have told you in writing about your own account, the written thing about your account wins.',
      ]],
      ['Opening an account', [
        'You must be eighteen or over and able to enter a contract. You give us a legal name, a date of birth and an identity document, and we check them before your account can hold a balance.',
        'One person, one account. If we find duplicates we keep the oldest and close the rest, returning any balance to you.',
      ]],
      ['What a tokenized share is', [
        'A tokenized share tracks the price of a listed company. It is not the share itself, and holding one does not make you a shareholder of that company. You do not get a vote, and you should not expect a dividend unless we say in writing that a particular product pays one.',
        'Prices move. The value of what you hold can fall below what you paid, and past performance tells you nothing about what happens next.',
      ]],
      ['Money in and money out', [
        'Deposits are credited when they clear. Withdrawals go back to an account in your own name; we do not send money to third parties.',
        'We may hold a withdrawal while we finish a check. When we do, we tell you it is held and what we need from you.',
      ]],
      ['Fees', [
        'Fees are shown before you confirm anything, on the screen where you confirm it. If a fee changes, the change applies to what you do after it takes effect, not to anything already done.',
      ]],
      ['Borrowing', [
        'Where you borrow against what you hold, what you hold is collateral. If its value falls far enough, some of it is sold to repay the loan, and we tell you before that happens where the market gives us time to.',
      ]],
      ['Closing an account', [
        'You can close your account whenever you like. We will ask you to withdraw your balance first.',
        'We can close or suspend an account if we have to for a legal or a fraud reason, or if the account is used for something these terms forbid. Where the law allows us to tell you why, we will.',
      ]],
      ['When something goes wrong', [
        'Tell us. Write to ' + EMAIL + ' and we will look at it. If we got something wrong we will put it right.',
        'We are responsible for our own failures. We are not responsible for a loss that comes from the market moving, from you giving us wrong details, or from something outside our reasonable control.',
      ]],
      ['Changes to these terms', [
        'We will give you notice before a material change takes effect, at the address on your account. Continuing to use Tokkenly after that means you accept the change.',
      ]],
    ],
  },

  privacy: {
    slug: 'privacy',
    nav: 'Privacy policy',
    title: 'Privacy policy.',
    meta: 'What we collect, why we collect it, how long we keep it, and what you can ask us to do with it.',
    lead: 'What we collect, why, how long we keep it, and what you can ask us to do with it.',
    updated: 'Last updated 17 September 2026',
    cta: 'privacy',
    props: [['globe', 'n-tl'], ['notes', 'n-br']],
    close: ['Your money, your record.',
      'Every movement accounted for, and nothing shared that you did not ask us to share.'],
    sections: [
      ['What we collect', [
        'What you give us: your name, date of birth, address, email, phone number and identity document. Without these we cannot open an account for you, because the law requires us to know who holds it.',
        'What you do: the deposits, withdrawals, purchases, sales and transfers you make, and when you made them. This is your record and it is the point of the product.',
        'What your device tells us: an IP address, a device type and a rough location, used to spot someone signing in who is not you.',
      ]],
      ['Why we collect it', [
        'To run your account. To meet the legal checks we are required to perform. To find and stop fraud. To answer you when you write to us.',
        'We do not sell your information, and we do not hand it to anyone who wants to advertise at you.',
      ]],
      ['Who else sees it', [
        'The companies that do a specific job for us: identity checking, payments, and the infrastructure the app runs on. Each of them sees only what that job needs, and none of them may use it for anything else.',
        'A regulator or a court, where we are legally required to produce it.',
      ]],
      ['How long we keep it', [
        'While your account is open, and for as long afterwards as the law requires us to keep financial records. That period is longer than most people expect and it is not ours to shorten.',
        'Everything we are not required to keep is deleted when your account closes.',
      ]],
      ['What you can ask for', [
        'A copy of what we hold about you. A correction, if something is wrong. Deletion of anything we are not required to keep. An explanation of why a decision went the way it did.',
        'Write to ' + EMAIL + '. We answer within one working day and act within thirty.',
      ]],
      ['Keeping it safe', [
        'Traffic is encrypted in transit and at rest. Access inside Tokkenly is limited to the people whose job needs it and is logged.',
        'If something happens that puts your information at risk, we tell you, and we tell you what to do about it.',
      ]],
    ],
  },
}
