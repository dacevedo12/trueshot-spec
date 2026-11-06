# Effects and looks

The lasting effects units carry, the particles a client draws, and how units
look and move on screen. None of this changes what a unit can do; that is
[replication](replication.md)'s to say.

## Lasting effects

A lasting effect sits in one of a unit's effect slots and shows on its icon row.
A server puts one on with `EffectAdded`, replaces the one in a slot with
`EffectReplaced`, restates how many are stacked with `EffectCount`, and takes it
off with `EffectRemoved`. The unit carrying an effect can differ from the unit
that cast it. A server can do each of these for several units at once
(`EffectAddedGroup`, `EffectReplacedGroup`, `EffectCountGroup`,
`EffectRemovedGroup`), and set the number an effect shows on its icon with
`EffectCounter`.

## Particles

`ParticlesCreated` starts a client drawing particles, and `KillParticle` stops
one. A server can also pause or resume a named group of emitters with
`EmitterPause`, and drive a value of a unit's lasting particles from something
that changes, such as a capture point or the unit's resource, with
`ParticleSource`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> `ParticlesCreated` starts one particle, named by the message's own id.

<!-- holds from 0.9.25.24 up to 4.21.0.0 -->

> **In 0.9.25.24–4.20**
>
> `ParticlesCreated` starts sets of particles, each named by its own id.

<!-- holds from 3.02.0.30 up to 3.5.0.68 -->

> **In 3.02–3.04**
>
> A client takes `EmitterPause` as a `ChatAllowance`, the first four bytes of
> the group's name standing as the lines left. A server MUST NOT send
> `EmitterPause`.

## Looks and animation

A server lays a new look over a unit's own with `AppearancePushed`; looks
stack, the newest showing, and `AppearancePopped` and `AppearanceCleared` take
them away. `AnimationOverrides` has a unit play one set of movements wherever it
would have played another.

<!-- holds from 0.8.13.26 up to 1.0.0.127 -->

> **In 0.8.13.26–1.0.0.126**
>
> `AppearancePopped` takes away every look laid over the unit's own, not only
> the newest.

A server can also:

- play, stop, pause and advance a unit's animations (`PlayAnimation`,
  `StopAnimation`, `PauseAnimation`, `AnimationAdvanced`);
- fade a unit or a side's minions (`FadeTo`, `FadeRemoved`, `FadeMinions`);
- set how each nexus looks (`NexusIdle`, `NexusSkin`);
- tint a side's screens (`ScreenTint`);
- change the voice a unit speaks with (`VoiceOverride`).

<!-- messages -->
