import { hash } from "bcryptjs";
import { send } from "../services/broadcast/";
import { addCmd, force } from "../services/commands";
import { dbojs } from "../services/Database";
import { getNextId } from "../utils/getNextId";
import { moniker } from "../utils/moniker";
import { joinChans } from "../utils/joinChans";
import cfg from "../ursamu.config";

export default () =>
  addCmd({
    name: "create",
    pattern: /^create\s+(.*)/i,
    exec: async (ctx, args) => {
      // if there are only two args, then it's name and password, but
      // if there are three, then it's a two or three word, etc name
      // with a password at the end.

      let name = "";
      let password = "";
      const pieces = args[0].split(" ");
      if (pieces.length < 2) {
        [name, password] = pieces;
      } else {
        password = pieces.pop() || "";
        name = pieces.join(" ");
      }

      const players = await dbojs.find({ flags: /player/i });
      const taken = await dbojs.find({
        $or: [{ "data.name": name }, { "data.alias": name }],
      });

      if (taken.length > 0) {
        send([ctx.socket.id], "That name is already taken or unavailable.", {
          error: true,
        });
        return;
      }

      const flags =
        players.length > 0 ? "player connected" : "player connected superuser";
      const id = await getNextId();
      const player = await dbojs.insert({
        id,
        flags,
        location: cfg.config.game?.playerStart,
        data: {
          name,
          home: cfg.config.game?.playerStart,
          password: await hash(password, 10),
        },
      });

      ctx.socket.join(`#${player.id}`);
      ctx.socket.join(`#${player.location}`);
      ctx.socket.cid = player.id;
      player.data ||= {};
      player.data.lastCommand = Date.now();

      await dbojs.update({ id: player.id }, player);
      await joinChans(ctx);

      send([ctx.socket.id], `Welcome to the game, ${player.data?.name}!`, {
        cid: player.id,
      });

      send([`#${player.location}`], `${moniker(player)} has connected.`, {});
      force(ctx, "look");
    },
  });
