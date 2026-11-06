# Communication

Chat, pings, emotes, and the sound and music a server can drive.

## Chat

Players chat with `Chat`, which carries a line to everyone or to a side. A
server puts a line of its own in a client's chat with `SystemMessage`. A server
can limit how many more lines a player can send with `ChatAllowance`.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client shows how many lines `ChatAllowance` leaves its player.

## Pings and emotes

A client marks a point on the map with `MapPing`, and a server shows the ping to
everyone meant to see it with `PingPlaced`. A client asks to play an emote with
`PlayEmote`, and a server shows it with `EmotePlayed`. A server can also tell
clients of a voice command a champion gave (`VoiceCommand`) and of an emote a
champion played for the moment (`ContextEmote`).

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client plays the voice line `VoiceCommand` names, unless its player has
> muted the champion's player.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> A client shows no ping its server marks as throttled, and notes in its own
> chat that the player is pinging too often. `VoiceCommand` and `ContextEmote`
> change nothing a client shows.

## Sound and music

A server can play a sound once (`SoundPlayed`) or a voice event (`VoiceEvent`).
Where a `VoiceEvent` asks for an answer, a client sends `VoiceEventDone` once it
has played the event. A server can also set
a champion's skin music (`ThemeMusic`), drive the music (`MusicCue`), mute or
unmute a kind of sound (`VolumeMuted`) and fade sound effects out
(`FadeSounds`).

<!-- holds from 0.9.22.14 up to 0.9.25.21 -->

> **In 0.9.22.14–0.9.25.20**
>
> `VoiceEvent` carries only the event's name and asks for no answer.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client never answers a `VoiceEvent` it cannot play.

<!-- holds from 1.0.0.126 up to 4.21.0.0 -->

> **In 1.0.0.126–4.20**
>
> A client answers a `VoiceEvent` it cannot play at once.

<!-- messages -->
