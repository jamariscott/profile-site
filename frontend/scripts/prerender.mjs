// After `vite build` and the SSR build of src/entry-prerender.tsx:
//  - dist/app.html: the plain app shell, served for every route except "/"
//    (see vercel.json), so other pages never flash the home page.
//  - dist/index.html: the same shell with the home page's HTML inside #root.
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = '<div id="root"></div>';
const shell = readFileSync("dist/index.html", "utf8");
if (!shell.includes(ROOT)) throw new Error("prerender: #root placeholder not found in dist/index.html");

const { render } = await import(pathToFileURL(resolve("dist-ssr/entry-prerender.js")).href);
const html = render();
if (!html.includes("Show the world what you do")) throw new Error("prerender: home headline missing from render");

writeFileSync("dist/app.html", shell);
writeFileSync("dist/index.html", shell.replace(ROOT, `<div id="root">${html}</div>`));
rmSync("dist-ssr", { recursive: true, force: true });
console.log(`prerender: home page HTML ${(html.length / 1024).toFixed(1)} KB written to dist/index.html`);
