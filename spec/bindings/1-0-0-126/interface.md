# Interface

<!-- place: locked-view -->

A client sends no `Camera` while its camera is locked. It takes the lock from
the player's own settings when `StartGame` arrives, locked where they say
nothing, and answers with `CameraLock`; `CameraLockSet` changes it for the
match without changing those settings. A server that needs a client's view
reports frees its camera with `CameraLockSet`.
