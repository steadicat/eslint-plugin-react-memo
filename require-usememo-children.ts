import { Rule } from "eslint";
import * as ESTree from "estree";
import { TSESTree } from "@typescript-eslint/types";
import {
  getExpressionMemoStatus,
  isComplexComponent,
  MemoStatus,
} from "./common";

const componentNameRegex = /^[^a-z]/;
const hookNameRegex = /^use[A-Z0-9].*$/;

const messages = {
  "object-usememo-children":
    "Object literal should be wrapped in React.useMemo() when used as children",
  "array-usememo-children":
    "Array literal should be wrapped in React.useMemo() when used as children",
  "instance-usememo-children":
    "Object instantiation should be wrapped in React.useMemo() when used as children",
  "jsx-usememo-children":
    "JSX should be wrapped in React.useMemo() when used as children",
  "function-usecallback-children":
    "Function definition should be wrapped in React.useCallback() when used as children",
  "unknown-usememo-children":
    "Unknown value may need to be wrapped in React.useMemo() when used as children",
  "usememo-const":
    "useMemo/useCallback return value should be assigned to a const to prevent reassignment",
};

const rule: Rule.RuleModule = {
  meta: {
    messages,
    schema: [
      {
        type: "object",
        properties: { strict: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
  },
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
                case MemoStatus.UnmemoizedOther:
                  if (context.options?.[0]?.strict) {
                    report(node, "unknown-usememo-children");
                  }
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
