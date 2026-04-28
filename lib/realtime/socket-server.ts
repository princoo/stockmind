import { createServer, type Server as HttpServer } from "node:http";
import { Server as IOServer, type ServerOptions } from "socket.io";

const DEFAULT_PORT = Number(process.env.REALTIME_PORT ?? "4010");

let ioRef: IOServer | null = null;
let httpServerRef: HttpServer | null = null;
let initPromise: Promise<{ port: number }> | null = null;

function createIoServer(httpServer: HttpServer) {
  const options: Partial<ServerOptions> = {
    cors: {
      origin: true,
      credentials: true,
    },
  };
  return new IOServer(httpServer, options);
}

export function getIoServer() {
  return ioRef;
}

export async function ensureRealtimeServer() {
  if (ioRef && httpServerRef) {
    const address = httpServerRef.address();
    const port =
      typeof address === "object" && address?.port ? Number(address.port) : DEFAULT_PORT;
    return { port };
  }
  if (initPromise !== null) return initPromise;

  initPromise = new Promise<{ port: number }>((resolve, reject) => {
    const httpServer = createServer((_, res) => {
      res.writeHead(404);
      res.end();
    });
    const io = createIoServer(httpServer);

    httpServer.on("error", (error) => {
      initPromise = null;
      reject(error);
    });

    httpServer.listen(DEFAULT_PORT, () => {
      ioRef = io;
      httpServerRef = httpServer;
      resolve({ port: DEFAULT_PORT });
    });
  });

  return initPromise;
}

export function emitNotificationsRefresh() {
  ioRef?.emit("notifications:refresh");
}
