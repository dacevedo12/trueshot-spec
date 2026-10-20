# Votes

Surrender votes, and a vote on evening out a match.

## Surrender

A server tells a side a surrender vote has been called with
`SurrenderVoteCalled`, which opens the vote's panel for that side and shows the
caller's vote. A client answers with `SurrenderVote`, and a server tells the side
where the vote stands with `SurrenderStatus`. A server can say whether a champion's player can call a vote at all with
`SurrenderAllowed`, which turns the choice in the client's menu on or off.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> A client ignores `SurrenderVoteCalled` that arrives before its own champion is on the field.

## Evening out a match

A server can hold a vote on giving the side behind gold, experience and
turrets. `BalanceVote` opens the vote's panel for the voting side on the first
vote and adds one voter with each message; a client answers with
`BalanceVoteAnswer` from the panel or as its player types `/equalize`, once per
vote. `BalanceResult` says how the vote ended, or why it could not be held.

<!-- holds from 4.1.0.171 up to 4.18.0.271 -->

> **In 4.1–4.17**
>
> Where the version answer's features turn the commands on, a client also sends
> a vote against as its player types `/noequalize`: `BalanceVoteRefused`, laid
> out as `BalanceVote` with only its first fields filled.

<!-- messages -->
