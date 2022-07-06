import { tables } from '../conf/mapping-rules.json';
import { MappingRules, Rule, RuleDataType, RuleObjectLocator } from './rules-props';

export class TableMapping {
  // counter used as ruleId
  private static rule_counter = 0;

  private static mappingRules = new MappingRules();

  public static generateTableMappingRules() {
    // init mapping rules
    this.mappingRules.rules = [];
    TableMapping.rule_counter = 0;

    // loop over tables in the mapping-rules conf
    tables.forEach(table => this.generateMappingRuleForTable(table));

    return JSON.stringify(this.mappingRules);
  }

  private static generateMappingRuleForTable(table: any) {
    const schemaName = table.schemaName.toLowerCase();
    const tableName = table.tableName.toLowerCase();

    // generate include table rule
    this.mappingRules.rules.push(TableMapping.getTableRule(schemaName, tableName));

    // insert include-column rule for each column in the includeColumns
    table.includeColumns.forEach((column: string) => {
      this.mappingRules.rules.push(TableMapping.getInsertColumnRule(schemaName, tableName, column));
    });

    // insert remove-column rule and add-column rule for the same column but with hashed value
    table.hashColumns.forEach((column: string) => {
      TableMapping.getExcludeColumnRule(schemaName, tableName, column);

      const expr = `hash_sha256($${column.toLowerCase()})`;
      this.mappingRules.rules.push(
        TableMapping.getAddColumnRule(schemaName, tableName, `${column.toLowerCase()}_hashed`, expr)
      );
    });

    // insert add column rule for columns with custom case expression
    table.caseColumns.forEach((column: any) => {
      this.mappingRules.rules.push(
        TableMapping.getAddColumnRule(
          schemaName,
          tableName,
          `${column.columnName.toLowerCase()}_case`,
          column.statement
        )
      );
    });
  }

  private static getTableRule(schemaName: string, tableName: string) {
    // create include table rule
    const ruleName = `include table ${tableName}`;
    const rule = TableMapping.getRule('selection', ruleName, 'include');

    rule['object-locator'] = TableMapping.getObjLocator(schemaName, tableName);
    return rule;
  }

  private static getInsertColumnRule(schemaName: string, tableName: string, columnName: string) {
    // create include-column rule
    const ruleName = `insert column ${tableName}:${columnName}`;
    const rule = TableMapping.getRule('transformation', ruleName, 'include-column', 'column');

    rule['object-locator'] = TableMapping.getObjLocator(schemaName, tableName, columnName);
    return rule;
  }

  private static getExcludeColumnRule(schemaName: string, tableName: string, columnName: string) {
    // create remove-column rule
    const ruleName = `remove column ${tableName}:${columnName}`;
    const rule = TableMapping.getRule('transformation', ruleName, 'remove-column', 'column');

    rule['object-locator'] = TableMapping.getObjLocator(schemaName, tableName, columnName);
    return rule;
  }

  private static getAddColumnRule(schemaName: string, tableName: string, columnName: string, expression: string) {
    // create add column rule
    const expr = expression;
    const ruleName = `add column ${tableName}:${columnName}`;
    const rule = TableMapping.getRule('transformation', ruleName, 'add-column', 'columns', columnName, expr);

    rule['object-locator'] = TableMapping.getObjLocator(schemaName, tableName);
    rule['data-type'] = TableMapping.getDataType('string', 64);
    return rule;
  }

  private static getRule(type: string, name: string, action: string, target = '', value = '', expression = '') {
    TableMapping.rule_counter++;

    const rule = new Rule();
    rule['rule-type'] = type;
    rule['rule-id'] = this.rule_counter.toString();
    rule['rule-name'] = name;
    rule['rule-action'] = action;
    if (target) {
      rule['rule-target'] = 'column';
    }
    if (value) {
      rule.value = value;
    }
    if (expression) {
      rule.expression = expression;
    }

    return rule;
  }

  private static getObjLocator(schemaName: string, tableName: string, columnName = '') {
    const objLocator = new RuleObjectLocator();
    objLocator['schema-name'] = schemaName;
    objLocator['table-name'] = tableName;
    if (columnName) {
      objLocator['column-name'] = columnName;
    }

    return objLocator;
  }

  private static getDataType(type: string, length: number) {
    const dataType = new RuleDataType();
    dataType.type = type;
    dataType.length = length;

    return dataType;
  }
}
