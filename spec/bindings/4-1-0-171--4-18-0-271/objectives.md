# Objectives

<!-- place: capture-points -->

Everything a client shows of a capture point (who holds it, where it stands,
how far it is taken) comes from the unit `CapturePointChanged` binds it to, so a
server hands a point over by changing the unit's side and moves it toward
capture by changing the unit's resource. A client shows the points and the
score on a panel it builds only where the version answer names the mode ODIN,
and only once one point is known. Reaching a score ends nothing: the match ends
as any match does (see [The match](../../match.md)).

<!-- place: respawn-points -->

A client acts on `RespawnPoint` only where its screen has such a panel.
