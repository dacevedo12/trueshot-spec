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

`ParticlesCreated` starts a client drawing sets of particles, each named by its
own id, and `KillParticle` stops one. A server can also pause or resume a
named group of emitters with `EmitterPause`, and drive a value of a unit's
lasting particles from something that changes, such as a capture point or the
unit's resource, with `ParticleSource`.

## Looks and animation

A server lays a new look over a unit's own with `AppearancePushed`; looks
stack, the newest showing, and `AppearancePopped` and `AppearanceCleared` take
them away. `AnimationOverrides` has a unit play one set of movements wherever it
would have played another. A server can also play, stop, pause and advance
a unit's animations (`PlayAnimation`, `StopAnimation`, `PauseAnimation`,
`AnimationAdvanced`), fade a unit or a side's minions (`FadeTo`, `FadeRemoved`,
`FadeMinions`), set how each nexus looks (`NexusIdle`, `NexusSkin`), tint a
side's screens (`ScreenTint`), and change the voice a unit speaks with
(`VoiceOverride`).

## Messages

<!-- messages:begin -->

| Message                                                              | Sent by | 1.0  | 4.17          | 4.18          | 4.20          | What it does                                                                                                     |
| -------------------------------------------------------------------- | ------- | ---- | ------------- | ------------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`AnimationAdvanced`](../schema/messages/AnimationAdvanced.json)     | server  | none | 259 on events | 259 on events | 259 on events | Move an animation a unit is playing forward at once                                                              |
| [`AnimationOverrides`](../schema/messages/AnimationOverrides.json)   | server  | none | 107 on events | 107 on events | 107 on events | Make a unit play one set of movements wherever it would have played another                                      |
| [`AnimationUnlocked`](../schema/messages/AnimationUnlocked.json)     | server  | none | none          | none          | 303 on events | Let a unit's locked animation be replaced again                                                                  |
| [`AppearanceCleared`](../schema/messages/AppearanceCleared.json)     | server  | none | 200 on events | 200 on events | 200 on events | Take every look laid over a unit away                                                                            |
| [`AppearancePopped`](../schema/messages/AppearancePopped.json)       | server  | none | 103 on events | 103 on events | 103 on events | Take a look AppearancePushed laid over a unit away                                                               |
| [`AppearancePushed`](../schema/messages/AppearancePushed.json)       | server  | none | 151 on events | 151 on events | 151 on events | Lay a new look over a unit's own                                                                                 |
| [`EffectAdded`](../schema/messages/EffectAdded.json)                 | server  | none | 183 on events | 183 on events | 183 on events | Put a lasting effect on a unit                                                                                   |
| [`EffectAddedGroup`](../schema/messages/EffectAddedGroup.json)       | server  | none | 104 on events | 104 on events | 104 on events | Put one effect on several units at once                                                                          |
| [`EffectCount`](../schema/messages/EffectCount.json)                 | server  | none | 28 on events  | 28 on events  | 28 on events  | Restate how many of a lasting effect are stacked on a unit                                                       |
| [`EffectCountGroup`](../schema/messages/EffectCountGroup.json)       | server  | none | 191 on events | 191 on events | 191 on events | Restate how many of an effect are stacked on several units at once                                               |
| [`EffectCounter`](../schema/messages/EffectCounter.json)             | server  | none | 265 on events | 265 on events | 265 on events | Set the number an effect shows on its icon                                                                       |
| [`EffectRemoved`](../schema/messages/EffectRemoved.json)             | server  | none | 123 on events | 123 on events | 123 on events | Take a lasting effect off a unit                                                                                 |
| [`EffectRemovedGroup`](../schema/messages/EffectRemovedGroup.json)   | server  | none | 148 on events | 148 on events | 148 on events | Take one effect off several units at once                                                                        |
| [`EffectReplaced`](../schema/messages/EffectReplaced.json)           | server  | none | 48 on events  | 48 on events  | 48 on events  | Put a lasting effect in a slot that already holds one, keeping the slot rather than taking the old one off first |
| [`EffectReplacedGroup`](../schema/messages/EffectReplacedGroup.json) | server  | none | 30 on events  | 30 on events  | 30 on events  | Replace one effect with another on several units at once                                                         |
| [`EmitterPause`](../schema/messages/EmitterPause.json)               | server  | none | 248 on events | none          | 248 on events | Pause or resume a named group of particle emitters                                                               |
| [`FadeMinions`](../schema/messages/FadeMinions.json)                 | server  | none | 203 on events | 203 on events | 203 on events | Fade one side's minions                                                                                          |
| [`FadeRemoved`](../schema/messages/FadeRemoved.json)                 | server  | none | 50 on events  | 50 on events  | 50 on events  | Undo a fade on a unit                                                                                            |
| [`FadeTo`](../schema/messages/FadeTo.json)                           | server  | none | 178 on events | 178 on events | 178 on events | Fade a unit towards an opacity over time                                                                         |
| [`KillParticle`](../schema/messages/KillParticle.json)               | server  | none | 56 on events  | 56 on events  | 56 on events  | Stop a particle a client is drawing                                                                              |
| [`NexusIdle`](../schema/messages/NexusIdle.json)                     | server  | none | 4 on events   | 4 on events   | 4 on events   | Put each nexus into its idle particles                                                                           |
| [`NexusSkin`](../schema/messages/NexusSkin.json)                     | server  | none | 116 on events | 116 on events | 116 on events | Change how one side's nexus looks                                                                                |
| [`ParticleSource`](../schema/messages/ParticleSource.json)           | server  | none | 210 on events | none          | 210 on events | Drive a value of the lasting particle effects on a unit from something that changes                              |
| [`ParticlesCreated`](../schema/messages/ParticlesCreated.json)       | server  | none | 135 on events | 135 on events | 135 on events | Start drawing sets of particles                                                                                  |
| [`PauseAnimation`](../schema/messages/PauseAnimation.json)           | server  | none | 113 on events | 113 on events | 113 on events | Pause or resume a unit's animation                                                                               |
| [`PlayAnimation`](../schema/messages/PlayAnimation.json)             | server  | none | 176 on events | 176 on events | 176 on events | Make a unit play an animation                                                                                    |
| [`ScreenTint`](../schema/messages/ScreenTint.json)                   | server  | none | 219 on events | none          | 219 on events | Tint a side's screens, or to take a tint away                                                                    |
| [`StopAnimation`](../schema/messages/StopAnimation.json)             | server  | none | 41 on events  | 41 on events  | 41 on events  | Stop an animation a unit is playing                                                                              |
| [`VoiceOverride`](../schema/messages/VoiceOverride.json)             | server  | none | 150 on events | 150 on events | 150 on events | Change or reset the voice a unit speaks with                                                                     |

<!-- messages:end -->
