import { Rule } from "eslint";
import * as ESTree from "estree";
import { TSESTree } from "@typescript-eslint/types";
import { getExpressionMemoStatus, MemoStatus } from "./common";

const componentNameRegex = /^[^a-z]/;
const hookNameRegex = /^use[A-Z0-9].*$/;

function isComplexComponent(node: TSESTree.JSXOpeningElement) {
  if (node.type !== "JSXOpeningElement") return false;
  if (node.name.type !== "JSXIdentifier") return false;
  return componentNameRegex.test(node.name.name);
}

const messages = {
  "jsx-usememo-children":
    "JSX needs to be wrapped in React.useMemo() when used as children",
  "object-usememo-children":
    "Object definition needs to be wrapped in React.useMemo() if used as children",
  "array-usememo-children":
    "Array definition needs to be wrapped in React.useMemo() if used as children",
  "instance-usememo-children":
    "Object instantiation needs to be wrapped in React.useMemo() if used as children",
  "function-usecallback-children":
    "Function definition needs to be wrapped in React.useCallback() if used as children",
  "unknown-usememo-children":
    "Unknown value may need to be wrapped in React.useMemo() if used as children",
  "usememo-const":
    "React.useMemo()/React.useCallback() should be assigned to a const to prevent reassignment",
};

const rule: Rule.RuleModule = {
  meta: { messages },
  create: (context) => {
    function report(node: Rule.Node, messageId: keyof typeof messages) {
      context.report({ node, messageId: messageId as string });
    }

    return {
      JSXElement: (node: ESTree.Node & Rule.NodeParentExtension) => {
        const {
          children,
          openingElement,
        } = (node as unknown) as TSESTree.JSXElement & Rule.NodeParentExtension;
        if (!isComplexComponent(openingElement)) return;

        for (const child of children) {
          if (child.type === "JSXElement" || child.type === "JSXFragment") {
            report(node, "jsx-usememo-children");
            return;
          }
          if (child.type === "JSXExpressionContainer") {
            const { expression } = child;
            if (expression.type !== "JSXEmptyExpression") {
              switch (getExpressionMemoStatus(context, expression)) {
                case MemoStatus.UnmemoizedObject:
                  report(node, "object-usememo-children");
                  break;
                case MemoStatus.UnmemoizedArray:
                  report(node, "array-usememo-children");
                  break;
                case MemoStatus.UnmemoizedNew:
                  report(node, "instance-usememo-children");
                  break;
                case MemoStatus.UnmemoizedFunction:
                  report(node, "function-usecallback-children");
                  break;
                case MemoStatus.UnmemoizedFunctionCall:
                  report(node, "unknown-usememo-children");
                  break;
                case MemoStatus.UnmemoizedJSX:
                  report(node, "jsx-usememo-children");
                  break;
              }
            }
          }
        }
      },
    };
  },
};

export default rule;
