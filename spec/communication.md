# Communication

Chat, pings, emotes, and the sound and music a server can drive.

## Chat

Players chat with `Chat`, on the chat channel, which carries a line to everyone
or to a side. A server puts a line of its own in a client's chat with
`SystemMessage`. A server can limit how many more lines a player can send with
`ChatAllowance`. Messages players exchange outside a match do not travel on
this connection at all.

<!-- binding: chat-allowance -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/communication.md).*

## Pings and emotes

A client marks a point on the map with `MapPing`, and a server shows the ping to
everyone meant to see it with `PingPlaced`. A client asks to play an emote with
`PlayEmote`, and a server shows it with `EmotePlayed`.

<!-- binding: pings-and-emotes -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/communication.md).*

## Sound and music

A server can play a sound once (`SoundPlayed`) or a voice event
(`VoiceEvent`), which a client answers with `VoiceEventDone` once it has played,
where the event asked for that, or at once where it could not play it. It can
also set a champion's skin music (`ThemeMusic`), drive the music
(`MusicCue`), mute or unmute a kind of sound (`VolumeMuted`) and fade sound
effects out (`FadeSounds`).

## Messages

<!-- messages:begin -->

| Message                                                    | Sent by | Ranges               | What it does                                                                                                                                     |
| ---------------------------------------------------------- | ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`Chat`](../schema/messages/Chat.json)                     | both    | every range          | Text one player sends the others during a match                                                                                                  |
| [`ChatAllowance`](../schema/messages/ChatAllowance.json)   | server  | 4.10–4.20            | Limit a player's chat, showing how many lines they have left                                                                                     |
| [`ContextEmote`](../schema/messages/ContextEmote.json)     | server  | 4.10–4.20            | What a server sends about an emote a champion played for the moment                                                                              |
| [`EmotePlayed`](../schema/messages/EmotePlayed.json)       | server  | every range          | Say a unit played an emote                                                                                                                       |
| [`FadeSounds`](../schema/messages/FadeSounds.json)         | server  | every range          | Fade a client's sound effects out                                                                                                                |
| [`MapPing`](../schema/messages/MapPing.json)               | client  | every range          | Mark a point on the map for the others                                                                                                           |
| [`MusicCue`](../schema/messages/MusicCue.json)             | server  | every range          | Drive the music a client plays                                                                                                                   |
| [`PingPlaced`](../schema/messages/PingPlaced.json)         | server  | 1.0, 4.10–4.17, 4.20 | Show a ping on the map to everyone meant to see it                                                                                               |
| [`PlayEmote`](../schema/messages/PlayEmote.json)           | client  | every range          | Play an emote                                                                                                                                    |
| [`SoundPlayed`](../schema/messages/SoundPlayed.json)       | server  | 4.10–4.20            | Play a sound once                                                                                                                                |
| [`SystemMessage`](../schema/messages/SystemMessage.json)   | server  | 4.10–4.20            | Put a line of its own in a client's chat                                                                                                         |
| [`ThemeMusic`](../schema/messages/ThemeMusic.json)         | server  | 4.17–4.20            | Set a champion's skin music                                                                                                                      |
| [`VoiceCommand`](../schema/messages/VoiceCommand.json)     | server  | 4.10–4.17, 4.20      | What a server sends about a voice command a champion gave                                                                                        |
| [`VoiceEvent`](../schema/messages/VoiceEvent.json)         | server  | every range          | Play a voice event                                                                                                                               |
| [`VoiceEventDone`](../schema/messages/VoiceEventDone.json) | client  | every range          | What a client sends once a voice event (VoiceEvent) of kind 0 that asked for it has played, or at once where the client could not play the event |
| [`VolumeMuted`](../schema/messages/VolumeMuted.json)       | server  | every range          | Mute or unmute one kind of sound                                                                                                                 |

<!-- messages:end -->
