# Joining a match

<!-- place: loading-player -->

A client writes all ones where its player id goes in `LoadingProgress`. A
server MUST put the seat's player id in `SeatLoadProgress`: the loading screen
shows a seat's card from the `VersionSync` seat with that id.

<!-- place: selected-early -->

A client can send `CharacterSelected` before its progress reaches 100.
