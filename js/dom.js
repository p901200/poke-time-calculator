// ============================================================
// dom.js — 極簡 DOM 建構工具
// 用意：避免用大量字串拼接 innerHTML，改用 createElement 組裝畫面。
// ============================================================

/**
 * h('button', { class: 'btn', onClick: fn }, ['文字', childNode])
 */
export function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      node.className = value;
    } else if (key === 'html') {
      // 僅限用於極少數固定、非使用者輸入的內容（例如單一符號），
      // 一般畫面一律使用 createElement + textContent。
      node.innerHTML = value;
    } else if (key in node && key !== 'list') {
      try {
        node[key] = value;
      } catch {
        node.setAttribute(key, value);
      }
    } else {
      node.setAttribute(key, value);
    }
  }

  const kids = Array.isArray(children) ? children : [children];
  for (const child of kids) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      node.appendChild(document.createTextNode(String(child)));
    } else {
      node.appendChild(child);
    }
  }

  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function mount(parent, node) {
  clear(parent);
  parent.appendChild(node);
}
