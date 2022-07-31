import { Rule } from "eslint";
import * as ESTree from "estree";
import { TSESTree } from "@typescript-eslint/types";
import {
  findInit,
  getExpressionMemoStatus,
  isComplexComponent,
  MemoStatus,
} from "./common";

const hookNameRegex = /^use[A-Z0-9].*$/;

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

function wrapInUseMemo(
  context: Rule.RuleContext,
  expression: TSESTree.Expression | null | undefined
) {
  if (expression === null || expression === undefined) return () => [];
  const init = findInit(context, expression);
  if (!init) return () => [];
  const { range } = init;
  if (range === undefined) return () => [];
  return (fixer: Rule.RuleFixer): Rule.Fix[] => [
    fixer.insertTextBeforeRange(range, "React.useMemo(() => "),
    fixer.insertTextAfterRange(range, ", [])"),
  ];
}

function wrapInUseCallback(
  context: Rule.RuleContext,
  expression: TSESTree.Expression | null | undefined
) {
  if (expression === null || expression === undefined) return () => [];
  const init = findInit(context, expression);
  if (!init) return () => [];
  const { range } = init;
  if (range === undefined) return () => [];
  return (fixer: Rule.RuleFixer): Rule.Fix[] => [
    fixer.insertTextBeforeRange(range, "React.useCallback("),
    fixer.insertTextAfterRange(range, ", [])"),
  ];
}

const messages = {
  "object-usememo-props":
    "Object literal should be wrapped in React.useMemo() when used as a prop",
  "object-usememo-deps":
    "Object literal should be wrapped in React.useMemo() when used as a hook dependency",
  "array-usememo-props":
    "Array literal should be wrapped in React.useMemo() when used as a prop",
  "array-usememo-deps":
    "Array literal should be wrapped in React.useMemo() when used as a hook dependency",
  "instance-usememo-props":
    "Object instantiation should be wrapped in React.useMemo() when used as a prop",
  "instance-usememo-deps":
    "Object instantiation should be wrapped in React.useMemo() when used as a hook dependency",
  "jsx-usememo-props":
    "JSX should be wrapped in React.useMemo() when used as a prop",
  "jsx-usememo-deps":
    "JSX should be wrapped in React.useMemo() when used as a hook dependency",
  "function-usecallback-props":
    "Function definition should be wrapped in React.useCallback() when used as a prop",
  "function-usecallback-deps":
    "Function definition should be wrapped in React.useCallback() when used as a hook dependency",
  "unknown-usememo-props":
    "Unknown value may need to be wrapped in React.useMemo() when used as a prop",
  "unknown-usememo-deps":
    "Unknown value may need to be wrapped in React.useMemo() when used as a hook dependency",
  "usememo-const":
    "useMemo/useCallback return value should be assigned to a const to prevent reassignment",
};

const rule: Rule.RuleModule = {
  meta: {
    messages,
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: { strict: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    function report(
      node: Rule.Node,
      messageId: keyof typeof messages,
      fix: (fixer: Rule.RuleFixer) => Rule.Fix[]
    ) {
      context.report({ node, messageId: messageId as string, fix });
    }

    return {
      JSXAttribute: (node: ESTree.Node & Rule.NodeParentExtension) => {
        const { parent, value } = (node as unknown) as TSESTree.JSXAttribute &
          Rule.NodeParentExtension;
        if (value === null) return;
        if (!isComplexComponent(parent)) return;
        if (value.type === "JSXExpressionContainer") {
          const { expression } = value;
          if (expression.type !== "JSXEmptyExpression") {
            switch (getExpressionMemoStatus(context, expression)) {
              case MemoStatus.UnmemoizedObject:
                report(
                  node,
                  "object-usememo-props",
                  wrapInUseMemo(context, expression)
                );
                break;
              case MemoStatus.UnmemoizedArray:
                report(
                  node,
                  "array-usememo-props",
                  wrapInUseMemo(context, expression)
                );
                break;
              case MemoStatus.UnmemoizedNew:
                report(
                  node,
                  "instance-usememo-props",
                  wrapInUseMemo(context, expression)
                );
                break;
              case MemoStatus.UnmemoizedFunction:
                report(
                  node,
                  "function-usecallback-props",
                  wrapInUseCallback(context, expression)
                );
                break;
              case MemoStatus.UnmemoizedFunctionCall:
              case MemoStatus.UnmemoizedOther:
                if (context.options?.[0]?.strict) {
                  report(
                    node,
                    "unknown-usememo-props",
                    wrapInUseMemo(context, expression)
                  );
                }
                break;
              case MemoStatus.UnmemoizedJSX:
                report(
                  node,
                  "jsx-usememo-props",
                  wrapInUseMemo(context, expression)
                );
                break;
            }
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
              switch (getExpressionMemoStatus(context, dep)) {
                case MemoStatus.UnmemoizedObject:
                  report(
                    node,
                    "object-usememo-deps",
                    wrapInUseMemo(context, dep)
                  );
                  break;
                case MemoStatus.UnmemoizedArray:
                  report(
                    node,
                    "array-usememo-deps",
                    wrapInUseMemo(context, dep)
                  );
                  break;
                case MemoStatus.UnmemoizedNew:
                  report(
                    node,
                    "instance-usememo-deps",
                    wrapInUseMemo(context, dep)
                  );
                  break;
                case MemoStatus.UnmemoizedFunction:
                  report(
                    node,
                    "function-usecallback-deps",
                    wrapInUseCallback(context, dep)
                  );
                  break;
                case MemoStatus.UnmemoizedFunctionCall:
                case MemoStatus.UnmemoizedOther:
                  if (context.options?.[0]?.strict) {
                    report(
                      node,
                      "unknown-usememo-deps",
                      wrapInUseMemo(context, dep)
                    );
                  }
                  break;
                case MemoStatus.UnmemoizedJSX:
                  report(node, "jsx-usememo-deps", wrapInUseMemo(context, dep));
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
