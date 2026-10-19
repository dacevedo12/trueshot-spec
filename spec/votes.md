# Votes

Surrender votes, and a vote on evening out a match.

## Surrender

A server tells a side a surrender vote has been called with
`SurrenderVoteCalled`, which opens the vote's panel for that side and shows the
caller's vote. A client answers with `SurrenderVote`, and a server tells the side
where the vote stands with `SurrenderStatus`. A server can say whether a champion's player can call a vote at all with
`SurrenderAllowed`, which turns the choice in the client's menu on or off.

<!-- binding: surrender -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/votes.md).*

## Evening out a match

A server can hold a vote on giving the side behind gold, experience and
turrets. `BalanceVote` opens the vote's panel for the voting side on the first
vote and adds one voter with each message; a client answers with
`BalanceVoteAnswer` from the panel or as its player types `/equalize`, once per
vote. `BalanceResult` says how the vote ended, or why it could not be held.

<!-- binding: vote-against -->
<!-- by range -->*Ranges add to this: [4.10–4.17](bindings/4-10-0-379--4-18-0-271/votes.md).*

## Messages

<!-- messages:begin -->

| Message                                                              | Sent by | Ranges          | What it does                                                                                                                                                                                             |
| -------------------------------------------------------------------- | ------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`BalanceResult`](../schema/messages/BalanceResult.json)             | server  | 4.10–4.20       | What a server sends when a vote on evening out a match ends, or cannot be held                                                                                                                           |
| [`BalanceVote`](../schema/messages/BalanceVote.json)                 | server  | 4.10–4.20       | What a server sends as a side votes on evening out a match: on the first vote it opens the vote's panel for that side, and each message adds one voter                                                   |
| [`BalanceVoteAnswer`](../schema/messages/BalanceVoteAnswer.json)     | client  | 4.10–4.20       | What a client sends as its player answers a vote on evening out a match (BalanceVote), once per vote, from the vote's panel or by typing /equalize                                                       |
| [`BalanceVoteRefused`](../schema/messages/BalanceVoteRefused.json)   | client  | 4.10–4.20       | What a client sends as its player types /noequalize, where the version answer's features have bit 0 set, outside the tutorial: a vote against, laid out as BalanceVote with only its first fields filled |
| [`SurrenderAllowed`](../schema/messages/SurrenderAllowed.json)       | server  | 4.10–4.20       | Say whether a champion's player can call a surrender vote                                                                                                                                                |
| [`SurrenderStatus`](../schema/messages/SurrenderStatus.json)         | server  | 4.10–4.17, 4.20 | Tell a side where its surrender vote stands                                                                                                                                                              |
| [`SurrenderVote`](../schema/messages/SurrenderVote.json)             | client  | 4.10–4.20       | Answer a call to surrender                                                                                                                                                                               |
| [`SurrenderVoteCalled`](../schema/messages/SurrenderVoteCalled.json) | server  | 4.10–4.20       | Open a surrender vote, or to report one already open                                                                                                                                                     |

<!-- messages:end -->
