# Watching a match

How a client is started to watch a match rather than play in it, and how the
match reaches it.

<!-- holds from 0.8.13.26 up to 1.0.0.97 -->

> **In 0.8.13.26–1.0.0.96**
>
> A client cannot watch a match: no start-up word or message makes it watch.

<!-- holds from 1.0.0.126 up to 1.0.0.141 -->

> **In 1.0.0.126–1.0.0.140**
>
> A watching client takes the match over HTTP from a spectator service, not over
> a game connection.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> A client can watch a match that a server streams to it over the same
> connection a player uses, rather than playing in it.

## What marks a watching client

Nothing on the wire does. A client watches because it was started to watch: it
is given the word `spectator` where a player's client is given its server's
address. Its key can be given as more than 16 characters of base64: the first
24 bytes it encodes, deciphered as Blowfish ECB under the match number written
out, give the key as their first 16 bytes.

<!-- holds from 1.0.0.126 up to 1.0.0.141 -->

> **In 1.0.0.126–1.0.0.140**
>
> The word is followed by the spectator service's address, with no port of its
> own, the key, a match number and a platform name; there is no player number.
> A key is deciphered under the low 32 bits of the match number, written out as
> a signed decimal.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> The word `replay` starts a watching client as `spectator` does, and a
> player's key too can be given as base64.

<!-- holds from 4.1.0.171 up to 4.21.0.0 -->

> **In 4.1–4.20**
>
> The word is followed by the address, the port, the key, a match number and a
> player number. The key works as a player's does, with one difference: it can
> instead be given as base64, deciphered under the match number written out in
> decimal.
>
> A watching client registers as a player's client does (see
> [Joining a match](joining.md)), and is answered the same way, save for the
> client id. A server MUST answer a watching client with a client id that no
> player in the streamed match holds: a watching client given a player's client
> id takes that player's champion as its own, and fails as soon as it has caught
> up with the stream. From then on it takes only `StreamMetadata`,
> `StreamChunkRange` and `StreamChunk`, on any channel, and drops every other
> message a server sends it directly, `VersionSync` included. Of what a player's
> client sends while joining, it sends only `JoinSide`, once the stream's own
> `VersionSync` has played, then `GameOptions`, `CharacterSelected` and
> `ClientReady`: no `ClientVersion`, no `QueryStatus` and no `LoadingProgress`.

## The order of the stream

1. A client answered on registration sends `StreamRequest`.
2. A server sends `StreamMetadata`, within 30 seconds: until it arrives the
   client waits.
3. A server sends `StreamChunkRange`, with the match's end left at zero while
   it runs.
4. A server sends the chunks, each cut into `StreamChunk` fragments sent in
   order and not mixed with another chunk's. It either sends every chunk from
   chunk 1 upward, or joins the client late:
   - the chunks of setting up, from 1 to the last of them (the chunk of kind
     3), and no chunk after it;
   - then the key frame nearest the present, the first key frame sent on the
     connection;
   - then the chunks from the one that key frame leads to.

   Either way it skips none after that. A client takes a key frame only where
   it is the first one sent and arrives before the chunk after the last chunk
   of setting up; otherwise it keeps it but plays on from that chunk. A server
   SHOULD join a client late once a match is more than a few minutes in: a
   client sent every chunk from 1 fails partway through a long catch-up.

5. As the match ends, a server sends `StreamChunkRange` again naming its last
   chunk, then that chunk. Once it has arrived the client takes no more of the
   stream.

The stream's chunks run for `StreamMetadata`'s `chunkTimeInterval` each and its
key frames for its `keyFrameTimeInterval`, both in milliseconds.

<!-- holds from 1.0.0.126 up to 1.0.0.141 -->

> **In 1.0.0.126–1.0.0.140**
>
> A watching client asks the spectator service for the match under
> `/observer-mode/rest/consumer/`, each request naming the platform and the
> match number: `getGameMetaData` for the match's metadata, `getLastChunkInfo`
> and `getLastKeyFrameInfo` for how far the match has come, and
> `getGameDataChunk` and `getKeyFrame` for a chunk or a key frame by number. It
> gives up on the metadata after a time, fetches the chunks of setting up, then
> catches up to the last chunk on offer and waits there for the next. Key frames arrive compressed. The metadata gives `gameKey.gameId`,
> `gameEnded` and `chunkTimeInterval`; the last chunk's information gives
> `chunkId`, `nextChunkId`, `availableSince`, `nextAvailableChunk`,
> `endStartupChunkId` and `endGameChunkId`.

<!-- holds from 1.0.0.140 up to 1.0.0.141 -->

> **In 1.0.0.140**
>
> A watching client first asks the service for its version, and fetches the
> first key frame's information after the chunks of setting up; it ends by
> asking the service to stop. The metadata also gives `keyFrameTimeInterval`, a
> whole multiple of `chunkTimeInterval`, and `clientAddedLag`; the last chunk's
> information also gives `keyFrameId`, `duration` and `startGameChunkId`.

## What a chunk holds

A chunk is the messages a server sent the players of the match, one record
after another.

<!-- holds from 4.17.0.233 up to 4.18.0.271 -->

> **In 4.17**
>
> Each record is a [`StreamRecord`](../schema/types/StreamRecord.json),
> written against the one before it to save space. A reader keeps the last
> record's time, command and object, and recovers a record's own:
>
> - its time, from a time difference, as the last record's time plus that many
>   milliseconds;
> - its command, where the record leaves it out, as the last record's;
> - its object, from an object difference, as the last record's object plus
>   that signed difference.
>
> A message is the command, the object and the body, laid out as a game message
> is (see [Messages](messages.md)). A record never holds a container.

A client plays records as the stream's clock reaches their time, records of
time zero at once, and the first record with a time above zero sets its clock.
It skips a record of command 0 on the events channel.

The chunks of setting up carry what a player's client is sent from its version
answer on: `VersionSync` first. A client whose own build differs from the one
`VersionSync` names leaves. A client holds the stream back while it loads after
`VersionSync`, and again while it builds the world after `SpawnStart`, and
goes on by itself afterwards.

A key frame is laid out as a chunk is, and holds the whole world as it stands
at that point. A client joined late goes on after it from the chunk the key
frame names, or, where it names none, from the chunk its number implies (see
`StreamChunk`).

<!-- messages -->
