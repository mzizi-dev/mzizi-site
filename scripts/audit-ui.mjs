#!/usr/bin/env node
/**
 * UI/UX audit of the BUILT site (dist/), driven with Playwright.
 *
 *   node scripts/audit-ui.mjs dist                       # full audit, JSON + table
 *   node scripts/audit-ui.mjs dist --guard               # CI guard: exit 1 on a floor failure
 *   node scripts/audit-ui.mjs dist --out <dir> --label after --shots
 *   node scripts/audit-ui.mjs --url https://mzizi.dev    # a live site instead of dist/
 *
 * Measures, at 390x844 (touch), 820x1180 (tablet, touch) and 1440x900 (fine
 * pointer): the computed font size of every text node, the hit region of every
 * interactive element (its box, grown by a `::after` overlay, which is how
 * `@bundu/ui` keeps 49px on a control drawn smaller), the contrast of every
 * text/background pair, focus visibility, landmarks, headings, alt text, link
 * purpose, `prefers-reduced-motion`, horizontal scroll at 320px, and (full
 * audit only) the weight, LCP and layout shift on a throttled 3G profile.
 *
 * The floor it holds the site to is the Bundu floor: nothing readable under
 * 14px, body text 17px, a 49px hit region, contrast 7:1 body / 4.5:1 other,
 * and the spacing floor (registry 4.24.0, BUNDU_FLOOR.spacing): a 7px gap
 * between adjacent controls (visible edge to visible edge; hit regions may
 * touch, never overlap), a 14px inset from text to the edge of its container
 * (cards, panels and callouts on all four sides; buttons, links drawn as
 * buttons and inputs on the inline axis, because the visible control is 28px
 * and a 14px block inset cannot fit), a 1.5 body line height, and a WCAG 1.4.12
 * text-spacing stress pass (line-height 1.5, paragraph spacing 2x, letter
 * 0.12em, word 0.16em, injected as CSS) with no clipped or overflowing text.
 * An element, or anything inside it, carrying `data-mzizi-spacing-exempt="<reason>"`
 * is skipped and counted; the reason is mandatory (the convention the CLI's
 * `mzizi check` reads as a `mzizi-spacing-exempt: <reason>` comment).
 * Inline links inside running text are exempt from the hit region, as in
 * WCAG 2.5.8. Playwright is a devDependency; set PW_EXECUTABLE=<path> or PW_CHANNEL=chrome to use an
 * installed Chrome (CI) instead of Playwright's own chromium.
 */
import { createServer } from "node:http";
import {
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { extname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const GUARD = flag("guard");
const SHOTS = flag("shots");
const LABEL = opt("label", "run");
const OUT = resolve(opt("out", "audit-out"));
const REMOTE = opt("url", "");
const DIST = resolve(
  args.find(
    (a) =>
      !a.startsWith("--") &&
      a !== opt("out") &&
      a !== opt("label") &&
      a !== opt("url"),
  ) ?? "dist",
);

const VIEWPORTS = [
  { name: "390", width: 390, height: 844, touch: true, mobile: true },
  { name: "820", width: 820, height: 1180, touch: true, mobile: true },
  { name: "1440", width: 1440, height: 900, touch: false, mobile: false },
];
const PAGES = [
  ["home", "/"],
  ["components", "/components"],
  ["component", "/components/button"],
  ["tokens", "/tokens"],
  ["skills", "/skills"],
  ["language", "/language"],
  ["cli", "/cli"],
  ["ecosystem", "/ecosystem"],
  ["404", "/__no-such-page__"],
];

// ---- a static server for dist/ with the same URL shape as the Worker ----
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".wasm": "application/wasm",
};
function serve(dist) {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(dist, p);
    let status = 200;
    const ok = (f) => existsSync(f) && statSync(f).isFile();
    if (!ok(file))
      file = ok(file + ".html")
        ? file + ".html"
        : ok(join(file, "index.html"))
          ? join(file, "index.html")
          : "";
    if (!file) {
      file = join(dist, "404.html");
      status = 404;
    }
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    const body = readFileSync(file);
    const gz =
      /text|json|javascript|svg|css/.test(type) &&
      /gzip/.test(req.headers["accept-encoding"] ?? "");
    res.writeHead(status, {
      "content-type": type,
      ...(gz ? { "content-encoding": "gzip" } : {}),
      "cache-control": "no-store",
    });
    res.end(gz ? gzipSync(body) : body);
  });
  return new Promise((ok) =>
    server.listen(0, "127.0.0.1", () =>
      ok({ server, origin: `http://127.0.0.1:${server.address().port}` }),
    ),
  );
}

// ---- measurements, run inside the page ----
function measure({
  floorText,
  floorBody,
  floorHit,
  floorInset,
  floorGap,
  floorLeading,
  root,
}) {
  const scope = (root && document.querySelector(root)) || document;
  const base = scope === document ? document.body : scope;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (c) => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#000";
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    // fillRect on a transparent canvas premultiplies; recover alpha via a second draw on white
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, 1, 1);
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const w = cx.getImageData(0, 0, 1, 1).data;
    const a = d[3] / 255;
    return a === 0
      ? [0, 0, 0, 0]
      : [d[0] / a, d[1] / a, d[2] / a, a]
          .map((v, i) => (i < 3 ? Math.min(255, Math.round(v)) : v))
          .concat([w[0]]);
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat([1]);
  };
  const lum = (c) => {
    const f = (v) =>
      (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (
        s.display === "none" ||
        s.visibility === "hidden" ||
        s.opacity === "0"
      )
        return false;
      if (e.hidden) return false;
      // the body of a closed <details> is not drawn, though its boxes still have a rect
      if (
        e.parentElement?.tagName === "DETAILS" &&
        !e.parentElement.open &&
        e.tagName !== "SUMMARY"
      )
        return false;
    }
    // visually-hidden helpers (1px clip) are for assistive tech, not readers
    return !(r.width <= 1 && r.height <= 1);
  };
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) return `${s}#${el.id}`;
    const c = [...el.classList].slice(0, 2).join(".");
    return c ? `${s}.${c}` : s;
  };
  const back = (el) => {
    // effective opaque background; null when an image or gradient is involved
    let acc = null;
    const stack = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (
        s.backgroundImage !== "none" &&
        !/^url\(.*(?:\.svg|\.png)/.test(s.backgroundImage)
      )
        return null;
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) stack.push(c);
      if (c[3] === 1) break;
    }
    acc = [255, 255, 255, 1];
    for (const c of stack.reverse()) acc = over(c, acc);
    return acc;
  };
  const out = {
    errors: [],
    text: [],
    small: [],
    body: [],
    contrast: [],
    targets: [],
    overlaps: [],
    gaps: [],
    insets: [],
    leading: [],
    exempt: 0,
    exemptNoReason: [],
    headings: [],
    imgs: [],
    links: [],
    motion: 0,
    hscroll: false,
  };

  // text nodes
  const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode());) {
    const t = n.nodeValue.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || el.closest("script,style,noscript,svg,template")) continue;
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    const px = parseFloat(s.fontSize);
    const key = el;
    out.text.push(px);
    if (px < floorText)
      out.small.push({ el: sel(el), px, text: t.slice(0, 50) });
    const isBody =
      el.closest("p,li,dd,blockquote,td,th") &&
      !el.closest(
        "nav,header,footer,button,[role=tab],summary,figcaption,code,pre,table,.eyebrow,.badge,small",
      );
    if (isBody && px < floorBody)
      out.body.push({ el: sel(el), px, text: t.slice(0, 50) });
    if (seen.has(key)) continue;
    seen.add(key);
    // contrast
    const bg = back(el);
    if (!bg) continue;
    let fg = rgba(s.color);
    let op = 1;
    for (let e = el; e; e = e.parentElement)
      op *= parseFloat(getComputedStyle(e).opacity);
    fg = [fg[0], fg[1], fg[2], fg[3] * op];
    const eff = over(fg, bg);
    const r = ratio(eff, bg);
    const need = isBody && px >= floorBody ? 7 : 4.5;
    if (r < need)
      out.contrast.push({
        el: sel(el),
        ratio: +r.toFixed(2),
        need,
        px,
        text: t.slice(0, 40),
      });
  }

  // running prose: paragraphs and list items of 80+ characters in <main>
  out.prose = [...document.querySelectorAll("main p, main li, main dd")]
    .filter(
      (e) =>
        visible(e) &&
        e.textContent.trim().length >= 80 &&
        !e.querySelector("p,li"),
    )
    .map((e) => ({
      el: sel(e),
      px: parseFloat(getComputedStyle(e).fontSize),
      parent: sel(e.parentElement),
      text: e.textContent.trim().slice(0, 40),
    }));
  out.proseSmall = out.prose.filter((p) => p.px < floorBody);

  // interactive elements and their hit region
  const interactive = [
    ...document.querySelectorAll(
      "a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[tabindex]:not([tabindex='-1'])",
    ),
  ].filter(visible);
  const boxes = [];
  const inlineEls = new Set();
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    let w = r.width;
    let h = r.height;
    const a = getComputedStyle(el, "::after");
    if (
      a.content !== "none" &&
      a.position === "absolute" &&
      (a.pointerEvents ?? "auto") !== "none"
    ) {
      w = Math.max(w, parseFloat(a.width) || 0);
      h = Math.max(h, parseFloat(a.height) || 0);
    }
    // a label wrapping the input, or an <a> filling a flex item, counts through its own box only
    const s = getComputedStyle(el);
    const inline =
      el.tagName === "A" &&
      s.display === "inline" &&
      el.parentElement &&
      /^(P|LI|DD|TD|TH|BLOCKQUOTE|FIGCAPTION|SMALL|H[1-6]|SPAN|DIV|CODE|EM|STRONG)$/.test(
        el.parentElement.tagName,
      ) &&
      [...el.parentElement.childNodes].some(
        (c) => c.nodeType === 3 && c.nodeValue.trim().length > 2,
      );
    const skip = el.closest(".sr-only,.skip") && !el.matches(":focus");
    const rec = {
      el: sel(el),
      w: Math.round(w),
      h: Math.round(h),
      inline: !!inline,
      text: (el.getAttribute("aria-label") || el.textContent || "")
        .trim()
        .slice(0, 30),
    };
    if (skip) continue;
    if (inline) inlineEls.add(el);
    out.targets.push(rec);
    if (!inline && base.contains(el) && (w > r.width + 1 || h > r.height + 1))
      boxes.push({
        rec,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        w: Math.max(w, 0),
        h: Math.max(h, 0),
        el,
      });
  }
  out.belowHit = out.targets.filter(
    (t) => !t.inline && (t.w < floorHit || t.h < floorHit),
  );
  // two distinct targets whose hit regions overlap by more than a sliver
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ox =
        Math.min(a.x + a.w / 2, b.x + b.w / 2) -
        Math.max(a.x - a.w / 2, b.x - b.w / 2);
      const oy =
        Math.min(a.y + a.h / 2, b.y + b.h / 2) -
        Math.max(a.y - a.h / 2, b.y - b.h / 2);
      if (ox > 4 && oy > 4) out.overlaps.push(`${a.rec.el} x ${b.rec.el}`);
    }

  // ---- the spacing floor (BUNDU_FLOOR.spacing) ----
  const exempt = (el) => el.closest("[data-mzizi-spacing-exempt]");
  const exemptEls = [
    ...document.querySelectorAll("[data-mzizi-spacing-exempt]"),
  ];
  out.exempt = exemptEls.length;
  out.exemptNoReason = exemptEls
    .filter((e) => !e.getAttribute("data-mzizi-spacing-exempt").trim())
    .map(sel);
  const boxMemo = new WeakMap();
  const drawsBox = (e) => {
    if (boxMemo.has(e)) return boxMemo.get(e);
    const s = getComputedStyle(e);
    let v = rgba(s.backgroundColor)[3] > 0 || s.backgroundImage !== "none";
    // a border on three or more sides draws a box; one rule (a divider) does not
    const edges = ["Top", "Right", "Bottom", "Left"].filter(
      (side) =>
        parseFloat(s["border" + side + "Width"]) > 0 &&
        s["border" + side + "Style"] !== "none" &&
        rgba(s["border" + side + "Color"])[3] > 0,
    );
    if (edges.length >= 3) v = true;
    if (s.boxShadow !== "none" && /\d/.test(s.boxShadow)) v = true;
    boxMemo.set(e, v);
    return v;
  };
  const textRects = (root2) => {
    const rects = [];
    const w = document.createTreeWalker(root2, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      if (!n.nodeValue.trim()) continue;
      const p = n.parentElement;
      if (!p || p.closest("script,style,noscript,template") || !visible(p))
        continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      for (const r of rg.getClientRects())
        if (r.width > 0 && r.height > 0) rects.push(r);
    }
    return rects;
  };
  // the visible edge of a control: its box when it draws one, else its text and media
  const visibleRect = (el) => {
    if (drawsBox(el)) return el.getBoundingClientRect();
    const rs = textRects(el);
    for (const m of el.querySelectorAll("img,svg,video"))
      if (visible(m)) rs.push(m.getBoundingClientRect());
    if (!rs.length) return el.getBoundingClientRect();
    return {
      left: Math.min(...rs.map((r) => r.left)),
      right: Math.max(...rs.map((r) => r.right)),
      top: Math.min(...rs.map((r) => r.top)),
      bottom: Math.max(...rs.map((r) => r.bottom)),
    };
  };
  // gaps between adjacent controls, visible edge to visible edge
  const CONTROLS =
    "a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=link],[role=menuitem],[role=switch],[role=checkbox],[role=radio]";
  const ctl = interactive
    .filter(
      (e) =>
        base.contains(e) &&
        e.matches(CONTROLS) &&
        !exempt(e) &&
        !inlineEls.has(e) &&
        !(e.closest(".sr-only,.skip") && !e.matches(":focus")),
    )
    .map((e) => ({ e, r: visibleRect(e) }));
  for (let i = 0; i < ctl.length; i++)
    for (let j = i + 1; j < ctl.length; j++) {
      const a = ctl[i];
      const b = ctl[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const dx = Math.max(a.r.left - b.r.right, b.r.left - a.r.right, 0);
      const dy = Math.max(a.r.top - b.r.bottom, b.r.top - a.r.bottom, 0);
      const d = dx > 0 && dy > 0 ? Math.hypot(dx, dy) : Math.max(dx, dy);
      if (d < floorGap - 0.5)
        out.gaps.push({
          a: sel(a.e),
          b: sel(b.e),
          gap: +d.toFixed(1),
          text: `${a.e.textContent.trim().slice(0, 18)} | ${b.e.textContent.trim().slice(0, 18)}`,
        });
    }
  // text inset to the edge of its container: the nearest ancestor that draws a box
  const CONTROL = /^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|A)$/;
  // chips are labels, not containers; table cells are data, not cards, panels or callouts
  const NOT_CONTAINER =
    "[data-slot=badge],.badge,.eyebrow,kbd,td,th,:not(pre) > code:not(.cmd)";
  const ext = new Map();
  const tw = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    if (!n.nodeValue.trim()) continue;
    const p = n.parentElement;
    if (!p || p.closest("script,style,noscript,svg,template") || !visible(p))
      continue;
    // the nearest ancestor that is a box or a control; text in a bare control (a plain
    // link) has no edge of its own, and text in a chip or a table cell is not held to the inset
    let c = null;
    for (
      let e = p;
      e && e !== document.body && e !== document.documentElement;
      e = e.parentElement
    ) {
      if (e.matches(NOT_CONTAINER)) break;
      if (drawsBox(e)) {
        c = e;
        break;
      }
      if (e.matches(CONTROLS)) break;
    }
    if (!c || exempt(c)) continue;
    const cs = getComputedStyle(c);
    const control =
      CONTROL.test(c.tagName) ||
      /^(button|tab)$/.test(c.getAttribute("role") ?? "");
    // chips (badges, inline labels) are not containers; text-bearing inline boxes that are not controls
    if (!control && /^inline/.test(cs.display)) continue;
    // a chip (a label) is not a container: a box no taller than the 28px visible control
    // minimum, or a one-line pill (a badge, a stepper, a drawn specimen of a button)
    if (!control) {
      const cb = c.getBoundingClientRect();
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      const tr = textRects(c);
      const oneLine =
        tr.length > 0 &&
        Math.max(...tr.map((r) => r.bottom)) -
          Math.min(...tr.map((r) => r.top)) <=
          1.5 * Math.min(...tr.map((r) => r.height));
      if (cb.height <= 28 || (oneLine && radius >= cb.height / 2 - 1)) continue;
    }
    const ps = getComputedStyle(p);
    const lh = parseFloat(ps.lineHeight);
    const rg = document.createRange();
    rg.selectNodeContents(n);
    // text that sits inside its own scroll area is reached by scrolling, not clipped
    let sx = false;
    let sy = false;
    for (let e = p; e && e !== c; e = e.parentElement) {
      const es = getComputedStyle(e);
      if (/auto|scroll/.test(es.overflowX) && e.scrollWidth > e.clientWidth + 1)
        sx = true;
      if (
        /auto|scroll/.test(es.overflowY) &&
        e.scrollHeight > e.clientHeight + 1
      )
        sy = true;
    }
    for (const r of rg.getClientRects()) {
      if (r.width <= 0 || r.height <= 0) continue;
      // measure to the line box, not the glyph box: the half-leading belongs to the text
      // (negative when the line is tighter than the glyphs)
      const half = Number.isFinite(lh) ? (lh - r.height) / 2 : 0;
      const x = ext.get(c) ?? {
        l: 1e9,
        r: -1e9,
        t: 1e9,
        b: -1e9,
        control,
        sx: false,
        sy: false,
      };
      x.sx ||= sx;
      x.sy ||= sy;
      x.l = Math.min(x.l, r.left);
      x.r = Math.max(x.r, r.right);
      x.t = Math.min(x.t, r.top - half);
      x.b = Math.max(x.b, r.bottom + half);
      ext.set(c, x);
    }
  }
  for (const [c, x] of ext) {
    const b = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    const scrollsX =
      /auto|scroll/.test(cs.overflowX) && c.scrollWidth > c.clientWidth + 1;
    const scrollsY =
      /auto|scroll/.test(cs.overflowY) && c.scrollHeight > c.clientHeight + 1;
    const sides = {
      left: x.l - b.left,
      right: scrollsX || x.sx ? Infinity : b.right - x.r,
      top: x.control ? Infinity : x.t - b.top,
      bottom: x.control || scrollsY || x.sy ? Infinity : b.bottom - x.b,
    };
    const [side, inset] = Object.entries(sides).sort((p, q) => p[1] - q[1])[0];
    if (inset < floorInset - 1)
      out.insets.push({
        el: sel(c),
        side,
        inset: +inset.toFixed(1),
        text: c.textContent.trim().slice(0, 30),
      });
  }
  // body line height: 1.5 or more (WCAG 1.4.12); `normal` is about 1.2
  const lhSeen = new Set();
  const lw = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
  for (let n; (n = lw.nextNode());) {
    const el = n.parentElement;
    if (!n.nodeValue.trim() || !el || lhSeen.has(el)) continue;
    if (
      el.closest("script,style,noscript,svg,template") ||
      !visible(el) ||
      exempt(el)
    )
      continue;
    lhSeen.add(el);
    const body = el.closest("p,li,dd,blockquote,td,th");
    if (
      !body ||
      el.closest(
        "nav,header,footer,button,[role=tab],summary,figcaption,code,pre,.eyebrow,.badge,small",
      )
    )
      continue;
    const s = getComputedStyle(body);
    const px = parseFloat(s.fontSize);
    const lh = parseFloat(s.lineHeight);
    const ratio2 = Number.isFinite(lh) ? lh / px : 1.2;
    if (ratio2 < floorLeading - 0.005)
      out.leading.push({
        el: sel(body),
        ratio: +ratio2.toFixed(2),
        text: body.textContent.trim().slice(0, 30),
      });
  }
  out.leading = out.leading.filter(
    (v, i, a) => a.findIndex((w) => w.el === v.el && w.ratio === v.ratio) === i,
  );

  // structure
  out.landmarks = Object.fromEntries(
    ["header", "nav", "main", "footer"].map((t) => [
      t,
      document.querySelectorAll(t).length,
    ]),
  );
  let prev = 0;
  for (const h of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
    if (!visible(h)) continue;
    const lvl = +h.tagName[1];
    out.headings.push({
      lvl,
      skip: prev && lvl > prev + 1 ? `h${prev}->h${lvl}` : "",
    });
    prev = lvl;
  }
  out.h1 = out.headings.filter((h) => h.lvl === 1).length;
  out.headingSkips = out.headings.filter((h) => h.skip).map((h) => h.skip);
  out.imgNoAlt = [...document.images]
    .filter((i) => !i.hasAttribute("alt"))
    .map((i) => i.currentSrc.slice(-50));
  const GENERIC = /^(click here|here|read more|more|link|learn more)$/i;
  for (const a of document.querySelectorAll("a[href]")) {
    if (!visible(a) && !a.closest(".sr-only")) continue;
    const name = (
      a.getAttribute("aria-label") ||
      a.textContent ||
      a.querySelector("img")?.alt ||
      ""
    ).trim();
    if (!name || GENERIC.test(name))
      out.links.push(`${a.getAttribute("href")} -> "${name}"`);
  }
  out.unnamedButtons = [
    ...document.querySelectorAll(
      "button,input:not([type=hidden]),select,textarea",
    ),
  ]
    .filter(
      (b) =>
        visible(b) &&
        !(
          b.getAttribute("aria-label") ||
          b.textContent.trim() ||
          b.labels?.length ||
          b.getAttribute("aria-labelledby") ||
          b.placeholder
        ),
    )
    .map(sel);
  out.lang = document.documentElement.lang;
  out.skipLink = !!document.querySelector('a.skip[href="#main"]');
  out.hscroll =
    document.documentElement.scrollWidth >
    document.documentElement.clientWidth + 1;
  out.minText = out.text.length ? Math.min(...out.text) : 0;
  out.bodyPx = (() => {
    const p = document.querySelector("main p");
    return p ? parseFloat(getComputedStyle(p).fontSize) : 0;
  })();
  delete out.text;
  return out;
}

// ---- WCAG 1.4.12 text-spacing stress, run after STRESS_CSS is injected ----
// The criterion: with line height 1.5, paragraph spacing 2x the font size,
// letter spacing 0.12em and word spacing 0.16em, no content or function is lost.
// Lost here means text clipped by an overflow:hidden ancestor, text spilling out of
// the box that draws it, a truncated line, or a page that now scrolls sideways.
const STRESS_CSS = `*:not(svg):not(svg *) {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p { margin-bottom: 2em !important; }`;

function stress() {
  const out = {
    clipped: [],
    spill: [],
    truncated: [],
    hscroll: false,
    exempt: 0,
  };
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) return `${s}#${el.id}`;
    const c = [...el.classList].slice(0, 2).join(".");
    return c ? `${s}.${c}` : s;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (
        s.display === "none" ||
        s.visibility === "hidden" ||
        s.opacity === "0"
      )
        return false;
      if (e.hidden) return false;
      if (
        e.parentElement?.tagName === "DETAILS" &&
        !e.parentElement.open &&
        e.tagName !== "SUMMARY"
      )
        return false;
    }
    return !(r.width <= 1 && r.height <= 1);
  };
  const drawsBox = (e) => {
    const s = getComputedStyle(e);
    const clear = (c) => /^(rgba\(0, 0, 0, 0\)|transparent)$/.test(c);
    if (!clear(s.backgroundColor) || s.backgroundImage !== "none") return true;
    return (
      ["Top", "Right", "Bottom", "Left"].filter(
        (d) =>
          parseFloat(s["border" + d + "Width"]) > 0 &&
          s["border" + d + "Style"] !== "none" &&
          !clear(s["border" + d + "Color"]),
      ).length >= 3
    );
  };
  out.hscroll =
    document.documentElement.scrollWidth >
    document.documentElement.clientWidth + 1;
  const seen = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    if (!n.nodeValue.trim()) continue;
    const p = n.parentElement;
    if (
      !p ||
      p.closest(
        "script,style,noscript,svg,template,[data-mzizi-spacing-exempt]",
      ) ||
      !visible(p)
    )
      continue;
    const rg = document.createRange();
    rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter(
      (r) => r.width > 0 && r.height > 0,
    );
    if (!rects.length) continue;
    const L = Math.min(...rects.map((r) => r.left));
    const R = Math.max(...rects.map((r) => r.right));
    const T = Math.min(...rects.map((r) => r.top));
    const B = Math.max(...rects.map((r) => r.bottom));
    const txt = n.nodeValue.trim().slice(0, 30);
    // clipped by an overflow:hidden/clip ancestor
    // (an ancestor that scrolls on an axis makes the text reachable on that axis)
    let reachX = false;
    let reachY = false;
    for (let e = p; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      const clips = (v) => v === "hidden" || v === "clip";
      const scrolls = (v) => v === "auto" || v === "scroll";
      const cx = clips(s.overflowX) && !reachX;
      const cy = clips(s.overflowY) && !reachY;
      if (scrolls(s.overflowX)) reachX = true;
      if (scrolls(s.overflowY)) reachY = true;
      if (!cx && !cy) continue;
      const b = e.getBoundingClientRect();
      if (
        (cx && (L < b.left - 1 || R > b.right + 1)) ||
        (cy && (T < b.top - 1 || B > b.bottom + 1))
      ) {
        const key = "c" + sel(e) + txt;
        if (!seen.has(key)) {
          seen.add(key);
          out.clipped.push({ el: sel(e), text: txt });
        }
        break;
      }
    }
    // a truncated line (text-overflow) or a one-line box that now scrolls
    const ps = getComputedStyle(p);
    if (ps.textOverflow === "ellipsis" && p.scrollWidth > p.clientWidth + 1) {
      const key = "t" + sel(p) + txt;
      if (!seen.has(key)) {
        seen.add(key);
        out.truncated.push({ el: sel(p), text: txt });
      }
    }
    // spilling out of the box that draws it
    let c = null;
    for (let e = p; e && e !== document.body; e = e.parentElement)
      if (drawsBox(e)) {
        c = e;
        break;
      }
    if (c && !/auto|scroll/.test(getComputedStyle(c).overflowX)) {
      const b = c.getBoundingClientRect();
      let sx = false;
      let sy = false;
      for (let e = p; e && e !== c; e = e.parentElement) {
        const es = getComputedStyle(e);
        if (/auto|scroll/.test(es.overflowX)) sx = true;
        if (/auto|scroll/.test(es.overflowY)) sy = true;
      }
      if (
        L < b.left - 1 ||
        (!sx && R > b.right + 1) ||
        T < b.top - 1 ||
        (!sy && B > b.bottom + 1)
      ) {
        const key = "s" + sel(c) + txt;
        if (!seen.has(key)) {
          seen.add(key);
          out.spill.push({ el: sel(c), text: txt });
        }
      }
    }
  }
  return out;
}

async function launch() {
  const base = { args: ["--no-sandbox"] };
  if (process.env.PW_EXECUTABLE)
    return chromium.launch({
      ...base,
      executablePath: process.env.PW_EXECUTABLE,
    });
  if (process.env.PW_CHANNEL)
    return chromium.launch({ ...base, channel: process.env.PW_CHANNEL });
  return chromium.launch(base);
}

async function focusAudit(page, max = 80) {
  const bad = [];
  let order = [];
  await page.evaluate(() => document.activeElement?.blur());
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      const s = getComputedStyle(e);
      const rect = e.getBoundingClientRect();
      const ring =
        (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2) ||
        (s.boxShadow !== "none" && /\d+px/.test(s.boxShadow));
      return {
        el:
          e.tagName.toLowerCase() +
          (e.id
            ? "#" + e.id
            : e.className
              ? "." + String(e.className).split(" ")[0]
              : ""),
        ring,
        text: (e.getAttribute("aria-label") || e.textContent || "")
          .trim()
          .slice(0, 24),
        off: rect.width === 0,
      };
    });
    if (!r) break;
    if (
      order.length &&
      order[0].el === r.el &&
      order[0].text === r.text &&
      i > 2
    )
      break;
    order.push(r);
    if (!r.ring) bad.push(r.el + " " + r.text);
  }
  return { count: order.length, first: order[0]?.text, noRing: bad };
}

async function motionAudit(browser, origin, path) {
  const ctx = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: "load" });
  const n = await page.evaluate(() => {
    let c = 0;
    const secs = (v) =>
      Math.max(
        ...v
          .split(",")
          .map((x) => parseFloat(x) * (x.includes("ms") ? 0.001 : 1)),
      );
    for (const e of document.querySelectorAll("*")) {
      const s = getComputedStyle(e);
      if (s.animationName !== "none" && secs(s.animationDuration) > 0.05) c++;
      else if (secs(s.transitionDuration) > 0.3) c++;
    }
    return {
      animated: c,
      smooth:
        getComputedStyle(document.documentElement).scrollBehavior === "smooth",
    };
  });
  await ctx.close();
  return n;
}

async function perfAudit(browser, origin, path) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  // Lighthouse's "slow 4G" / WebPageTest "3G fast": 1.6 Mbps down, 750 Kbps up, 150 ms RTT; 4x CPU slowdown
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let bytes = 0;
  let reqs = 0;
  cdp.on("Network.loadingFinished", (e) => {
    bytes += e.encodedDataLength;
    reqs++;
  });
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const t0 = Date.now();
  await page.goto(origin + path, { waitUntil: "load" });
  const load = Date.now() - t0;
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => ({
    lcp: Math.round(window.__lcp),
    cls: +window.__cls.toFixed(3),
    js: performance
      .getEntriesByType("resource")
      .filter((r) => r.initiatorType === "script").length,
  }));
  await ctx.close();
  return { kb: Math.round(bytes / 1024), reqs, load, ...m };
}

// BUNDU_FLOOR from the registry (4.24.0): text 14, body 17, hit 49; spacing
// insetPx 14 (--inset-floor), controlGapPx 7 (--gap-floor), leadingBody 1.5 (--leading-floor)
const MEASURE_OPTS = {
  floorText: 14,
  floorBody: 17,
  floorHit: 49,
  floorInset: 14,
  floorGap: 7,
  floorLeading: 1.5,
};

async function auditPage(browser, origin, [name, path], vp, shots) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: vp.touch,
    isMobile: vp.mobile,
    deviceScaleFactor: vp.mobile ? 2 : 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on(
    "console",
    (m) => m.type() === "error" && errors.push(m.text().slice(0, 120)),
  );
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
  const res = await page.goto(origin + path, { waitUntil: "load" });
  const r = await page.evaluate(measure, MEASURE_OPTS);
  r.status = res.status();
  r.errors = errors;
  r.page = name;
  r.vp = vp.name;
  r.pointer = await page.evaluate(() => matchMedia("(pointer: fine)").matches);
  if (!GUARD) r.focus = await focusAudit(page);
  if (shots) {
    mkdirSync(OUT, { recursive: true });
    await page.screenshot({
      path: join(OUT, `${LABEL}-${name}-${vp.name}.png`),
      fullPage: true,
    });
  }
  const extra = [];
  // overlays: mobile drawer (below the nav breakpoint) and the search dialog
  if (name === "home") {
    if (await page.locator("#nav-toggle").isVisible()) {
      await page.click("#nav-toggle");
      await page.waitForTimeout(400);
      const d = await page.evaluate(measure, {
        ...MEASURE_OPTS,
        root: "#mobile-drawer",
      });
      d.page = "drawer";
      d.vp = vp.name;
      extra.push(d);
      if (shots)
        await page.screenshot({
          path: join(OUT, `${LABEL}-drawer-${vp.name}.png`),
        });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      if (await page.locator("#mobile-drawer").isVisible()) {
        r.drawerEscape = "drawer did not close on Escape";
        await page.click("#drawer-close").catch(() => {});
      }
    }
    await page.click("#search-trigger", { force: true }).catch(() => {});
    await page.waitForTimeout(500);
    if (await page.locator("#search-dialog").isVisible()) {
      await page.fill("#search-input", "button").catch(() => {});
      await page.waitForTimeout(1200);
      const d = await page.evaluate(measure, {
        ...MEASURE_OPTS,
        root: "#search-dialog",
      });
      d.page = "search";
      d.vp = vp.name;
      extra.push(d);
      if (shots)
        await page.screenshot({
          path: join(OUT, `${LABEL}-search-${vp.name}.png`),
        });
    } else r.searchOpen = "search dialog did not open";
  }
  // narrow reflow: nothing scrolls sideways at 320px
  if (vp.name === "390") {
    await page.setViewportSize({ width: 320, height: 640 });
    r.hscroll320 = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
  }
  // text-spacing stress on a fresh load of the page, and on the open drawer
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(origin + path, { waitUntil: "load" });
  await page.addStyleTag({ content: STRESS_CSS });
  await page.waitForTimeout(150);
  r.stress = await page.evaluate(stress);
  if (name === "home" && (await page.locator("#nav-toggle").isVisible())) {
    await page.click("#nav-toggle");
    await page.waitForTimeout(400);
    const d = extra.find((x) => x.page === "drawer");
    if (d) d.stress = await page.evaluate(stress);
  }
  await ctx.close();
  return [r, ...extra];
}

function rtlScan() {
  const hits = [];
  const re =
    /\b(margin|padding)-(left|right)\b|\b(left|right)\s*:|text-align:\s*(left|right)|border-(left|right)\b|\b(ml|mr|pl|pr)-\d|\btext-(left|right)\b|\b(left|right)-\d/;
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(astro|css|tsx)$/.test(f.name)) {
        readFileSync(p, "utf8")
          .split("\n")
          .forEach((l, i) => {
            if (re.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l))
              hits.push(
                `${p.replace(process.cwd() + "/", "")}:${i + 1}: ${l.trim().slice(0, 80)}`,
              );
          });
      }
    }
  };
  if (existsSync("src")) walk("src");
  return hits;
}

const main = async () => {
  let origin = REMOTE;
  let server;
  if (!origin) {
    ({ server, origin } = await serve(DIST));
  }
  const browser = await launch();
  const rows = [];
  for (const vp of VIEWPORTS)
    for (const pg of PAGES)
      rows.push(...(await auditPage(browser, origin, pg, vp, SHOTS)));
  const motion = GUARD ? null : await motionAudit(browser, origin, "/");
  const perf = [];
  if (!GUARD)
    for (const [n, p] of [PAGES[0], PAGES[1], PAGES[2], PAGES[3]])
      perf.push({ page: n, ...(await perfAudit(browser, origin, p)) });
  await browser.close();
  server?.close();
  const rtl = GUARD ? [] : rtlScan();

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    join(OUT, `${LABEL}.json`),
    JSON.stringify({ rows, motion, perf, rtl }, null, 1),
  );

  // ---- summary ----
  const sum = (f) => rows.reduce((n, r) => n + f(r).length, 0);
  const fails = [];
  for (const r of rows) {
    const tag = `${r.page}@${r.vp}`;
    if (r.small.length)
      fails.push(
        `${tag}: ${r.small.length} text node(s) under 14px, e.g. ${r.small[0].el} ${r.small[0].px}px "${r.small[0].text}"`,
      );
    if (r.belowHit.length)
      fails.push(
        `${tag}: ${r.belowHit.length} control(s) under a 49px hit region, e.g. ${r.belowHit[0].el} ${r.belowHit[0].w}x${r.belowHit[0].h} "${r.belowHit[0].text}"`,
      );
    if (r.gaps.length)
      fails.push(
        `${tag}: ${r.gaps.length} pair(s) of adjacent controls under a 7px gap, e.g. ${r.gaps[0].a} / ${r.gaps[0].b} ${r.gaps[0].gap}px "${r.gaps[0].text}"`,
      );
    if (r.insets.length)
      fails.push(
        `${tag}: ${r.insets.length} container(s) with text under a 14px inset, e.g. ${r.insets[0].el} ${r.insets[0].side} ${r.insets[0].inset}px "${r.insets[0].text}"`,
      );
    if (r.leading.length)
      fails.push(
        `${tag}: ${r.leading.length} body text block(s) under a 1.5 line height, e.g. ${r.leading[0].el} ${r.leading[0].ratio} "${r.leading[0].text}"`,
      );
    if (r.exemptNoReason.length)
      fails.push(
        `${tag}: data-mzizi-spacing-exempt without a reason on ${r.exemptNoReason.join(", ")}`,
      );
    const st = r.stress;
    if (st) {
      const lost = [...st.clipped, ...st.spill, ...st.truncated];
      if (lost.length)
        fails.push(
          `${tag}: text-spacing stress (1.4.12) loses text in ${lost.length} place(s), e.g. ${lost[0].el} "${lost[0].text}" (${st.clipped.length} clipped, ${st.spill.length} spilling, ${st.truncated.length} truncated)`,
        );
      if (st.hscroll)
        fails.push(
          `${tag}: text-spacing stress makes the page scroll sideways`,
        );
    }
    if (r.overlaps.length)
      fails.push(
        `${tag}: ${r.overlaps.length} overlapping hit region(s), e.g. ${r.overlaps[0]}`,
      );
    if (r.contrast.length)
      fails.push(
        `${tag}: ${r.contrast.length} text/background pair(s) under the contrast floor, e.g. ${r.contrast[0].el} ${r.contrast[0].ratio}:1 (needs ${r.contrast[0].need}) "${r.contrast[0].text}"`,
      );
    if (
      !["drawer", "search"].includes(r.page) &&
      (r.h1 !== 1 || r.headingSkips.length)
    )
      fails.push(
        `${tag}: headings (h1 count ${r.h1}, skips ${r.headingSkips.join(",") || "none"})`,
      );
    if (r.hscroll || r.hscroll320)
      fails.push(`${tag}: horizontal scroll${r.hscroll320 ? " at 320px" : ""}`);
    if (r.errors.length && r.status < 400)
      fails.push(`${tag}: console errors: ${r.errors[0]}`);
  }
  console.log(
    `\naudit "${LABEL}" of ${REMOTE || DIST}: ${rows.length} page states`,
  );
  const t = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
  t(
    "text nodes under 14px",
    sum((r) => r.small),
  );
  t(
    "prose (80+ chars) under 17px",
    sum((r) => r.proseSmall),
  );
  t(
    "controls under a 49px hit region (non-inline)",
    sum((r) => r.belowHit),
  );
  t(
    "overlapping hit regions",
    sum((r) => r.overlaps),
  );
  t(
    "adjacent controls under a 7px gap",
    sum((r) => r.gaps),
  );
  t(
    "containers with text under a 14px inset",
    sum((r) => r.insets),
  );
  t(
    "body text blocks under a 1.5 line height",
    sum((r) => r.leading),
  );
  t(
    "text lost under the 1.4.12 spacing stress",
    rows.reduce(
      (n, r) =>
        n +
        (r.stress
          ? r.stress.clipped.length +
            r.stress.spill.length +
            r.stress.truncated.length
          : 0),
      0,
    ),
  );
  t(
    "pages that scroll sideways under the stress",
    rows.filter((r) => r.stress?.hscroll).length,
  );
  t(
    "spacing exemptions (data-mzizi-spacing-exempt)",
    rows.reduce((n, r) => n + (r.exempt ?? 0), 0),
  );
  t(
    "contrast failures (7:1 body, 4.5:1 other)",
    sum((r) => r.contrast),
  );
  t(
    "pages with horizontal scroll (incl. 320px)",
    rows.filter((r) => r.hscroll || r.hscroll320).length,
  );
  t(
    "pages without exactly one h1",
    rows.filter((r) => !["drawer", "search"].includes(r.page) && r.h1 !== 1)
      .length,
  );
  t(
    "heading level skips",
    rows.reduce((n, r) => n + r.headingSkips.length, 0),
  );
  t(
    "images without alt",
    sum((r) => r.imgNoAlt),
  );
  t(
    "links with no/generic name",
    sum((r) => r.links),
  );
  t(
    "controls without a name",
    sum((r) => r.unnamedButtons),
  );
  t(
    "console errors",
    sum((r) => r.errors),
  );
  if (!GUARD) {
    t(
      "focused elements without a visible ring",
      rows.reduce((n, r) => n + (r.focus?.noRing.length ?? 0), 0),
    );
    t(
      "elements animating under reduced motion",
      motion.animated + (motion.smooth ? " (smooth scroll on)" : ""),
    );
    t("physical (non-logical) CSS properties in src/", rtl.length);
    for (const p of perf)
      t(
        `3G ${p.page}`,
        `${p.kb} KB, ${p.reqs} req, LCP ${p.lcp} ms, CLS ${p.cls}, load ${p.load} ms`,
      );
  }
  if (fails.length) {
    console.log("\nFAILED:");
    for (const f of fails) console.log("  - " + f);
    if (GUARD) process.exit(1);
  } else
    console.log(
      "\nfloor holds: no text under 14px, no control under a 49px hit region, 7px between controls, 14px text inset, 1.5 line height, the 1.4.12 stress passes, no sideways scroll, no console errors",
    );
};
main().catch((e) => {
  console.error(e);
  process.exit(2);
});
