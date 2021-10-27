import { Rule } from "eslint";
import { TSESTree } from "@typescript-eslint/types";

const componentNameRegex = /^[^a-z]/;

export function isComplexComponent(node: TSESTree.JSXOpeningElement) {
  if (node.type !== "JSXOpeningElement") return false;
  if (node.name.type !== "JSXIdentifier") return false;
  return componentNameRegex.test(node.name.name);
}

export enum MemoStatus {
  Memoized,
  UnmemoizedObject,
  UnmemoizedArray,
  UnmemoizedNew,
  UnmemoizedFunction,
  UnmemoizedFunctionCall,
  UnmemoizedJSX,
  UnmemoizedOther,
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

function getIdentifierMemoStatus(
  context: Rule.RuleContext,
  { name }: TSESTree.Identifier
): MemoStatus {
  const variable = context.getScope().variables.find((v) => v.name === name);
  if (variable === undefined) return MemoStatus.Memoized;
  const [{ node }] = variable.defs;
  if (node.type !== "VariableDeclarator") return MemoStatus.Memoized;
  if (node.parent.kind === "let") {
    context.report({ node, messageId: "usememo-const" });
    if (!node.init) {
      // Rely on usememo-const reported error to fail this identifier
      return MemoStatus.Memoized;
    }
  }
  return getExpressionMemoStatus(context, node.init);
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
    case "BinaryExpression":
      return MemoStatus.Memoized;
    default:
      return MemoStatus.UnmemoizedOther;
  }
}
