# Joining a match

<!-- place: loading-player -->

A client writes all ones where its player id goes in `LoadingProgress`. A
server MUST put the seat's player id in `SeatLoadProgress`: the loading screen
shows a seat's card from the `VersionSync` seat with that id.

<!-- place: selected-early -->

A client can send `CharacterSelected` before its progress reaches 100.

Until it sends `CharacterSelected`, a client drops every message but
`VersionSync`, `QueryStatusAnswer`, `MatchIdentity`, `SeatLoadProgress` and
`GameEnded`, apart from what arrives on the registration and roster channels,
and keeps nothing it drops for later. A server MUST NOT send any of the spawn
run before `CharacterSelected` arrives.

<!-- place: registering -->

A client waits 30 seconds for the answer naming its own player id. Then it
offers its player to wait another 30 seconds or to give up, and leaves on
giving up.

<!-- place: waiting -->

A client whose connection drops before play begins ends rather than connecting
again.
