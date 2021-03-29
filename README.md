# eslint-plugin-react-memo

Enforce that all function components are wrapped in `React.memo`, and that all props and deps are wrapped in `useMemo`/`useCallback` so they don’t break memo.

Rationale: [Why we memo all the things](https://attardi.org/why-we-memo-all-the-things/).

## Rules

- `require-memo`: Requires all function components to be wrapped in `React.memo()`.
- `require-usememo`: Requires complex values (objects, arrays, functions, and JSX) that get passed props or referenced as a hook dependency to be wrapped in `React.useMemo()` or `React.useCallback()`.
- `require-usememo-children` (**ADVANCED**): Requires complex values (objects, arrays, functions, and JSX) that get passed as children to be wrapped in `React.useMemo()` or `React.useCallback()`.
