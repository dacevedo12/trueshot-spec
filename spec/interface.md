# The interface

What a client shows its player besides the field: the view and camera, input
locks, the minimap, text and highlights over the screen, tips, quests and the
tutorial. Applies to 4.20 clients, as [Versions](versions.md) describes.

## The view

A client reports where its view sits and which way it faces with `Camera`, and a
server MUST answer each report with `CameraAck`, naming it: until it does, a
client sends the report again and again. A client tells a server what it has
selected with `SelectObject`, and as it locks its view to its champion or
releases it with `CameraLock`.

A server carries a client's view from one place to another with `MoveCamera`. A
4.17 server can also lock or free a client's camera with `CameraLockSet`, which
the client answers with `CameraLock`, and set a point a player's view keeps to
with `CameraBehaviour`. A 4.20 client reports a view drawn further out than it
allows with `ZoomReport`, which a server MAY ignore.

## Input

A 4.17 server can lock or unlock kinds of input, such as movement, spells or the
shop, with `InputLock` and `InputLockToggled`.

## The minimap and text on screen

`MinimapIcon` changes what a client draws for a unit on its map. A 4.17 server
can float text over a unit (`FloatingText`, `UnitText`), warn a player who seems
to be away (`AfkWarning`), and tell a champion something has come about
(`Situation`). `ClientEvent` tells a client something happened that concerns a
unit; the sort it names settles what follows it.

## Tips, quests and objectives

A server puts a tip in front of a player with `TipShown`, addressed to that
player's champion, and a client reports a click on it, or the tip being closed,
with `TipEvent`. A 4.17 server can add, complete and remove quests in the quest
tracker with `QuestUpdated`, and a client reports the pointer passing over a
quest, and a click on it, with `QuestEvent`. A 4.17 server can also show, change
and hide an objective panel (`ObjectiveShown`, `ObjectiveReplaced`,
`ObjectiveHidden`) and a box of text at the side of the screen
(`SideTextShown`, `SideTextRefreshed`, `SideTextHidden`).

## The tutorial

A 4.17 client is in the tutorial where the version answer names the mode
TUTORIAL on map 12. A
server can then put lines of the client's own text in its chat
(`TutorialChatLine`), open the tutorial's popup (`TutorialPopup`), which the
client answers with `TutorialPopupClosed`, and light up parts of the screen and
units (`HudHighlighted`, `HudHighlightToggled`, `UiHighlight`,
`UnitHighlighted`, `UnitHighlightRemoved`); these highlights work outside the
tutorial too.

## Messages

<!-- messages:begin -->

| Message                                                | Sent by | 4.20            | What it does                                                                                |
| ------------------------------------------------------ | ------- | --------------- | ------------------------------------------------------------------------------------------- |
| [`Camera`](../schema/messages/Camera.json)             | client  | 46 on requests  | Say where its view sits and which way it faces                                              |
| [`CameraAck`](../schema/messages/CameraAck.json)       | server  | 44 on events    | What a server returns for a view report, naming the report it answers                       |
| [`CameraLock`](../schema/messages/CameraLock.json)     | client  | 129 on requests | What a client sends as it locks its view to a unit or releases it                           |
| [`ClientEvent`](../schema/messages/ClientEvent.json)   | server  | 163 on events   | Tell a client something happened                                                            |
| [`MinimapIcon`](../schema/messages/MinimapIcon.json)   | server  | 216 on events   | Change what a client draws for a unit on its map                                            |
| [`MoveCamera`](../schema/messages/MoveCamera.json)     | server  | 37 on events    | Carry a client's view from one place to another                                             |
| [`SelectObject`](../schema/messages/SelectObject.json) | client  | 175 on requests | What a client sends as the object it has selected changes                                   |
| [`TipEvent`](../schema/messages/TipEvent.json)         | client  | 109 on requests | What a client sends about a tip it has shown or dismissed                                   |
| [`TipShown`](../schema/messages/TipShown.json)         | server  | 85 on events    | Put a note in front of a seat                                                               |
| [`ZoomReport`](../schema/messages/ZoomReport.json)     | client  | 125 on requests | What a client sends when it notices it has drawn its view further out than it allows itself |

<!-- messages:end -->
