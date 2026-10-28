# AGENTS.md — Architectural Rules & Engineering Invariants

## 1. Project Objective
Build deterministic ASCII/UTF-8 wireframe design engine that compiles 2D scene graphs into hybrid `WIREFRAME.md` specifications optimized for AI agent UI prototyping.

## 2. Core Architectural Invariants
1. **Strict Separation of Concerns:**
   - `src/core/` MUST remain 100% pure TypeScript with zero DOM, UI framework, or I/O dependencies.
   - Never mutate 2D character strings directly during user drag/resize operations. Mutate `SceneGraph` AST first, then re-rasterize full `CharGrid` on each frame (< 2ms budget).
2. **Coordinate System:**
   - All spatial coordinates (`x`, `y`, `w`, `h`) are discrete integer grid cells (`0-indexed`, top-left origin).
   - Minimum container size: `w >= 3`, `h >= 3`.
3. **BPE Tokenization Safety:**
   - Never emit trailing whitespace at line ends.
   - Always close vertical container boundaries (`│`) explicitly to prevent LLM column-alignment drift across multi-line spans.

## 3. Border Intersection Algorithm (4-Bit NESW Bitmask)
Do not use regex or string replacement to join overlapping boxes. Maintain parallel `Uint8Array` bitmask buffer alongside character matrix.

```text
   NORTH (1)          Bitmask = (N << 0) | (E << 1) | (S << 2) | (W << 3)
       ▲
       │              Example Junctions:
WEST ◄─┼─► EAST       - Corner ┌ : SOUTH (4) | EAST (2)               = 6
 (8)   │    (2)       - Line   ─ : EAST (2)  | WEST (8)               = 10
       ▼              - Line   │ : NORTH (1) | SOUTH (4)              = 5
   SOUTH (4)          - Tee    ├ : NORTH (1) | SOUTH (4) | EAST (2)   = 7
                      - Cross  ┼ : NORTH (1) | EAST (2)  | SOUTH (4) | WEST (8) = 15

Bitmask Accumulation Flow:
[Box A Perimeter] ──(OR bits)──► [Uint8Array Grid] ◄──(OR bits)── [Box B Perimeter]
                                         │
                                         ▼
                           [16-Entry UTF-8 Lookup Table]
                                         │
                                         ▼
                        [' ', '╵', '╶', '┌', ..., '├', ..., '┼']
```

## 4. Canonical ASCII Widget DSL
Enforce exact syntax in `src/core/rasterizer/widget-stampers.ts`:
- `Container` : `┌── Title ──┐ ... └───────────┘`
- `Button`    : `[ Label ]` (Secondary) | `[# Label #]` (Primary)
- `Input`     : `[ Placeholder...   ]`
- `Select`    : `[ Value          v ]`
- `Checkbox`  : `[ ] Label` (Unchecked) | `[x] Label` (Checked)
- `Radio`     : `( ) Label` (Unselected) | `(•) Label` (Selected)
- `Toggle`    : `(o─)` (Off) | `(─o)` (On)
- `Icon/Img`  : `{icon:name}` | `[IMG: label]`

## 5. Development & Testing Protocol
- Write unit tests in `tests/` for every AST mutation and bitmask edge case before touching `src/editor/`.
- Snapshot tests must assert exact multi-line UTF-8 string equality.
- Run `npm test` and `npm run typecheck` after every file edit.
