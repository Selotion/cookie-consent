import { build, transform } from "esbuild";
import { readFile, stat } from "node:fs/promises";

// CSS ve HTML şablonu metin olarak pakete gömülür; CSS ayrıca küçültülür.
const embedPlugin = {
  name: "embed-text",
  setup(b) {
    b.onLoad({ filter: /\.css$/ }, async (args) => {
      const src = await readFile(args.path, "utf8");
      const out = await transform(src, { loader: "css", minify: true });
      return { contents: out.code.trim(), loader: "text" };
    });
    b.onLoad({ filter: /\.html$/ }, async (args) => {
      const src = await readFile(args.path, "utf8");
      const min = src.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim();
      return { contents: min, loader: "text" };
    });
  },
};

await build({
  entryPoints: ["src/cookie-consent.js"],
  outfile: "dist/cookie-consent.min.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019", "chrome80", "firefox78", "safari13"],
  legalComments: "none",
  banner: { js: "/*! Selotion Cookie Consent v1.0.0 | MIT | https://github.com/selotion/cookie-consent */" },
  plugins: [embedPlugin],
});

const { size } = await stat("dist/cookie-consent.min.js");
console.log(`dist/cookie-consent.min.js  ${(size / 1024).toFixed(1)} KB`);