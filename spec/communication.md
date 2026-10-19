# Communication

Chat, pings, emotes, and the sound and music a server can drive.

## Chat

Players chat with `Chat`, on the chat channel, which carries a line to everyone
or to a side. A server puts a line of its own in a client's chat with
`SystemMessage`. A server can limit how many more lines a player can send with
`ChatAllowance`. Messages players exchange outside a match do not travel on
this connection at all.

<!-- binding: chat-allowance -->

## Pings and emotes

A client marks a point on the map with `MapPing`, and a server shows the ping to
everyone meant to see it with `PingPlaced`. A client asks to play an emote with
`PlayEmote`, and a server shows it with `EmotePlayed`.

<!-- binding: pings-and-emotes -->

## Sound and music

A server can play a sound once (`SoundPlayed`) or a voice event
(`VoiceEvent`), which a client answers with `VoiceEventDone` once it has played,
where the event asked for that, or at once where it could not play it. It can
also set a champion's skin music (`ThemeMusic`), drive the music
(`MusicCue`), mute or unmute a kind of sound (`VolumeMuted`) and fade sound
effects out (`FadeSounds`).

## Messages

<!-- messages:begin -->

| Message                                                    | Sent by | 1.0       | 4.17           | 4.18           | 4.20           | What it does                                                                                                                                     |
| ---------------------------------------------------------- | ------- | --------- | -------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`Chat`](../schema/messages/Chat.json)                     | server  | 0 on chat | 104 on chat    | 104 on chat    | 104 on chat    | Text one player sends the others during a match                                                                                                  |
| [`ChatAllowance`](../schema/messages/ChatAllowance.json)   | server  | none      | 249 on events  | 249 on events  | 249 on events  | Limit a player's chat, showing how many lines they have left                                                                                     |
| [`ContextEmote`](../schema/messages/ContextEmote.json)     | server  | none      | 243 on events  | 243 on events  | 243 on events  | What a server sends about an emote a champion played for the moment                                                                              |
| [`EmotePlayed`](../schema/messages/EmotePlayed.json)       | server  | none      | 66 on events   | 66 on events   | 66 on events   | Say a unit played an emote                                                                                                                       |
| [`FadeSounds`](../schema/messages/FadeSounds.json)         | server  | none      | 95 on events   | 95 on events   | 95 on events   | Fade a client's sound effects out                                                                                                                |
| [`MapPing`](../schema/messages/MapPing.json)               | client  | none      | 87 on requests | 87 on requests | 87 on requests | Mark a point on the map for the others                                                                                                           |
| [`MusicCue`](../schema/messages/MusicCue.json)             | server  | none      | 220 on events  | 220 on events  | 220 on events  | Drive the music a client plays                                                                                                                   |
| [`PingPlaced`](../schema/messages/PingPlaced.json)         | server  | none      | 64 on events   | none           | 64 on events   | Show a ping on the map to everyone meant to see it                                                                                               |
| [`PlayEmote`](../schema/messages/PlayEmote.json)           | client  | none      | 72 on requests | 72 on requests | 72 on requests | Play an emote                                                                                                                                    |
| [`SoundPlayed`](../schema/messages/SoundPlayed.json)       | server  | none      | 67 on events   | 67 on events   | 67 on events   | Play a sound once                                                                                                                                |
| [`SystemMessage`](../schema/messages/SystemMessage.json)   | server  | none      | 247 on events  | 247 on events  | 247 on events  | Put a line of its own in a client's chat                                                                                                         |
| [`ThemeMusic`](../schema/messages/ThemeMusic.json)         | server  | none      | 96 on events   | 96 on events   | 96 on events   | Set a champion's skin music                                                                                                                      |
| [`VoiceCommand`](../schema/messages/VoiceCommand.json)     | server  | none      | 68 on events   | none           | 68 on events   | What a server sends about a voice command a champion gave                                                                                        |
| [`VoiceEvent`](../schema/messages/VoiceEvent.json)         | server  | none      | 121 on events  | 121 on events  | 121 on events  | Play a voice event                                                                                                                               |
| [`VoiceEventDone`](../schema/messages/VoiceEventDone.json) | client  | none      | 5 on requests  | 5 on requests  | 5 on requests  | What a client sends once a voice event (VoiceEvent) of kind 0 that asked for it has played, or at once where the client could not play the event |
| [`VolumeMuted`](../schema/messages/VolumeMuted.json)       | server  | none      | 39 on events   | 39 on events   | 39 on events   | Mute or unmute one kind of sound                                                                                                                 |

<!-- messages:end -->
