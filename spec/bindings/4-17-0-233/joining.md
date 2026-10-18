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
