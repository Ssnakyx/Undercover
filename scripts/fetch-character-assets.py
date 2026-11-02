#!/usr/bin/env python3
"""Télécharge les portraits Smash / Pokémon utilisés par les paires et génère la table d'assets.

Usage (depuis la racine du repo) : python3 scripts/fetch-character-assets.py

- Lit les noms dans server/src/content/{smash,pokemon,brawl}Pairs.ts.
- Smash : portraits de l'écran de sélection (dépôt communautaire StreamHelperAssets), résolus
  via le nom FR officiel -> codename du jeu.
- Pokémon : artworks officiels (dépôt PokeAPI/sprites), résolus via le nom FR -> n° Pokédex.
- Brawl Stars : modèles en pied du CDN communautaire Brawlify (dépôt Brawlify/CDN), résolus via
  l'identifiant du Brawler dans le jeu (table BRAWL_IDS).
- Écrit les images redimensionnées en WebP dans client/public/img/{smash,pokemon,brawl}/ et la table
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
BRAWL_MODEL = "https://raw.githubusercontent.com/Brawlify/CDN/master/brawlers/model"

# Identifiants des Brawlers dans les fichiers du jeu (ceux de l'API officielle et du CDN Brawlify).
BRAWL_IDS = {
    "Shelly": 0, "Colt": 1, "Bull": 2, "Brock": 3, "Rico": 4, "Spike": 5, "Barley": 6, "Jessie": 7,
    "Nita": 8, "Dynamike": 9, "El Primo": 10, "Mortis": 11, "Crow": 12, "Poco": 13, "Bo": 14,
    "Piper": 15, "Pam": 16, "Tara": 17, "Darryl": 18, "Penny": 19, "Frank": 20, "Gene": 21,
    "Tick": 22, "Leon": 23, "Rosa": 24, "Carl": 25, "Bibi": 26, "8-Bit": 27, "Sandy": 28, "Bea": 29,
    "Emz": 30, "Mr. P": 31, "Max": 32, "Jacky": 34, "Gale": 35, "Nani": 36, "Sprout": 37,
    "Surge": 38, "Colette": 39, "Amber": 40, "Lou": 41, "Byron": 42, "Edgar": 43, "Ruffs": 44,
    "Stu": 45, "Belle": 46, "Squeak": 47, "Grom": 48, "Buzz": 49, "Griff": 50, "Ash": 51, "Meg": 52,
    "Lola": 53, "Fang": 54, "Eve": 56, "Janet": 57, "Bonnie": 58, "Otis": 59, "Sam": 60, "Gus": 61,
    "Buster": 62, "Chester": 63, "Gray": 64, "Mandy": 65, "R-T": 66, "Willow": 67, "Maisie": 68,
    "Hank": 69, "Cordelius": 70, "Doug": 71, "Pearl": 72, "Chuck": 73, "Charlie": 74, "Mico": 75,
    "Kit": 76, "Larry & Lawrie": 77, "Melodie": 78, "Angelo": 79, "Draco": 80, "Lily": 81,
    "Berry": 82, "Clancy": 83, "Moe": 84, "Kenji": 85, "Shade": 86, "Juju": 87,
}

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


def brawl_assets() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for name in names_in(CONTENT / "brawlPairs.ts"):
        if name not in BRAWL_IDS:
            sys.exit(f"[brawl] Brawler sans identifiant : {name}")
        brawler_id = 16000000 + BRAWL_IDS[name]
        file = f"{brawler_id}.webp"
        dest = PUBLIC / "brawl" / file
        if not dest.exists():
            save_webp(fetch(f"{BRAWL_MODEL}/{brawler_id}.png"), dest, 360)
        out[name] = {"file": f"/img/brawl/{file}", "aliases": []}
    return out


def main() -> None:
    smash = smash_assets()
    pokemon = pokemon_assets()
    brawl = brawl_assets()
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
    for const, data in (("smashAssets", smash), ("pokemonAssets", pokemon), ("brawlAssets", brawl)):
        lines.append(f"export const {const}: Record<string, CharacterAsset> = {{")
        for name, asset in data.items():
            lines.append(f"  {json.dumps(name, ensure_ascii=False)}: {json.dumps(asset, ensure_ascii=False)},")
        lines.append("};")
        lines.append("")
    (CONTENT / "characterAssets.generated.ts").write_text("\n".join(lines), encoding="utf-8")
    print(f"smash: {len(smash)} persos, pokemon: {len(pokemon)} persos, brawl: {len(brawl)} Brawlers")


if __name__ == "__main__":
    main()
