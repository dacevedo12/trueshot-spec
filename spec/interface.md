# The interface

What a client shows its player besides the field: the view and camera, input
locks, the minimap, text and highlights over the screen, tips, quests and the
tutorial.

## The view

A client reports where its view sits and which way it faces with `Camera`,
which a server answers (see [Ordering](ordering.md)). A client tells a server what it has
selected with `SelectObject`, and as it locks its view to its champion or
releases it with `CameraLock`.

A server carries a client's view from one place to another with `MoveCamera`. A
server can also lock or free a client's camera with `CameraLockSet`, which the
client answers with `CameraLock`, and set a point a player's view keeps to with
`CameraBehaviour`.

<!-- holds from 4.20.0.315 up to 4.21.0.0 -->

> **In 4.20**
>
> A client reports a view drawn further out than it allows with `ZoomReport`; a
> server MAY ignore it.

<!-- holds from 0.9.25.24 up to 1.0.0.120 -->

> **In 0.9.25.24–1.0.0.119**
>
> `Camera` names one point, the one the view looks at, in place of where the
> view sits and which way it faces.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client sends no `Camera` while its camera is locked. It takes the lock from
> the player's own settings when `StartGame` arrives, locked where they say
> nothing, and answers with `CameraLock`; `CameraLockSet` changes it for the
> match without changing those settings. A server that needs a client's view
> reports frees its camera with `CameraLockSet`.

## Input

A server locks or unlocks kinds of input, such as movement, spells or the
shop, with `InputLock` or `InputLockToggled`.

<!-- holds from 0.9.22.16 up to 0.9.25.36 -->

> **In 0.9.22.16–0.9.25.24**
>
> A client locks and unlocks its own input too, and tells the server each time:
> `InputLocksFlipped` for the locks it flipped, as when a camera move a script
> drives starts and ends, and `InputLockChanged` for the locks it set or
> cleared.

<!-- holds from 0.9.22.14 up to 0.9.22.16 -->

> **In 0.9.22.14**
>
> A server locks and unlocks input with `InputLockToggled` alone. A client
> flips locks of its own too, and tells the server which with
> `InputLocksFlipped`.

<!-- holds from 0.8.13.26 up to 0.9.22.14 -->

> **In 0.8.13.26**
>
> No message locks a client's input, in either direction.

## The minimap, text and highlights

`MinimapIcon` changes what a client draws for a unit on its map. A server can
float text over a unit (`FloatingText`, `UnitText`), warn a player who seems
to be away (`AfkWarning`), and tell a champion something has come about
(`Situation`). `ClientEvent` tells a client something happened that concerns a
unit; the sort it names settles what follows it.

A server lights up parts of the screen and units with `HudHighlighted`,
`HudHighlightToggled`, `UiHighlight`, `UnitHighlighted` and
`UnitHighlightRemoved`.

## Tips, quests and objectives

A server puts a tip in front of a player with `TipShown`, addressed to that
player's champion, and a client reports a click on it, or the tip being closed,
with `TipEvent`. A server can add, complete and remove quests in the quest
tracker with `QuestUpdated`, and a client reports the pointer passing over a
quest, and a click on it, with `QuestEvent`. A server can also show, change
and hide an objective panel (`ObjectiveShown`, `ObjectiveReplaced`,
`ObjectiveHidden`) and a box of text at the side of the screen
(`SideTextShown`, `SideTextRefreshed`, `SideTextHidden`).

## The tutorial

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client is in the tutorial where `VersionSync` names the mode TUTORIAL on map 12.

In the tutorial, a server can put lines of the client's own text in its chat
(`TutorialChatLine`) and open the tutorial's popup (`TutorialPopup`), which the
client answers with `TutorialPopupClosed`.

<!-- messages -->
