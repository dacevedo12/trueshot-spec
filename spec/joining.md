# Joining a match

What passes between a client and a server from connection until play begins,
in order.

## Starting a client

A client learns where to connect from its command line. It takes three
arguments it needs nothing in, which can be empty, and then a fourth holding
four words: the server's IPv4 address, its UDP port,
the key (see [Transport](transport.md)), and the player id the client registers
as. The client
connects to that address and port, registers as that player, and enciphers its
proof under that key.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> A client finds each argument between a pair of double quotes, and reads
> nothing outside them.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client whose command line holds no double quote ends.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> Any whitespace separates the words of the fourth argument. A client whose
> command line holds `.rep` anywhere plays a replay rather than connecting.

<!-- holds from 0.9.25.24 up to 1.0.0.140 -->

> **In 0.9.25.24–1.0.0.139**
>
> A client whose command line holds no double quote takes the command line it
> saved on an earlier run instead.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> Whitespace separates a client's arguments, and double quotes group words into
> one. A client given no arguments takes the command line it saved on an
> earlier run instead, and one given one to three ends, unless its one argument
> holds `.rofl`.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> Whitespace separates a client's arguments, and double quotes group words into
> one. A client given no arguments takes the command line it saved on an
> earlier run instead, and one given one to three ends, unless its one argument
> names a replay.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> Whitespace separates a client's arguments, and double quotes group words into
> one; any whitespace separates the words of the fourth argument. A client
> given one argument holding `.rofl` plays that replay; given fewer than four
> otherwise, it shows an error naming how many it was given. One whose fourth
> argument holds `.rofl` plays that replay, and one whose command line holds
> `.rep` anywhere plays a replay rather than connecting.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> Whitespace separates a client's arguments, and double quotes group words into
> one; any whitespace separates the words of the fourth argument. A client
> given one argument holding `.rofl`, or a command line holding `.rep`
> anywhere, plays a replay rather than connecting; given fewer than four
> arguments otherwise, it shows a notice and ends. One whose fourth argument
> holds `spectator`, `replay` or `.rofl` anywhere does not connect as a player
> (see [Watching a match](spectating.md)).

## Registering

A client's first payload is `Register`, on the registration channel.
[Objects and identifiers](objects.md#how-they-relate) says how a server answers
it and what a client takes from the answers.
[Leaving and coming back](match.md#leaving-and-coming-back) says when the answer
has a client send `ReconnectedInMatch`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client waits for the answer naming its own player id as long as it takes,
> and offers its player no choice.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> A client waits 30 seconds for the answer naming its own player id. Then it
> offers its player to wait another 30 seconds or to give up, and leaves on
> giving up.

<!-- holds from 3.10.0.237 up to 4.20.0.315 -->

> **In 3.10–4.19**
>
> The first answer for a client id stands, and a later one for the same client
> id changes nothing.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client uses which client id stands for which player for names, sides and
> loading cards. It takes an answer whenever it arrives, while loading or in
> play, and one saying a client has dropped changes nothing it shows.

## Asking whether a server is ready

A client then sends `QueryStatus` over and over until a `QueryStatusAnswer`
says the server is ready. It pairs no answer with a query: one ready answer is
enough, and a query it sends after that answer needs none. Until a ready answer
arrives, a client stays on a black screen and goes no further.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client waits 500 milliseconds before each `QueryStatus` it sends.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client waits 10 milliseconds before each `QueryStatus` it sends.

## Stating a build

Once an answer says the server is ready, a client sends `ClientVersion` once. A
server answers with `VersionSync`, and a client loads only where its
`agreement` says the builds agree.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `VersionSync` names neither the map nor anyone at the match.
> [Space](space.md#maps) says which map a client loads.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> `VersionSync` names the map to load and everyone at the match.

<!-- holds from 3.10.0.237 up to 4.20.0.315 -->

> **In 3.10–4.19**
>
> With `agreement.buildMatches` clear, the client shows its player its own
> version text beside the one the message carries, and ends.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client never compares the two otherwise: the message's
> build text appears only in that notice. `agreement.matched` changes some of
> what chat and the options offer, and nothing about loading. A server leaves
> `reportsToFile` and `reportingReady` clear, since they have a client write
> metrics to a file of its own and report to the addresses the message carries.
>
> No bit of `features` is needed for a match to load, and a match with every bit
> clear has none of the features. A client's own defaults for most of the bits
> are in its file `DATA/CFG/defaults/GameFeatures.cfg`, one key each, though not
> in the order of the bits. A server MAY start from those defaults, and leaves the
> bits that report metrics clear.

## Taking a seat

Straight after `VersionSync`, a client sends `JoinSide` on the roster channel.
A server answers with one `Roster`, then a `SeatName` and a `SeatChampion` for
each seat a player holds.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Every seat a player holds needs its place in `Roster`, its `SeatName` and its
> `SeatChampion`; a client shows a seat it lacks them for as an empty card. A
> later `SeatName` replaces the one before it. A client whose own seat `Roster`
> leaves out knows no side for its player, and announcements meant for allies do
> not show.

## Loading

A client reports how far loading has got with `LoadingProgress`, repeatedly
through loading. A server answers each report with `SeatLoadProgress`,
carrying the report's figures under the seat that reported.
A client goes on reporting after its progress reaches 100, until play begins.

A client waits on no other seat. `SpawnStart`, `SpawnEnd` and `StartGame` are
what move a client on, and `StartGame` alone ends its loading. A server that
means its players to begin together sends `StartGame` to none of them until
every client has sent `ClientReady`.

<!-- holds from 0.9.25.24 up to 1.0.0.127 -->

> **In 0.9.25.24–1.0.0.126**
>
> A client writes zero where its player id goes in `LoadingProgress`.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A server MUST put the seat's player id in `SeatLoadProgress`: the loading
> screen shows a seat's card from the `VersionSync` seat with that id.

<!-- holds from 1.0.0.58 up to 1.0.0.61 -->

> **In 1.0.0.58–1.0.0.60**
>
> The loading screen picks the card a `SeatLoadProgress` updates by the client
> id it carries, not by its player id.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> A player's card takes its place on the screen from that seat's place in the
> `Roster`, and its name from that player's `SeatName`. A client finds the
> card's client through the player that `SeatName` names and that player's
> `Registered`, so two seats of one name show one client's figures, and the
> latest `SeatLoadProgress` for that client gives the card its progress. The
> first `SeatLoadProgress` once that player's `SeatChampion` has arrived sets
> the card up: its portrait and the champion's name, from that
> `SeatChampion`'s champion and skin, then the `level` and the summoner spells
> of the `VersionSync` seat whose player id the `SeatLoadProgress` names. Where
> no seat has that player id, the card is set up without them. A card shows the
> ping where its seat's `level` is below 120. A card with no `SeatName`, no
> registration or no `SeatLoadProgress` yet says it is not connected. A later
> `SeatChampion` does not change a card already set up.

<!-- holds from 1.0.0.97 up to 4.20.0.315 -->

> **In 1.0.0.97–4.19**
>
> A player's card takes its place on the screen from that seat's place in the
> `Roster`, and its name from that player's `SeatName`. The registration answers
> (`Registered`) pair each player with a client id, and the latest
> `SeatLoadProgress` for that client gives the card its progress and, on the
> client's own card only, its ping. The first `SeatLoadProgress` after the
> player's `SeatChampion` sets the card up: its portrait and the champion's
> name, from that `SeatChampion`'s champion and skin, then everything else from
> the `VersionSync` seat whose player id the `SeatLoadProgress` names. A card
> with no `SeatChampion` yet shows a black portrait, and one with no
> registration or no `SeatLoadProgress` yet says it is not connected. A later
> `SeatChampion` does not change a card already set up.

<!-- holds from 1.0.0.97 up to 1.0.0.141 -->

> **In 1.0.0.97–1.0.0.140**
>
> A server MUST put the seat's player id in `SeatLoadProgress`: the loading
> screen shows a seat's card from the `VersionSync` seat with that id.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client writes its own client id where its player id goes in
> `LoadingProgress`, in the low four bytes with zeros above.

<!-- holds from 3.10.0.237 up to 4.21.0.0 -->

> **In 3.10–4.20**
>
> A client writes all ones where its player id goes in `LoadingProgress`.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> The loading screen picks the card a `SeatLoadProgress` updates by the client
> id it carries, not by its player id.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A server MUST put the seat's player id in `SeatLoadProgress`: the loading
> screen shows a seat's card from the `VersionSync` seat with that id.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> The loading screen picks the card a `SeatLoadProgress` updates by the client
> id it carries, not by its player id.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A card draws a seat's `icon` only where it is 0 or more. A seat is a bot's
> where its `flags` is not zero, whatever its bits, and the card of a bot takes
> its name from the client's own name for that bot, not from the seat's
> `botName`. No bit of `flags` chooses older portrait art.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client draws its own card only as a server returns its own reports.
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

<!-- holds from 0.8.13.26 up to 1.0.0.61 -->

> **In 0.8.13.26–1.0.0.60**
>
> A client drops nothing for arriving before `CharacterSelected`.

<!-- holds from 1.0.0.96 up to 1.0.0.97 -->

> **In 1.0.0.96**
>
> Before `CharacterSelected`, a client drops only what [Units](units.md) says it
> drops.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> Before `CharacterSelected`, a client drops only what [Units](units.md) says it
> drops.

<!-- holds from 3.10.0.237 up to 4.1.0.171 -->

> **In 3.10–3.15**
>
> Until it sends `CharacterSelected`, a client drops every message but
> `VersionSync`, `QueryStatusAnswer`, `MatchIdentity`, `SeatLoadProgress` and
> `GameEnded`, apart from what arrives on the registration and roster channels,
> and keeps nothing it drops for later. A server MUST NOT send any of the spawn
> run before `CharacterSelected` arrives.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> Until it sends `CharacterSelected`, a client drops every game message but
> `VersionSync`, `QueryStatusAnswer`, `MatchIdentity`, `SeatLoadProgress` and
> `GameEnded`, and keeps nothing it drops for later. A server MUST NOT send any
> of the spawn run before `CharacterSelected` arrives.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> Just before `CharacterSelected`, a client sends a `LoadingProgress` at 100
> with its loaded bit set.

A server answers with `SpawnStart`, states everything on the field as play
opens, and closes the run with `SpawnEnd`. A run carries:

- for each seat, `CreateChampion` followed by `Loadout`;
- for each turret, a `CreateTurret` and a `Replication` batch of its values;
- for each inhibitor and nexus, an `EnterSight`, and a `Replication` batch on a
  map whose buildings replicate (see [Replication](replication.md));
- a `RegionAdded` for each region, and a `MapProp` for each prop;
- at a server's choice, an `EnterLocalSight` for any of those units.

[Vision](vision.md) says which of these can arrive inside an `EnterSight`, and
[The shop](shop.md) what `Loadout` does for the shop. A client takes them in any
order within the run.

A run MUST carry at least the `CreateChampion` carrying the client's own client
id, and `SpawnEnd`. Given only those, a client still enters play, showing its
champion's portrait, health, resource and spells; [Vision](vision.md) says when
it draws the champion on the field.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> When `SpawnEnd` arrives, a client destroys every turret of the map that no
> `CreateTurret` named.

A client answers `Replication` batches with `TransientAck` as
[Replication](replication.md#which-batches-a-client-takes) says.

## Starting play

A client sends `ClientReady` after `SpawnEnd` and after its answers to the
run's batches, while it is still reporting its loading. A server MUST answer
with `StartGame`, and later sends `MatchStarted`, with other messages
free to come between them; `MatchStarted` carries 0 (see [Time](time.md)).
[Leaving and coming back](match.md#leaving-and-coming-back) says what a client
whose connection drops before play begins does.

<!-- holds from 0.8.13.26 up to 3.11.0.306 -->

> **In 0.8.13.26–3.10**
>
> A client sends `ClientReady` as soon as `SpawnEnd` arrives.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Between `ClientReady` and `StartGame` a client keeps its loading screen up with
> its own progress full, and sends `LoadingProgress` again about every half a
> second. It waits as long as it takes: nothing in it gives up on a server that
> is slow to start play.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client sends `ClientReady` as soon as `SpawnEnd` arrives.

<!-- messages -->
