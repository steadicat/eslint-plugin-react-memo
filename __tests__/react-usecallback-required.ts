import { RuleTester } from "eslint";
import rule from "../react-usecallback-required";

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
  ],
  invalid: [
    {
      code: `const Component = () => {
        const myFn = function myFn() {};
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "usecallback-required" }],
    },
    {
      code: `const Component = () => {
        const myFn = () => {};
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "usecallback-required" }],
    },
    {
      code: `const Component = () => {
        let myFn = useCallback(() => ({}));
        myFn = () => ({});
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "usecallback-const-required" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={() => {}} />;
      }`,
      errors: [{ messageId: "usecallback-required" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={() => []} />;
      }`,
      errors: [{ messageId: "usecallback-required" }],
    },
    {
      code: `const Component = () => {
      const myFn = memoize({});
      return <Child prop={myFn} />;
    }`,
      errors: [{ messageId: "usecallback-required" }],
    },
    {
      code: `const Component = () => {
      const myFn = lodash.memoize([]);
      return <Child prop={myFn} />;
    }`,
      errors: [{ messageId: "usecallback-required" }],
    },
  ],
});
