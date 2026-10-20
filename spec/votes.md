# Votes

Surrender votes, and a vote on evening out a match.

## Surrender

A server tells a side a surrender vote has been called with
`SurrenderVoteCalled`, which opens the vote's panel for that side and shows the
caller's vote. A client answers with `SurrenderVote`, and a server tells the side
where the vote stands with `SurrenderStatus`. A server can say whether a champion's player can call a vote at all with
`SurrenderAllowed`, which turns the choice in the client's menu on or off.

<!-- binding: surrender -->

## Evening out a match

A server can hold a vote on giving the side behind gold, experience and
turrets. `BalanceVote` opens the vote's panel for the voting side on the first
vote and adds one voter with each message; a client answers with
`BalanceVoteAnswer` from the panel or as its player types `/equalize`, once per
vote. `BalanceResult` says how the vote ended, or why it could not be held.

<!-- binding: vote-against -->

<!-- messages -->
