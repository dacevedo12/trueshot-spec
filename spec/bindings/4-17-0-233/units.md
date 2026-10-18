# Units

<!-- place: before-selection -->

A client drops a `CreateChampion` or a `CreateNeutral` that arrives before it
sends `CharacterSelected`, reconnecting included. A server MUST send them after
it receives `CharacterSelected`.

<!-- place: bots -->

None of `BotDebug`, `BotTargets` and `BotState` changes what a player sees.
