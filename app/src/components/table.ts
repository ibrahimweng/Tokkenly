import { h } from '../ui'
import { icon } from '../icons'
import { isMobile } from '../responsive'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
  width?: string
  /** Dropped below the phone breakpoint. A phone has room for who and how
   *  much, and the rest is one tap away in the receipt. */
  optional?: boolean
  /** Dropped below a wide desktop too. Nine columns fit 1440 and overflow a
   *  laptop, and a table that runs off the side has stopped being a table. */
  wide?: boolean
  /** A column you can order by. The header becomes a button. */
  sortable?: boolean
}

export interface Sort { key: string; dir: 'asc' | 'desc' }

/** How the same rows read on a phone.
 *
 *  A table is a shape for comparing across, and a phone has no across. Nine
 *  columns became four became three, and three columns of eleven-pixel headers
 *  with sort carets on them is a spreadsheet somebody has been asked to use
 *  with a thumb. Given this, the same cells are drawn as the row anatomy the
 *  activity feed already uses — a glyph, what it is and what about it, the
 *  figure, a chevron — so one row shape reads the same everywhere in the
 *  product instead of a table here and a feed there.
 *
 *  Columns are named rather than numbered, so a column moving in the table
 *  does not silently move the phone's second line to a different fact. */
export interface RowShape {
  /** The cell that leads the row. If `detail` and `ic` are both absent it is
   *  placed as it is, on the assumption it already carries its own anatomy. */
  lead: string
  /** Folded into the quiet second line, joined with middots. Text only. */
  detail?: string[]
  /** Right-aligned, stacked in the order given. Usually one; two where a
   *  price wants its day move under it. */
  figure?: string[]
  /** Drawn at the end in place of the chevron — a control the row carries
   *  that is not the row's own destination. */
  trail?: string
  /** A glyph for row i, when the lead cell does not bring one. */
  ic?: (i: number) => string
}

export function table(
  cols: Column[],
  rows: (Node | string)[][],
  onRow?: (i: number) => void,
  sorting?: { current: Sort | null; onSort: (key: string) => void },
  shape?: RowShape,
): HTMLElement {
  if (shape && isMobile()) return listOf(cols, rows, shape, onRow)
  const thead = h('thead')
  const tr = h('tr')
  for (const c of cols) {
    const live = sorting && c.sortable
    const on = live && sorting.current?.key === c.key
    const th = h('th')
    if (live) {
      th.appendChild(h('button', {
        class: 'th-sort' + (on ? ' on' : ''),
        ariaLabel: `Sort by ${c.label}`,
        on: { click: () => sorting.onSort(c.key) },
      },
        h('span', { text: c.label }),
        h('span', { class: 'caret', text: on ? (sorting.current!.dir === 'asc' ? '↑' : '↓') : '↕' })))
    } else {
      th.textContent = c.label
    }
    if (c.align === 'right') th.classList.add('right')
    if (c.width) th.style.width = c.width
    if (c.optional) th.classList.add('opt')
    if (c.wide) th.classList.add('opt-wide')
    tr.appendChild(th)
  }
  thead.appendChild(tr)

  const tbody = h('tbody')
  rows.forEach((cells, i) => {
    const row = h('tr', onRow ? { on: { click: () => onRow(i) } } : {})
    cells.forEach((cell, j) => {
      const td = h('td')
      if (cols[j]?.align === 'right') td.classList.add('right')
      if (cols[j]?.optional) td.classList.add('opt')
      if (cols[j]?.wide) td.classList.add('opt-wide')
      td.appendChild(typeof cell === 'string' ? document.createTextNode(cell) : cell)
      row.appendChild(td)
    })
    tbody.appendChild(row)
  })

  // A table has a floor below which its columns stop shrinking. Below that
  // the wide content scrolls in its own box rather than pushing the page
  // sideways — a horizontal scrollbar on the document is never the answer.
  return h('div', { class: 'table-scroll' }, h('table', { class: 'table' }, thead, tbody))
}

/** The same rows, as rows. See RowShape. */
function listOf(
  cols: Column[], rows: (Node | string)[][], shape: RowShape, onRow?: (i: number) => void,
): HTMLElement {
  const at = (key: string) => cols.findIndex((c) => c.key === key)
  const lead = at(shape.lead)
  const detail = (shape.detail ?? []).map(at).filter((n) => n >= 0)
  const figures = (shape.figure ?? []).map(at).filter((n) => n >= 0)
  const trail = shape.trail ? at(shape.trail) : -1
  const list = h('div', { class: 'feed' })

  rows.forEach((cells, i) => {
    const words = (n: number) => {
      const c = cells[n]
      return c == null ? '' : typeof c === 'string' ? c : (c.textContent ?? '').trim()
    }
    const node = (n: number): Node | null => {
      const c = cells[n]
      return c == null ? null : typeof c === 'string' ? h('span', { text: c }) : c
    }
    const head = node(lead)
    const line = detail.map(words).filter(Boolean).join(' · ')
    // The lead keeps its own structure wherever it has one. Most of these
    // cells are already a two-line, or a glyph beside one, because that is
    // what they are on a desktop too — so the second line goes *into* the
    // structure that is there rather than around it. Wrapping a two-line in a
    // two-line indents the row inside itself.
    const own = head instanceof HTMLElement
      ? (head.matches('.two-line') ? head : head.querySelector('.two-line'))
      : null
    let body: Node
    if (line && own) {
      own.appendChild(h('small', { class: 'muted', text: line }))
      ;(head as HTMLElement).classList.add('grow')
      body = head as HTMLElement
    } else if (line) {
      body = h('span', { class: 'two-line grow' },
        h('span', { class: 't-body-strong' }, head ?? h('span')),
        h('small', { class: 'muted', text: line }))
    } else if (head instanceof HTMLElement) {
      head.classList.add('grow')
      body = head
    } else {
      body = h('span', { class: 'grow' }, head ?? h('span'))
    }

    const row = h('button', {
      class: 'feed-row',
      ...(onRow ? { on: { click: () => onRow(i) } } : {}),
    },
      shape.ic ? h('span', { class: 'mark feed-ic', html: shape.ic(i) }) : null,
      body,
      figures.length
        ? h('span', { class: 'row-figure' }, ...figures.map((n) => node(n)).filter(Boolean) as Node[])
        : null,
      trail >= 0 ? h('span', { class: 'row-trail' }, node(trail) ?? h('span')) : null,
      trail < 0 && onRow ? h('span', { class: 'muted set-chev', html: icon.chevron() }) : null)
    list.appendChild(row)
  })
  return list
}
