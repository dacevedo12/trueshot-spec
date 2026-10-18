// Starting and stopping the client you supply. Nothing here knows where a
// client lives or how your system runs one: the environment says (see
// README.md), and a run without a client skips every check that needs one.

import type { Subprocess } from "bun";
import { dirname, join } from "node:path";

interface Setup {
  readonly build: string;
  readonly client: string;
  readonly launcher: readonly string[];
  readonly stop: readonly string[];
  readonly screenshot: readonly string[];
  readonly port: number;
}

// Words split on spaces; a launcher that needs a space in one word belongs
// in a script of its own.
const words = (text: string | undefined): readonly string[] =>
  (text ?? "").split(" ").filter((w) => w.length > 0);

function setup(): Setup | undefined {
  const build = Bun.env["TRUESHOT_BUILD"];
  const client = Bun.env["TRUESHOT_CLIENT"];
  if (
    build === undefined ||
    client === undefined ||
    build === "" ||
    client === ""
  )
    return undefined;
  return {
    build,
    client,
    launcher: words(Bun.env["TRUESHOT_LAUNCHER"]),
    stop: words(Bun.env["TRUESHOT_STOP"]),
    screenshot: words(Bun.env["TRUESHOT_SCREENSHOT"]),
    port: Number(Bun.env["TRUESHOT_PORT"] ?? 5000),
  };
}

interface Launch {
  readonly host: string;
  readonly port: number;
  readonly key: string;
  readonly playerId: string;
}

class Client {
  readonly #setup: Setup;
  #process: Subprocess | undefined;

  constructor(s: Setup) {
    this.#setup = s;
  }

  // A client takes three arguments it does not need here, then one holding
  // where to connect, the key in base64, and the player it registers as.
  start(launch: Launch, log: string): void {
    const target = `${launch.host} ${launch.port} ${launch.key} ${launch.playerId}`;
    const command = [
      ...this.#setup.launcher,
      this.#setup.client,
      "",
      "",
      "",
      target,
    ];
    this.#process = Bun.spawn(command, {
      cwd: dirname(this.#setup.client),
      stdout: Bun.file(join(log, "client.log")),
      stderr: Bun.file(join(log, "client.err")),
    });
  }

  get running(): boolean {
    return (
      this.#process !== undefined &&
      this.#process.exitCode === null &&
      this.#process.signalCode === null
    );
  }

  // Empty where it worked, otherwise why it did not.
  async screenshot(file: string): Promise<string> {
    if (this.#setup.screenshot.length === 0)
      return "TRUESHOT_SCREENSHOT is not set";
    const [program = "", ...rest] = this.#setup.screenshot;
    const done = Bun.spawn([program, ...rest, file], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const code = await done.exited;
    if (code === 0) return "";
    const said =
      `${await new Response(done.stdout).text()}${await new Response(done.stderr).text()}`.trim();
    return `the screenshot command exited ${code}${said === "" ? "" : `: ${said}`}`;
  }

  async stop(): Promise<void> {
    this.#process?.kill();
    if (this.#setup.stop.length > 0) {
      await Bun.spawn([...this.#setup.stop]).exited;
    }
    await this.#process?.exited;
  }
}

export { Client, setup };
export type { Launch, Setup };
