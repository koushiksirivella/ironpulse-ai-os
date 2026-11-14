// Tiny DOM builder.
//
// The engine never builds HTML by string concatenation. Product names, notes
// and addresses come from a database an operator types into; one `<img
// onerror=...>` in a product name would run on every visitor's page. Building
// nodes and setting `.textContent` makes that impossible rather than merely
// unlikely — there is no escaping function to forget to call.
//
// No colour, no font. See CLAUDE.md §1.

/**
 * el('div', {class: 'j7-card', onclick: fn}, [child, 'text'])
 *
 * - `class`, `id`, `type`, `value`, `href`, `src`, `disabled`, `checked` etc.
 *   are set as attributes or properties as appropriate
 * - keys starting with `on` bind listeners
 * - keys starting with `data-` or `aria-` are set as attributes
 * - strings and numbers in children become text nodes
 * - null / undefined / false children are skipped, so `cond && el(...)` works
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      node.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(node.style, value);
    } else if (key in node && key !== 'list' && typeof value !== 'object') {
      node[key] = value;
    } else {
      node.setAttribute(key, String(value));
    }
  }

  for (const child of [].concat(children)) {
    if (child == null || child === false || child === '') continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Empty a node without the innerHTML round trip. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Replace everything inside a node with new children, in one paint. */
export function mount(node, children) {
  clear(node);
  const frag = document.createDocumentFragment();
  for (const child of [].concat(children)) if (child) frag.append(child);
  node.append(frag);
  return node;
}

/** Every element the skin has offered the engine, keyed by mount name. */
export function findMounts(root = document) {
  const map = {};
  for (const node of root.querySelectorAll('[data-j7-mount]')) {
    const name = node.getAttribute('data-j7-mount');
    (map[name] ||= []).push(node);
  }
  return map;
}
