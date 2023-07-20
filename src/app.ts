import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { IMSocket } from "./@types/IMSocket";
import { cmdParser } from "./services/commands";
import { Server } from "socket.io";
import { dbojs } from "./services/Database";
import { send } from "./services/broadcast";
import { moniker } from "./utils/moniker";
import { joinChans } from "./utils/joinChans";
import { IContext } from "./@types/IContext";
import { setFlags } from "./utils/setFlags";
import { authRouter, dbObjRouter } from "./routes";
import authMiddleware from "./middleware/authMiddleware";
import { IMError } from "./@types";

export const app = express();
export const server = createServer(app);
export const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth/", authRouter);
app.use("/api/v1/dbobj/", authMiddleware, dbObjRouter);

app.use(
  (error: IMError, req: Request, res: Response, next: NextFunction): void => {
    // Handle error here
    console.error(error);
    res
      .status(error.status || 500)
      .json({ error: true, status: error.status, message: error.message });
  }
);

io.on("connection", (socket: IMSocket) => {
  socket.on("message", async (message) => {
    if (message.data.cid) socket.cid = message.data.cid;
    const player = await dbojs.findOne({ id: socket.cid });
    if (player) socket.join(`#${player.location}`);

    if (message.data.disconnect) {
      socket.disconnect();
      return;
    }

    const ctx: IContext = { socket, msg: message.msg };
    joinChans(ctx);
    if (message.msg.trim()) cmdParser.run(ctx);
  });

  socket.on("disconnect", async () => {
    const en = await dbojs.findOne({ id: socket.cid });
    if (!en) return;

    const socks: IMSocket[] = [];
    for (const [id, sock] of io.sockets.sockets.entries()) {
      const s = sock as IMSocket;
      if (s.cid && s.cid === en.id) {
        socks.push(s);
      }
    }
    console.log(socks.length);
    if (socks.length < 1) await setFlags(en, "!connected");
    await send([`#${en.location}`], `${moniker(en)} has disconnected.`, {});
  });

  socket.on("error", () => {
    socket.disconnect();
  });
});
