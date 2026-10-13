# Implementing a server

Work through the documents below in order. Each one builds on the ones before
it. Together they are meant to be enough to build a conforming server in any
language, without reading another one.

Every definition and every document states the client versions it applies to. [Versions](spec/versions.md) says how to
read both, and links a generated page for each range of versions that lists
every message a build in it sends or takes, with the layout of its body.

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

Then a match from end to end, which is enough for a client to join and play:

4. [Joining a match](spec/joining.md), from registering until play begins,
   including what the loading screen shows.
5. [The match](spec/match.md): its clock, holding it, its end, and players
   leaving and coming back.
6. [Units](spec/units.md): putting champions, minions, monsters, turrets and
   props on the field.
7. [Vision](spec/vision.md): bringing units into a client's view.
8. [Movement](spec/movement.md): orders, paths and what their coordinates mean.
9. [Replication](spec/replication.md): the values of units a server keeps
   current, which no layout reaches.

Then the systems a match is played with, in any order:

10. [Combat](spec/combat.md): attacks, damage, death and coming back.
11. [Spells](spec/spells.md): casting, levelling spells, and missiles.
12. [Effects and looks](spec/effects.md): lasting effects, particles and how
    units look.
13. [The shop](spec/shop.md): what fills it, buying and selling.
14. [Objectives](spec/objectives.md): camps, capture points and score, and the
    events the whole match is told about.
15. [Communication](spec/communication.md): chat, pings, emotes and sound.
16. [Votes](spec/votes.md): surrender, and evening out a match.
17. [The interface](spec/interface.md): the view, input, tips, quests and the
    tutorial.
18. [Watching a match](spec/spectating.md): streaming a match to a client that
    watches over its connection.

Each system document ends with a table of its messages, generated from
`schema/`, with the command and channel each takes in every range of versions.

The transport is ENet 1.2.5 except where [Transport](spec/transport.md) says
otherwise. Above the transport, the specification covers registering, the
requests a client sends, the clock, what a server says happened, what changes
about a unit, chat, and the seats before play. Where a field's meaning is
undetermined, its note says so.
