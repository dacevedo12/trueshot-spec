# Ordering and acknowledgement

What arrives in what order, which numbers say that one statement supersedes
another, and what a client answers with. A server whose messages arrive out of
the order these rules expect has them ignored or lost.

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
so either can overtake the message creating the unit it names. A `Replication`
batch skips a unit the client does not hold, and goes unanswered (see below),
so a server sends a newly created unit's values again until a batch naming it
is answered.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> A server can instead send `Replication` reliably on the events channel.

<!-- holds from 1.0.0.96 up to 1.0.0.141 -->

> **In 1.0.0.96–1.0.0.140**
>
> A client that meets a unit it does not hold in a `WaypointGroup` or
> `WaypointGroupAtSpeed` leaves that unit's path unread, reads every later
> movement in the group from the wrong place, and answers the group all the
> same. A server MUST NOT name a unit in a group until the transport has
> acknowledged the message creating it.

## Numbers that supersede

Several messages carry a `syncId`: a number that lets a client tell a newer
statement from an older one, or a server tell which statement an answer is
for. Each family keeps its own numbers, and compares them in its own way.

| Family      | Carried by              | Counted                                   | A client takes a statement                                                                              |
| ----------- | ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Replication | `Replication`           | per unit and per group of values, from 0  | whose number is greater than the last taken for that unit and group, with no wrapping: 0 is never taken |
| View        | `Camera`, from a client | per client, counting up as the view moves | (a client's own report)                                                                                 |

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client compares no numbers on movements: it takes every path as it
> arrives, whatever `syncId` it carries.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> `WaypointGroup`, `WaypointGroupAtSpeed`,
> `Path`, `PathWithSpeed`, `EnterSight`, and `UnitStopped` and
> `SpellCastAnswer` where they carry one, share one count per unit, from -1. A
> client takes a statement whose number is equal to the unit's or ahead of it;
> a number 2<sup>30</sup> or more behind counts as ahead, so the count can
> wrap. A group of movements carries one `syncId` for every unit in it. A
> server MUST give each statement about a unit a number equal to or ahead of
> the last it gave that unit.

A statement a client does not take changes nothing; what follows it still
applies.

For replication, a server MUST give each batch carrying a unit a number greater
than the last batch carrying that unit, and MUST NOT give one 0. A server
SHOULD give every batch a number of its own, so that a `TransientAck` names one
batch.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client sends a view report again until a server answers with its number. A
> server MUST answer each view report with `CameraAck`, carrying its number.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> Nothing answers a view report: a client sends its latest report again, twice
> the round trip time plus 1/30 of a second apart, for as long as the match
> runs.

<!-- holds from 1.0.0.58 up to 4.21.0.0 -->

> **In 1.0.0.58–4.20**
>
> A client sends a view report again until a server answers with its number,
> twice the round trip time plus 1/30 of a second apart. A server MUST answer
> each view report with `CameraAck`, carrying its number.

## What a client answers

| A server sends                          | A client answers                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `QueryStatusAnswer`                     | nothing; it asks again with `QueryStatus` until told the server is ready                                              |
| `WaypointGroup`, `WaypointGroupAtSpeed` | `WaypointAck` for each group, taken or not, naming the units in it that carried a token (see [Movement](movement.md)) |
| `Replication`                           | `TransientAck`, where every unit the batch names is held                                                              |
| `ClockSync`                             | `ClockReply` (see [Time](time.md))                                                                                    |

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> A client also answers each `Path` and `PathWithSpeed`, taken or not, with a
> `WaypointAck` carrying its `syncId` and naming no units.

A client sends these answers when it plays a match, not while it plays back a
stream.
