const vim = { mode: "insert", register: "", anchor: 0, cursor: 0 };

article.addEventListener("keydown", (e) => {
  if (vim.mode === "insert") {
    if (e.key === "Escape") {
      e.preventDefault();
      enterNormal();
    }
    return;
  }

  if (e.metaKey || e.ctrlKey) return;

  const handlers = {
    normal: {
      i: enterInsert,
      a: append,
      A: appendEOL,
      v: visual,
      V: visualLine,
      Y: yankLine,
      D: deleteToEOL,
      h: moveLeft,
      j: moveDown,
      k: moveUp,
      l: moveRight,
      o: openBelow,
      O: openAbove,
    },
    visual: {
      Escape: enterNormal,
      y: yank,
      d: del,
      v: enterNormal,
      h: moveLeft,
      j: moveDown,
      k: moveUp,
      l: moveRight,
    },
    "visual-line": {
      Escape: enterNormal,
      y: yank,
      d: del,
      V: enterNormal,
      j: moveDown,
      k: moveUp,
    },
  };

  const handler = handlers[vim.mode]?.[e.key];
  if (handler) {
    e.preventDefault();
    handler();
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
  }
});

function enterNormal() {
  vim.mode = "normal";
  article.className = "normal-mode";
  selectCharAtCursor();
}

function enterInsert() {
  vim.mode = "insert";
  article.className = "";
  collapseCursor();
}

function append() {
  const sel = getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  enterInsert();
}

function appendEOL() {
  const { end } = getLineRange();
  setCursor(end);
  enterInsert();
}

function visual() {
  vim.mode = "visual";
  article.className = "visual-mode";
  const pos = getCursorOffset();
  const { start } = getLineRange();
  vim.anchor = start;
  vim.cursor = pos;
  selectRange(start, Math.max(start + 1, pos));
}

function visualLine() {
  vim.mode = "visual-line";
  article.className = "visual-line-mode";
  const pos = getCursorOffset();
  const { start, end } = getLineRange();
  vim.anchor = start;
  vim.cursor = pos;
  selectRange(start, end);
}

function yank() {
  vim.register = getSelection().toString();
  navigator.clipboard?.writeText(vim.register);
  enterNormal();
}

function yankLine() {
  const { start, end } = getLineRange();
  const text = article.textContent;
  vim.register = text.slice(start, end);
  navigator.clipboard?.writeText(vim.register);
  selectCharAtCursor();
}

function del() {
  const sel = getSelection();
  if (sel.rangeCount) {
    sel.getRangeAt(0).deleteContents();
    article.dispatchEvent(new Event("input", { bubbles: true }));
  }
  enterNormal();
}

function deleteToEOL() {
  const pos = getCursorOffset();
  const { end } = getLineRange();
  if (pos < end) {
    selectRange(pos, end);
    getSelection().getRangeAt(0).deleteContents();
    article.dispatchEvent(new Event("input", { bubbles: true }));
  }
  selectCharAtCursor();
}

function getPos() {
  return vim.mode === "normal" ? getCursorOffset() : vim.cursor;
}

function getLineRangeAt(pos) {
  const text = article.textContent;
  const start = text.lastIndexOf("\n", pos - 1) + 1;
  const endIdx = text.indexOf("\n", pos);
  const end = endIdx === -1 ? text.length : endIdx;
  return { start, end };
}

function moveLeft() {
  const pos = getPos();
  const { start } = getLineRangeAt(pos);
  if (pos > start) moveTo(pos - 1);
}

function moveRight() {
  const pos = getPos();
  const { end } = getLineRangeAt(pos);
  if (pos < end - 1) moveTo(pos + 1);
}

function moveDown() {
  const pos = getPos();
  const { start, end } = getLineRangeAt(pos);
  const col = pos - start;
  const text = article.textContent;
  if (end < text.length) {
    const nextLineStart = end + 1;
    const nextLineEnd = text.indexOf("\n", nextLineStart);
    const nextLineLen =
      (nextLineEnd === -1 ? text.length : nextLineEnd) - nextLineStart;
    moveTo(nextLineStart + Math.min(col, nextLineLen));
  }
}

function moveUp() {
  const pos = getPos();
  const { start } = getLineRangeAt(pos);
  const col = pos - start;
  if (start > 0) {
    const prevLineEnd = start - 1;
    const text = article.textContent;
    const prevLineStart = text.lastIndexOf("\n", prevLineEnd - 1) + 1;
    const prevLineLen = prevLineEnd - prevLineStart;
    moveTo(prevLineStart + Math.min(col, prevLineLen));
  }
}

function moveTo(newPos) {
  vim.cursor = newPos;
  if (vim.mode === "normal") {
    setCursor(newPos);
    selectCharAtCursor();
  } else if (vim.mode === "visual") {
    selectRange(Math.min(vim.anchor, newPos), Math.max(vim.anchor, newPos) + 1);
  } else if (vim.mode === "visual-line") {
    const text = article.textContent;
    const anchorLineStart = text.lastIndexOf("\n", vim.anchor - 1) + 1;
    const anchorLineEnd = text.indexOf("\n", vim.anchor);
    const newLineStart = text.lastIndexOf("\n", newPos - 1) + 1;
    const newLineEnd = text.indexOf("\n", newPos);
    const start = Math.min(anchorLineStart, newLineStart);
    const end = Math.max(
      anchorLineEnd === -1 ? text.length : anchorLineEnd,
      newLineEnd === -1 ? text.length : newLineEnd,
    );
    selectRange(start, end);
  }
}

function openBelow() {
  const { end } = getLineRange();
  setCursor(end);
  document.execCommand("insertText", false, "\n");
  enterInsert();
}

function openAbove() {
  const { start } = getLineRange();
  setCursor(start);
  document.execCommand("insertText", false, "\n");
  setCursor(start);
  enterInsert();
}

function getCursorOffset() {
  const sel = getSelection();
  if (!sel.rangeCount) return 0;
  const range = document.createRange();
  range.setStart(article, 0);
  range.setEnd(sel.anchorNode, sel.anchorOffset);
  return range.toString().length;
}

function getLineRange() {
  const text = article.textContent;
  const pos = getCursorOffset();
  const start = text.lastIndexOf("\n", pos - 1) + 1;
  const endIdx = text.indexOf("\n", pos);
  const end = endIdx === -1 ? text.length : endIdx;
  return { start, end };
}

function setCursor(offset) {
  const { node, off } = findNodeAtOffset(offset);
  const sel = getSelection();
  const range = document.createRange();
  range.setStart(node, off);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function selectRange(start, end) {
  const startPos = findNodeAtOffset(start);
  const endPos = findNodeAtOffset(end);
  const sel = getSelection();
  const range = document.createRange();
  range.setStart(startPos.node, startPos.off);
  range.setEnd(endPos.node, endPos.off);
  sel.removeAllRanges();
  sel.addRange(range);
}

function selectCharAtCursor() {
  const pos = getCursorOffset();
  const text = article.textContent;
  if (text.length === 0) return;
  const end = Math.min(pos + 1, text.length);
  selectRange(Math.min(pos, text.length - 1), end);
}

function collapseCursor() {
  const sel = getSelection();
  if (sel.rangeCount) sel.collapseToEnd();
}

function findNodeAtOffset(targetOffset) {
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let node = walker.nextNode();
  while (node) {
    const len = node.textContent.length;
    if (offset + len >= targetOffset) {
      return { node, off: targetOffset - offset };
    }
    offset += len;
    node = walker.nextNode();
  }
  const lastNode = article.lastChild || article;
  const lastLen = lastNode.textContent?.length || 0;
  return {
    node: lastNode.nodeType === Node.TEXT_NODE ? lastNode : article,
    off: lastLen,
  };
}
