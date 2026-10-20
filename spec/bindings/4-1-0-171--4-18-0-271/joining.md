# Joining a match

<!-- place: loading-screen -->

## The loading screen

What a client draws while it loads comes from what it has been sent by
then. Until it sends `CharacterSelected`, a client takes only `VersionSync`,
`QueryStatusAnswer`, `MatchIdentity`, `SeatLoadProgress` and `GameEnded`
among the game messages, and drops the rest, `Loadout` included.

A player's card is built from several messages. Its place on the screen is that seat's
place in the `Roster`, and its name is that player's `SeatName`. The
registration answers (`Registered`) pair each player with a client id, and the
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
nothing for a side whose name is empty: names `Team 1` and `Team 2` under tags
`T1` and `T2` show as `[T1] Team 1` and `[T2] Team 2` either side of the versus
emblem. A tip set in `VersionSync` to show on the loading screen takes their
place for its duration, and then they appear. The match's variants can give
the screen a background picture of their naming; with none, it has none.

<!-- place: registering -->

A client knows the answer meant for it by the player id it registered as, not by
the client id, and takes the client id that answer carries as its own. Every
other answer tells it which client id stands for which player, which it uses for
names, sides and loading cards: the first answer for a client id stands, and a
later one for the same client id changes nothing. A seat a bot holds needs no
answer. A client takes an answer whenever it arrives, while loading or in play,
and one saying a client has dropped changes nothing it shows. An answer for its
own player id arriving during play has it send `ReconnectedInMatch`.

<!-- place: version-check -->

A client loads only where `VersionSync` sets `agreement.buildMatches`. With it
clear, the client shows its player its own version text beside the one the
message carries, and ends. It never compares the two otherwise: the message's
build text appears only in that notice. `agreement.matched` changes some of
what chat and the options offer, and nothing about loading. A server leaves
`reportsToFile` and `reportingReady` clear, since they have a client write
metrics to a file of its own and report to the addresses the message carries.

No bit of `features` is needed for a match to load, and a match with every bit
clear has none of the features. A client's own defaults are in its file
`DATA/CFG/defaults/GameFeatures.cfg`, one key for each bit in the order of the
bits; a server that wants a client's usual behaviour can start from it, and
leaves the bits that report metrics clear.

<!-- place: seats -->

Every seat a player holds needs its place in `Roster`, its `SeatName` and its
`SeatChampion`. A seat a bot holds needs none of them, since `VersionSync` lists
the bots. A client loads a seat it lacks them for as an empty card, shows a
named seat with no `Registered` or no `SeatLoadProgress` as not connected, and
shows no champion on a seat without its `SeatChampion`. A later `SeatName` or
`SeatChampion` replaces the one before it. A client whose own seat `Roster`
leaves out knows no side for its player, and announcements meant for allies do
not show.

<!-- place: loading-others -->

A client waits on no other seat. Each `SeatLoadProgress` updates the card of
the seat it names, a client draws its own card only as a server returns its
own reports, and a seat a bot holds shows as loaded from `VersionSync` alone.
`SpawnStart`, `SpawnEnd` and `StartGame` are what move a client on, and
`StartGame` alone ends loading. A server that means its players to begin
together sends `StartGame` to none of them until every client has sent
`ClientReady`.

<!-- place: waiting -->

Between `ClientReady` and `StartGame` a client keeps its loading screen up with
its own progress full, and sends `LoadingProgress` again about every half a
second. It waits as long as it takes: nothing in it gives up on a server that
is slow to start play.
