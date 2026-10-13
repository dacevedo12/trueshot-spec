# Effects and looks

The lasting effects units carry, the particles a client draws, and how units
look and move on screen. None of this changes what a unit can do; that is
[replication](replication.md)'s to say. Applies to 4.17 and 4.20 clients, as [Versions](versions.md) describes.

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

| Message                                                              | Sent by | 4.17          | 4.20          | What it does                                                                                                     |
| -------------------------------------------------------------------- | ------- | ------------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`AnimationAdvanced`](../schema/messages/AnimationAdvanced.json)     | server  | 259 on events | none          | Move an animation a unit is playing forward at once                                                              |
| [`AnimationOverrides`](../schema/messages/AnimationOverrides.json)   | server  | 107 on events | 107 on events | Make a unit play one set of movements wherever it would have played another                                      |
| [`AppearanceCleared`](../schema/messages/AppearanceCleared.json)     | server  | 200 on events | none          | Take every look laid over a unit away                                                                            |
| [`AppearancePopped`](../schema/messages/AppearancePopped.json)       | server  | 103 on events | none          | Take a look AppearancePushed laid over a unit away                                                               |
| [`AppearancePushed`](../schema/messages/AppearancePushed.json)       | server  | 151 on events | none          | Lay a new look over a unit's own                                                                                 |
| [`EffectAdded`](../schema/messages/EffectAdded.json)                 | server  | 183 on events | 183 on events | Put a lasting effect on a unit                                                                                   |
| [`EffectAddedGroup`](../schema/messages/EffectAddedGroup.json)       | server  | 104 on events | none          | Put one effect on several units at once                                                                          |
| [`EffectCount`](../schema/messages/EffectCount.json)                 | server  | 28 on events  | 28 on events  | Restate how many of a lasting effect are stacked on a unit                                                       |
| [`EffectCountGroup`](../schema/messages/EffectCountGroup.json)       | server  | 191 on events | none          | Restate how many of an effect are stacked on several units at once                                               |
| [`EffectCounter`](../schema/messages/EffectCounter.json)             | server  | 265 on events | none          | Set the number an effect shows on its icon                                                                       |
| [`EffectRemoved`](../schema/messages/EffectRemoved.json)             | server  | 123 on events | 123 on events | Take a lasting effect off a unit                                                                                 |
| [`EffectRemovedGroup`](../schema/messages/EffectRemovedGroup.json)   | server  | 148 on events | none          | Take one effect off several units at once                                                                        |
| [`EffectReplaced`](../schema/messages/EffectReplaced.json)           | server  | 48 on events  | 48 on events  | Put a lasting effect in a slot that already holds one, keeping the slot rather than taking the old one off first |
| [`EffectReplacedGroup`](../schema/messages/EffectReplacedGroup.json) | server  | 30 on events  | none          | Replace one effect with another on several units at once                                                         |
| [`EmitterPause`](../schema/messages/EmitterPause.json)               | server  | 248 on events | none          | Pause or resume a named group of particle emitters                                                               |
| [`FadeMinions`](../schema/messages/FadeMinions.json)                 | server  | 203 on events | none          | Fade one side's minions                                                                                          |
| [`FadeRemoved`](../schema/messages/FadeRemoved.json)                 | server  | 50 on events  | none          | Undo a fade on a unit                                                                                            |
| [`FadeTo`](../schema/messages/FadeTo.json)                           | server  | 178 on events | none          | Fade a unit towards an opacity over time                                                                         |
| [`KillParticle`](../schema/messages/KillParticle.json)               | server  | 56 on events  | 56 on events  | Stop a particle a client is drawing                                                                              |
| [`NexusIdle`](../schema/messages/NexusIdle.json)                     | server  | 4 on events   | none          | Put each nexus into its idle particles                                                                           |
| [`NexusSkin`](../schema/messages/NexusSkin.json)                     | server  | 116 on events | none          | Change how one side's nexus looks                                                                                |
| [`ParticleSource`](../schema/messages/ParticleSource.json)           | server  | 210 on events | none          | Drive a value of the lasting particle effects on a unit from something that changes                              |
| [`ParticlesCreated`](../schema/messages/ParticlesCreated.json)       | server  | 135 on events | 135 on events | Start drawing sets of particles                                                                                  |
| [`PauseAnimation`](../schema/messages/PauseAnimation.json)           | server  | 113 on events | none          | Pause or resume a unit's animation                                                                               |
| [`PlayAnimation`](../schema/messages/PlayAnimation.json)             | server  | 176 on events | none          | Make a unit play an animation                                                                                    |
| [`ScreenTint`](../schema/messages/ScreenTint.json)                   | server  | 219 on events | none          | Tint a side's screens, or to take a tint away                                                                    |
| [`StopAnimation`](../schema/messages/StopAnimation.json)             | server  | 41 on events  | none          | Stop an animation a unit is playing                                                                              |
| [`VoiceOverride`](../schema/messages/VoiceOverride.json)             | server  | 150 on events | none          | Change or reset the voice a unit speaks with                                                                     |

<!-- messages:end -->
