import { createServer } from "node:http";
import { prisma } from "./db";

const port = process.env.PORT ?? 3000;

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/health/db") {
    prisma.tenant
      .count()
      .then((count) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok", tenants: count }));
      })
      .catch((err) => {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: String(err) }));
      });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
