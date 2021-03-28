import { Rule } from "eslint";
import * as ESTree from "estree";
import { TSESTree } from "@typescript-eslint/types";

const componentNameRegex = /^[^a-z]/;

function isComplexComponent(node: TSESTree.JSXOpeningElement) {
  if (node.type !== "JSXOpeningElement") return false;
  if (node.name.type !== "JSXIdentifier") return false;
  return componentNameRegex.test(node.name.name);
}

function isUseMemoCallExpression(node: Rule.Node) {
  if (node.type !== "CallExpression") return false;
  if (node.callee.type === "MemberExpression") {
    const {
      callee: { object, property },
    } = node;
    if (
      object.type === "Identifier" &&
      property.type === "Identifier" &&
      object.name === "React" &&
      property.name === "useMemo"
    ) {
      return true;
    }
  } else if (
    node.callee.type === "Identifier" &&
    node.callee.name === "useMemo"
  ) {
    return true;
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    messages: {
      "usememo-required":
        "Object definition needs to be wrapped in React.useMemo() if used as a prop",
      "usememo-const-required":
        "React.useMemo() needs to be assigned to a const to prevent reassignment",
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

        if (
          expression.type === "ObjectExpression" ||
          expression.type === "ArrayExpression" ||
          expression.type === "NewExpression"
        ) {
          context.report({ node: node, messageId: "usememo-required" });
          return;
        }

        if (expression.type === "Identifier") {
          const { name } = expression;
          const variable = context
            .getScope()
            .variables.find((v) => v.name === name);
          if (variable === undefined) return;
          const [{ node }] = variable.defs;
          if (node.type === "VariableDeclarator") {
            const { init, parent } = node;

            if (parent.kind === "let") {
              context.report({
                node: node,
                messageId: "usememo-const-required",
              });
            }

            let currentNode = init;
            while (currentNode.type === "CallExpression") {
              if (isUseMemoCallExpression(currentNode)) {
                return;
              }
              currentNode = currentNode.arguments[0];
            }

            if (
              currentNode.type === "ObjectExpression" ||
              currentNode.type === "ArrayExpression" ||
              currentNode.type === "NewExpression"
            ) {
              context.report({
                node: currentNode,
                messageId: "usememo-required",
              });
            }
          }
        }
      }
    },
  }),
};

export default rule;
