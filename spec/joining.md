# Joining a match

What passes between a client and a server from the moment a client connects
until play begins. The steps below come in the same order in everything
observed, and each follows the one before it. Layouts live in `schema/`; this
document says what follows what.

## Registering

A client's first payload is `Register`, on the registration channel.
[Transport](transport.md) says how its proof is enciphered, and the note on
`Registered` says what a server answers with: one answer for every seat.

## Asking whether a server is ready

A client then sends `QueryStatus`, and a server answers each one with
`QueryStatusAnswer`. A client asks more than once, from two to five times in
everything observed, even when every answer says the server is ready.

## Stating a build

After an answer, a client sends `ClientVersion` once. A server answers with
`VersionSync`, which names the map to load and everyone at the match.

## Taking a seat

Straight after `VersionSync`, a client sends `JoinSide` on the roster channel.
A server answers with one `Roster`, then a `SeatName` and a `SeatChampion` for
each seat a player holds.

## Loading

A client reports how far loading has got with `LoadingProgress`, a few dozen
times over the whole of loading. A server answers each report with
`SeatLoadProgress` on the transient channel. The answer carries the report's
own figures under the seat that reported: its progress, the seconds it expects
to take, its count of reports, and its ping. A client goes on reporting after
its progress reaches 100, up to the moment it is ready.

## The spawn run

Once a character is settled, a client sends `CharacterSelected`, once. It can send it before its progress reaches 100.

A server answers with `SpawnStart`, states everything on the field as play
opens, and closes the run with `SpawnEnd`. In everything observed a run
carries:

- for each seat, `CreateChampion` followed by `Loadout`;
- for each turret, a `CreateTurret`, either on its own or carried inside the
  `EnterSight` that brings the turret into view, and a `Replication` batch of
  its values;
- for each inhibitor and nexus, an `EnterSight` and a `Replication` batch;
- an `EnterLocalSight` for some of those, a `RegionAdded` for each region, and
  a `MapProp` for each prop.

The order of those within a run differs from one run to another, and a client
accepted every order observed.

Once `SpawnEnd` arrives, a client answers each `Replication` batch the run
carried with a `TransientAck` naming that batch's `syncId`. It sends one answer
for each batch, in the order the batches came, including a batch that repeats
the `syncId` of the batch before it.

## Starting play

A client sends `ClientReady` after `SpawnEnd` and after those answers, while it
is still reporting its loading. A server answers with `StartGame`, followed by
`ClockSync` and then `MatchStarted`, with other messages free to come between
them. In everything observed the first `ClockSync` carries 0, and so does
`MatchStarted`.
