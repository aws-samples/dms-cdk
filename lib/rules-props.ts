export class RuleObjectLocator {
  'schema-name': string;

  'table-name': string;

  'column-name': string;
}

export class RuleDataType {
  'type': string;

  'length': number;
}

export class Rule {
  'rule-type': string;

  'rule-id': string;

  'rule-name': string;

  'rule-action': string;

  'rule-target': string;

  'value': string;

  'expression': string;

  'object-locator': RuleObjectLocator;

  'data-type': RuleDataType;
}

export class MappingRules {
  'rules': Rule[];
}
