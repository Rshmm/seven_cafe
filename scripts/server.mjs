import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/kitchen") pathname = "/index.html";
  const safe = normalize(pathname).replace(/^([.][.][\\/])+/, "");
  try {
    const data = await readFile(join(root, safe));
    response.writeHead(200, { "Content-Type": types[extname(safe)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => console.log(`کافه هفت روی http://localhost:${port}`));
