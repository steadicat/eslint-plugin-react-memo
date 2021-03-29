import { RuleTester } from "eslint";
import rule from "../require-usememo-children";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
});

ruleTester.run("useMemo children", rule, {
  valid: [
    {
      code: `const Component = () => {
        const children = React.useMemo(() => <div><Grandchild /></div>, []);
        return <Child>{children}</Child>;
      }`,
    },
    {
      code: `const Component = () => {
        return <div><Child /></div>;
      }`,
    },
    {
      code: `const Component = () => {
        const renderFn = React.useCallback(() => <div><Grandchild /></div>, []);
        return <Child>{renderFn}</Child>;
      }`,
    },
  ],
  invalid: [
    {
      code: `const Component = () => {
        const grandchildren = React.useMemo(() => <div><Grandchild /></div>, []);
        return <Child>
          <>
            {grandchildren}
          </>
        </Child>;
      }`,
      errors: [{ messageId: "jsx-usememo-children" }],
      output: `const Component = () => {
        const grandchildren = React.useMemo(() => <div><Grandchild /></div>, []);
        const children = React.useMemo(() => <>
          {grandchildren}
        </>, []);
        return <Child>
          {children}
        </Child>;
      }`,
    },
    {
      code: `const Component = () => {
        const children = <div />;
        return <Child>{children}</Child>
      }`,
      errors: [{ messageId: "jsx-usememo-children" }],
      output: `const Component = () => {
        const children = React.useMemo(() => <div />, []);
        return <Child>{children}</Child>
      }`,
    },
    {
      code: `const Component = () => {
        const children = [<div />, <Child1 />, <Child2 />];
        return <Child>{children}</Child>
      }`,
      errors: [{ messageId: "array-usememo-children" }],
      output: `const Component = () => {
        const children = React.useMemo(() => [<div />, <Child1 />, <Child2 />], []);
        return <Child>{children}</Child>
      }`,
    },
    {
      code: `const Component = () => (
        <Child>
          {() => <div />}
        </Child>
      )`,
      errors: [{ messageId: "function-usecallback-children" }],
      output: `const Component = () => {
        const children = React.useCallback(() => <div />, []);
        return <Child>
          {children}
        </Child>
      }`,
    },
  ],
});
