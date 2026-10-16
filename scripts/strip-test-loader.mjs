import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function withTypeScriptExtension(filePath) {
  if (existsSync(filePath)) return filePath;
  for (const suffix of [".ts", ".tsx", ".mts", ".js", ".mjs"]) {
    if (existsSync(filePath + suffix)) return filePath + suffix;
  }
  return "";
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const filePath = withTypeScriptExtension(path.join(root, specifier.slice(2)));
    if (filePath) return nextResolve(pathToFileURL(filePath).href, context);
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parentDir = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : root;
    const filePath = withTypeScriptExtension(path.resolve(parentDir, specifier));
    if (filePath) return nextResolve(pathToFileURL(filePath).href, context);
  }

  return nextResolve(specifier, context);
}
