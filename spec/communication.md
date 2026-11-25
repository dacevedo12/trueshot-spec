# Communication

Chat, pings, emotes, and the sound and music a server can drive.

## Chat

Players chat with `Chat`, which carries a line to everyone or to a side. A
server puts a line of its own in a client's chat with `SystemMessage`. A server
can limit how many more lines a player can send with `ChatAllowance`.

<!-- holds from 3.10.0.237 up to 3.14.0.700 -->

> **In 3.10–3.13**
>
> A client shows how many lines `ChatAllowance` leaves its player.

<!-- holds from 4.4.0.1858 up to 4.5.0.260 -->

> **In 4.4**
>
> A client shows how many lines `ChatAllowance` leaves its player.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client shows how many lines `ChatAllowance` leaves its player.

<!-- holds from 4.4.0.1858 up to 4.5.0.260 -->

> **In 4.4**
>
> A client drops a `ChatAllowance` that arrives before it has finished loading.

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

<!-- holds from 3.10.0.237 up to 4.18.0.271 -->

> **In 3.10–4.17**
>
> A client shows no ping its server marks as throttled, and notes in its own
> chat that the player is pinging too often. `VoiceCommand` and `ContextEmote`
> change nothing a client shows.

## Sound and music

A server can play a sound once (`SoundPlayed`) or a voice event (`VoiceEvent`),
which a client can report done with `VoiceEventDone`. A server can also set a
champion's skin music (`ThemeMusic`), drive the music (`MusicCue`), mute or
unmute a kind of sound (`VolumeMuted`) and fade sound effects out
(`FadeSounds`).

<!-- holds from 0.9.22.14 up to 0.9.25.21 -->

> **In 0.9.22.14–0.9.25.20**
>
> `VoiceEvent` carries only the event's name and asks for no answer.

<!-- holds from 0.9.25.24 up to 1.0.0.133 -->

> **In 0.9.25.24–1.0.0.132**
>
> Where a `VoiceEvent` asks for an answer, a client sends `VoiceEventDone` once
> it has played the event.

<!-- holds from 0.9.25.24 up to 1.0.0.97 -->

> **In 0.9.25.24–1.0.0.96**
>
> A client never answers a `VoiceEvent` it cannot play.

<!-- holds from 1.0.0.126 up to 1.0.0.133 -->

> **In 1.0.0.126–1.0.0.132**
>
> A client answers a `VoiceEvent` it cannot play at once.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A client never answers a `VoiceEvent` for a voice tied to a unit, and drops
> one of a kind it does not know. Any other it answers where it asks for an
> answer, and at once where it cannot play it, whether it asks or not.

<!-- holds from 3.10.0.237 up to 3.11.0.306 -->

> **In 3.10**
>
> A client never answers a `VoiceEvent` for a voice tied to a unit. Any other it
> answers with `VoiceEventDone` once it has played it, where it asks for an
> answer, and at once where it cannot play it, whether it asks or not.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> A client answers only a `VoiceEvent` of kind 0: with `VoiceEventDone` once it
> has played it, where it asks for an answer, and at once where it cannot play
> it, whether it asks or not. It never answers kind 1, a voice tied to a unit,
> and does nothing for any other kind.

<!-- messages -->
