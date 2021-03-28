import { Rule } from "eslint";
import { TSESTree } from "@typescript-eslint/types";

const componentNameRegex = /^[A-Z]/;

function isComplexComponent(node: TSESTree.JSXOpeningElement) {
  if (node.type !== "JSXOpeningElement") return false;
  if (node.name.type !== "JSXIdentifier") return false;
  return componentNameRegex.test(node.name.name);
}

function isUseCallbackCallExpression(node: Rule.Node) {
  if (node.type !== "CallExpression") return false;
  if (node.callee.type === "MemberExpression") {
    const {
      callee: { object, property },
    } = node;
    if (
      object.type === "Identifier" &&
      property.type === "Identifier" &&
      object.name === "React" &&
      property.name === "useCallback"
    ) {
      return true;
    }
  } else if (
    node.callee.type === "Identifier" &&
    node.callee.name === "useCallback"
  ) {
    return true;
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    messages: {
      "usecallback-required":
        "Object definition needs to be wrapped in React.usecallback() if used as a prop",
      "usecallback-const-required":
        "React.usecallback() needs to be assigned to a const to prevent reassignment",
    },
  },
  create: (context) => ({
    JSXAttribute(node) {
      const { parent, value } = node as TSESTree.JSXAttribute &
        Rule.NodeParentExtension;
      if (!isComplexComponent(parent)) return;
      if (value.type === "JSXExpressionContainer") {
        const { expression } = value;

        if (
          expression.type === "FunctionExpression" ||
          expression.type === "ArrowFunctionExpression"
        ) {
          context.report({ node: node, messageId: "usecallback-required" });
          return;
        }

        if (expression.type === "Identifier") {
          const { name } = expression;
          const variable = context
            .getScope()
            .variables.find((v) => v.name === name);
          const [{ node }] = variable.defs;
          if (node.type === "VariableDeclarator") {
            const { init, parent } = node;

            if (parent.kind === "let") {
              context.report({
                node: node,
                messageId: "usecallback-const-required",
              });
            }

            let currentNode = init;
            while (currentNode.type === "CallExpression") {
              if (isUseCallbackCallExpression(currentNode)) {
                return;
              }
              currentNode = currentNode.arguments[0];
            }

            if (
              currentNode.type === "FunctionExpression" ||
              "ArrowFunctionExpression"
            ) {
              context.report({
                node: currentNode,
                messageId: "usecallback-required",
              });
            }
          }
        }
      }
    },
  }),
};

export default rule;
