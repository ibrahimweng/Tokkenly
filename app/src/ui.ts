/** Minimal typed DOM builder. No framework, no virtual DOM: the router
 *  re-renders a screen wholesale, which is fast enough at this size. */

type Child = Node | string | number | null | undefined | false
type Props = {
  class?: string
  text?: string
  html?: string
  href?: string
  type?: string
  value?: string
  placeholder?: string
  disabled?: boolean
  inputmode?: string
  ariaCurrent?: string
  ariaPressed?: boolean | string
  ariaLabel?: string
  dataset?: Record<string, string>
  style?: Partial<CSSStyleDeclaration>
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (ev: HTMLElementEventMap[K]) => void }>
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (props.class) el.className = props.class
  if (props.text !== undefined) el.textContent = props.text
  if (props.html !== undefined) el.innerHTML = props.html
  if (props.href !== undefined) el.setAttribute('href', props.href)
  if (props.type !== undefined) el.setAttribute('type', props.type)
  if (props.value !== undefined) (el as HTMLInputElement).value = props.value
  if (props.placeholder !== undefined) el.setAttribute('placeholder', props.placeholder)
  if (props.disabled) el.setAttribute('disabled', 'true')
  if (props.inputmode) el.setAttribute('inputmode', props.inputmode)
  if (props.ariaCurrent) el.setAttribute('aria-current', props.ariaCurrent)
  if (props.ariaPressed !== undefined) el.setAttribute('aria-pressed', String(props.ariaPressed))
  if (props.ariaLabel) el.setAttribute('aria-label', props.ariaLabel)
  if (props.dataset) for (const [k, v] of Object.entries(props.dataset)) el.dataset[k] = v
  if (props.style) Object.assign(el.style, props.style)
  if (props.on) {
    for (const [name, fn] of Object.entries(props.on)) {
      el.addEventListener(name, fn as EventListener)
    }
  }
  append(el, children)
  return el
}

export function append(parent: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue
    parent.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)))
  }
}

export function frag(...children: Child[]): DocumentFragment {
  const f = document.createDocumentFragment()
  append(f, children)
  return f
}

/** `<a>` that routes internally. Every navigation in the product goes through this. */
export function link(to: string, cls: string, ...children: Child[]): HTMLAnchorElement {
  const a = h('a', { class: cls, href: '#' + to })
  append(a, children)
  return a
}
