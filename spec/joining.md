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

A client then sends `QueryStatus` over and over, and a server answers each one
with `QueryStatusAnswer`. This is how a server holds a client back until the
match can begin. While the answers say the server is not ready, a client stays
on a black screen and keeps asking, many times a second. Once an answer says
it is ready, the client goes on to the next step. It can send a few more
queries after that first ready answer, and they are answered too, so a server
ready from the outset still sees from two to five.

A server that needs time before a match can begin answers that it is not ready
until it is.

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

A client writes all ones where its player id goes in `LoadingProgress`. A
server puts the seat's real player id in `SeatLoadProgress`, because that is
how a client finds the seat's entry in `VersionSync` for the loading screen.

## The loading screen

What a 4.17 client draws while it loads comes from what it has been sent by
then. Until it has finished loading, a client takes only `VersionSync`,
`QueryStatusAnswer`, `MatchIdentity`, `SeatLoadProgress` and `GameEnded`
among the game messages, and drops the rest, `Loadout` included.

A player's card is found in steps. Its place on the screen is that seat's
place in the `Roster`, and its name is that player's `SeatName`. The
registration answers (`Registered`) turn the player into a client id, and the
latest `SeatLoadProgress` for that client gives the card its progress and, on
the client's own card only, its ping. The first `SeatLoadProgress` after the
player's `SeatChampion` sets the card up: its portrait and the champion's
name, from that `SeatChampion`'s champion and skin, then everything else from
the `VersionSync` seat whose player id the `SeatLoadProgress` names. A card
with no `SeatChampion` yet shows a black portrait, and one with no
registration or no `SeatLoadProgress` yet says it is not connected. A later
`SeatChampion` does not change a card already set up.

From the `VersionSync` seat a card takes:

- the two summoner spells, as the name hashes of the spells, each drawn as its
  icon, or as a plain square for zero or a hash that names no spell;
- the profile icon, the art of icon 0 for a negative number or one with no art;
- the standing, drawn as a frame over the card where the client's own images
  have one of that name (UNRANKED and BRONZE draw nothing);
- one badge: the ally badge for the card's own side, otherwise the enemy
  badge, each drawn where it is one of the badges the client's own data names;
- from the flags, bit 1, which shows the skin's older portrait art where it
  has one.

A seat's level is not drawn. A seat with flags bit 0 set is a bot's, and the
client draws its card from the seat alone, needing no other message: the
client's own name for a bot of that champion (not the seat's bot name), the
champion's portrait in the bot's skin with the skin's name, summoner spells
the client's own data picks for the champion, mode and difficulty, and 100%.
A seat on neither side 100 nor 200 has no card.

Between the two rows, where both have a card, a client shows the two sides'
team names, each as its tag in square brackets, a space and its name, and
nothing for a side whose name is empty. A tip set in `VersionSync` to show on
the loading screen takes their place for its duration, and then they appear.
The match's variants can give the screen a background picture of their
naming; with none, it has none.

A 4.17.0.267 client given a seat with standing GOLD, icon 7, Flash and Ignite,
team names Trueshot and Bench under tags TS and BN, and a bot seat for Annie in
skin 1, drew the gold frame, the icon and both spells on its card,
`[TS] Trueshot` and `[BN] Bench` either side of the versus emblem, and a card
for the bot named Annie Bot, showing Goth Annie, at 100%.

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

A run need not carry all of that. A 4.17.0.233, 4.17.0.267 or 4.20.0.315
client given a run of `SpawnStart`, its own seat's `CreateChampion` and
`SpawnEnd`, and nothing else, sends `ClientReady`. Answered with `StartGame`
and one `ClockSync`, and no `MatchStarted`, it enters play: it shows its
champion's portrait, health, resource and spells, and goes on reporting where
its view sits. It does not draw the champion itself, which nothing in such a
run places on the map. A 4.17.0.267 or 4.20.0.315 client given the same run with an
`EnterSight` for its champion after the `CreateChampion` draws the champion where that message
places it, with its name and health bar over it, and an `EnterLocalSight` is
not needed for that. Such a client's shop opens empty, and so does a 4.20.0.315
client's. A 4.17.0.267 client's shop fills, with every item and the items it suggests for the
champion, once the run also carries its own champion's `Loadout`.

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
