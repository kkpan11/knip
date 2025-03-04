import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { stripQuotes } from '../../ast-helpers.js';
import { isJS } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';

const isModuleExportsAccess = (node: ts.PropertyAccessExpression) =>
  ts.isIdentifier(node.expression) && node.expression.escapedText === 'module' && node.name.escapedText === 'exports';

export default visit(isJS, node => {
  if (ts.isExpressionStatement(node)) {
    if (ts.isBinaryExpression(node.expression)) {
      if (ts.isPropertyAccessExpression(node.expression.left)) {
        if (
          ts.isPropertyAccessExpression(node.expression.left.expression) &&
          isModuleExportsAccess(node.expression.left.expression)
        ) {
          // Pattern: module.exports.NAME
          const identifier = node.expression.left.name.getText();
          const pos = node.expression.left.name.pos;
          return { node, identifier, type: SymbolType.UNKNOWN, pos };
        } else if (isModuleExportsAccess(node.expression.left)) {
          const expr = node.expression.right;
          if (ts.isObjectLiteralExpression(expr) && expr.properties.every(ts.isShorthandPropertyAssignment)) {
            // Pattern: module.exports = { identifier, identifier2 }
            return expr.properties.map(node => {
              return { node, identifier: node.getText(), type: SymbolType.UNKNOWN, pos: node.pos };
            });
          } else {
            // Pattern: module.exports = any
            return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos: expr.pos };
          }
        }
      } else if (
        ts.isElementAccessExpression(node.expression.left) &&
        ts.isPropertyAccessExpression(node.expression.left.expression) &&
        ts.isIdentifier(node.expression.left.expression.name) &&
        isModuleExportsAccess(node.expression.left.expression)
      ) {
        // Pattern: module.exports['NAME']
        const identifier = stripQuotes(node.expression.left.argumentExpression.getText());
        const pos = node.expression.left.argumentExpression.pos;
        return { node, identifier, type: SymbolType.UNKNOWN, pos };
      }
    }
  }
});
