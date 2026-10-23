# Profile avatars — DiceBear Open Peeps

Eight demo SVGs are bundled here. Replace them one by one; no code changes or
member-data migration needed. The app draws the existing person-colour circle
behind each transparent portrait. Pictures never load from DiceBear at runtime.

## Download configuration

Use **Open Peeps** in the [DiceBear playground](https://www.dicebear.com/playground?style=open-peeps).
Artwork: Pablo Stanley, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
The demo files retain DiceBear's creator/license metadata.

Use these settings for every replacement:

- **Format:** SVG, square, 512 × 512 export. Keep the SVG's original `viewBox`
  (the demos use `0 0 704 704`; the viewBox does not have to equal pixel size).
- **Background:** fully transparent. The app supplies the coloured circle.
- **Scale:** 100% / normal size. In the **10.x HTTP API**, this is `scale=1`,
  **not** `scale=100`.
- **Radius:** 0. Do not bake a circular crop into the SVG; the app clips it.
- **Mask probability:** 0. No medical masks by default.
- **Skin:** choose a natural tone from `ffdbb4`, `edb98a`, `d08b5b`, `ae5d29`,
  `694d3d`. Keep the collection varied.
- **Clothing:** choose cream `fffbf3`, pale green `dcebe0`, or warm beige
  `efe8d9`. These match the Warm Cabinet surface tokens and remain visible on
  the darker person-colour circles. Avoid saturated/neon clothing.
- **Hair / head contrast:** warm dark `2c1b18`, brown `694d3d`, or `724133`.
- **Face / hair / accessories:** choose distinct, calm portraits that remain
  recognisable at 40px. Check the face is not clipped at the top or sides.
  Nothing is assigned automatically from a member's name, gender, age or relation.
- **No:** text, gradients, shadows, external images, scripts, or external SVG
  references. Internal `href="#..."` references are fine.

HTTP colour values below omit `#`. **API 10.x uses `backgroundColor=00000000`
for transparency, not the string `transparent`.** Use one colour per parameter;
these verified download links do not use comma-separated palettes. If the
playground displays percentage controls, use 100% there, not `1%`.

## File slots and colours

The circle is drawn by `src/constants/avatars.ts`, not baked into the download.
It stays identical in light and dark mode and also colours the member's records.

| Replace this file | App circle | Clothing | Skin | Hair |
|---|---|---|---|---|
| `clay.svg` | `#B65C3F` | `#FFFBF3` | `#EDB98A` | `#2C1B18` |
| `sand.svg` | `#966F21` | `#DCEBE0` | `#D08B5B` | `#694D3D` |
| `teal.svg` | `#38807C` | `#EFE8D9` | `#FFDBB4` | `#724133` |
| `lilac.svg` | `#8A5A9E` | `#FFFBF3` | `#AE5D29` | `#2C1B18` |
| `rose.svg` | `#C24E75` | `#DCEBE0` | `#694D3D` | `#2C1B18` |
| `sage.svg` | `#5A7F55` | `#EFE8D9` | `#EDB98A` | `#694D3D` |
| `sky.svg` | `#467BA5` | `#FFFBF3` | `#D08B5B` | `#724133` |
| `slate.svg` | `#6B7280` | `#DCEBE0` | `#FFDBB4` | `#2C1B18` |

Skin/hair entries are demo choices, not a fixed rule per slot. Keep clothing in
this small palette; customise facial features to suit the family.

## Ready-to-download demos

Open a link, save its SVG, then give it the matching filename. Change only the
`seed` to generate another portrait with the same palette, or customise its
features in the playground. Use generic seeds, not real family names.

- [clay.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-clay&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=edb98a&clothingColor=fffbf3&headContrastColor=2c1b18)
- [sand.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-sand&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=d08b5b&clothingColor=dcebe0&headContrastColor=694d3d)
- [teal.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-teal&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=ffdbb4&clothingColor=efe8d9&headContrastColor=724133)
- [lilac.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-lilac&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=ae5d29&clothingColor=fffbf3&headContrastColor=2c1b18)
- [rose.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-rose&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=694d3d&clothingColor=dcebe0&headContrastColor=2c1b18)
- [sage.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-sage&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=edb98a&clothingColor=efe8d9&headContrastColor=694d3d)
- [sky.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-sky&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=d08b5b&clothingColor=fffbf3&headContrastColor=724133)
- [slate.svg](https://api.dicebear.com/10.x/open-peeps/svg?seed=cabinet-slate&size=512&scale=1&radius=0&backgroundColor=00000000&maskProbability=0&skinColor=ffdbb4&clothingColor=dcebe0&headContrastColor=2c1b18)

The links were verified against the **10.x** API when these demos were added.
Other DiceBear versions can use different scale/colour conventions; do not mix
versioned settings. Local files remain stable even if the hosted API changes.

## Replace a portrait

1. Download an Open Peeps SVG with the settings above.
2. Open it to confirm it is a portrait, not an API error response. Preserve
   `xmlns`, `viewBox`, and internal definitions/references. Avoid extra SVG
   minification: iOS can misread tightly packed elliptical arc parameters.
3. Replace **only** the matching `assets/avatars/<id>.svg` file. Keep the filename
   and extension. Do not change tint ids or the static asset registry.
4. In a development build, reload. If the old picture remains, restart Metro:
   `npx expo start --clear`. This app cannot run in Expo Go.
5. A standalone preview APK contains a frozen bundle. Rebuild it to include the
   replacements, or deliver a compatible OTA update only if EAS Update has been
   configured. Replacing SVGs adds no native dependency.
6. Check picker (48px), family grid (64px), member header (80px), and search
   (40px), in light/dark and airplane mode. The selected ring must stay visible.

All members selecting a slot see its replacement picture; names and record
colours stay intact. The eight files are shared presets, not per-member photos.

## Technical notes

- `src/constants/avatars.ts` statically requires each SVG.
- `src/components/Avatar.tsx` renders bundled portraits with `expo-image` and
  `contentFit="contain"`; existing photo avatars use `cover`.
- A small vector silhouette appears if image decoding fails; initials are not
  used as a fallback.
- Legacy emoji ids resolve through the existing tint mapping. No database
  migration or runtime DiceBear dependency is needed.

References: [Open Peeps](https://www.dicebear.com/styles/open-peeps/) ·
[Expo SDK 57 Image](https://docs.expo.dev/versions/v57.0.0/sdk/image/).
