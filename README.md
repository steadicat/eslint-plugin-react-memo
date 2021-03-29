# eslint-plugin-react-memo

Enforce that all function components are wrapped in `React.memo`, and that all props are wrapped in `useMemo`/`useCallback` so they don’t break memo.

Rationale: [Why we memo all the things](https://attardi.org/why-we-memo-all-the-things/).

## Rules

- `require-memo`: Requires all function components to be wrapped in `memo()`
- `require-usememo`: Requires complex objects (objects, arrays, instances, and functions) that get passed as a prop to a component or used as a hook dependency to be wrapped in `useMemo()` or `useCallback()`.
