# Movement

<!-- place: prediction -->

Where its player has movement prediction on, a client starts its champion
toward the point it asked for, and puts it back where it was if no path arrives
within 2 seconds. A path carried by `WaypointGroupAtSpeed` cannot be overridden
by the player's orders, so a server walks a champion with `WaypointGroup`.
