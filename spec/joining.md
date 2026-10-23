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

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client waits 30 seconds for the answer naming its own player id. Then it
> offers its player to wait another 30 seconds or to give up, and leaves on
> giving up.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client knows the answer meant for it by the player id it registered as, not by
> the client id, and takes the client id that answer carries as its own. Every
> other answer tells it which client id stands for which player, which it uses for
> names, sides and loading cards: the first answer for a client id stands, and a
> later one for the same client id changes nothing. A seat a bot holds needs no
> answer. A client takes an answer whenever it arrives, while loading or in play,
> and one saying a client has dropped changes nothing it shows. An answer for its
> own player id arriving during play has it send `ReconnectedInMatch`.

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

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client loads only where `VersionSync` sets `agreement.buildMatches`. With it
> clear, the client shows its player its own version text beside the one the
> message carries, and ends. It never compares the two otherwise: the message's
> build text appears only in that notice. `agreement.matched` changes some of
> what chat and the options offer, and nothing about loading. A server leaves
> `reportsToFile` and `reportingReady` clear, since they have a client write
> metrics to a file of its own and report to the addresses the message carries.
>
> No bit of `features` is needed for a match to load, and a match with every bit
> clear has none of the features. A client's own defaults for most of the bits
> are in its file `DATA/CFG/defaults/GameFeatures.cfg`, one key each, though not
> in the order of the bits; a server that wants a client's usual behaviour can start from it, and
> leaves the bits that report metrics clear.

## Taking a seat

Straight after `VersionSync`, a client sends `JoinSide` on the roster channel.
A server answers with one `Roster`, then a `SeatName` and a `SeatChampion` for
each seat a player holds.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Every seat a player holds needs its place in `Roster`, its `SeatName` and its
> `SeatChampion`. A seat a bot holds needs none of them, since `VersionSync` lists
> the bots. A client loads a seat it lacks them for as an empty card, shows a
> named seat with no `Registered` or no `SeatLoadProgress` as not connected, and
> shows no champion on a seat without its `SeatChampion`. A later `SeatName` or
> `SeatChampion` replaces the one before it. A client whose own seat `Roster`
> leaves out knows no side for its player, and announcements meant for allies do
> not show.

## Loading

A client reports how far loading has got with `LoadingProgress`, repeatedly
through loading. A server answers each report with
`SeatLoadProgress` on the transient channel. The answer carries the report's
own figures under the seat that reported: its progress, the seconds it expects
to take, its count of reports, and its ping. A client goes on reporting after
its progress reaches 100, up to the moment it is ready.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client waits on no other seat. Each `SeatLoadProgress` updates the card of
> the seat it names, a client draws its own card only as a server returns its
> own reports, and a seat a bot holds shows as loaded from `VersionSync` alone.
> `SpawnStart`, `SpawnEnd` and `StartGame` are what move a client on, and
> `StartGame` alone ends loading. A server that means its players to begin
> together sends `StartGame` to none of them until every client has sent
> `ClientReady`.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0**
>
> A client writes zero where its player id goes in `LoadingProgress`.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client writes all ones where its player id goes in `LoadingProgress`. A
> server MUST put the seat's player id in `SeatLoadProgress`: the loading screen
> shows a seat's card from the `VersionSync` seat with that id.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> ## The loading screen
>
> What a client draws while it loads comes from what it has been sent by
> then. Until it sends `CharacterSelected`, a client takes only `VersionSync`,
> `QueryStatusAnswer`, `MatchIdentity`, `SeatLoadProgress` and `GameEnded`
> among the game messages, and drops the rest, `Loadout` included.
>
> A player's card is built from several messages. Its place on the screen is that seat's
> place in the `Roster`, and its name is that player's `SeatName`. The
> registration answers (`Registered`) pair each player with a client id, and the
> latest `SeatLoadProgress` for that client gives the card its progress and, on
> the client's own card only, its ping. The first `SeatLoadProgress` after the
> player's `SeatChampion` sets the card up: its portrait and the champion's
> name, from that `SeatChampion`'s champion and skin, then everything else from
> the `VersionSync` seat whose player id the `SeatLoadProgress` names. A card
> with no `SeatChampion` yet shows a black portrait, and one with no
> registration or no `SeatLoadProgress` yet says it is not connected. A later
> `SeatChampion` does not change a card already set up.
>
> From the `VersionSync` seat a card takes:
>
> - the two summoner spells, as the name hashes of the spells, each drawn as its
>   icon, or as a plain square for zero or a hash that names no spell;
> - the profile icon, the art of icon 0 for a negative number or one with no art;
> - the standing, drawn as a frame over the card where the client's own images
>   have one of that name (UNRANKED and BRONZE draw nothing);
> - one badge: the ally badge for the card's own side, otherwise the enemy
>   badge, each drawn where it is one of the badges the client's own data names;
> - from the flags, bit 1, which shows the skin's older portrait art where it
>   has one.
>
> A seat's level is not drawn. A seat with flags bit 0 set is a bot's, and the
> client draws its card from the seat alone, needing no other message: the
> client's own name for a bot of that champion (not the seat's bot name), the
> champion's portrait in the bot's skin with the skin's name, summoner spells
> the client's own data picks for the champion, mode and difficulty, and 100%.
> A seat on neither side 100 nor 200 has no card.
>
> Between the two rows, where both have a card, a client shows the two sides'
> team names, each as its tag in square brackets, a space and its name, and
> nothing for a side whose name is empty: names `Team 1` and `Team 2` under tags
> `T1` and `T2` show as `[T1] Team 1` and `[T2] Team 2` either side of the versus
> emblem. A tip set in `VersionSync` to show on the loading screen takes their
> place for its duration, and then they appear. The match's variants can give
> the screen a background picture of their naming; with none, it has none.

## The spawn run

Once a character is settled, a client sends `CharacterSelected`, once.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client can send `CharacterSelected` before its progress reaches 100.
>
> Until it sends `CharacterSelected`, a client drops every message but
> `VersionSync`, `QueryStatusAnswer`, `MatchIdentity`, `SeatLoadProgress` and
> `GameEnded`, apart from what arrives on the registration and roster channels,
> and keeps nothing it drops for later. A server MUST NOT send any of the spawn
> run before `CharacterSelected` arrives.

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

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client whose connection drops before play begins ends rather than connecting
> again.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Between `ClientReady` and `StartGame` a client keeps its loading screen up with
> its own progress full, and sends `LoadingProgress` again about every half a
> second. It waits as long as it takes: nothing in it gives up on a server that
> is slow to start play.

<!-- messages -->
