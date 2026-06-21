# Home composition — ownership map (Foundation 0e)

The Today/home screen is composed by a **foundation-frozen shell** that arranges a set
of child components. To let parallel groups work on home without colliding, the children
are partitioned into two disjoint directories by owner. **The shell is frozen** — it is
owned by neither group and must not be edited during parallel work.

## Directories

| Path | Owner | Rule |
|---|---|---|
| `components/home/rails/*` | **Group A** (article / learn) | A edits only here for home work |
| `components/home/record/*` | **Group D** (moment / record) | D edits only here for home work |
| `components/home/*` (root) | **Frozen shell** | neither group edits |

## Files

### Group A — `home/rails/`
| File | Role |
|---|---|
| `rails/PickUpRail.tsx` | "Pick up where you left off" in-progress reads rail |
| `rails/MostRead.tsx` | "Most read this month" editorial list |
| `rails/CareAndLearning.tsx` | "Care & learning" outward doorways (Find Care / Browse Library) |

### Group D — `home/record/`
| File | Role |
|---|---|
| `record/RecordChart.tsx` | 14-day terrain visualization + mood insight headline |
| `record/ReflectionRow.tsx` | one-time "reflection ready" row on the record well |

### Frozen shell — `home/` (root)
| File | Role |
|---|---|
| `HomeContainer.tsx` | stateful orchestration (state selection, capture sheet, overlays) |
| `HomeView.tsx` | presentational layout; the only file that imports the A/D children |
| `HomeCardSlot.tsx` | bridge / reminder card slot |
| `Mascot.tsx` | route-aware decorative presence |
| `PrimaryAction.tsx` | adaptive check-in CTA |
| `ToolsBento.tsx` | "When you need something now" tool grid |
| `home-card.ts` | card model (React-free) |

Also frozen and out of scope for both groups: `app/(tabs)/(today)/index.tsx` (the route
that renders `HomeContainer`).

## Rules for groups A and D

1. **Stay in your directory.** A edits `home/rails/*`; D edits `home/record/*`. Neither
   touches the other's directory or the root-level shell files.
2. **Do not edit the shell** (`HomeContainer.tsx`, `HomeView.tsx`, the other root files,
   or `(today)/index.tsx`). The shell decides arrangement; that arrangement is frozen by
   Foundation 0e. Adding a *new* home child (new section) is a shell change and therefore
   a coordination point — raise it, don't slip it in.
3. **Import children via `@/components/home/rails/<X>` or `@/components/home/record/<X>`.**
   No `../../../` chains (CLAUDE.md convention #8).
