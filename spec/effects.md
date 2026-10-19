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

| Message                                                              | Sent by | Ranges               | What it does                                                                                                     |
| -------------------------------------------------------------------- | ------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`AnimationAdvanced`](../schema/messages/AnimationAdvanced.json)     | server  | 4.10–4.20            | Move an animation a unit is playing forward at once                                                              |
| [`AnimationOverrides`](../schema/messages/AnimationOverrides.json)   | server  | every range          | Make a unit play one set of movements wherever it would have played another                                      |
| [`AnimationUnlocked`](../schema/messages/AnimationUnlocked.json)     | server  | 4.20                 | Let a unit's locked animation be replaced again                                                                  |
| [`AppearanceCleared`](../schema/messages/AppearanceCleared.json)     | server  | 4.10–4.20            | Take every look laid over a unit away                                                                            |
| [`AppearancePopped`](../schema/messages/AppearancePopped.json)       | server  | every range          | Take a look AppearancePushed laid over a unit away                                                               |
| [`AppearancePushed`](../schema/messages/AppearancePushed.json)       | server  | every range          | Lay a new look over a unit's own                                                                                 |
| [`EffectAdded`](../schema/messages/EffectAdded.json)                 | server  | every range          | Put a lasting effect on a unit                                                                                   |
| [`EffectAddedGroup`](../schema/messages/EffectAddedGroup.json)       | server  | every range          | Put one effect on several units at once                                                                          |
| [`EffectCount`](../schema/messages/EffectCount.json)                 | server  | every range          | Restate how many of a lasting effect are stacked on a unit                                                       |
| [`EffectCountGroup`](../schema/messages/EffectCountGroup.json)       | server  | every range          | Restate how many of an effect are stacked on several units at once                                               |
| [`EffectCounter`](../schema/messages/EffectCounter.json)             | server  | 4.10–4.20            | Set the number an effect shows on its icon                                                                       |
| [`EffectRemoved`](../schema/messages/EffectRemoved.json)             | server  | every range          | Take a lasting effect off a unit                                                                                 |
| [`EffectRemovedGroup`](../schema/messages/EffectRemovedGroup.json)   | server  | every range          | Take one effect off several units at once                                                                        |
| [`EffectReplaced`](../schema/messages/EffectReplaced.json)           | server  | every range          | Put a lasting effect in a slot that already holds one, keeping the slot rather than taking the old one off first |
| [`EffectReplacedGroup`](../schema/messages/EffectReplacedGroup.json) | server  | every range          | Replace one effect with another on several units at once                                                         |
| [`EmitterPause`](../schema/messages/EmitterPause.json)               | server  | 4.10–4.17, 4.20      | Pause or resume a named group of particle emitters                                                               |
| [`FadeMinions`](../schema/messages/FadeMinions.json)                 | server  | every range          | Fade one side's minions                                                                                          |
| [`FadeRemoved`](../schema/messages/FadeRemoved.json)                 | server  | every range          | Undo a fade on a unit                                                                                            |
| [`FadeTo`](../schema/messages/FadeTo.json)                           | server  | every range          | Fade a unit towards an opacity over time                                                                         |
| [`KillParticle`](../schema/messages/KillParticle.json)               | server  | every range          | Stop a particle a client is drawing                                                                              |
| [`NexusIdle`](../schema/messages/NexusIdle.json)                     | server  | every range          | Put each nexus into its idle particles                                                                           |
| [`NexusSkin`](../schema/messages/NexusSkin.json)                     | server  | every range          | Change how one side's nexus looks                                                                                |
| [`ParticleSource`](../schema/messages/ParticleSource.json)           | server  | 1.0, 4.10–4.17, 4.20 | Drive a value of the lasting particle effects on a unit from something that changes                              |
| [`ParticlesCreated`](../schema/messages/ParticlesCreated.json)       | server  | every range          | Start drawing sets of particles                                                                                  |
| [`PauseAnimation`](../schema/messages/PauseAnimation.json)           | server  | every range          | Pause or resume a unit's animation                                                                               |
| [`PlayAnimation`](../schema/messages/PlayAnimation.json)             | server  | every range          | Make a unit play an animation                                                                                    |
| [`ScreenTint`](../schema/messages/ScreenTint.json)                   | server  | 1.0, 4.10–4.17, 4.20 | Tint a side's screens, or to take a tint away                                                                    |
| [`StopAnimation`](../schema/messages/StopAnimation.json)             | server  | every range          | Stop an animation a unit is playing                                                                              |
| [`VoiceOverride`](../schema/messages/VoiceOverride.json)             | server  | every range          | Change or reset the voice a unit speaks with                                                                     |

<!-- messages:end -->
