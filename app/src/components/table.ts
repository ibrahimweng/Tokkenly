import { h } from '../ui'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
  width?: string
  /** Dropped below the breakpoint. A phone has room for who and how much,
   *  and the rest is one tap away in the receipt. */
  optional?: boolean
  /** A column you can order by. The header becomes a button. */
  sortable?: boolean
}

export interface Sort { key: string; dir: 'asc' | 'desc' }

export function table(
  cols: Column[],
  rows: (Node | string)[][],
  onRow?: (i: number) => void,
  sorting?: { current: Sort | null; onSort: (key: string) => void }
): HTMLElement {
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
      td.appendChild(typeof cell === 'string' ? document.createTextNode(cell) : cell)
      row.appendChild(td)
    })
    tbody.appendChild(row)
  })

  return h('table', { class: 'table' }, thead, tbody)
}
