import { RuleTester } from "eslint";
import rule from "../react-usememo-required";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
});

ruleTester.run("useMemo", rule, {
  valid: [
    {
      code: `const Component = () => {
      const myObject = React.useMemo(() => ({}), []);
      return <Child prop={myObject} />;
    }`,
    },
    {
      code: `const Component = () => {
      const myArray = useMemo(() => [], []);
      return <Child prop={myArray} />;
    }`,
    },
    {
      code: `const Component = () => {
      const myArray = React.useMemo(() => new Object(), []);
      return <Child prop={myArray} />;
    }`,
    },
    {
      code: `const Component = () => {
        const myObject = {};
        return <div prop={myObject} />;
      }`,
    },
    {
      code: `const Component = () => {
        const myArray = [];
        return <div prop={myArray} />;
      }`,
    },
  ],
  invalid: [
    {
      code: `const Component = () => {
        const myObject = {};
        return <Child prop={myObject} />;
      }`,
      errors: [{ messageId: "usememo-required" }],
    },
    {
      code: `const Component = () => {
        const myArray = [];
        return <Child prop={myArray} />;
      }`,
      errors: [{ messageId: "usememo-required" }],
    },
    {
      code: `const Component = () => {
        const myInstance = new Object();
        return <Child prop={myInstance} />;
      }`,
      errors: [{ messageId: "usememo-required" }],
    },
    {
      code: `const Component = () => {
        let myObject = useMemo({});
        myObject = {a: 'b'};
        return <Child prop={myObject} />;
      }`,
      errors: [{ messageId: "usememo-const-required" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={{}} />;
      }`,
      errors: [{ messageId: "usememo-required" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={[]} />;
      }`,
      errors: [{ messageId: "usememo-required" }],
    },
    {
      code: `const Component = () => {
      const myObject = memoize({});
      return <Child prop={myObject} />;
    }`,
      errors: [{ messageId: "usememo-required" }],
    },
    {
      code: `const Component = () => {
      const myArray = lodash.memoize([]);
      return <Child prop={myArray} />;
    }`,
      errors: [{ messageId: "usememo-required" }],
    },
  ],
});
