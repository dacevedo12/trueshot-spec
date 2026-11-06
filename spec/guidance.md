# Tutorial and guidance

What a server shows a player to lead them: tips, quests, objectives and text at
the side of the screen, highlights, and the tutorial.

A server tells a champion something has come about with `Situation`.

## Highlights

A server lights up parts of the screen and units with `HudHighlighted`,
`HudHighlightToggled`, `UiHighlight`, `UnitHighlighted` and
`UnitHighlightRemoved`, and makes part of the minimap or of the shop blink with
`MinimapHighlighted` and `ShopHighlighted`.

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

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client is in the tutorial where `VersionSync` names the mode TUTORIAL and a
> setting of its own turns the tutorial on, whatever the map.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client is in the tutorial where `VersionSync` names the mode TUTORIAL on map 12.

In the tutorial, a server can put lines of the client's own text in its chat
(`TutorialChatLine`) and open the tutorial's popup (`TutorialPopup`), which the
client answers with `TutorialPopupClosed`.

<!-- holds from 1.0.0.58 up to 3.11.0.306 -->

> **In 1.0.0.58–3.10**
>
> A client takes `TutorialChatLine` in any match.

<!-- holds from 1.0.0.58 up to 1.0.0.97 -->

> **In 1.0.0.58–1.0.0.96**
>
> A client takes `TutorialPopup` in any match.

<!-- messages -->
