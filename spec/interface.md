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

## Messages

<!-- messages:begin -->

| Message                                                                | Sent by | 1.0            | 4.17            | 4.18            | 4.20            | What it does                                                                                                                  |
| ---------------------------------------------------------------------- | ------- | -------------- | --------------- | --------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [`AfkWarning`](../schema/messages/AfkWarning.json)                     | server  | none           | 184 on events   | 184 on events   | 184 on events   | Warn the player that they seem to be away, in a popup with one button that only closes it                                     |
| [`Camera`](../schema/messages/Camera.json)                             | client  | 48 on requests | 46 on requests  | 46 on requests  | 46 on requests  | Say where its view sits and which way it faces                                                                                |
| [`CameraAck`](../schema/messages/CameraAck.json)                       | server  | 46 on events   | 44 on events    | 44 on events    | 44 on events    | What a server returns for a view report, naming the report it answers                                                         |
| [`CameraBehaviour`](../schema/messages/CameraBehaviour.json)           | server  | none           | 115 on events   | 115 on events   | 115 on events   | Set a point a champion's player's view keeps to                                                                               |
| [`CameraLock`](../schema/messages/CameraLock.json)                     | client  | none           | 129 on requests | 129 on requests | 129 on requests | What a client sends as it locks its view to a unit or releases it                                                             |
| [`CameraLockSet`](../schema/messages/CameraLockSet.json)               | server  | none           | 120 on events   | 120 on events   | 120 on events   | Lock the camera to the champion or free it                                                                                    |
| [`ClientEvent`](../schema/messages/ClientEvent.json)                   | server  | none           | 163 on events   | none            | 163 on events   | Tell a client something happened                                                                                              |
| [`DebugHidden`](../schema/messages/DebugHidden.json)                   | server  | none           | none            | none            | 232 on events   | What a server sends about which objects a debug view hides                                                                    |
| [`FloatingText`](../schema/messages/FloatingText.json)                 | server  | none           | 24 on events    | 24 on events    | 24 on events    | Show text floating over a unit                                                                                                |
| [`FloatingTextOnMap`](../schema/messages/FloatingTextOnMap.json)       | server  | none           | none            | none            | 296 on events   | Float text over a unit, to the clients that can see it                                                                        |
| [`HudHighlightToggled`](../schema/messages/HudHighlightToggled.json)   | server  | none           | 79 on events    | 79 on events    | 79 on events    | Light up part of the screen, or to put it out                                                                                 |
| [`HudHighlighted`](../schema/messages/HudHighlighted.json)             | server  | none           | 61 on events    | 61 on events    | 61 on events    | Light up part of the screen, as a tutorial does                                                                               |
| [`InputLock`](../schema/messages/InputLock.json)                       | server  | none           | 132 on events   | 132 on events   | 132 on events   | Lock or unlock a kind of input on a client                                                                                    |
| [`InputLockToggled`](../schema/messages/InputLockToggled.json)         | server  | none           | 155 on events   | 155 on events   | 155 on events   | Turn kinds of input off where they are on, or on where they are off                                                           |
| [`MinimapIcon`](../schema/messages/MinimapIcon.json)                   | server  | none           | 216 on events   | 216 on events   | 216 on events   | Change what a client draws for a unit on its map                                                                              |
| [`MoveCamera`](../schema/messages/MoveCamera.json)                     | server  | none           | 37 on events    | 37 on events    | 37 on events    | Carry a client's view from one place to another                                                                               |
| [`ObjectiveHidden`](../schema/messages/ObjectiveHidden.json)           | server  | none           | 162 on events   | 162 on events   | 162 on events   | Hide the objective panel                                                                                                      |
| [`ObjectiveReplaced`](../schema/messages/ObjectiveReplaced.json)       | server  | none           | 13 on events    | 13 on events    | 13 on events    | Replace the text of the objective panel, showing the panel if it is hidden                                                    |
| [`ObjectiveShown`](../schema/messages/ObjectiveShown.json)             | server  | none           | 54 on events    | 54 on events    | 54 on events    | Show the objective panel with a text                                                                                          |
| [`QuestEvent`](../schema/messages/QuestEvent.json)                     | client  | none           | 205 on requests | 205 on requests | 205 on requests | What a client sends as its player points at a quest in the tracker (QuestUpdated), stops pointing at it, or clicks it         |
| [`QuestUpdated`](../schema/messages/QuestUpdated.json)                 | server  | none           | 140 on events   | 140 on events   | 140 on events   | Add a quest to the quest tracker, complete it or remove it                                                                    |
| [`SelectObject`](../schema/messages/SelectObject.json)                 | client  | none           | 175 on requests | 175 on requests | 175 on requests | What a client sends as the object it has selected changes                                                                     |
| [`SideTextHidden`](../schema/messages/SideTextHidden.json)             | server  | none           | 167 on events   | 167 on events   | 167 on events   | Close the box of text SideTextShown opened                                                                                    |
| [`SideTextRefreshed`](../schema/messages/SideTextRefreshed.json)       | server  | none           | 177 on events   | 177 on events   | 177 on events   | Change the text in the box SideTextShown opened, in place                                                                     |
| [`SideTextShown`](../schema/messages/SideTextShown.json)               | server  | none           | 160 on events   | 160 on events   | 160 on events   | Show a box of text at the right edge of the screen, halfway down                                                              |
| [`Situation`](../schema/messages/Situation.json)                       | server  | none           | 289 on events   | 289 on events   | 289 on events   | Tell a champion something has come about                                                                                      |
| [`TipEvent`](../schema/messages/TipEvent.json)                         | client  | none           | 109 on requests | 109 on requests | 109 on requests | What a client sends about a tip it has shown or dismissed                                                                     |
| [`TipShown`](../schema/messages/TipShown.json)                         | server  | none           | 85 on events    | 85 on events    | 85 on events    | Put a note in front of a seat                                                                                                 |
| [`TutorialChatLine`](../schema/messages/TutorialChatLine.json)         | server  | none           | 2 on events     | 2 on events     | 2 on events     | Put a line of the client's own text in its chat, as a line from the game                                                      |
| [`TutorialPopup`](../schema/messages/TutorialPopup.json)               | server  | none           | 179 on events   | 179 on events   | 179 on events   | Open the tutorial's popup: a caption, this text and a single button, which a client answers with TutorialPopupClosed          |
| [`TutorialPopupClosed`](../schema/messages/TutorialPopupClosed.json)   | client  | none           | 204 on requests | 204 on requests | 204 on requests | What a client sends as its player presses the button of the tutorial's popup (TutorialPopup), or closes a tip in the tutorial |
| [`UiHighlight`](../schema/messages/UiHighlight.json)                   | server  | none           | 202 on events   | 202 on events   | 202 on events   | Place an animated highlight over one element of the screen, or to take one away                                               |
| [`UnitHighlightRemoved`](../schema/messages/UnitHighlightRemoved.json) | server  | none           | 180 on events   | 180 on events   | 180 on events   | Take away the light UnitHighlighted put on a unit                                                                             |
| [`UnitHighlighted`](../schema/messages/UnitHighlighted.json)           | server  | none           | 89 on events    | 89 on events    | 89 on events    | Outline a unit with a pulsing light, as a tutorial does, until UnitHighlightRemoved                                           |
| [`UnitText`](../schema/messages/UnitText.json)                         | server  | none           | 25 on events    | none            | 25 on events    | Float a line of the client's own text over a unit, as combat text floats                                                      |
| [`ZoomReport`](../schema/messages/ZoomReport.json)                     | client  | none           | none            | none            | 125 on requests | What a client sends when it notices it has drawn its view further out than it allows itself                                   |

<!-- messages:end -->
