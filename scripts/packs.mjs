/**
 * scripts/packs.mjs
 *
 * Converts between compiled Foundry VTT compendium packs (LevelDB, in packs/<name>/)
 * and their plaintext JSON source (in packs/_source/<name>/*.json).
 *
 * Usage:
 *   node scripts/packs.mjs unpack   # LevelDB -> JSON  (run after editing packs in Foundry)
 *   node scripts/packs.mjs pack     # JSON -> LevelDB   (run before loading the module in Foundry / before release)
 *
 * Pack definitions are read straight from module.json, so adding/removing a
 * compendium there is all that's needed to pick it up here too.
 */

import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE_ROOT = path.join(ROOT, "packs", "_source");

async function loadPacks() {
    const moduleJson = JSON.parse(await fs.readFile(path.join(ROOT, "module.json"), "utf8"));
    if (!Array.isArray(moduleJson.packs) || moduleJson.packs.length === 0) {
        throw new Error("No packs found in module.json");
    }
    return moduleJson.packs.map((p) => ({
        name: p.name,
        compiledDir: path.join(ROOT, p.path),
        sourceDir: path.join(SOURCE_ROOT, p.name),
    }));
}

async function pathExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

// Best-effort wipe of a directory before a fresh rebuild, so documents
// removed/renamed on one side don't linger as orphans on the other. This is
// skipped (with a warning) if the filesystem refuses the delete - e.g. some
// sandboxed/managed environments block deleting existing files - in which
// case extractPack/compilePack simply upsert into the existing directory.
async function tryClean(dir) {
    try {
        await fs.rm(dir, { recursive: true, force: true });
    } catch (err) {
        console.warn(`Could not clean ${path.basename(dir)} (${err.code ?? err.message}); updating in place instead.`);
    }
    await fs.mkdir(dir, { recursive: true });
}

async function unpack() {
    const packs = await loadPacks();
    for (const pack of packs) {
        if (!(await pathExists(pack.compiledDir))) {
            console.warn(`Skipping "${pack.name}": no compiled pack at ${pack.compiledDir}`);
            continue;
        }
        await tryClean(pack.sourceDir);

        console.log(`Unpacking "${pack.name}" -> ${path.relative(ROOT, pack.sourceDir)}`);
        await extractPack(pack.compiledDir, pack.sourceDir, { log: true });
    }
}

async function pack() {
    const packs = await loadPacks();
    for (const pack of packs) {
        if (!(await pathExists(pack.sourceDir))) {
            console.warn(`Skipping "${pack.name}": no JSON source at ${pack.sourceDir}`);
            continue;
        }
        await tryClean(pack.compiledDir);

        console.log(`Packing "${pack.name}" -> ${path.relative(ROOT, pack.compiledDir)}`);
        await compilePack(pack.sourceDir, pack.compiledDir, { log: true });
    }
}

async function main() {
    const mode = process.argv[2];
    if (mode === "unpack") {
        await unpack();
    } else if (mode === "pack") {
        await pack();
    } else {
        console.error("Usage: node scripts/packs.mjs <unpack|pack>");
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
