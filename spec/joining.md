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

A client writes all ones where its player id goes in `LoadingProgress`. A
server MUST put the seat's player id in `SeatLoadProgress`: the loading screen
shows a seat's card from the `VersionSync` seat with that id.

<!-- binding: loading-screen -->

## The spawn run

Once a character is settled, a client sends `CharacterSelected`, once. It can send it before its progress reaches 100.

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

## Messages

<!-- messages:begin -->

| Message                                                          | Sent by | 4.17              | 4.20              | What it does                                                                                                                                                           |
| ---------------------------------------------------------------- | ------- | ----------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`CharacterSelected`](../schema/messages/CharacterSelected.json) | client  | 190 on requests   | 190 on requests   | What a client sends once a character is settled on                                                                                                                     |
| [`ClientReady`](../schema/messages/ClientReady.json)             | client  | 82 on requests    | 82 on requests    | What a client sends once it has loaded and is ready to play                                                                                                            |
| [`ClientVersion`](../schema/messages/ClientVersion.json)         | client  | 189 on requests   | 189 on requests   | State which build it is                                                                                                                                                |
| [`GameOptions`](../schema/messages/GameOptions.json)             | client  | 71 on requests    | 71 on requests    | What a client sends when a setting that a server needs to know about changes                                                                                           |
| [`JoinSide`](../schema/messages/JoinSide.json)                   | client  | 100 on roster     | 100 on roster     | Ask for a seat on one of the two sides while the match is being put together                                                                                           |
| [`LoadingProgress`](../schema/messages/LoadingProgress.json)     | client  | 22 on requests    | 22 on requests    | What a client sends while a match loads, saying how far it has got                                                                                                     |
| [`MatchIdentity`](../schema/messages/MatchIdentity.json)         | server  | 146 on events     | 146 on events     | Tell a client which match this is and what its player is called                                                                                                        |
| [`MatchStarted`](../schema/messages/MatchStarted.json)           | server  | 194 on events     | 194 on events     | Set when the match began                                                                                                                                               |
| [`QueryStatus`](../schema/messages/QueryStatus.json)             | client  | 20 on requests    | 20 on requests    | Ask a server for its state                                                                                                                                             |
| [`QueryStatusAnswer`](../schema/messages/QueryStatusAnswer.json) | server  | 136 on events     | 136 on events     | What a server returns when asked whether it is ready                                                                                                                   |
| [`Register`](../schema/messages/Register.json)                   | client  | 0 on registration | 0 on registration | What a client sends first                                                                                                                                              |
| [`Registered`](../schema/messages/Registered.json)               | server  | 0 on registration | 0 on registration | What a server answers a registration with, naming a player in the match and the seat they occupy                                                                       |
| [`Roster`](../schema/messages/Roster.json)                       | server  | 103 on roster     | 103 on roster     | Lay out both sides and who is on them, while the match is being put together                                                                                           |
| [`SeatChampion`](../schema/messages/SeatChampion.json)           | server  | 101 on roster     | 101 on roster     | Say which champion a seat is playing, while the match is being put together                                                                                            |
| [`SeatLoadProgress`](../schema/messages/SeatLoadProgress.json)   | server  | 149 on transient  | 149 on transient  | Tell everyone how far one seat has got through loading, and how it is holding up                                                                                       |
| [`SeatName`](../schema/messages/SeatName.json)                   | server  | 102 on roster     | 102 on roster     | Say what a seat is called, while the match is being put together                                                                                                       |
| [`SpawnEnd`](../schema/messages/SpawnEnd.json)                   | server  | 17 on events      | 17 on events      | Close the run of units it opened with                                                                                                                                  |
| [`SpawnStart`](../schema/messages/SpawnStart.json)               | server  | 98 on events      | 98 on events      | Open the run of units a client is about to be told about                                                                                                               |
| [`StartGame`](../schema/messages/StartGame.json)                 | server  | 92 on events      | 92 on events      | Begin play                                                                                                                                                             |
| [`StatsRequest`](../schema/messages/StatsRequest.json)           | client  | 86 on requests    | 86 on requests    | What a client sends about itself: what it has detected running alongside it, and which appearance it believes it is wearing                                            |
| [`VersionSync`](../schema/messages/VersionSync.json)             | server  | 84 on events      | 84 on events      | What a server sends once a client has said which build it runs: whether the two agree, which map to load, who is at the match, and everything else settled before play |

<!-- messages:end -->
