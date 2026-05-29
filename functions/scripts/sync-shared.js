#!/usr/bin/env node

/**
 * Sincroniza el paquete @tijuanasinbarreras/shared dentro de functions/
 * para que este disponible durante el deploy a Cloud Build.
 *
 * Copia ../shared/dist/ → functions/shared/dist/
 * Genera functions/shared/package.json (apunta a dist/ ya compilado)
 */

const fs = require("node:fs");
const path = require("node:path");

const SHARED_SRC = path.resolve(__dirname, "..", "..", "shared");
const SHARED_DEST = path.resolve(__dirname, "..", "shared");

if (!fs.existsSync(path.join(SHARED_SRC, "dist"))) {
  console.error("ERROR: shared/dist no existe. Ejecuta 'yarn build' en shared/ primero.");
  process.exit(1);
}

fs.rmSync(SHARED_DEST, {recursive: true, force: true});
fs.mkdirSync(path.join(SHARED_DEST, "dist"), {recursive: true});

copyRecursive(path.join(SHARED_SRC, "dist"), path.join(SHARED_DEST, "dist"));

const sharedPkg = {
  name: "@tijuanasinbarreras/shared",
  version: "0.0.1",
  private: true,
  type: "module",
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
};

fs.writeFileSync(
  path.join(SHARED_DEST, "package.json"),
  JSON.stringify(sharedPkg, null, 2)
);

console.log("shared/ sincronizado en functions/shared/");

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, {withFileTypes: true});
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, {recursive: true});
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
