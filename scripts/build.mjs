import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(join(out, "src"), { recursive: true });
await cp(join(root, "index.html"), join(out, "index.html"));
await cp(join(root, "styles.css"), join(out, "styles.css"));
await cp(join(root, "src"), join(out, "src"), { recursive: true });
console.log(`Built static app in ${out}`);
