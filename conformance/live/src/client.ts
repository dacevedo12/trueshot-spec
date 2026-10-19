// Starting and stopping the client you supply. Nothing here knows where a
// client lives or how your system runs one: the environment says (see
// README.md), and a run without a client skips every check that needs one.

import type { Subprocess } from "bun";
import { dirname, join } from "node:path";
import { Layouts } from "../../../scripts/schema.ts";

interface Setup {
  readonly build: string;
  // The build whose layouts the harness serves: the client's own unless
  // TRUESHOT_LAYOUTS names another, which is how a build the specification
  // does not yet cover is tried against a range it might join.
  readonly layouts: string;
  // TRUESHOT_TRANSPORT takes the header, channels and families from another
  // build, and TRUESHOT_MESSAGES the revision of each message it names
  // (Name=build, separated by commas): both only for trials.
  readonly transport: string | undefined;
  readonly messages: ReadonlyMap<string, string>;
  readonly client: string;
  readonly launcher: readonly string[];
  readonly stop: readonly string[];
  readonly screenshot: readonly string[];
  // A command that prints the client's open windows, one per line as an id,
  // a tab and a title; and the title of the window it plays in. Any other
  // window is a dialog: an error, or a crash report.
  readonly windows: readonly string[];
  readonly mainWindow: string;
  readonly port: number;
}

interface Window {
  readonly id: string;
  readonly title: string;
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
    layouts: Bun.env["TRUESHOT_LAYOUTS"] || build,
    transport: Bun.env["TRUESHOT_TRANSPORT"] || undefined,
    messages: new Map(
      (Bun.env["TRUESHOT_MESSAGES"] ?? "")
        .split(",")
        .filter((pair) => pair.includes("="))
        .map((pair) => pair.split("=", 2) as [string, string]),
    ),
    client,
    launcher: words(Bun.env["TRUESHOT_LAUNCHER"]),
    stop: words(Bun.env["TRUESHOT_STOP"]),
    screenshot: words(Bun.env["TRUESHOT_SCREENSHOT"]),
    windows: words(Bun.env["TRUESHOT_WINDOWS"]),
    mainWindow:
      Bun.env["TRUESHOT_MAIN_WINDOW"] ?? "League of Legends (TM) Client",
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
  // The windows the client has open other than the one it plays in, or none
  // where nothing says how to list them. The command is given the process the
  // harness started, and lists only the windows of that process and those
  // under it.
  async dialogs(): Promise<readonly Window[]> {
    const pid = this.#process?.pid;
    if (this.#setup.windows.length === 0 || pid === undefined) return [];
    const [program = "", ...rest] = this.#setup.windows;
    const done = Bun.spawn([program, ...rest, String(pid)], {
      stdout: "pipe",
      stderr: "ignore",
    });
    const text = await new Response(done.stdout).text();
    await done.exited;
    return text
      .split("\n")
      .map((line) => line.split("\t"))
      .filter((parts): parts is [string, string] => parts.length >= 2)
      .map(([id, title]) => ({ id, title }))
      .filter((w) => w.title !== this.#setup.mainWindow);
  }

  // The client's window, or the window `id` names where the command takes
  // one after the file.
  async screenshot(file: string, id?: string): Promise<string> {
    if (this.#setup.screenshot.length === 0)
      return "TRUESHOT_SCREENSHOT is not set";
    const [program = "", ...rest] = this.#setup.screenshot;
    const done = Bun.spawn(
      [program, ...rest, file, ...(id === undefined ? [] : [id])],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const code = await done.exited;
    if (code === 0) return "";
    const said =
      `${await new Response(done.stdout).text()}${await new Response(done.stderr).text()}`.trim();
    return `the screenshot command exited ${code}${said === "" ? "" : `: ${said}`}`;
  }

  // The stop command runs first, given the process the harness started, so
  // it can find what that process started in turn while it is still there.
  async stop(): Promise<void> {
    const pid = this.#process?.pid;
    if (this.#setup.stop.length > 0 && pid !== undefined) {
      await Bun.spawn([...this.#setup.stop, String(pid)]).exited;
    }
    this.#process?.kill();
    await this.#process?.exited;
  }
}

// The layouts a run serves, as the environment mixes them.
function layoutsOf(s: Setup): Layouts {
  return new Layouts(s.layouts, {
    ...(s.transport === undefined ? {} : { transport: s.transport }),
    messages: s.messages,
  });
}

// Whether a run serves anything but the client's own build's layouts.
const isTrial = (s: Setup): boolean =>
  s.layouts !== s.build || s.transport !== undefined || s.messages.size > 0;

export { Client, isTrial, layoutsOf, setup };
export type { Launch, Setup, Window };
