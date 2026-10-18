# Implementing a server

Work through the documents below in order. Each one builds on the ones before
it. Together they are meant to be enough to build a conforming server in any
language, without reading another one.

Every definition states the client versions it applies to, and every chapter
holds for all of them, with what one range alone does in that range's binding.
[Versions](spec/versions.md) says how to read both, and links a generated page
for each range of versions that lists every message a build in it sends or
takes, with the layout of its body. `bun run book` puts the chapters and one
range's binding together as a single book, which is the easiest way to read
the specification for one range.

Check your work against [conformance/](conformance/) as you go, rather than at
the end. How you structure what you build is your business. The vectors are the
measure this repository provides of whether it is right.

Field layouts live in [schema/](schema/) and are machine readable. Prose never
restates them, so a layout cannot be recovered by reading prose.

If the specification does not answer something you need, do not fill the gap
with a guess and carry on. That is a defect worth reporting, and
[CONTRIBUTING.md](CONTRIBUTING.md) explains how.

## Reading order

The foundations come first, since everything else is written in their terms:

1. [Transport](spec/transport.md), which carries everything else. Vectors for
   it live in `conformance/vectors/transport` and `conformance/vectors/cipher`.
2. [Messages](spec/messages.md), which defines how a message is recorded, what
   a family puts in front of one, and how to read a file in `schema/messages`.
3. [Versions](spec/versions.md), which says which builds each fact holds for.

Then what every system shares, which keeps the messages a server sends
consistent with one another:

4. [Objects and identifiers](spec/objects.md): how players, clients and
   objects are named, and when an object enters and leaves a client's world.
5. [Ordering and acknowledgement](spec/ordering.md): what arrives in what
   order, the numbers that say one statement supersedes another, and the
   answers a client sends.
6. [Space](spec/space.md): positions, directions and maps.
7. [Time](spec/time.md): the clocks a match runs on, and which each time on the
   wire is measured against.
8. [Sides and slots](spec/values.md): sides, and how spell, item and effect
   slots are numbered.

Then a match from end to end, which is enough for a client to join and play:

9. [Joining a match](spec/joining.md), from registering until play begins,
   including what the loading screen shows.
10. [The match](spec/match.md): its clock, holding it, its end, and players
    leaving and coming back.
11. [Units](spec/units.md): putting champions, minions, monsters, turrets and
    props on the field.
12. [Vision](spec/vision.md): bringing units into a client's view.
13. [Movement](spec/movement.md): orders, paths and what their coordinates
    mean.
14. [Replication](spec/replication.md): the values of units a server keeps
    current, which no layout reaches.

Then the systems a match is played with, in any order:

15. [Combat](spec/combat.md): attacks, damage, death and coming back.
16. [Spells](spec/spells.md): casting, levelling spells, and missiles.
17. [Effects and looks](spec/effects.md): lasting effects, particles and how
    units look.
18. [The shop](spec/shop.md): what fills it, buying and selling.
19. [Objectives](spec/objectives.md): camps, capture points and score, and the
    events the whole match is told about.
20. [Communication](spec/communication.md): chat, pings, emotes and sound.
21. [Votes](spec/votes.md): surrender, and evening out a match.
22. [The interface](spec/interface.md): the view, input, tips, quests and the
    tutorial.
23. [Watching a match](spec/spectating.md): streaming a match to a client that
    watches over its connection.

Each system document ends with a table of its messages, generated from
`schema/`, with the command and channel each takes in every range of versions.

The transport is ENet 1.2.5 except where [Transport](spec/transport.md) says
otherwise. Above the transport, the specification covers registering, the
requests a client sends, the clock, what a server says happened, what changes
about a unit, chat, and the seats before play. Where a field's meaning is
undetermined, its note says so.
