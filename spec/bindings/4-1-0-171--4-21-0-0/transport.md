# Transport

<!-- place: stock -->

The rest of this chapter says what a client does **not** accept from stock
ENet. A server built on an unmodified ENet 1.2.5 never completes a connection.

<!-- place: connect-command -->

## The connect command

A client's connect command takes ENet's layout, except that two of its fields
carry one byte of meaning each. The peer id is the first of the two bytes ENet
gives it, and the session id is the first of the four. The bytes after each
carry nothing a server reads, and a client fills them with anything.

A server MUST take the peer id and the session id from those first bytes. The
session id is then the byte every header carries, and a server that reads
either field at ENet's width answers a client that never hears it.

A client asks for 8 channels. A server's verify connect MUST state that count,
and the throttle interval, acceleration and deceleration the connect command
carried: a client abandons a connection whose verify connect states anything
else.
