/**
 * bake-docs.cjs
 *
 * Copies source/documentation.html into the "Harrowing Macro Documentation"
 * journal page inside the plaintext JSON compendium source
 * (packs/_source/documentation/*.json).
 *
 * This replaced an older version of this script that patched the raw
 * LevelDB pack file directly (fragile, required a local-disk scratch copy).
 * Now that packs are unpacked to JSON via foundryvtt-cli (see
 * scripts/packs.mjs / `npm run unpack`), editing is a plain JSON text
 * replacement -- no database involved.
 *
 * Workflow:
 *   1. Edit source/documentation.html.
 *   2. node source/bake-docs.cjs
 *   3. npm run pack   (compiles packs/_source/documentation -> packs/documentation)
 */

const fs = require("fs");
const path = require("path");

const HTML_FILE = path.join(__dirname, "documentation.html");
const SOURCE_DIR = path.join(__dirname, "..", "packs", "_source", "documentation");
const PAGE_NAME = "Harrowing Macro Documentation";

function main() {
    const html = fs.readFileSync(HTML_FILE, "utf8").trim();
    console.log(`Read documentation.html (${html.length} chars)`);

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`No JSON source found at ${SOURCE_DIR}. Run "npm run unpack" first.`);
        process.exit(1);
    }

    const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".json"));
    let updated = false;

    for (const file of files) {
        const filePath = path.join(SOURCE_DIR, file);
        const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const page = (doc.pages || []).find((p) => p.name === PAGE_NAME);
        if (!page) continue;

        page.text.content = html;
        fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
        console.log(`Updated "${PAGE_NAME}" in ${file}`);
        updated = true;
        break;
    }

    if (!updated) {
        console.error(`Could not find a journal page named "${PAGE_NAME}" under ${SOURCE_DIR}.`);
        process.exit(1);
    }

    console.log('Done. Run "npm run pack" to compile the change into packs/documentation.');
}

main();
