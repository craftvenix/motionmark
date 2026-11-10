# Self-hosted typefaces

Motionmark serves every typeface from this folder as woff2. Nothing is fetched
from Google Fonts at runtime.

| Family | File prefix | Weight range | Upstream |
| --- | --- | --- | --- |
| Bricolage Grotesque | `bricolage-grotesque-*` | 200–800 | https://github.com/ateliertriay/bricolage |
| DM Sans | `dm-sans-*` (normal + italic) | 300–700 | https://github.com/googlefonts/dm-fonts |
| Fraunces | `fraunces-*` (normal + italic) | 300–700 | https://github.com/undercasetype/Fraunces |
| Space Grotesk | `space-grotesk-*` | 300–700 | https://github.com/floriankarsten/space-grotesk |
| Syne | `syne-*` | 400–800 | https://gitlab.com/bonjour-monde/fonderie/syne-typeface |

Each family ships `latin` and `latin-ext` subsets. The unicode ranges in
`src/fonts.css` select them automatically, so accented brand copy stays in the
chosen face.

All families are licensed under the SIL Open Font License 1.1. The original
license and copyright notice for each is in [`licenses/`](./licenses).
