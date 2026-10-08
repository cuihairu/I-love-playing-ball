[English](README.md) | [中文](README.zh.md)

# Ikunism

A game monorepo with basketball and chick memes as the core visual identity. The current direction is *Aikun Sect* (爱坤宗), a narrative game built on a chapter-based main storyline: the sect master suppressed, the disciples turned into chickens, stages cleared to collect fragments, and fellow disciples awakened. On platforms, Steam premium (one-time purchase) comes first, with WeChat and Douyin mini game versions to follow (a desensitized F2P variant, monetized through ads only, no payments).

## Current recommendations

- The game client engine is finalized as **Godot 4.x** (Steam premium first; decided in the engine re-evaluation on 2026-10-04, see `docs/engine-selection.md` §0.1. Cocos has dropped out of the candidate list, and Unity is kept as the 3D upgrade path).
- No self-built backend (decided 2026-10-04): the player-facing side runs entirely on Steamworks (leaderboards/achievements/cloud saves), the content side runs entirely on the Cloudflare free tier (R2/Workers/Pages), and administration = git + wrangler release configuration. Development of `apps/backend` is halted and archived, see the "Platform and Monetization" section of `docs/gameplay-v3.md`.
- For art assets, generate AI concept images first, then run a unified pass of cropping, compression, and size adaptation; do not start out hand-collecting assets.

## Directory structure

```text
.
|-- apps
|   |-- backend          # Backend service: leaderboard/config/event APIs
|   `-- game             # Cocos Creator game project
|-- docs
|   |-- art-tools.md     # Image generation tools and workflow recommendations
|   |-- cocos-project-plan.md # Cocos main project plan
|   |-- gameplay-v1.md   # Gameplay design v1
|   `-- architecture.md  # Technology choices and directory design
|-- packages
|   |-- game-config      # Shared config, stats, levels, and copy
|   `-- platform-sdk     # WeChat/Douyin platform capability wrapper
|-- tools
|   `-- art              # Prompts, batch processing, compression and cropping scripts
|-- package.json
`-- pnpm-workspace.yaml
```

## Why this split

- `apps/game` and `apps/backend` are kept apart so that game logic and server logic do not end up mixed together later.
- `packages/platform-sdk` absorbs the API differences between the WeChat and Douyin mini games; ads, login, and sharing all go through it.
- `packages/game-config` holds the shared JSON/TS configuration, which keeps stats and events easier to maintain.
- `tools/art` manages prompts and image-processing scripts separately, so switching models or batch-producing images later will not pollute business code.

## Next steps

1. Initialize a Cocos Creator project in `apps/game`.
2. Keep extending the Go service in `apps/backend`, starting with leaderboard persistence and config distribution.
3. Build a minimal gameplay prototype first, for example "shooting + combos + chick expression changes".
4. Set a visual baseline for the chick, then batch-generate expressions, skins, and meme assets.

## Development docs

- Architecture and technology choices: `docs/architecture.md`
- Image tools and image-generation workflow: `docs/art-tools.md`
- Placeholder asset checklist: `docs/placeholder-assets-checklist.md`
- Asset naming conventions: `docs/asset-naming-conventions.md`
- AI asset import rules: `docs/ai-asset-import-rules.md`
- Cocos project plan: `docs/cocos-project-plan.md`
- Cocos component mapping: `docs/cocos-component-mapping.md`
- Gameplay node binding: `docs/gameplay-node-binding.md`
- Cocos field attachment checklist: `docs/cocos-field-checklist.md`
- Creator component shells: `docs/creator-component-shells.md`
- Creator integration playbook: `docs/creator-integration-playbook.md`
- Creator file placement map: `docs/creator-file-map.md`
- Gameplay feedback hooks: `docs/gameplay-feedback-hooks.md`
- Home/Result page hooks: `docs/home-result-hooks.md`
- Gameplay design v1: `docs/gameplay-v1.md`
- Gameplay design v2 (Aikun Sect: Four Arts training): `docs/gameplay-v2.md`
- Gameplay design v3 (chapter-based main storyline): `docs/gameplay-v3.md`
- Story bible (worldview / main storyline / seven-sin inner demons / forgiveness ending): `docs/story.md`
- Level and gameplay design (chapters/tracks/ending hooks): `docs/levels.md`
- Trending meme corpus collection and analysis: `docs/meme-collection.md`
- Platform compliance analysis: `docs/compliance.md`

## Integration testing

- Start the backend: `go run ./apps/backend/cmd/server`
- Game-side offline demo: `pnpm --dir apps/game demo`
- Game-side online demo: `pnpm --dir apps/game demo:online`
- Game-side in-memory scene-flow demo: `pnpm --dir apps/game demo:cocos-flow`
