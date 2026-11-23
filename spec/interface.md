# The interface

What a client shows its player besides the field: the view and camera, input
locks, the minimap and text over the screen. Tips, quests, highlights and the
tutorial are in [Tutorial and guidance](guidance.md).

## The view

A client reports its view with `Camera`;
[Ordering](ordering.md#what-a-server-answers) says when it sends a report
again. A client tells a server what it has selected with
`SelectObject`, and as it locks its view to its champion or releases it with
`CameraLock`.

A server carries a client's view from one place to another with `MoveCamera`. A
server can also lock or free a client's camera with `CameraLockSet`, which the
client answers with `CameraLock` except while it holds its camera itself, and
set a point for a player's view with `CameraBehaviour`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26–0.9.22.13**
>
> A client's view report, `Camera`, goes out as either set of three coordinates
> it carries moves more than 200 units, at most every tenth of a second, and
> never while its view is locked; a report sent again until answered comes
> sooner.

<!-- holds from 0.9.25.24 up to 3.11.0.306 -->

> **In 0.9.25.24–3.10**
>
> A server that needs a client's view reports while its camera is locked frees
> it with `CameraLockSet`.

<!-- holds from 0.9.25.24 up to 1.0.0.120 -->

> **In 0.9.25.24–1.0.0.119**
>
> `Camera` names one point, the one the view looks at.

<!-- holds from 0.9.25.24 up to 1.0.0.61 -->

> **In 0.9.25.24–1.0.0.60**
>
> A client ignores `CameraLockSet` that arrives while it holds its camera
> itself, and answers nothing.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A client's view report, `Camera`, goes out as its view moves more than 200
> units, at most every tenth of a second, and never while its view is locked.

<!-- holds from 1.0.0.25 up to 1.0.0.97 -->

> **In 1.0.0.25–1.0.0.96**
>
> A client's view report, `Camera`, goes out as its view moves more than 200
> units, at most every tenth of a second, and never while its view is locked; a
> report sent again until answered can come sooner.

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

<!-- holds from 1.0.0.110 up to 1.0.0.111 -->

> **In 1.0.0.110**
>
> A client's view report, `Camera`, goes out as its view moves more than 200
> units, at most every tenth of a second, and never while its view is locked; a
> report sent again until answered can come sooner.

<!-- holds from 1.0.0.111 up to 1.0.0.132 -->

> **In 1.0.0.111–1.0.0.131**
>
> A client's view report, `Camera`, goes out as its view moves at least 200
> units, at most every tenth of a second, and never while its view is locked.

<!-- holds from 1.0.0.132 up to 1.0.0.133 -->

> **In 1.0.0.132**
>
> A client's view report, `Camera`, goes out where a point it carries moves more
> than 200 units, at most every tenth of a second, and never while its view is
> locked; a report sent again until answered can come sooner.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client's view report, `Camera`, goes out where a point it carries moves
> more than 200 units, at most every tenth of a second, and never while its
> view is locked; a report sent again until answered can come sooner.

<!-- holds from 1.0.0.150 up to 1.0.0.151 -->

> **In 1.0.0.150**
>
> A client's view report, `Camera`, goes out where a point it carries moves
> more than 200 units, at most every tenth of a second, and never while its
> view is locked or while it watches a match; a report sent again until
> answered can come sooner.

<!-- holds from 3.6.0.388 up to 3.7.0.328 -->

> **In 3.6**
>
> A client's view report, `Camera`, goes out where a point it carries moves more
> than 200 units, at most every tenth of a second, and never while its view is
> locked or while it watches a match; a report sent again until answered can
> come sooner.

<!-- holds from 3.7.0.328 up to 3.13.0.399 -->

> **In 3.7–3.12**
>
> A client's view report, `Camera`, goes out as its view moves at least 200
> units, at most every tenth of a second, and never while its view is locked.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client ignores `CameraLockSet` that arrives while it holds its camera
> itself, and answers nothing.

<!-- holds from 3.13.0.399 up to 3.14.0.700 -->

> **In 3.13**
>
> A client's view report, `Camera`, goes out where a point it carries moves more
> than 200 units, at most every tenth of a second, and never while its view is
> locked or while it watches a match; a report sent again until answered can
> come sooner.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client's view report, `Camera`, goes out as its view moves, and never while
> its view is locked.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client sends a new view report where its view's position or direction moves
> more than 200 units, at most every tenth of a second; a report sent again
> until answered can come sooner.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A client reports a view drawn further out than it allows with `ZoomReport`.
>
> A client's view report, `Camera`, goes out where a point it carries moves
> more than 200 units, at most every tenth of a second, and never while its
> view is locked or while it watches a match.
>
> A client ignores a `CameraLockSet` that arrives while it holds its camera
> itself, and does not apply it later.

## Input

A server locks or unlocks kinds of input, such as movement, spells or the
shop, with `InputLock` or `InputLockToggled`. A message that locks the shop
alone closes the shop and turns off its key.

<!-- holds from 0.9.22.14 up to 0.9.25.36 -->

> **In 0.9.22.14–0.9.25.35**
>
> A client locks and unlocks its own input too, and tells the server each time:
> `InputLocksFlipped` for the locks it flipped, as when a camera move a script
> drives starts and ends, and `InputLockChanged` for the locks it set or
> cleared.

<!-- holds from 0.9.25.24 up to 1.0.0.25 -->

> **In 0.9.25.24–1.0.0.24**
>
> A client keeps every lock a message sets or clears, and later input obeys
> them, but it acts on a lock at once only where the message's mask is exactly
> one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 1.0.0.25 up to 1.0.0.58 -->

> **In 1.0.0.25–1.0.0.57**
>
> A client keeps every lock a message sets or clears, but acts on a lock at once
> only where the message's mask is exactly one of 1, 4, 8, 16, 32 or 128. Later
> input obeys every lock but the shop's, which
> [The shop](shop.md#buying-and-selling) covers.

<!-- holds from 1.0.0.58 up to 1.0.0.74 -->

> **In 1.0.0.58–1.0.0.73**
>
> A client keeps every lock a message sets or clears, and later input obeys
> them, but it acts on a lock at once only where the message's mask is exactly
> one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 1.0.0.74 up to 1.0.0.75 -->

> **In 1.0.0.74**
>
> A client keeps every lock a message sets or clears, but acts on a lock at once
> only where the message's mask is exactly one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 1.0.0.86 up to 1.0.0.87 -->

> **In 1.0.0.86**
>
> A client keeps every lock a message sets or clears, but acts on a lock at once
> only where the message's mask is exactly one of 1, 4, 8, 16, 32 or 128. Later
> input obeys every lock but the shop's, which
> [The shop](shop.md#buying-and-selling) covers.

<!-- holds from 1.0.0.87 up to 1.0.0.132 -->

> **In 1.0.0.87–1.0.0.131**
>
> A client keeps every lock a message sets or clears, and later input obeys
> them, but it acts on a lock at once only where the message's mask is exactly
> one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 1.0.0.132 up to 1.0.0.133 -->

> **In 1.0.0.132**
>
> A client keeps every lock a message sets or clears, but acts on a lock at once
> only where the message's mask is exactly one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 1.0.0.133 up to 1.0.0.150 -->

> **In 1.0.0.133–1.0.0.149**
>
> A client keeps every lock a message sets or clears, and later input obeys
> them, but it acts on a lock at once only where the message's mask is exactly
> one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 1.0.0.150 up to 1.0.0.151 -->

> **In 1.0.0.150**
>
> A client keeps every lock a message sets or clears, but acts on a lock at
> once only where the message's mask is exactly one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 3.6.0.388 up to 3.7.0.328 -->

> **In 3.6**
>
> A client keeps every lock a message sets or clears, and later input obeys
> them, but for the shop lock only in the tutorial. It acts on a lock at once
> only where the message's mask is exactly one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 3.7.0.328 up to 3.11.0.306 -->

> **In 3.7–3.10**
>
> A client keeps every lock a message sets or clears, and later input obeys
> them, but it acts on a lock at once only where the message's mask is exactly
> one of 1, 4, 8, 16, 32 or 128.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A watching client ignores `InputLock`.

<!-- holds from 4.1.0.171 up to 4.17.0.233 -->

> **In 4.1–4.16**
>
> Any message that locks the shop closes it and turns off its key, whatever
> else it locks.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A message that locks other input along with the shop stops the shop opening,
> but leaves an open shop open and its key on.

<!-- holds from 4.18.0.271 up to 4.20.0.315 -->

> **In 4.18–4.19**
>
> Any message that locks the shop closes it and turns off its key, whatever
> else it locks.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A client acts on a lock at once only where the message's mask is exactly one
> of 1, 4, 8, 16, 32 or 128. A message that locks other input along with the
> shop stops the shop opening, but leaves an open shop open and its key on. A
> watching client ignores `InputLock`.

## The minimap and text on screen

`MinimapIcon` changes what a client draws for a unit on its map. A server can
float text over a unit (`FloatingText`, `UnitText`), warn a player who seems
to be away (`AfkWarning`), and take the interface down (`HudDisabled`).

<!-- messages -->
