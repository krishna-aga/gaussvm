# GaussVM submission images

Prepared on 12 September 2026 for the ETHGlobal submission form.

## Upload these files

| Form field | File | Pixels |
| --- | --- | --- |
| Logo | `gaussvm-logo-512.png` | 512 x 512 |
| Cover image | `gaussvm-cover-1600.png` | 1600 x 900, exactly 16:9 |
| Screenshot 1 | `screenshot-01-swap.png` | 1440 x 1100 |
| Screenshot 2 | `screenshot-02-liquidity.png` | 1440 x 1364 |
| Screenshot 3 | `screenshot-03-gaussian-curve.png` | 1440 x 1200 |
| Optional screenshot 4 | `screenshot-04-mobile.png` | 390 x 1294 |

`gaussvm-cover-640.png` is a smaller 640 x 360 version of the same cover.
Both covers use the current tagline: **Liquidity shaped for prediction markets.**
The first three screenshots satisfy the minimum shown in the submission form.

## Sources and capture

- The logo is a direct raster export of the existing `web/public/favicon.svg`, with sage corners. `gaussvm-logo.svg` preserves the editable source.
- The cover was created with the built-in image generation tool. `cover-prompt.txt` and `gaussvm-cover-original.png` preserve the initial artwork. The caption was updated with the same tool; `cover-edit-prompt.txt` records the edit and `gaussvm-cover-caption-source.png` preserves its output. The two current upload variants were resized to an exact 16:9 ratio.
- All four screenshots are new captures of https://krishna-aga.github.io/gaussvm/, using its unmodified hosted frontend and actual Sepolia chain reads. They are not generated screen mockups.
- A read-only EIP-1193 adapter displays the project's already-public test account. No private keys were loaded, and the adapter cannot sign or submit transactions. Screenshots show existing balances and simulated quotes, without a fabricated transaction history.
- The research screenshot is scrolled to show the complete curve illustration, its explanatory note, and the static invariant. The illustration label remains visible.
- `capture-evidence.json` records the capture time, public account, visible text and page errors. `capture.mjs` reproduces the screenshot capture from the repository root.
- The logo, cover typography, and screenshot layouts were visually inspected. Capture checks found no page errors, visible error alerts, or horizontal overflow.

The upload ZIP contains the logo, both updated cover sizes, all four screenshots, this guide, and both cover prompts. Source scripts, original artwork and detailed capture evidence remain in this directory.
