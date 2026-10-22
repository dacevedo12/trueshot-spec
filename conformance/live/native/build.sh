#!/bin/sh
# Builds ENet 1.2.5 with the changes a client needs, into native/build:
#
#   libenet-stock          ENet 1.2.5 as released, whose header 1.0.0.126 keeps
#   libenet-stock-small    that release taking no datagram over 996 bytes, as 3.02 does
#   libenet-plain          the header schema/protocol.json gives 4.17
#   libenet-address-check  the header it gives 4.20, which opens with four more bytes
#
# enet-1.2.5.patch holds the changes: the header, the constants, and the one
# byte the connect command carries each id in (spec/transport.md). Nothing
# else differs from stock.
#
#   native/build.sh            on macOS or Linux, with a C compiler and curl
#
# On Windows, apply the patch to the same release and build each variant as a
# DLL, defining ENET_ADDRESS_CHECK for the second, then point
# TRUESHOT_ENET_PLAIN and TRUESHOT_ENET_ADDRESS_CHECK at them.
set -eu

HERE=$(cd "$(dirname "$0")" && pwd)
OUT="$HERE/build"
RELEASE=enet-1.2.5
SHA256=d77e76f72c445b50cfe8277bd107b324a029a4bd5374168513aa302deeec302b

mkdir -p "$OUT"
cd "$OUT"
[ -f "$RELEASE.tar.gz" ] || curl -fsSLO "http://enet.bespin.org/download/$RELEASE.tar.gz"
echo "$SHA256  $RELEASE.tar.gz" | shasum -a 256 -c - >/dev/null
rm -rf "$RELEASE" stock stock-small
mkdir stock stock-small
tar xzf "$RELEASE.tar.gz" -C stock
tar xzf "$RELEASE.tar.gz" -C stock-small
sed -i.orig 's/ENET_PROTOCOL_MAXIMUM_MTU             = 4096/ENET_PROTOCOL_MAXIMUM_MTU             = 996/' \
  stock-small/"$RELEASE"/include/enet/protocol.h
grep -q 'MAXIMUM_MTU             = 996' stock-small/"$RELEASE"/include/enet/protocol.h
tar xzf "$RELEASE.tar.gz"
patch -s -p1 < "$HERE/$RELEASE.patch"

case "$(uname -s)" in
  Darwin) EXT=dylib; SHARED=-dynamiclib ;;
  *) EXT=so; SHARED="-shared -fPIC" ;;
esac
FLAGS="-DHAS_SOCKLEN_T -DHAS_FCNTL -DHAS_POLL -DHAS_MSGHDR_FLAGS -O2 -w"

# shellcheck disable=SC2086
cc $FLAGS -Istock/$RELEASE/include $SHARED -o "libenet-stock.$EXT" stock/"$RELEASE"/*.c
# shellcheck disable=SC2086
cc $FLAGS -Istock-small/$RELEASE/include $SHARED -o "libenet-stock-small.$EXT" stock-small/"$RELEASE"/*.c
# shellcheck disable=SC2086
cc $FLAGS -I$RELEASE/include $SHARED -o "libenet-plain.$EXT" "$RELEASE"/*.c
# shellcheck disable=SC2086
cc $FLAGS -I$RELEASE/include -DENET_ADDRESS_CHECK $SHARED -o "libenet-address-check.$EXT" "$RELEASE"/*.c
echo "built libenet-stock, libenet-stock-small, libenet-plain and libenet-address-check in $OUT"
