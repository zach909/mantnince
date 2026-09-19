/**
 * A tiny, hand-rolled DOM helper — our own minimal stand-in for what we used
 * to reach for React/JSX for. There's no virtual DOM or reconciler here: `el`
 * builds real elements directly, and components that need to change over time
 * just keep a reference to the node and mutate it imperatively. That's the
 * right tradeoff for a popup this small; a full reconciler would be a lot of
 * machinery for a couple of views.
 */

type Child = Node | string | number | null | undefined | false | Child[]
type Props = Record<string, any>

function flatten(children: Child[], out: (Node | string)[] = []): (Node | string)[] {
  for (const child of children) {
    if (child == null || child === false) continue
    if (Array.isArray(child)) flatten(child, out)
    else out.push(typeof child === 'number' ? String(child) : child)
  }
  return out
}

export function appendChildren(node: Node, children: Child[]): void {
  for (const child of flatten(children)) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child)
  }
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild)
}

export function setChildren(node: Element, ...children: Child[]): void {
  clear(node)
  appendChildren(node, children)
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue
    if (key === 'className') node.className = value
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value)
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener)
    } else if (key === 'disabled') {
      if (value) node.setAttribute('disabled', '')
    } else {
      node.setAttribute(key, String(value))
    }
  }
  appendChildren(node, children)
  return node
}

const SVG_NS = 'http://www.w3.org/2000/svg'

export function svgEl(tag: string, attrs: Record<string, string> = {}, ...children: Child[]): SVGElement {
  const node = document.createElementNS(SVG_NS, tag) as unknown as SVGElement
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  appendChildren(node, children)
  return node
}
