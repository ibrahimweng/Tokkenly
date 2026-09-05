/** Line icons at 20px on a 24 grid. Stroke inherits currentColor so a row's
 *  state colours its glyph without a second asset. */
const svg = (d: string, size = 20): string =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${d}</svg>`

export const icon = {
  home: () => svg('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
  wallet: () => svg('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 11h18"/>'),
  market: () => svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m8 14 3-3 2 2 3-4"/>'),
  grow: () => svg('<path d="M5 20V10M12 20V4M19 20v-7"/>'),
  history: () => svg('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  account: () => svg('<circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5"/>'),
  arrowIn: () => svg('<path d="M17 7 7 17M7 10v7h7"/>', 16),
  arrowOut: () => svg('<path d="M7 17 17 7M17 14V7h-7"/>', 16),
  chevron: () => svg('<path d="m9 5 7 7-7 7"/>', 16),
  close: () => svg('<path d="M6 6l12 12M18 6 6 18"/>', 16),
  check: () => svg('<path d="m5 13 4.5 4.5L19 7"/>', 28),
  info: () => svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 18),
  alert: () => svg('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>', 18),
  search: () => svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>', 18),
  download: () => svg('<path d="M12 4v10M8 11l4 4 4-4M5 19h14"/>', 18),
  send: () => svg('<path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 10.1z"/>', 18),
  receive: () => svg('<path d="M12 4v12M8 12l4 4 4-4M5 20h14"/>', 18),
  convert: () => svg('<path d="M4 8h13l-3-3M20 16H7l3 3"/>', 18),
  buy: () => svg('<path d="M6 18 18 6M10 6h8v8"/>', 18),
  card: () => svg('<path d="M7 17 17 7M17 13V7h-6"/>', 18),
  lock: () => svg('<rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/>', 18),
  face: () => svg('<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 10h.01M15 10h.01M9 14.5s1.2 1 3 1 3-1 3-1"/>', 18),
  key: () => svg('<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H20l-1.5 2M17 12v3"/>', 18),
  mail: () => svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>', 18),
  copy: () => svg('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>', 18),
  plus: () => svg('<path d="M12 5v14M5 12h14"/>', 18),
}
