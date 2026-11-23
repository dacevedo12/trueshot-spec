# Ordering and acknowledgement

What arrives in what order, which numbers say that one statement supersedes
another, and what a client answers with.

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

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client compares a `PathWithSpeed`'s number with its unit's count but does
> not advance the count to it.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A view report's number is one byte, and goes from 255 back to 0.

A statement a client does not take changes nothing; what follows it still
applies.

For replication, a server MUST give each batch carrying a unit a number greater
than the last batch carrying that unit, and MUST NOT give one 0. A server
SHOULD give every batch a number of its own, so that a `TransientAck` names one
batch.

## What a client answers

| A server sends                          | A client answers                                                         |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `QueryStatusAnswer`                     | nothing; it asks again with `QueryStatus` until told the server is ready |
| `WaypointGroup`, `WaypointGroupAtSpeed` | `WaypointAck` for each group, taken or not (see [Movement](movement.md)) |
| `Replication`                           | `TransientAck`, where every unit the batch names is held                 |
| `ClockSync`                             | `ClockReply`, on the clock channel (see [Time](time.md))                 |

A client sends the answers above when it plays a match, not while it plays back
a stream.

<!-- holds from 0.9.25.24 up to 3.10.0.237 -->

> **In 0.9.25.24–3.9**
>
> A client also answers each `Path` and `PathWithSpeed`, taken or not, with a
> `WaypointAck` carrying its `syncId` (see [Movement](movement.md)), when it
> plays a match, not while it plays back a stream.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client also answers each `Path` and `PathWithSpeed`, taken or not, with a
> `WaypointAck` carrying its `syncId` (see [Movement](movement.md)), sent
> before it decides whether to take the path, and sent while it plays back a
> stream too.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A client also answers each `Path` and `PathWithSpeed`, taken or not, with a
> `WaypointAck` carrying its `syncId` (see [Movement](movement.md)), sent
> before it decides whether to take the path.

## What a server answers

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client sends its latest view report again and again, without waiting for a
> round trip or for its view to move, until a server answers it with
> `CameraAck` carrying its number.

<!-- holds from 0.9.22.14 up to 0.9.25.24 -->

> **In 0.9.22.14–0.9.25.23**
>
> Where its last view report goes unacknowledged, a client sends it again
> without its view moving, once more than twice the round trip has passed.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> Nothing answers a view report: a client sends its latest report again, twice
> the round trip time plus 1/30 of a second apart, for as long as the match
> runs.

<!-- holds from 1.0.0.25 up to 1.0.0.110 -->

> **In 1.0.0.25–1.0.0.109**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.

<!-- holds from 1.0.0.110 up to 1.0.0.111 -->

> **In 1.0.0.110**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.
> After a `CameraAck` carrying 255 it never takes one carrying 0, and sends its
> report numbered 0 again until its view moves on and a later report is
> answered.

<!-- holds from 1.0.0.111 up to 3.03.0.198 -->

> **In 1.0.0.111–3.02**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.

<!-- holds from 3.03.0.198 up to 3.04.0.78 -->

> **In 3.03**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.
> After a `CameraAck` carrying 255 it never takes one carrying 0, and sends its
> report numbered 0 again until its view moves on and a later report is
> answered.

<!-- holds from 3.6.0.388 up to 3.7.0.328 -->

> **In 3.6**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.
> After a `CameraAck` carrying 255 it never takes one carrying 0, and sends its
> report numbered 0 again until its view moves on and a later report is
> answered.

<!-- holds from 3.7.0.328 up to 3.13.0.399 -->

> **In 3.7–3.12**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.
> After a `CameraAck` carrying 255 it never takes one carrying 0, and sends its
> report numbered 0 again until its view moves on and a later report is
> answered.

<!-- holds from 3.14.0.700 up to 4.21.0.0 -->

> **In 3.14–4.20**
>
> A client sends a view report again, twice the round trip time plus 1/30 of a
> second apart, until a server answers it with `CameraAck`, carrying its number.
