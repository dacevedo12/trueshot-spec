// Serve one client started some other way, from connecting into play, and
// keep it there until it leaves. The client is launched with
//   "" "" "" "127.0.0.1 <port> CokZRbAN15lr+Vviv9YYow== 1"
//
//   bun run live:serve <build> [port]
import { KEY, Match } from "./match.ts";

const [build, port = "5000"] = process.argv.slice(2);
if (build === undefined) {
  console.error("usage: bun run live:serve <build> [port]");
  process.exit(2);
}
const match = new Match(
  {
    build,
    layouts: build,
    transport: undefined,
    messages: new Map(),
    client: "",
    launcher: [],
    stop: [],
    screenshot: [],
    windows: [],
    mainWindow: "",
    port: Number(port),
  },
  { name: "serve", launch: false },
);
await match.start();
console.log(
  `serving ${build} on 127.0.0.1:${port}; launch the client with "127.0.0.1 ${port} ${KEY} ${match.seat.playerId}"`,
);
await match.reach("playing", 3_600_000);
console.log(`in play; capture in ${match.capture.dir}`);
while (match.disconnected === undefined) await Bun.sleep(1_000);
console.log(`the client left: ${match.disconnected}`);
process.exit(0);
