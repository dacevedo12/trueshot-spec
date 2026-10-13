# Effects and looks

The lasting effects units carry, the particles a client draws, and how units
look and move on screen. None of this changes what a unit can do; that is
[replication](replication.md)'s to say. Applies to 4.20 clients, as [Versions](versions.md) describes.

## Lasting effects

A lasting effect sits in one of a unit's effect slots and shows on its icon row.
A server puts one on with `EffectAdded`, replaces the one in a slot with
`EffectReplaced`, restates how many are stacked with `EffectCount`, and takes it
off with `EffectRemoved`. The unit carrying an effect can differ from the unit
that cast it. A 4.17 server can do each of these for several units at once
(`EffectAddedGroup`, `EffectReplacedGroup`, `EffectCountGroup`,
`EffectRemovedGroup`), and set the number an effect shows on its icon with
`EffectCounter`.

## Particles

`ParticlesCreated` starts a client drawing sets of particles, each named by its
own id, and `KillParticle` stops one. A 4.17 server can also pause or resume a
named group of emitters with `EmitterPause`, and drive a value of a unit's
lasting particles from something that changes, such as a capture point or the
unit's resource, with `ParticleSource`.

## Looks and animation

A 4.17 server lays a new look over a unit's own with `AppearancePushed`; looks
stack, the newest showing, and `AppearancePopped` and `AppearanceCleared` take
them away. `AnimationOverrides` has a unit play one set of movements wherever it
would have played another. A 4.17 server can also play, stop, pause and advance
a unit's animations (`PlayAnimation`, `StopAnimation`, `PauseAnimation`,
`AnimationAdvanced`), fade a unit or a side's minions (`FadeTo`, `FadeRemoved`,
`FadeMinions`), set how each nexus looks (`NexusIdle`, `NexusSkin`), tint a
side's screens (`ScreenTint`), and change the voice a unit speaks with
(`VoiceOverride`).

## Messages

<!-- messages:begin -->

| Message                                                            | Sent by | 4.20          | What it does                                                                                                     |
| ------------------------------------------------------------------ | ------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`AnimationOverrides`](../schema/messages/AnimationOverrides.json) | server  | 107 on events | Make a unit play one set of movements wherever it would have played another                                      |
| [`EffectAdded`](../schema/messages/EffectAdded.json)               | server  | 183 on events | Put a lasting effect on a unit                                                                                   |
| [`EffectCount`](../schema/messages/EffectCount.json)               | server  | 28 on events  | Restate how many of a lasting effect are stacked on a unit                                                       |
| [`EffectRemoved`](../schema/messages/EffectRemoved.json)           | server  | 123 on events | Take a lasting effect off a unit                                                                                 |
| [`EffectReplaced`](../schema/messages/EffectReplaced.json)         | server  | 48 on events  | Put a lasting effect in a slot that already holds one, keeping the slot rather than taking the old one off first |
| [`KillParticle`](../schema/messages/KillParticle.json)             | server  | 56 on events  | Stop a particle a client is drawing                                                                              |
| [`ParticlesCreated`](../schema/messages/ParticlesCreated.json)     | server  | 135 on events | Start drawing sets of particles                                                                                  |

<!-- messages:end -->
