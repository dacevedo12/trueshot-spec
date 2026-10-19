# Watching a match over the connection

A client can watch a match that a server streams to it over the same
connection a player uses, rather than playing in it. This document says how the
stream is laid out and in what order its parts go. Layouts live in `schema/`.

## What marks a watching client

Nothing on the wire does. A client watches because it was started to watch: it
is given the word `spectator` where a player's client is given its server's
address, followed by the address, the port, the key, a match number and a
player number. The key works as a player's does, with one difference: it can
instead be given as more than 16 characters of base64. The first 24 bytes it
encodes, deciphered as Blowfish ECB under the match number written out in
decimal, give the key as their first 16 bytes.

A watching client registers as a player's client does (see
[Joining a match](joining.md)), and is answered the same way, save for the
client id. A server MUST answer a watching client with a client id that no
player in the streamed match holds: a watching client given a player's client
id takes that player's champion as its own, and fails as soon as it has caught
up with the stream. From then on it
takes only `StreamMetadata`, `StreamChunkRange` and `StreamChunk`, on any
channel, and drops every other message a server sends it directly, `VersionSync`
included. Of what a player's client sends while joining, it sends only
`JoinSide`, once the stream's own `VersionSync` has played, then `GameOptions`,
`CharacterSelected` and `ClientReady`: no `ClientVersion`, no `QueryStatus` and
no `LoadingProgress`.

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
   of setting up; otherwise it keeps it but plays on from that chunk. A client
   sent every chunk from 1 catches up at speed, and fails partway through a
   long catch-up, so a server SHOULD join a client late once a match is more
   than a few minutes in.

5. As the match ends, a server sends `StreamChunkRange` again naming its last
   chunk, then that chunk. Once it has arrived the client takes no more of the
   stream.

The stream's chunks run for `chunkTimeInterval` each and its key frames for
`keyFrameTimeInterval`, both in milliseconds.

## What a chunk holds

A chunk is the messages a server sent the players of the match, one
[`StreamRecord`](../schema/types/StreamRecord.json) after another, each
written against the one before it to save space. A reader keeps the last
record's time, command and object, and recovers a record's own:

- its time, from a time difference, as the last record's time plus that many
  milliseconds;
- its command, where the record leaves it out, as the last record's;
- its object, from an object difference, as the last record's object plus
  that signed difference.

A message is the command, the object and the body, laid out as a game message
is (see [Messages](messages.md)). A record never holds a container.

A client plays records as the stream's clock reaches their time, records of
time zero at once, and the first record with a time above zero sets its clock.
It skips a record of command 0 on the events channel.

The chunks of setting up carry what a player's client is sent from its version
answer on: `VersionSync` first. A client whose own build differs from the one
`VersionSync` names leaves. A client holds the stream back while it loads after
`VersionSync`, and again while it builds the world after `SpawnStart`, and
goes on by itself afterwards.

A key frame is laid out as a chunk is, and holds the whole world as it stands
at that point. A client joined late plays the chunks of setting up, then the
key frame, then goes on from the chunk the key frame names, or, where it names
none, from the chunk its number implies (see `StreamChunk`). The chunks between
the last of setting up and that one are never played.

## Messages

<!-- messages:begin -->

| Message                                                        | Sent by | Ranges    | What it does                                                                                                                                                                 |
| -------------------------------------------------------------- | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`StreamChunk`](../schema/messages/StreamChunk.json)           | server  | 4.17–4.20 | What a server streaming a match sends to carry one fragment of a chunk or key frame of recorded messages (see spec/spectating.md)                                            |
| [`StreamChunkRange`](../schema/messages/StreamChunkRange.json) | server  | 4.17–4.20 | What a server streaming a match sends to say where the match proper begins in its chunks, and, once known, where it ends                                                     |
| [`StreamMetadata`](../schema/messages/StreamMetadata.json)     | server  | 4.17–4.20 | What a server streaming a match to a watching client sends first, within 30 seconds of the client's request: how long its chunks and key frames run                          |
| [`StreamRequest`](../schema/messages/StreamRequest.json)       | client  | 4.17–4.20 | What a client watching a match streamed over its connection (see spec/spectating.md) sends each time the server answers its registration, asking for the stream from a point |

<!-- messages:end -->
