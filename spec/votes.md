# Votes

Surrender votes, and a vote on evening out a match.

## Surrender

A server tells a side a surrender vote has been called with
`SurrenderVoteCalled`. A client answers with `SurrenderVote`, and a server tells
the side where the vote stands with `SurrenderStatus`. `SurrenderAllowed` says
whether a champion's player can call a vote, turning the choice in the client's
menu on or off.

<!-- holds from 0.8.13.26 up to 0.9.22.16 -->

> **In 0.8.13.26–0.9.22.15**
>
> There is no surrender vote: a client sends and takes no message about one.

<!-- holds from 0.9.22.16 up to 0.9.25.21 -->

> **In 0.9.22.16–0.9.25.20**
>
> A client has no panel for the vote. `SurrenderVoteCalled` only announces a
> vote, as just cast or as cast already, and a client's player votes by typing.
> Where a vote fails, `SurrenderFailed` says how long until another can be
> called.

<!-- holds from 0.9.25.21 up to 4.21.0.0 -->

> **In 0.9.25.21–4.20**
>
> `SurrenderVoteCalled` shows the caller's vote to that side and, where it says
> the vote opens, opens the vote's panel for that side.

<!-- holds from 0.9.25.24 up to 0.9.25.36 -->

> **In 0.9.25.24–0.9.25.35**
>
> A client takes `SurrenderVoteCalled` whenever it arrives, its own champion on
> the field or not.

<!-- holds from 1.0.0.58 up to 4.20.0.315 -->

> **In 1.0.0.58–4.19**
>
> A client ignores `SurrenderVoteCalled` that arrives before its own champion is
> on the field.

<!-- holds from 1.0.0.126 up to 1.0.0.127 -->

> **In 1.0.0.126**
>
> A client opens no panel for a vote called while the match is paused.

## Evening out a match

A server can hold a vote on giving the side behind gold, experience and
turrets. `BalanceVote` opens the vote's panel for the voting side on the first
vote and adds one voter with each message; a client answers with
`BalanceVoteAnswer` from the panel or as its player types `/equalize`, once per
vote. `BalanceResult` says how the vote ended, or why it could not be held.

<!-- holds from 4.1.0.171 up to 4.20.0.315 -->

> **In 4.1–4.19**
>
> Where the version answer's features turn the commands on, a client also sends
> `BalanceVoteRefused`, a vote against, as its player types `/noequalize`.

<!-- messages -->
