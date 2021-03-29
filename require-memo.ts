import { Rule } from "eslint";
import * as ESTree from "estree";
import * as path from "path";

const componentNameRegex = /^[^a-z]/;

function isMemoCallExpression(node: Rule.Node) {
  if (node.type !== "CallExpression") return false;
  if (node.callee.type === "MemberExpression") {
    const {
      callee: { object, property },
    } = node;
    if (
      object.type === "Identifier" &&
      property.type === "Identifier" &&
      object.name === "React" &&
      property.name === "memo"
    ) {
      return true;
    }
  } else if (node.callee.type === "Identifier" && node.callee.name === "memo") {
    return true;
  }

  return false;
}

function wrapInMemo(node: { range?: [number, number] } | null | undefined) {
  if (node === null || node === undefined) return () => [];
  const { range } = node;
  if (range === undefined) return () => [];
  return (fixer: Rule.RuleFixer): Rule.Fix[] => [
    fixer.insertTextBeforeRange(range, "React.memo("),
    fixer.insertTextAfterRange(range, ")"),
  ];
}

function checkFunction(
  context: Rule.RuleContext,
  node: (
    | ESTree.ArrowFunctionExpression
    | ESTree.FunctionExpression
    | ESTree.FunctionDeclaration
  ) &
    Rule.NodeParentExtension
) {
  function report(
    node: Rule.Node,
    messageId: keyof typeof messages,
    fix: (fixer: Rule.RuleFixer) => Rule.Fix[]
  ) {
    context.report({ node, messageId: messageId as string, fix });
  }

  let currentNode = node.parent;
  while (currentNode.type === "CallExpression") {
    if (isMemoCallExpression(currentNode)) {
      return;
    }

    currentNode = currentNode.parent;
  }

  if (currentNode.type === "VariableDeclarator") {
    const { id, init } = currentNode;
    if (id.type === "Identifier") {
      if (componentNameRegex.test(id.name)) {
        report(node, "memo-required", wrapInMemo(init));
      }
    }
  } else if (
    node.type === "FunctionDeclaration" &&
    currentNode.type === "Program"
  ) {
    const { id, range } = node;
    if (id !== null && componentNameRegex.test(id.name)) {
      report(node, "memo-required", (fixer) =>
        range !== undefined
          ? [
              fixer.insertTextBeforeRange(
                range,
                `const ${id.name} = React.memo(`
              ),
              fixer.insertTextAfterRange(range, ")"),
            ]
          : []
      );
    } else {
      if (context.getFilename() === "<input>") return;
      const filename = path.basename(context.getFilename());
      if (componentNameRegex.test(filename)) {
        report(node, "memo-required", wrapInMemo(node));
      }
    }
  }
}

const messages = {
  "memo-required": "Component definition not wrapped in React.memo()",
};

const rule: Rule.RuleModule = {
  meta: { messages, fixable: "code" },
  create: (context) => ({
    ArrowFunctionExpression(node) {
      checkFunction(context, node);
    },
    FunctionDeclaration(node) {
      checkFunction(context, node);
    },
    FunctionExpression(node) {
      checkFunction(context, node);
    },
  }),
};

export default rule;
