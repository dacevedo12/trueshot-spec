# Communication

Chat, pings, emotes, and the sound and music a server can drive. Applies to 4.20 clients, as [Versions](versions.md) describes.

## Chat

Players chat with `Chat`, on the chat channel, which carries a line to everyone
or to a side. A server puts a line of its own in a client's chat with
`SystemMessage`. A 4.17 server can limit how many more lines a player can send
with `ChatAllowance`, which a client shows. Messages players exchange outside a
match do not travel on this connection at all.

## Pings and emotes

A client marks a point on the map with `MapPing`, and a server shows the ping to
everyone meant to see it with `PingPlaced`; a 4.17 client places no ping for one
its server marks as throttled, and only notes in its own chat that the player is
pinging too often. A client asks to play an emote with `PlayEmote`, and a server
shows it with `EmotePlayed`. `VoiceCommand` and `ContextEmote`
change nothing a 4.17 client shows.

## Sound and music

A 4.17 server can play a sound once (`SoundPlayed`) or a voice event
(`VoiceEvent`), which a client answers with `VoiceEventDone` once it has played,
where the event asked for that, or at once where it could not play it. It can
also set a champion's skin music (`ThemeMusic`), drive the music
(`MusicCue`), mute or unmute a kind of sound (`VolumeMuted`) and fade sound
effects out (`FadeSounds`).

## Messages

<!-- messages:begin -->

| Message                                                  | Sent by | 4.20           | What it does                                       |
| -------------------------------------------------------- | ------- | -------------- | -------------------------------------------------- |
| [`Chat`](../schema/messages/Chat.json)                   | server  | 104 on chat    | Text one player sends the others during a match    |
| [`EmotePlayed`](../schema/messages/EmotePlayed.json)     | server  | 66 on events   | Say a unit played an emote                         |
| [`MapPing`](../schema/messages/MapPing.json)             | client  | 87 on requests | Mark a point on the map for the others             |
| [`PingPlaced`](../schema/messages/PingPlaced.json)       | server  | 64 on events   | Show a ping on the map to everyone meant to see it |
| [`PlayEmote`](../schema/messages/PlayEmote.json)         | client  | 72 on requests | Play an emote                                      |
| [`SystemMessage`](../schema/messages/SystemMessage.json) | server  | 247 on events  | Put a line of its own in a client's chat           |

<!-- messages:end -->
