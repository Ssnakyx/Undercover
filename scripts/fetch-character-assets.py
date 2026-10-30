#!/usr/bin/env python3
"""Télécharge les portraits Smash / Pokémon utilisés par les paires et génère la table d'assets.

Usage (depuis la racine du repo) : python3 scripts/fetch-character-assets.py

- Lit les noms dans server/src/content/{smash,pokemon}Pairs.ts.
- Smash : portraits de l'écran de sélection (dépôt communautaire StreamHelperAssets), résolus
  via le nom FR officiel -> codename du jeu.
- Pokémon : artworks officiels (dépôt PokeAPI/sprites), résolus via le nom FR -> n° Pokédex.
- Écrit les images redimensionnées en WebP dans client/public/img/{smash,pokemon}/ et la table
  server/src/content/characterAssets.generated.ts (fichier image + alias de devinette).

Les images sont servies par le client lui-même (aucun hotlink en prod). Nécessite Pillow.
"""

import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "server" / "src" / "content"
PUBLIC = ROOT / "client" / "public" / "img"

SSBU_BASE = "https://raw.githubusercontent.com/joaorb64/StreamHelperAssets/main/games/ssbu"
POKEAPI_CSV = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv"
POKEMON_ART = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork"

LANG_FR = "5"
LANG_EN = "9"


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=60) as res:
        return res.read()


def names_in(pairs_file: Path) -> list[str]:
    text = pairs_file.read_text(encoding="utf-8")
    names: list[str] = []
    for a, b in re.findall(r"\[\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'", text):
        for n in (a, b):
            n = n.replace("\\'", "'")
            if n not in names:
                names.append(n)
    return names


def save_webp(data: bytes, dest: Path, size: int) -> None:
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    img.thumbnail((size, size), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=82, method=6)


def smash_assets() -> dict[str, dict]:
    config = json.loads(fetch(f"{SSBU_BASE}/base_files/config.json"))
    by_name: dict[str, tuple[str, str]] = {}
    for english, info in config["character_to_codename"].items():
        fr = (info.get("locale") or {}).get("fr") or english
        by_name[fr] = (info["codename"], english)
    out: dict[str, dict] = {}
    for name in names_in(CONTENT / "smashPairs.ts"):
        if name not in by_name:
            sys.exit(f"[smash] nom inconnu dans le roster FR : {name}")
        codename, english = by_name[name]
        file = f"{codename}.webp"
        dest = PUBLIC / "smash" / file
        if not dest.exists():
            save_webp(fetch(f"{SSBU_BASE}/full/chara_1_{codename}_00.png"), dest, 360)
        out[name] = {"file": f"/img/smash/{file}", "aliases": [english] if english != name else []}
    return out


def pokemon_assets() -> dict[str, dict]:
    rows = list(csv.DictReader(io.StringIO(fetch(f"{POKEAPI_CSV}/pokemon_species_names.csv").decode("utf-8"))))
    fr = {r["name"]: r["pokemon_species_id"] for r in rows if r["local_language_id"] == LANG_FR}
    en = {r["pokemon_species_id"]: r["name"] for r in rows if r["local_language_id"] == LANG_EN}
    out: dict[str, dict] = {}
    for name in names_in(CONTENT / "pokemonPairs.ts"):
        if name not in fr:
            sys.exit(f"[pokemon] nom FR inconnu du Pokédex : {name}")
        dex = fr[name]
        file = f"{dex}.webp"
        dest = PUBLIC / "pokemon" / file
        if not dest.exists():
            save_webp(fetch(f"{POKEMON_ART}/{dex}.png"), dest, 300)
        english = en.get(dex)
        out[name] = {"file": f"/img/pokemon/{file}", "aliases": [english] if english and english != name else []}
    return out


def main() -> None:
    smash = smash_assets()
    pokemon = pokemon_assets()
    lines = [
        "// Fichier généré par scripts/fetch-character-assets.py — ne pas éditer à la main.",
        "// Nom affiché -> image servie par le client (client/public/img) + alias acceptés pour la",
        "// devinette de Mr White (nom anglais).",
        "",
        "export interface CharacterAsset {",
        "  file: string;",
        "  aliases: string[];",
        "}",
        "",
    ]
    for const, data in (("smashAssets", smash), ("pokemonAssets", pokemon)):
        lines.append(f"export const {const}: Record<string, CharacterAsset> = {{")
        for name, asset in data.items():
            lines.append(f"  {json.dumps(name, ensure_ascii=False)}: {json.dumps(asset, ensure_ascii=False)},")
        lines.append("};")
        lines.append("")
    (CONTENT / "characterAssets.generated.ts").write_text("\n".join(lines), encoding="utf-8")
    print(f"smash: {len(smash)} persos, pokemon: {len(pokemon)} persos")


if __name__ == "__main__":
    main()
