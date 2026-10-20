{
  description = "The tools that check and typeset the trueshot specification";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      each = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      # Everything `bun run check`, `bun run site` and `bun run pages` call, at the
      # versions the lock file pins. Nothing here is needed by anyone who
      # installs the same tools another way.
      devShells = each (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            vale
            lychee
            mdbook
          ];
        };
      });
    };
}
