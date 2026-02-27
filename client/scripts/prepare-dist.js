/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "build");
const distDir = path.join(root, "dist");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function copyAllFiles(fromDir, toDir) {
  if (!fs.existsSync(fromDir)) return;
  ensureDir(toDir);
  for (const fileName of fs.readdirSync(fromDir)) {
    const from = path.join(fromDir, fileName);
    const to = path.join(toDir, fileName);
    if (fs.statSync(from).isDirectory()) {
      copyAllFiles(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(buildDir)) {
  throw new Error("Build folder not found. Run `npm run build` first.");
}

cleanDir(distDir);
ensureDir(path.join(distDir, "css"));
ensureDir(path.join(distDir, "js"));
ensureDir(path.join(distDir, "assets"));

const indexPath = path.join(buildDir, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf8");

const normalizedIndex = indexHtml
  .replaceAll("/static/css/", "./css/")
  .replaceAll("static/css/", "./css/")
  .replaceAll("/static/js/", "./js/")
  .replaceAll("static/js/", "./js/")
  .replaceAll("/static/media/", "./assets/")
  .replaceAll("static/media/", "./assets/");

fs.writeFileSync(path.join(distDir, "index.html"), normalizedIndex, "utf8");

copyAllFiles(path.join(buildDir, "static", "css"), path.join(distDir, "css"));
copyAllFiles(path.join(buildDir, "static", "js"), path.join(distDir, "js"));
copyAllFiles(path.join(buildDir, "static", "media"), path.join(distDir, "assets"));

for (const fileName of ["favicon.ico", "manifest.json", "robots.txt", "sw.js"]) {
  const from = path.join(buildDir, fileName);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(distDir, fileName));
  }
}

console.log("dist folder generated at:", distDir);
