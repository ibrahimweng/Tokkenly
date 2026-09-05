import { h } from '../ui'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
  width?: string
}

export function table(
  cols: Column[],
  rows: (Node | string)[][],
  onRow?: (i: number) => void
): HTMLElement {
  const thead = h('thead')
  const tr = h('tr')
  for (const c of cols) {
    const th = h('th', { text: c.label })
    if (c.align === 'right') th.style.textAlign = 'right'
    if (c.width) th.style.width = c.width
    tr.appendChild(th)
  }
  thead.appendChild(tr)

  const tbody = h('tbody')
  rows.forEach((cells, i) => {
    const row = h('tr', onRow ? { on: { click: () => onRow(i) } } : {})
    cells.forEach((cell, j) => {
      const td = h('td')
      if (cols[j]?.align === 'right') td.style.textAlign = 'right'
      td.appendChild(typeof cell === 'string' ? document.createTextNode(cell) : cell)
      row.appendChild(td)
    })
    tbody.appendChild(row)
  })

  return h('table', { class: 'table' }, thead, tbody)
}
