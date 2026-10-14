# Communication

Chat, pings, emotes, and the sound and music a server can drive. Applies to 4.17 and 4.20 clients, as [Versions](versions.md) describes.

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

| Message                                                    | Sent by | 4.17           | 4.20           | What it does                                                                                                                                     |
| ---------------------------------------------------------- | ------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`Chat`](../schema/messages/Chat.json)                     | server  | 104 on chat    | 104 on chat    | Text one player sends the others during a match                                                                                                  |
| [`ChatAllowance`](../schema/messages/ChatAllowance.json)   | server  | 249 on events  | none           | Limit a player's chat, showing how many lines they have left                                                                                     |
| [`ContextEmote`](../schema/messages/ContextEmote.json)     | server  | 243 on events  | none           | What a server sends about an emote a champion played for the moment                                                                              |
| [`EmotePlayed`](../schema/messages/EmotePlayed.json)       | server  | 66 on events   | 66 on events   | Say a unit played an emote                                                                                                                       |
| [`FadeSounds`](../schema/messages/FadeSounds.json)         | server  | 95 on events   | 95 on events   | Fade a client's sound effects out                                                                                                                |
| [`MapPing`](../schema/messages/MapPing.json)               | client  | 87 on requests | 87 on requests | Mark a point on the map for the others                                                                                                           |
| [`MusicCue`](../schema/messages/MusicCue.json)             | server  | 220 on events  | 220 on events  | Drive the music a client plays                                                                                                                   |
| [`PingPlaced`](../schema/messages/PingPlaced.json)         | server  | 64 on events   | 64 on events   | Show a ping on the map to everyone meant to see it                                                                                               |
| [`PlayEmote`](../schema/messages/PlayEmote.json)           | client  | 72 on requests | 72 on requests | Play an emote                                                                                                                                    |
| [`SoundPlayed`](../schema/messages/SoundPlayed.json)       | server  | 67 on events   | 67 on events   | Play a sound once                                                                                                                                |
| [`SystemMessage`](../schema/messages/SystemMessage.json)   | server  | 247 on events  | 247 on events  | Put a line of its own in a client's chat                                                                                                         |
| [`ThemeMusic`](../schema/messages/ThemeMusic.json)         | server  | 96 on events   | none           | Set a champion's skin music                                                                                                                      |
| [`VoiceCommand`](../schema/messages/VoiceCommand.json)     | server  | 68 on events   | 68 on events   | What a server sends about a voice command a champion gave                                                                                        |
| [`VoiceEvent`](../schema/messages/VoiceEvent.json)         | server  | 121 on events  | none           | Play a voice event                                                                                                                               |
| [`VoiceEventDone`](../schema/messages/VoiceEventDone.json) | client  | 5 on requests  | none           | What a client sends once a voice event (VoiceEvent) of kind 0 that asked for it has played, or at once where the client could not play the event |
| [`VolumeMuted`](../schema/messages/VolumeMuted.json)       | server  | 39 on events   | none           | Mute or unmute one kind of sound                                                                                                                 |

<!-- messages:end -->
