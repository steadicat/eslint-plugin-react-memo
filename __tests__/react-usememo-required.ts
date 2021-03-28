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
      errors: [{ messageId: "object-usememo-props" }],
    },
    {
      code: `const Component = () => {
        const myArray = [];
        return <Child prop={myArray} />;
      }`,
      errors: [{ messageId: "array-usememo-props" }],
    },
    {
      code: `const Component = () => {
        const myInstance = new Object();
        return <Child prop={myInstance} />;
      }`,
      errors: [{ messageId: "instance-usememo-props" }],
    },
    {
      code: `const Component = () => {
        let myObject = useMemo({});
        myObject = {a: 'b'};
        return <Child prop={myObject} />;
      }`,
      errors: [{ messageId: "usememo-const" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={{}} />;
      }`,
      errors: [{ messageId: "object-usememo-props" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={[]} />;
      }`,
      errors: [{ messageId: "array-usememo-props" }],
    },
    {
      code: `const Component = () => {
      const myObject = memoize({});
      return <Child prop={myObject} />;
    }`,
      errors: [{ messageId: "object-usememo-props" }],
    },
    {
      code: `const Component = () => {
      const myArray = lodash.memoize([]);
      return <Child prop={myArray} />;
    }`,
      errors: [{ messageId: "array-usememo-props" }],
    },
    {
      code: `const Component = () => {
      const myArray1 = [];
      const myArray2 = React.useMemo(() => myArray1, [myArray1]);
      return <Child prop={myArray2} />;
    }`,
      errors: [{ messageId: "array-usememo-deps" }],
    },
  ],
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
  ],
  invalid: [
    {
      code: `const Component = () => {
        const myFn = function myFn() {};
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "function-usecallback-props" }],
    },
    {
      code: `const Component = () => {
        const myFn = () => {};
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "function-usecallback-props" }],
    },
    {
      code: `const Component = () => {
        let myFn = useCallback(() => ({}));
        myFn = () => ({});
        return <Child prop={myFn} />;
      }`,
      errors: [{ messageId: "usecallback-const" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={() => {}} />;
      }`,
      errors: [{ messageId: "function-usecallback-props" }],
    },
    {
      code: `const Component = () => {
        return <Child prop={() => []} />;
      }`,
      errors: [{ messageId: "function-usecallback-props" }],
    },
    {
      code: `const Component = () => {
      const myFn = memoize(() => {});
      return <Child prop={myFn} />;
    }`,
      errors: [{ messageId: "function-usecallback-props" }],
    },
    {
      code: `const Component = () => {
      const myFn = lodash.memoize(() => []);
      return <Child prop={myFn} />;
    }`,
      errors: [{ messageId: "function-usecallback-props" }],
    },
    {
      code: `const Component = () => {
      const myFn1 = () => [];
      const myFn2 = React.useCallback(() => myFn1, [myFn1]);
      return <Child prop={myFn2} />;
      }`,
      errors: [{ messageId: "function-usecallback-deps" }],
    },
  ],
});
