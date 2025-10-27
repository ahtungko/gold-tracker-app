import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { pushNotificationService } from "../services/pushNotificationService";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

let lifecycleRegistered = false;

function registerLifecycle(server: ReturnType<typeof createServer>) {
  if (lifecycleRegistered) {
    return;
  }
  lifecycleRegistered = true;

  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log(`[server] Received ${signal}, shutting down gracefully.`);

    void (async () => {
      try {
        await pushNotificationService.stop();
      } catch (error) {
        console.error("[push] Error while stopping push notifications:", error);
      } finally {
        server.close(() => {
          process.exit(0);
        });
      }
    })();

    setTimeout(() => {
      process.exit(0);
    }, 5_000).unref();
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => shutdown(signal));
  }

  process.once("beforeExit", () => {
    if (!shuttingDown) {
      shuttingDown = true;
      void pushNotificationService.stop();
    }
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  registerLifecycle(server);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    pushNotificationService.start();
  });
}

startServer().catch(console.error);
