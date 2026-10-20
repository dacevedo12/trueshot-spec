# The specification

The chapters below describe how a server and a client behave toward each other,
and hold for every client build the specification covers. What one range of
builds alone does is in that range's binding, under [bindings/](bindings/).
Field layouts are not here: they live in [schema/](../schema/), and the
chapters link them.

`bun run site` puts the chapters, the bindings and the definitions together as
one folder per season under `dist/site`. Each range there has a book that
reads the chapters with its binding set in place, every message it sends or
takes with the layout of its body, and what changed from the range before it.
That is the easiest way to read the specification for one range.

## Reading order

The foundations come first, since everything else is written in their terms:

1. [Transport](transport.md), which carries everything else. Vectors for it
   live in `conformance/vectors/transport` and `conformance/vectors/cipher`.
2. [Messages](messages.md), which defines how a message is recorded, what a
   family puts in front of one, and how to read a file in `schema/messages`.
3. [Versions](versions.md), which says which builds each fact holds for.

Then what every system shares, which keeps the messages a server sends
consistent with one another:

4. [Objects and identifiers](objects.md): how players, clients and objects are
   named, and when an object enters and leaves a client's world.
5. [Ordering and acknowledgement](ordering.md): what arrives in what order, the
   numbers that say one statement supersedes another, and the answers a client
   sends.
6. [Space](space.md): positions, directions and maps.
7. [Time](time.md): the clocks a match runs on, and which each time on the wire
   is measured against.
8. [Sides and slots](values.md): sides, and how spell, item and effect slots
   are numbered.

Then a match from end to end, which is enough for a client to join and play:

9. [Joining a match](joining.md), from registering until play begins,
   including what the loading screen shows.
10. [The match](match.md): its clock, holding it, its end, and players leaving
    and coming back.
11. [Units](units.md): putting champions, minions, monsters, turrets and props
    on the field.
12. [Vision](vision.md): bringing units into a client's view.
13. [Movement](movement.md): orders, paths and what their coordinates mean.
14. [Replication](replication.md): the values of units a server keeps current,
    which no layout reaches.

Then the systems a match is played with, in any order:

15. [Combat](combat.md): attacks, damage, death and coming back.
16. [Spells](spells.md): casting, levelling spells, and missiles.
17. [Effects and looks](effects.md): lasting effects, particles and how units
    look.
18. [The shop](shop.md): what fills it, buying and selling.
19. [Objectives](objectives.md): camps, capture points and score, and the
    events the whole match is told about.
20. [Communication](communication.md): chat, pings, emotes and sound.
21. [Votes](votes.md): surrender, and evening out a match.
22. [The interface](interface.md): the view, input, tips, quests and the
    tutorial.
23. [Watching a match](spectating.md): streaming a match to a client that
    watches over its connection.

The transport is ENet 1.2.5 except where [Transport](transport.md) says
otherwise. Above the transport, the specification covers registering, the
requests a client sends, the clock, what a server says happened, what changes
about a unit, chat, and the seats before play. Where a field's meaning is
undetermined, its note says so.
