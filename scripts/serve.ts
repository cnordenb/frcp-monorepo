import { readFile } from "node:fs/promises";
import { type Server, createServer } from "node:http";
import path from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".webm": "audio/webm",
  ".ico": "image/x-icon",
};

function filePath(root: string, url: string): string | null {
  const name = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const file = path.join(root, name.endsWith("/") ? name + "index.html" : name);
  return file.startsWith(root) ? file : null;
}

export function serve(root: string, port: number): Promise<Server> {
  const server = createServer(async (request, response) => {
    const file = filePath(root, request.url ?? "/");
    try {
      const body = await readFile(file ?? "");
      response.writeHead(200, { "Content-Type": TYPES[path.extname(file ?? "")] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 8080);
  await serve(path.resolve(import.meta.dirname, "..", "dist", process.argv[2] ?? "web"), port);
  console.log(`http://127.0.0.1:${port}/`);
}
