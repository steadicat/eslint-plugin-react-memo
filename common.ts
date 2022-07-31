import { Rule } from "eslint";
import { TSESTree } from "@typescript-eslint/types";
import * as ESTree from "estree";

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
  expression: TSESTree.Identifier
): MemoStatus {
  const node = findDefinition(context, expression);
  if (!node) return MemoStatus.Memoized;
  if (node.type !== "VariableDeclarator") return MemoStatus.Memoized;
  const {
    kind,
    range: [start],
  } = node.parent as TSESTree.VariableDeclaration;
  if (kind === "let") {
    context.report({
      node: node as ESTree.Node,
      messageId: "usememo-const",
      fix: (fixer) => [
        fixer.replaceTextRange(
          [start, start + kind.length] as [number, number],
          "const"
        ),
      ],
    });
  }
  return getExpressionMemoStatus(context, node.init!);
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

function findDefinition(
  context: Rule.RuleContext,
  expression: TSESTree.Expression
) {
  if (expression.type !== "Identifier") return null;
  const { name } = expression;
  const variable = context.getScope().variables.find((v) => v.name === name);
  if (variable === undefined) return null;
  const [{ node }] = variable.defs;
  return node as TSESTree.VariableDeclarator;
}

export function findInit(
  context: Rule.RuleContext,
  expression: TSESTree.Expression
) {
  const def = findDefinition(context, expression);
  if (def !== null) return def.init;
  return expression;
}
