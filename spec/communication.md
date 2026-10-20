# Communication

Chat, pings, emotes, and the sound and music a server can drive.

## Chat

Players chat with `Chat`, on the chat channel, which carries a line to everyone
or to a side. A server puts a line of its own in a client's chat with
`SystemMessage`. A server can limit how many more lines a player can send with
`ChatAllowance`. Messages players exchange outside a match do not travel on
this connection at all.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client shows how many lines `ChatAllowance` leaves its player.

## Pings and emotes

A client marks a point on the map with `MapPing`, and a server shows the ping to
everyone meant to see it with `PingPlaced`. A client asks to play an emote with
`PlayEmote`, and a server shows it with `EmotePlayed`.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client places no ping for one its server marks as throttled, and only notes
> in its own chat that the player is pinging too often. `VoiceCommand` and
> `ContextEmote` change nothing a client shows.

## Sound and music

A server can play a sound once (`SoundPlayed`) or a voice event
(`VoiceEvent`), which a client answers with `VoiceEventDone` once it has played,
where the event asked for that, or at once where it could not play it. It can
also set a champion's skin music (`ThemeMusic`), drive the music
(`MusicCue`), mute or unmute a kind of sound (`VolumeMuted`) and fade sound
effects out (`FadeSounds`).

<!-- messages -->
