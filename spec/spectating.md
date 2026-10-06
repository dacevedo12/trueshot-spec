# Watching a match over the connection

A client can watch a match that a server streams to it over the same
connection a player uses, rather than playing in it. This document says how the
stream is laid out and in what order its parts go. Layouts live in `schema/`;
what is here was established against a 4.17 client.

## What marks a watching client

Nothing on the wire does. A client watches because it was started to watch: it
is given the word `spectator` where a player's client is given its server's
address, followed by the address, the port, the key, a match number and a
player number. The key works as a player's does, with one difference: a key
longer than 16 characters is read as base64, and the first 24 bytes it decodes
to are deciphered as Blowfish ECB under the match number written out in
decimal, the first 16 bytes of the result being the key.

A watching client registers as a player's client does (see
[Joining a match](joining.md)), and is answered the same way. From then on it
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
4. A server sends the chunks, from chunk 1 upward and none skipped, each cut
   into `StreamChunk` fragments sent in order and not mixed with another
   chunk's.
5. As the match ends, a server sends `StreamChunkRange` again naming its last
   chunk, then that chunk. Once it has arrived the client takes no more of the
   stream.

The recording's chunks run for `chunkTimeInterval` each and its key frames for
`keyFrameTimeInterval`. A recorded match observed used 30000 and 60000, five
chunks of setting up, and play from chunk 7.

## What a chunk holds

A chunk is the messages a server sent the players of the match, one record
after another, each written against the one before it to save space. A record
begins with a byte:

| Bits   | Meaning                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| 0 to 3 | The channel the message went on.                                                                                     |
| 4      | Set where the size is one byte; clear where it is four.                                                              |
| 5      | Set where the object id is one signed byte added to the last record's; clear where it is four bytes.                 |
| 6      | Set where the command is the last record's and is left out; clear where one byte of command follows.                 |
| 7      | Set where the time is one byte of milliseconds after the last record's; clear where it is a 32-bit float of seconds. |

What follows comes in this order: the time, the size, the command, the object
id, then as many bytes of the message's body as the size says. A message is
the command, the object id and the body, laid out as a game message is
(see [Messages](messages.md)). A record never holds a container.

A client plays records as the stream's clock reaches their time, records of
time zero at once, and the first record with a time above zero sets its clock.
It skips a record of command 0 on the events channel.

The chunks of setting up carry what a player's client is sent from its version
answer on: `VersionSync` first. A client whose own build differs from the one
`VersionSync` names leaves. A client holds the stream back while it loads after
`VersionSync`, and again while it builds the world after `SpawnStart`, and
goes on by itself afterwards.

A key frame is laid out as a chunk is. A client that starts late plays the key
frame nearest the point it wants and goes on from the chunk the key frame names,
or, where it names none, from the chunk its number implies (see `StreamChunk`).
