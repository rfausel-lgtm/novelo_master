import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// Adaptador somente para o preview privado no Sites. O export out/ usado no
// Cloudflare Pages continua intacto. Textos comprimidos são servidos pelo Worker.
if (existsSync(".openai/hosting.json")) {
  await rm("dist", { recursive: true, force: true });
  async function copy(directory, target) {
    await mkdir(target, { recursive: true });
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const from = join(directory, item.name),
        to = join(target, item.name);
      if (item.isDirectory()) await copy(from, to);
      else if (/\.(html|txt|json)$/.test(item.name))
        await writeFile(`${to}.gz`, gzipSync(await readFile(from)));
      else await copyFile(from, to);
    }
  }
  await copy("out", "dist/client");
  await mkdir("dist/server", { recursive: true });
  await copyFile("scripts/preview-worker.mjs", "dist/server/index.js");
  await mkdir("dist/.openai", { recursive: true });
  await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
  console.log("Preview completo preparado com textos comprimidos.");
}
