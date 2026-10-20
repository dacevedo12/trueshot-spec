# The interface

What a client shows its player besides the field: the view and camera, input
locks, the minimap, text and highlights over the screen, tips, quests and the
tutorial.

## The view

A client reports where its view sits and which way it faces with `Camera`, and a
server answers each report with `CameraAck`, naming it, as
[Ordering](ordering.md) requires. A client tells a server what it has
selected with `SelectObject`, and as it locks its view to its champion or
releases it with `CameraLock`.

A server carries a client's view from one place to another with `MoveCamera`. A
server can also lock or free a client's camera with `CameraLockSet`, which the
client answers with `CameraLock`, and set a point a player's view keeps to with
`CameraBehaviour`. Where its range defines `ZoomReport`, a client reports a view
drawn further out than it allows with it, which a server MAY ignore.

<!-- binding: locked-view -->

## Input

A server can lock or unlock kinds of input, such as movement, spells or the
shop, with `InputLock` and `InputLockToggled`.

## The minimap and text on screen

`MinimapIcon` changes what a client draws for a unit on its map. A server can
float text over a unit (`FloatingText`, `UnitText`), warn a player who seems
to be away (`AfkWarning`), and tell a champion something has come about
(`Situation`). `ClientEvent` tells a client something happened that concerns a
unit; the sort it names settles what follows it.

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

<!-- binding: tutorial -->

In the tutorial, a server can put lines of the client's own text in its chat
(`TutorialChatLine`), open the tutorial's popup (`TutorialPopup`), which the
client answers with `TutorialPopupClosed`, and light up parts of the screen and
units (`HudHighlighted`, `HudHighlightToggled`, `UiHighlight`,
`UnitHighlighted`, `UnitHighlightRemoved`); these highlights work outside the
tutorial too.

<!-- messages -->
