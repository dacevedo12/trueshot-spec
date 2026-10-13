# Votes

Surrender votes, and a 4.17 vote on evening out a match. Applies to 4.20 clients, as [Versions](versions.md) describes.

## Surrender

A server tells a side a surrender vote has been called with
`SurrenderVoteCalled`, which opens the vote's panel for that side and shows the
caller's vote. A client answers with `SurrenderVote`, and a server tells the side
where the vote stands with `SurrenderStatus`. A 4.17 client ignores
`SurrenderVoteCalled` that arrives before its own champion is on the field. A 4.17
server can say whether a champion's player can call a vote at all with
`SurrenderAllowed`, which turns the choice in the client's menu on or off.

## Evening out a match

A 4.17 server can hold a vote on giving the side behind gold, experience and
turrets. `BalanceVote` opens the vote's panel for the voting side on the first
vote and adds one voter with each message; a client answers with
`BalanceVoteAnswer` from the panel or as its player types `/equalize`, once per
vote. `BalanceResult` says how the vote ended, or why it could not be held.

Where the version answer's features turn the commands on, a 4.17 client also
sends a vote against as its player types `/noequalize`: `BalanceVoteRefused`,
laid out as `BalanceVote` with only its first fields filled.

## Messages

<!-- messages:begin -->

| Message                                                              | Sent by | 4.20            | What it does                                         |
| -------------------------------------------------------------------- | ------- | --------------- | ---------------------------------------------------- |
| [`SurrenderStatus`](../schema/messages/SurrenderStatus.json)         | server  | 165 on events   | Tell a side where its surrender vote stands          |
| [`SurrenderVote`](../schema/messages/SurrenderVote.json)             | client  | 164 on requests | Answer a call to surrender                           |
| [`SurrenderVoteCalled`](../schema/messages/SurrenderVoteCalled.json) | server  | 201 on events   | Open a surrender vote, or to report one already open |

<!-- messages:end -->
