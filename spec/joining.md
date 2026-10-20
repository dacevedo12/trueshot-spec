# Joining a match

What passes between a client and a server from the moment a client connects
until play begins. The steps below come in this order, each
following the one before it. Layouts live in `schema/`; this
document says what follows what.

## Starting a client

A client learns where to connect from its command line. It takes three
arguments it needs nothing in, which can be empty, and then a fourth holding
four words separated by single spaces: the server's IPv4 address, its UDP port,
the key in base64, and the player id the client registers as. The client
connects to that address and port, registers as that player, and enciphers its
proof under that key (see [Transport](transport.md)).

## Registering

A client's first payload is `Register`, on the registration channel.
[Transport](transport.md) says how its proof is enciphered, and the note on
`Registered` says what a server answers with: one answer for every seat.

## Asking whether a server is ready

A client then sends `QueryStatus` over and over. A server MUST answer each one
with `QueryStatusAnswer`, including those that come after its first ready
answer. While the answers say the server is not ready, a client stays on a
black screen and keeps asking; once an answer says it is ready, the client goes
on to the next step. A server that needs time before a match can begin answers
that it is not ready until it is.

## Stating a build

After an answer, a client sends `ClientVersion` once. A server answers with
`VersionSync`, which names the map to load and everyone at the match.

## Taking a seat

Straight after `VersionSync`, a client sends `JoinSide` on the roster channel.
A server answers with one `Roster`, then a `SeatName` and a `SeatChampion` for
each seat a player holds.

## Loading

A client reports how far loading has got with `LoadingProgress`, repeatedly
through loading. A server answers each report with
`SeatLoadProgress` on the transient channel. The answer carries the report's
own figures under the seat that reported: its progress, the seconds it expects
to take, its count of reports, and its ping. A client goes on reporting after
its progress reaches 100, up to the moment it is ready.

<!-- binding: loading-player -->

<!-- binding: loading-screen -->

## The spawn run

Once a character is settled, a client sends `CharacterSelected`, once.

<!-- binding: selected-early -->

A server answers with `SpawnStart`, states everything on the field as play
opens, and closes the run with `SpawnEnd`. A run carries:

- for each seat, `CreateChampion` followed by `Loadout`;
- for each turret, a `CreateTurret`, either on its own or carried inside the
  `EnterSight` that brings the turret into view, and a `Replication` batch of
  its values;
- for each inhibitor and nexus, an `EnterSight`, and a `Replication` batch on a
  map whose buildings replicate (see [Replication](replication.md));
- a `RegionAdded` for each region, and a `MapProp` for each prop;
- at a server's choice, an `EnterLocalSight` for any of those units.

A client takes these in any order within the run.

A run MUST carry at least `SpawnStart`, the `CreateChampion` carrying the
client's own client id, and `SpawnEnd`. Given only those, a client still enters play,
showing its champion's portrait, health, resource and spells. It draws the
champion on the map only once an `EnterSight` places it there, with its name
and health bar over it. Its shop stays empty until its own champion's `Loadout`
arrives (see [The shop](shop.md)).

Once `SpawnEnd` arrives, a client answers each `Replication` batch the run
carried with a `TransientAck` naming that batch's `syncId`. It sends one answer
for each batch, in the order the batches came, including a batch that repeats
the `syncId` of the batch before it.

## Starting play

A client sends `ClientReady` after `SpawnEnd` and after those answers, while it
is still reporting its loading. A server MUST answer with `StartGame` followed
by a `ClockSync`, and a client enters play once it has both. A server then
sends `MatchStarted`, with other messages free to come between them. The first `ClockSync` carries 0, and so does `MatchStarted` (see
[Time](time.md)).

<!-- messages -->
