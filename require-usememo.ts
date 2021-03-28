import { Rule } from "eslint";
import * as ESTree from "estree";
import { TSESTree } from "@typescript-eslint/types";

const componentNameRegex = /^[^a-z]/;
const hookNameRegex = /^use[A-Z0-9].*$/;

function isComplexComponent(node: TSESTree.JSXOpeningElement) {
  if (node.type !== "JSXOpeningElement") return false;
  if (node.name.type !== "JSXIdentifier") return false;
  return componentNameRegex.test(node.name.name);
}

function isHook(node: TSESTree.Node) {
  if (node.type === "Identifier") {
    return hookNameRegex.test(node.name);
  } else if (
    node.type === "MemberExpression" &&
    !node.computed &&
    isHook(node.property)
  ) {
    const obj = node.object;
    return obj.type === "Identifier" && obj.name === "React";
  } else {
    return false;
  }
}

function isCallExpression(node: Rule.Node, name: "useMemo" | "useCallback") {
  if (node.type !== "CallExpression") return false;
  if (node.callee.type === "MemberExpression") {
    const {
      callee: { object, property },
    } = node;
    if (
      object.type === "Identifier" &&
      property.type === "Identifier" &&
      object.name === "React" &&
      property.name === name
    ) {
      return true;
    }
  } else if (node.callee.type === "Identifier" && node.callee.name === name) {
    return true;
  }

  return false;
}

function checkIdentifier(
  context: Rule.RuleContext,
  { name }: TSESTree.Identifier,
  isDeps?: boolean
) {
  const variable = context.getScope().variables.find((v) => v.name === name);
  if (variable === undefined) return;
  const [{ node }] = variable.defs;
  if (node.type === "VariableDeclarator") {
    const { init, parent } = node;

    let currentNode = init;
    while (currentNode.type === "CallExpression") {
      if (isCallExpression(currentNode, "useMemo")) {
        if (parent.kind === "let") {
          context.report({ node, messageId: "usememo-const" });
        }
        return;
      } else if (isCallExpression(currentNode, "useCallback")) {
        if (parent.kind === "let") {
          context.report({ node, messageId: "usecallback-const" });
        }
        return;
      }
      currentNode = currentNode.arguments[0];
    }

    checkExpression(context, node, currentNode, isDeps);
  }
}

function checkExpression(
  context: Rule.RuleContext,
  node: Rule.Node,
  expression: TSESTree.Expression,
  isDeps?: boolean
) {
  switch (expression.type) {
    case "ObjectExpression":
      context.report({
        node,
        messageId: isDeps ? "object-usememo-deps" : "object-usememo-props",
      });
      break;
    case "ArrayExpression":
      context.report({
        node,
        messageId: isDeps ? "array-usememo-deps" : "array-usememo-props",
      });
      break;
    case "NewExpression":
      context.report({
        node,
        messageId: isDeps ? "instance-usememo-deps" : "instance-usememo-props",
      });
      break;
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      context.report({
        node,
        messageId: isDeps
          ? "function-usecallback-deps"
          : "function-usecallback-props",
      });
      break;
    case "Identifier":
      checkIdentifier(context, expression, isDeps);
      break;
  }
}

const rule: Rule.RuleModule = {
  meta: {
    messages: {
      "object-usememo-props":
        "Object definition needs to be wrapped in React.useMemo() if used as a prop",
      "object-usememo-deps":
        "Object definition needs to be wrapped in React.useMemo() if used as a hook dependency",
      "array-usememo-props":
        "Array definition needs to be wrapped in React.useMemo() if used as a prop",
      "array-usememo-deps":
        "Array definition needs to be wrapped in React.useMemo() if used as a hook dependency",
      "instance-usememo-props":
        "Object instantiation needs to be wrapped in React.useMemo() if used as a hook dependency",
      "instance-usememo-deps":
        "Object instantiation needs to be wrapped in React.useMemo() if used as a prop",
      "function-usecallback-props":
        "Function definition needs to be wrapped in React.useCallback() if used as a hook dependency",
      "function-usecallback-deps":
        "Function definition needs to be wrapped in React.useCallback() if used as a hook dependency",
      "usememo-const":
        "React.useMemo() should be assigned to a const to prevent reassignment",
      "usecallback-const":
        "React.useCallback() should be assigned to a const to prevent reassignment",
    },
  },
  create: (context) => ({
    JSXAttribute: (node: ESTree.Node & Rule.NodeParentExtension) => {
      const { parent, value } = (node as unknown) as TSESTree.JSXAttribute &
        Rule.NodeParentExtension;
      if (value === null) return;
      if (!isComplexComponent(parent)) return;
      if (value.type === "JSXExpressionContainer") {
        const { expression } = value;
        if (expression.type !== "JSXEmptyExpression") {
          checkExpression(context, node, expression);
        }
      }
    },

    CallExpression: (node) => {
      const { callee } = (node as unknown) as TSESTree.CallExpression &
        Rule.NodeParentExtension;
      if (!isHook(callee)) return;
      const {
        arguments: [, dependencies],
      } = (node as unknown) as TSESTree.CallExpression &
        Rule.NodeParentExtension;
      if (
        dependencies !== undefined &&
        dependencies.type === "ArrayExpression"
      ) {
        for (const dep of dependencies.elements) {
          if (dep !== null && dep.type === "Identifier") {
            checkIdentifier(context, dep, true);
          }
        }
      }
    },
  }),
};

export default rule;
