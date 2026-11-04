# Ordering and acknowledgement

What arrives in what order, which numbers say that one statement supersedes
another, and what a client answers with. A server whose messages arrive out of
the order these rules expect has them ignored or lost, however correct each one
is on its own.

## Across channels

The transport delivers a channel's reliable messages in the order they were
sent, and drops an unreliable message that arrives after a later one on the
same channel (see [Transport](transport.md)). Nothing orders one channel
against another.

A client acts on game messages in the order they arrive, whichever channel
they arrive on, and holds none back for later but the paths
[Objects and identifiers](objects.md) names. A message that arrives before the
message creating what it names is lost. So:

- A server MUST send the message creating an object before any message naming
  it.
- A server MUST NOT rely on a message on one channel arriving before a message
  sent later on another. Where one depends on the other, a server sends both
  on one reliable channel, or sends the second once the transport has
  acknowledged the first.

The messages creating a unit travel reliably on the events channel, while
`Replication` and `WaypointGroup` travel unreliably on the transient channel,
so either can overtake the message creating the unit it names. A client skips
a unit it does not hold, and answers no batch that named one (see below), so a
server sends a newly created unit's values again until a batch naming it is
answered.

<!-- holds from 4.17.0.233 up to 4.21.0.0 -->

> **In 4.17–4.20**
>
> A server can instead send `Replication` reliably on the events channel.

## Numbers that supersede

Several messages carry a `syncId`: a number that lets a client tell a newer
statement from an older one, or a server tell which statement an answer is
for. Each family keeps its own numbers, and compares them in its own way.

| Family      | Carried by                                                                                                                                   | Counted                                   | A client takes a statement                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Movement    | `WaypointGroup`, `WaypointGroupAtSpeed`, `Path`, `PathWithSpeed`, `EnterSight`, and `UnitStopped` and `SpellCastAnswer` where they carry one | per unit, from -1                         | whose number is equal to the unit's or ahead of it; a number 2<sup>30</sup> or more behind counts as ahead, so the count can wrap |
| Replication | `Replication`                                                                                                                                | per unit and per group of values, from 0  | whose number is greater than the last taken for that unit and group, with no wrapping: 0 is never taken                           |
| View        | `Camera`, from a client                                                                                                                      | per client, counting up as the view moves | (a server answers)                                                                                                                |

A group of movements carries one `syncId` for every unit in it. A statement a
client does not take changes nothing; what follows it still applies.

For the movement family, a server MUST give each statement about a unit a
number equal to or ahead of the last it gave that unit. For replication, a
server MUST give each batch carrying a unit a number greater than the last
batch carrying that unit, and MUST NOT give one 0. A server SHOULD give every
batch a number of its own, so that a `TransientAck` names one batch.

A client sends a view report again until a server answers with its number,
twice the round trip time plus 1/30 of a second apart. A server MUST answer
each view report with `CameraAck`, carrying its number.

## What a client answers

| A server sends                          | A client answers                                                          |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `QueryStatusAnswer`                     | nothing; it asks again with `QueryStatus` until told the server is ready  |
| `WaypointGroup`, `WaypointGroupAtSpeed` | `WaypointAck` for each group, taken or not, naming the units it relocated |
| `Replication`                           | `TransientAck`, where every unit the batch names is held                  |
| `ClockSync`                             | `ClockReply` (see [Time](time.md))                                        |

A client sends these answers when it plays a match, not while it plays back a
stream.
