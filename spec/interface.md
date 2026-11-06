# The interface

What a client shows its player besides the field: the view and camera, input
locks, the minimap and text over the screen. Tips, quests, highlights and the
tutorial are in [Tutorial and guidance](guidance.md).

## The view

A client reports where its view sits and which way it faces with `Camera`,
which a server answers (see [Ordering](ordering.md)). A client tells a server what it has
selected with `SelectObject`, and as it locks its view to its champion or
releases it with `CameraLock`.

A server carries a client's view from one place to another with `MoveCamera`. A
server can also lock or free a client's camera with `CameraLockSet`, which the
client answers with `CameraLock` except while it holds its camera itself, and
set a point a player's view keeps to with `CameraBehaviour`.

<!-- holds from 0.9.25.24 up to 1.0.0.141 -->

> **In 0.9.25.24–1.0.0.140**
>
> A client sends no `Camera` while its camera is locked: a server that needs a
> client's view reports frees its camera with `CameraLockSet`.

<!-- holds from 0.9.25.24 up to 1.0.0.120 -->

> **In 0.9.25.24–1.0.0.119**
>
> `Camera` names one point, the one the view looks at, in place of where the
> view sits and which way it faces.

<!-- holds from 0.9.25.24 up to 1.0.0.61 -->

> **In 0.9.25.24–1.0.0.60**
>
> A client ignores `CameraLockSet` that arrives while it holds its camera
> itself, and answers nothing.

<!-- holds from 1.0.0.96 up to 1.0.0.141 -->

> **In 1.0.0.96–1.0.0.140**
>
> A client keeps a `CameraLockSet` that arrives while it holds its camera
> itself, and applies and answers it once the hold ends.

<!-- holds from 1.0.0.96 up to 1.0.0.127 -->

> **In 1.0.0.96–1.0.0.126**
>
> A client takes the lock from the player's own settings when `StartGame`
> arrives, locked where they say nothing, and answers with `CameraLock`;
> `CameraLockSet` changes it for the match without changing those settings.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A client reports a view drawn further out than it allows with `ZoomReport`; a
> server MAY ignore it.

## Input

A server locks or unlocks kinds of input, such as movement, spells or the
shop, with `InputLock` or `InputLockToggled`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> No message locks a client's input, in either direction.

<!-- holds from 0.9.22.14 up to 0.9.22.16 -->

> **In 0.9.22.14–0.9.22.15**
>
> A server locks and unlocks input with `InputLockToggled` alone. A client
> flips locks of its own too, and tells the server which with
> `InputLocksFlipped`.

<!-- holds from 0.9.22.16 up to 0.9.25.36 -->

> **In 0.9.22.16–0.9.25.35**
>
> A client locks and unlocks its own input too, and tells the server each time:
> `InputLocksFlipped` for the locks it flipped, as when a camera move a script
> drives starts and ends, and `InputLockChanged` for the locks it set or
> cleared.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client keeps every lock a message sets or clears, and later input obeys
> them, but it acts on a lock at once only where the message's mask is exactly
> one of 1, 4, 8, 16, 32 or 128.

## The minimap and text on screen

`MinimapIcon` changes what a client draws for a unit on its map. A server can
float text over a unit (`FloatingText`, `UnitText`), warn a player who seems
to be away (`AfkWarning`), and take the interface down (`HudDisabled`).

<!-- messages -->
