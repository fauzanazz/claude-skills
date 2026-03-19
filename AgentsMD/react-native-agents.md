# React Native / Expo AGENTS.md Template

Use this template for projects built with **Expo + React Native + TypeScript + Expo Router**.

Populate each section by inspecting the actual project. Replace `{placeholders}` with real values.

---

## Template

```markdown
# AGENTS.md

Instructions for AI agents working on this codebase.

## Stack

Expo {sdk_version}, React Native {rn_version}, React {react_version}, TypeScript, Expo Router

## Commands

\```bash
{pkg} start              # Start Expo dev server
{pkg} run android        # Run on Android device/emulator
{pkg} run ios            # Run on iOS device/simulator
{pkg} run web            # Run in browser
{pkg} lint               # Lint
\```

> **Package manager:** Use `{npm|bun|yarn}`. Never use {alternatives}.
>
> **CRITICAL:** Never run `expo eject` or `expo prebuild` unless explicitly asked.

## Structure

\```
app/                       # Expo Router (file-based routing)
├── _layout.tsx            # Root layout (providers, navigation shell)
├── (tabs)/
│   ├── _layout.tsx        # Tab navigator
│   └── index.tsx          # Home screen
├── {feature}/
│   ├── index.tsx          # Feature list screen
│   ├── create.tsx         # Create screen
│   └── [id]/
│       ├── index.tsx      # Detail screen
│       └── {action}.tsx   # Action screens
components/
├── ui/                    # Shared primitives (themed wrappers, icons)
├── {domain}/              # Domain-grouped components
│   └── index.ts           # Barrel export
hooks/
├── use{Feature}.ts        # Reactive data hooks
└── use{Feature}Operations.ts  # Mutation/CRUD hooks
{data_layer}/              # db/, store/, or services/
├── schema.ts              # Data schema
├── models/                # Data models
│   └── index.ts           # Barrel export
utils/                     # Pure helper functions
constants/                 # Theme, config, business constants
assets/                    # Images, fonts, splash screen
\```

## Routing (Expo Router)

File-based routing in `app/`:

| File Pattern | Route |
|-------------|-------|
| `app/index.tsx` | `/` |
| `app/{name}/index.tsx` | `/{name}` |
| `app/{name}/[id]/index.tsx` | `/{name}/{id}` |
| `app/{name}/_layout.tsx` | Layout wrapper for `/{name}/*` |
| `app/(tabs)/_layout.tsx` | Tab navigator |
| `app/modal.tsx` | Modal screen (`presentation: 'modal'`) |

**Navigation:**
- Use `router.push('/path')` for forward navigation
- Use `router.back()` to go back
- Pass params via route: `router.push(\`/items/\${id}\`)`
- Pass complex data via search params or serialized JSON

**Root layout provider stack:**
\```
DatabaseProvider → ThemeProvider → Stack Navigator
\```

## Component Conventions

### Themed Primitives

Use themed wrapper components instead of raw React Native primitives:

\```typescript
<ThemedText type="title">Heading</ThemedText>
<ThemedView style={styles.container}>...</ThemedView>
\```

Variant types: `default`, `title`, `subtitle`, `defaultSemiBold`, `link`

### Domain Component Groups

Group components by feature domain with **barrel exports**:

\```
components/{domain}/
├── index.ts              # export { FeatureCard } from './FeatureCard';
├── FeatureCard.tsx
├── FeatureRow.tsx
└── FeatureChip.tsx
\```

### Platform-Specific Files

When behavior differs between platforms, use platform suffixes:

| File | Resolves On |
|------|-------------|
| `Component.tsx` | All platforms (default) |
| `Component.ios.tsx` | iOS only |
| `Component.android.tsx` | Android only |
| `Component.web.tsx` | Web only |
| `Component.native.tsx` | iOS + Android (not web) |

React Native resolves the most specific file automatically. **Always provide a default fallback.**

## Data Layer

### Option A: Local Database (WatermelonDB)

\```typescript
// Model with decorators
class Item extends Model {
  static table = 'items';
  @field('name') name!: string;
  @date('created_at') createdAt!: Date;
  @children('sub_items') subItems!: Query<SubItem>;
}
\```

**Conventions:**
- Schema in `db/schema.ts` with version tracking
- Models use decorators: `@field`, `@text`, `@date`, `@children`, `@relation`, `@readonly`
- Platform-specific init: `db/index.ts` (web) + `db/index.native.ts` (native with JSI)
- Context provider wraps the app: `<DatabaseProvider>`
- All writes inside `database.write()` transactions

### Option B: Remote API + Zustand

\```typescript
const useItemStore = create<ItemState>((set) => ({
  items: [],
  fetch: async () => { ... },
  add: async (item) => { ... },
}));
\```

### Reactive Hooks Pattern

\```typescript
// Read hook — subscribes to database changes
function useItems(): Item[] {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const sub = database
      .get<Item>('items')
      .query()
      .observe()
      .subscribe(setItems);
    return () => sub.unsubscribe();
  }, []);
  return items;
}

// Mutation hook — encapsulates write operations
function useItemOperations() {
  const createItem = useCallback(async (name: string) => {
    await database.write(async () => {
      await database.get<Item>('items').create((item) => {
        item.name = name;
      });
    });
  }, []);
  return { createItem };
}
\```

## Styling

- Use `StyleSheet.create()` for styles — not inline style objects
- Theme colors from `constants/theme.ts` (light/dark palettes)
- Access theme via `useColorScheme()` or `useThemeColor()` hooks
- Platform-specific fonts in constants (`Platform.select({ ios: ..., android: ... })`)

## TypeScript

- `strict: true`
- `experimentalDecorators: true` (required for WatermelonDB or similar ORMs)
- Path alias: `@/*` maps to `"./*"` (project root)
- Extends `expo/tsconfig.base`

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Inline styles everywhere | Use `StyleSheet.create()` |
| DB writes outside transactions | Always wrap in `database.write()` |
| Skip platform-specific files | Use `.ios.tsx` / `.native.ts` when behavior differs |
| Import directly from deep paths | Use barrel exports (`index.ts`) |
| Put business logic in screens | Extract to custom hooks |
| Use `any` for navigation params | Type routes with Expo Router typed routes |
| Hardcode colors | Use theme constants + `useThemeColor()` |
| Skip the loading/error states | Always handle async states in screens |

## Before Committing

1. Run `{pkg} lint`
2. Run `{pkg} start` and verify the app loads
3. Test on at least one platform (iOS or Android)
4. Follow existing patterns in the codebase
```

---

## Customization Notes

When populating this template, inspect the project for:

| Field | Where to Find |
|-------|---------------|
| Expo SDK version | `app.json` → `expo.sdkVersion` or `package.json` → `expo` version |
| React Native version | `package.json` → `react-native` |
| Package manager | Lockfile: `bun.lock`, `yarn.lock`, `package-lock.json` |
| New Architecture | `app.json` → `expo.newArchEnabled` |
| React Compiler | `app.json` → `expo.experiments.reactCompiler` |
| Data layer | Check for `@nozbe/watermelondb` (local DB), `zustand` (state), `@tanstack/react-query` (API) |
| Camera/OCR | Check for `expo-camera`, `react-native-mlkit-ocr` |
| Navigation type | Check `app/(tabs)/_layout.tsx` for tab/drawer/stack configuration |
| Haptics | Check for `expo-haptics` |
| Deep linking | `app.json` → `expo.scheme` |
