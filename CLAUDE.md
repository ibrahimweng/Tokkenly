# Tokkenly

## Project email address

`ibrahimweng0@gmail.com` is the address mail actually reaches. Use it where a
machine needs a real mailbox and nobody sees it:

- configuration and environment files
- notification and sender addresses
- anywhere a deploy, a form or a script has to deliver something

**Never put it on a screen.** Not as a placeholder, not as an example, not as
seed data, not as the address on a contact page. It carries a person's name,
and a name does not belong in any of those places. What shows instead:

- the site's or app's own address → `support@tokkenly.com`, a role rather than
  a person
- a field asking a visitor for *their* address → `you@example.com`
- a person the product has invented → their own name at `example.com`, for
  instance `chinaza.okoro@example.com` — that domain is reserved for this and
  can never reach a real mailbox

Do not use `founders@pagrin.com` anywhere in this project. It is the address on
the Claude account. Ignore it.

## Always send screenshots

Every time a piece of work is finished, send screenshots of it. Not a
description of what changed — the screens themselves.

- Before and after, side by side, wherever there is a before. Build the
  previous commit in a worktree and serve it on a second port so both sides
  are real builds of real code rather than one side from memory.
- Every size the change touches: 1440, 834 and 390 at least, and both themes
  when the change is about colour.
- The state that shows the change. A row that only appears when money is in
  flight needs money put in flight first; a screenshot of the empty case
  proves nothing.
- Keep each image under about 1MB. Larger ones are rejected on upload, and a
  full-page phone capture at 2x will exceed it — drop the scale factor rather
  than the screen.

This is not optional and does not need asking for.
