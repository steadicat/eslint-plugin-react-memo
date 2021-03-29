import { Rule } from "eslint";
import { TSESTree } from "@typescript-eslint/types";

export enum MemoStatus {
  Memoized,
  UnmemoizedObject,
  UnmemoizedArray,
  UnmemoizedNew,
  UnmemoizedFunction,
  UnmemoizedFunctionCall,
  UnmemoizedJSX,
}

function isCallExpression(
  node: TSESTree.CallExpression,
  name: "useMemo" | "useCallback"
) {
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

export function getExpressionMemoStatus(
  context: Rule.RuleContext,
  expression: TSESTree.Expression
): MemoStatus {
  switch (expression.type) {
    case "ObjectExpression":
      return MemoStatus.UnmemoizedObject;
    case "ArrayExpression":
      return MemoStatus.UnmemoizedArray;
    case "NewExpression":
      return MemoStatus.UnmemoizedNew;
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      return MemoStatus.UnmemoizedFunction;
    case "JSXElement":
      return MemoStatus.UnmemoizedJSX;
    case "CallExpression":
      if (
        isCallExpression(expression, "useMemo") ||
        isCallExpression(expression, "useCallback")
      ) {
        return MemoStatus.Memoized;
      }
      return MemoStatus.UnmemoizedFunctionCall;
    case "Identifier":
      return getIdentifierMemoStatus(context, expression);
    default:
      console.log(expression.type);
      return MemoStatus.Memoized;
  }
}

export function getIdentifierMemoStatus(
  context: Rule.RuleContext,
  { name }: TSESTree.Identifier
): MemoStatus {
  const variable = context.getScope().variables.find((v) => v.name === name);
  if (variable === undefined) return MemoStatus.Memoized;
  const [{ node }] = variable.defs;
  if (node.type !== "VariableDeclarator") return MemoStatus.Memoized;
  if (node.parent.kind === "let") {
    context.report({ node, messageId: "usememo-const" });
  }
  return getExpressionMemoStatus(context, node.init);
}
