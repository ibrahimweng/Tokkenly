# Tokkenly — Product Requirements Document (PRD)

**Version:** v3.0
**Date:** September 2026
**Audience:** Product, UI/UX Design, Engineering, Founders
**Product:** Tokkenly
**Core idea:** Remove the exit.

*Source: HackMD, by Emmanuel Doji (Tokkenly_PRD_v3_UIUX.md). Transcribed into the
repository so the product definition lives with the product.*

## 1. Product Overview

Tokkenly is a stablecoin neobank designed for people who already earn, hold, and
transact in stablecoins.

The problem is simple: users can hold digital dollars, but whenever they want to do
something with those dollars in their everyday financial life, they often have to
exit stablecoins first.

For example:

- You earn your salary or contract income in USDT/USDC. You want to buy airtime or
  pay a bill. You have to off-ramp to naira.
- You want to invest in stocks. You have to move the money to another platform.
- You want to spend your money. You have to convert it first.

This creates unnecessary fees, multiple apps, fragmented transaction histories, and
a poor user experience.

### Tokkenly's thesis

The stablecoin should be the account.

Tokkenly brings the user's stablecoin balance together with the financial services
they need. The product is organized around three core pillars:

| Pillar | Promise | Purpose |
| --- | --- | --- |
| HOLD | Your stablecoins, still yours. | Hold, receive and send digital dollars. |
| SPEND | Use your stablecoins for everyday life. | Pay for bills and services without unnecessary exits. |
| INVEST | Put your stablecoins to work. | Buy investments directly from your stablecoin balance. |

## 2. Current Product Status

Tokkenly is currently in an early testing phase.

**Currently working — HOLD:** stablecoin account, on-ramp, off-ramp, stablecoin
balance, receive/hold stablecoins, send stablecoins, transaction history.

**Currently working — INVEST:** purchase of tokenized stocks directly through
Tokkenly; investment flow funded from the user's stablecoin balance.

**Currently being built — SPEND:** airtime, data, electricity, other everyday
payments, stablecoin-to-naira conversion where required.

**Future investment roadmap:** stocks, ETFs, additional investment products,
dollar-denominated yield products, naira investment products, borrowing against
eligible assets (later).

The UI/UX should make the distinction between what is live today and what is coming
next very clear. Do not design future functionality as if it is already available.

## 3. Target User

### Primary user

A crypto-native Nigerian who already holds stablecoins. Typical characteristics:

- Earns some or all income in USDT/USDC.
- Holds stablecoins in a wallet or exchange.
- Understands basic crypto concepts.
- Wants the convenience of traditional financial apps without giving up the
  flexibility of stablecoins.
- Regularly needs to convert between crypto and naira.
- Wants access to investments without moving funds between multiple platforms.
- Uses a mobile phone as their primary financial device.

### Example user

A Web3 developer receives a $2,000 monthly contract payment in USDT. Today: USDT
arrives in their wallet; they need naira for a bill; they move USDT to an
exchange/P2P platform; they sell it; they transfer naira to their bank; they pay the
bill. If they want to invest, they repeat the process through another investment
app. Tokkenly should reduce this fragmentation.

## 4. Core User Problem

The core problem is not that users cannot hold stablecoins. The problem is that
holding stablecoins and using them as money are two different experiences today.

Users are forced to exit their stablecoins to pay for everyday services, pay bills,
move money into their bank, invest in stocks, access financial products, and spend
in their local economy.

Every exit can introduce fees, FX friction, multiple apps, additional verification,
transaction tracking, counterparty risk, delays, and confusion about where money is.

**Product goal.** Make the user's stablecoin balance the starting point for their
financial life rather than something they must constantly cash out.

## 5. Product Principles

### 5.1 Remove the Exit

Every major feature should answer: does this reduce the number of reasons the user
needs to cash out? If a feature creates another unnecessary exit, reconsider the
experience.

### 5.2 The Stablecoin Balance Is the Center

The user's stablecoin balance should remain visible and useful throughout the
product. The user should not feel like they are moving between completely separate
products.

### 5.3 Show the Important Number First

Every financial screen should lead with the number the user cares about: available
balance, amount to spend, amount to invest, amount received, total investment value.
Supporting information comes after the primary number.

### 5.4 No Surprises

Before a user confirms a transaction, show amount, exchange/conversion rate where
applicable, fees, total, and the amount the user receives or invests. The user should
know exactly what will happen before tapping Confirm.

### 5.5 Make Custody Clear

Where assets are held by Tokkenly versus a partner, the interface must make this
clear. Do not hide important custody information inside terms and conditions.

### 5.6 Mobile First

Tokkenly is primarily a mobile financial product. Design for mid-range Android
devices, mobile data, intermittent connectivity, simple navigation, and fast
transaction flows.

## 6. Information Architecture

The primary navigation should revolve around the three product pillars.

**Recommended navigation:** Home | Spend | Invest | Account

Hold is represented primarily through Home, because the user's balance is the
foundation of the entire product.

**Home** should answer "How much money do I have and what can I do with it?"
Suggested hierarchy: total stablecoin value, naira equivalent, hold balance,
invested balance, quick actions, recent activity.

**Spend** — everything related to using money: convert, airtime, data, electricity,
other bills, send, future cards.

**Invest** — everything related to growing money: portfolio, stocks, ETFs,
investment history, performance, future yield products, future borrowing.

**Account** — profile, verification, security, recovery, statements, transaction
history/export, fees, limits, support.

## 7. HOLD

### 7.1 Purpose

Hold is the foundation of Tokkenly. The user should be able to receive and hold
stablecoins without immediately needing to convert them to fiat.

**Core promise:** Your stablecoins, still yours.

### 7.2 Hold Features

**Balance.** The user can see total stablecoin balance, USDT balance, USDC balance,
naira equivalent, investment balance, and total portfolio value. The interface should
clearly distinguish Hold balance from Invested balance.

**Receive.** The user can select stablecoin, select network, view wallet address,
copy address, scan QR code, and view deposit status. The selected asset and network
must always be obvious, for example "Receive USDT — Network: TRON". Avoid situations
where a user could accidentally send an asset through the wrong network.

**Send.** The user can send to an external wallet or to another Tokkenly user,
enter/select recipient, select asset, select network, enter amount, review, confirm.

**Transaction history.** Every transaction should show type, asset, amount,
date/time, status, recipient/sender where appropriate, network, and transaction
reference/hash where applicable.

## 8. INVEST

### 8.1 Purpose

Invest allows users to put their stablecoin balance to work without first off-ramping
to naira and moving money to another investment platform.

**Core promise:** Invest without leaving your stablecoin balance behind.

### 8.2 Current Investment Product

The current working investment experience allows users to purchase tokenized stocks
using their stablecoin balance.

**Core flow:** stablecoin balance → select stock → enter amount → review → confirm →
investment appears in portfolio.

The experience should feel like an extension of the user's Tokkenly account, not a
completely separate app.

### 8.3 Investment Home

The Invest screen should show total portfolio value, available balance, portfolio
performance, holdings, individual asset positions, and recent investment activity.

**Important.** Performance must show both gains and losses honestly. Do not design
the interface to emphasize only positive performance.

### 8.4 Browse Investments

Users should be able to browse available stocks, search for a stock, view basic asset
information, view current price, view their existing position, and start a purchase.
Tokkenly should not present itself as providing personalized investment advice.

### 8.5 Buy Stock

User flow: user opens Invest; selects a stock; sees the current price; enters how
much they want to invest; the UI shows the expected quantity/fractional position; the
UI shows all applicable fees and FX/conversion costs; user reviews; user confirms;
order status is shown; once completed, the position appears in the portfolio.

Before confirmation, show asset, amount being invested, price, quantity,
commission/fees, FX cost where applicable, total stablecoin amount, and the final
expected position.

### 8.6 Investment Detail

Each holding should show asset name, quantity, current value, average purchase price,
current price, gain/loss, percentage performance, and purchase history. The user
should be able to understand: "How much did I put in, how much is it worth now, and
how much have I gained or lost?"

## 9. SPEND

### 9.1 Purpose

Spend is the part of Tokkenly designed to eliminate the most frequent reasons users
currently have to off-ramp.

**Core promise:** Use your stablecoins for everyday life.

### 9.2 Spend Products

**Airtime.** Select network, enter phone number, enter amount, see naira cost, see
stablecoin cost, confirm purchase, receive confirmation.

**Data.** Select network, enter phone number, select data plan, see price in naira,
see equivalent stablecoin cost, confirm, receive confirmation.

**Electricity.** Select/discover electricity provider, enter meter number, validate
meter, enter amount, see stablecoin cost, confirm, receive token/confirmation.

**Convert.** Convert allows the user to move from stablecoins to naira when they
genuinely need fiat. However, conversion should not be the center of Tokkenly. It is
a fallback/utility, not the product's destination.

Core conversion flow: user selects Convert; chooses whether to enter a stablecoin
amount or a naira target; Tokkenly shows the current rate; user sees fees; user sees
exact amount received; user confirms; conversion is processed; user sees status;
naira is delivered through the relevant payment partner.

**Key design principle.** If a user says "I need ₦100,000", the product should help
them answer "How much USDT do I need?" rather than forcing them to calculate it
themselves.

## 10. The Three-Pillar Experience

The three pillars should feel like one product.

A user receives $2,000 USDT. **HOLD:** they keep the majority of their balance in
Tokkenly (Hold: $2,000). **INVEST:** they decide to invest $500 in tokenized stocks
(Hold: $1,500, Invest: $500). **SPEND:** they later need ₦20,000 for data and
electricity; instead of moving the remaining $1,500 to another exchange, they use
Tokkenly's Spend experience.

The user should feel that all three actions are happening from one financial account.

## 11. Primary User Story

**The Web3 Earner.** As a Web3 professional who earns in stablecoins, I want to keep
my money in stablecoins while being able to hold it, invest it, and use it for
everyday financial needs, so that I don't have to constantly off-ramp to another app
every time I need to do something with my money.

Emmanuel receives $2,000 USDT for a monthly contract. He opens Tokkenly and sees
Total: $2,000. He decides to keep $1,200 in Hold, invest $500 in tokenized stocks,
and use $300 for everyday spending. He should be able to do all of this without
having to move his entire balance to an exchange, cash out everything, or manage
multiple financial applications.

**Success condition.** The user finishes their financial tasks while keeping as much
of their stablecoin balance inside Tokkenly as possible.

## 12. Secondary User Stories

- **Hold.** As a stablecoin holder, I want to receive and hold USDT/USDC in one
  account so that I can manage my digital dollars without constantly moving them
  between wallets.
- **Send.** As a stablecoin holder, I want to send money to another wallet or
  Tokkenly user so that I can transfer funds without unnecessary friction.
- **Spend.** As a stablecoin user, I want to buy airtime and data directly from my
  stablecoin balance so that I don't have to off-ramp just to pay for small everyday
  needs.
- **Invest.** As a stablecoin holder, I want to buy stocks directly using my
  stablecoin balance so that I don't have to convert to naira and fund another
  investment platform.
- **Portfolio.** As an investor, I want to see my investments and their performance
  alongside my stablecoin balance so that I understand my complete financial position.
- **Convert.** As a user who genuinely needs naira, I want to convert only the amount
  I need so that I don't have to cash out more of my stablecoin holdings than
  necessary.

## 13. Key Screens for UI/UX Design

- **A. Onboarding** — welcome, sign up, verification, account setup, first funding.
- **B. Home** — total balance, hold balance, invest balance, quick actions, recent
  transactions.
- **C. Hold** — asset list, asset detail, receive, send, network selection,
  transaction confirmation, transaction history.
- **D. Spend** — spend home, convert, airtime, data, electricity, payment
  confirmation, payment success/failure.
- **E. Invest** — invest home, portfolio, browse/search stocks, stock detail, buy,
  order review, order status, investment detail.
- **F. Account** — profile, verification, security, recovery, statements, fees,
  limits, support.

## 14. Home Screen Design Direction

The Home screen is one of the most important screens in the product. It should
immediately communicate: "This is my money."

Suggested structure:

1. **Total wealth** — $12,450.00, with the naira equivalent.
2. **Balance breakdown** — Hold $8,450, Invest $4,000.
3. **Quick actions** — Receive, Send, Spend, Invest.
4. **Recent activity** — received USDT, bought stock, paid for data, sent USDT.

The interface should not overwhelm the user with crypto infrastructure.

## 15. Transaction and Confirmation Principles

Every money-moving action should have a review screen. Review should answer: what am
I doing, how much am I paying, what fees am I paying, what will I receive, where is
the money going, what happens next.

Example — Buy Stock: investing $250 USDT; stock XYZ; price $125; quantity 2 shares;
fees $X; total $250 + fees; [Confirm Investment].

## 16. States and Edge Cases

UI/UX must include more than happy paths. Design states for: loading, pending,
successful, failed, cancelled, insufficient balance, network unavailable, partner
unavailable, invalid wallet address, wrong network, verification pending,
verification failed, investment order pending, investment order failed, spend payment
failed, refund pending.

Errors should explain what happened, whether money moved, and what the user should do
next. Avoid generic "Something went wrong." Prefer "Your payment wasn't completed.
Your balance was not charged."

## 17. Trust and Transparency

Because Tokkenly handles financial activity, trust should be visible throughout the
product. The interface should clearly communicate fees, exchange rates, transaction
status, asset ownership, custody model, investment partner where applicable, payment
partner where applicable, limits, and risk information. Do not bury important
financial information in legal pages.

## 18. Non-Functional Design Requirements

**Performance.** Mobile-first, fast initial load, designed for mid-range Android,
designed for intermittent/slow connectivity.

**Accessibility.** Strong contrast, large enough touch targets, clear typography, do
not rely on color alone for gains/losses or transaction states, support screen readers
where practical.

**Security.** PIN/biometric authentication, re-authentication for sensitive actions,
clear security and recovery settings, confirmation before outbound transactions.

## 19. Analytics and Product Metrics

**Hold.** Signups, funded accounts, first deposit, deposit volume, active balances,
send transactions.

**Spend.** Spend users, airtime transactions, data transactions, electricity
transactions, spend volume, repeat spend frequency, number/value of transactions that
happened without an off-ramp.

**Invest.** Users who view investments, users who make first investment, number of
investment transactions, investment volume, repeat investment rate, assets held,
portfolio value.

**Core product metric.** How much financial activity can a user complete through
Tokkenly without leaving their stablecoin balance?

## 20. MVP / Release Priorities

- **Phase 1 — HOLD.** Status: working. Onboarding, stablecoin balance, receive, send,
  on-ramp, off-ramp, transaction history.
- **Phase 2 — INVEST.** Status: working / early. Tokenized stocks, buy flow,
  portfolio, investment history, performance, investment transaction status.
- **Phase 3 — SPEND.** Status: next major product area. Airtime, data, electricity,
  convert, additional everyday payments.
- **Phase 4 — Expand INVEST.** Future: stocks and ETFs, dollar yield products, naira
  investment products, borrowing against eligible assets.
- **Phase 5 — Broader financial layer.** Future: cards, recurring payments, business
  accounts, additional financial products.

## 21. What Tokkenly Is NOT

Tokkenly is not intended to be another crypto exchange, a trading terminal, a
speculative crypto wallet, a complicated DeFi dashboard, an investment-advice
platform, or a product that requires users to understand blockchain infrastructure to
use basic financial features.

Tokkenly should feel like a financial account, with blockchain technology working
underneath where appropriate.

## 22. Design North Star

Every major design decision should pass this test: if a user has stablecoins in
Tokkenly, can they accomplish more without leaving them?

If the user still needs to open another app, cash out, move money to another wallet,
calculate complex conversions, or repeat KYC unnecessarily, then we have not fully
solved the problem.

## 23. Final Product Definition

Tokkenly is building a financial account around stablecoins. HOLD gives users a place
to keep and move their digital dollars. INVEST lets users put those dollars into
investments without first cashing out. SPEND lets users use those dollars for
everyday financial needs without unnecessarily leaving the stablecoin ecosystem.

**HOLD. SPEND. INVEST.** One account. One balance. Fewer exits.

Tokkenly's core promise: **Remove the exit.**
