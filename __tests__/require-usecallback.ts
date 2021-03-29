import { RuleTester } from "eslint";
import rule from "../require-usememo";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
});

ruleTester.run("useCallback", rule, {
  valid: [
    {
      code: `const Component = () => {
        const myFn = React.useCallback(function() {}, []);
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = useCallback(() => {}, []);
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = function() {};
        return <div prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = () => {};
        return <div prop={myFn} />;
      }`,
    },
    {
      code: `
      const myFn = () => {};
      const Component = () => {
        return <div prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn1 = useCallback(() => [], []);
        const myFn2 = React.useCallback(() => myFn1, [myFn1]);
        return <Child prop={myFn2} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = memoize(() => {});
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = lodash.memoize(() => []);
        return <Child prop={myFn} />;
      }`,
    },
  ],
  invalid: [
    {
      code: `const Component = () => {
        function myFn() {};
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "function-usecallback-props" }],
      output: `const Component = () => {
        const myFn = React.useCallback(function myFn() {}, []);
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = () => {};
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "function-usecallback-props" }],
      output: `const Component = () => {
        const myFn = React.useCallback(() => {}, []);
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        let myFn = useCallback(() => ({}));
        myFn = () => ({});
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "usememo-const" }],
      output: `const Component = () => {
        const myFn = useCallback(() => ({}));
        myFn = () => ({});
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const prop = () => {};
        return <Child prop={prop} />;
      }`,
      errors: [{ messageId: "function-usecallback-props" }],
      output: `const Component = () => {
        const prop = React.useCallback(() => {}, []);
        return <Child prop={prop} />;
      }`,
    },
    {
      code: `const Component = () => (
        <Child prop={() => []} />
      )`,
      errors: [{ messageId: "function-usecallback-props" }],
      output: `const Component = () => {
        const prop = React.useCallback(() => [], []);
        return <Child prop={() => []} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = memoize(() => {});
        return <Child prop={myFn} />;
      }`,
      options: [{ strict: true }],
      errors: [{ messageId: "unknown-usememo-props" }],
      output: `const Component = () => {
        const myFn = React.useMemo(() => memoize(() => {}), []);
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn = lodash.memoize(() => []);
        return <Child prop={myFn} />;
      }`,
      options: [{ strict: true }],
      errors: [{ messageId: "unknown-usememo-props" }],
      output: `const Component = () => {
        const myFn = React.useMemo(() => lodash.memoize(() => []), []);
        return <Child prop={myFn} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myFn1 = () => [];
        const myFn2 = React.useCallback(() => myFn1, [myFn1]);
        return <Child prop={myFn2} />;
      }`,
      errors: [{ messageId: "function-usecallback-deps" }],
      output: `const Component = () => {
        const myFn1 = React.useCallback(() => [], []);
        const myFn2 = React.useCallback(() => myFn1, [myFn1]);
        return <Child prop={myFn2} />;
      }`,
    },
  ],
});
