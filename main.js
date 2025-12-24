const article = document.querySelector("article");

article.addEventListener("input", debounce(500, save));
addEventListener("DOMContentLoaded", load);
addEventListener("hashchange", load);

async function load() {
  try {
    if (location.hash !== "") await set(location.hash);
    else {
      await set(localStorage.getItem("hash") ?? "");
      if (article.textContent) history.replaceState({}, "", await get());
    }
  } catch (e) {
    article.textContent = "";
    article.removeAttribute("style");
  }
  article.focus();
  updateTitle();
}

async function save() {
  const hash = await get();
  if (location.hash !== hash) history.replaceState({}, "", hash);
  try {
    localStorage.setItem("hash", hash);
  } catch (e) {}
  updateTitle();
}

async function set(hash) {
  const [content, style] = (await decompress(hash.slice(1))).split("\x00");
  article.textContent = content;
  if (style) article.setAttribute("style", style);
}

async function get() {
  const style = article.getAttribute("style");
  const content = article.textContent + (style !== null ? "\x00" + style : "");
  return "#" + (await compress(content));
}

function updateTitle() {
  const match = article.textContent.match(/^\n*#(.+)\n/);
  document.title = match?.[1] ?? "Textarea";
}

async function compress(string) {
  const byteArray = new TextEncoder().encode(string);
  const stream = new CompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buffer)
    .toBase64()
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function decompress(b64) {
  const byteArray = Uint8Array.fromBase64(
    b64.replace(/-/g, "+").replace(/_/g, "/"),
  );
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return new TextDecoder().decode(buffer);
}

function debounce(ms, fn) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
