/* eslint-disable prettier/prettier */

export type DataType = {
  'type': 'date' | 'time' | 'datetime' | 'int1' | 'int2' | 'int4' | 'int8' | 'numeric' | 'real4' | 'real8' | 'string' | 'uint1' | 'uint2' | 'uint4' | 'uint8' | 'wstring' | 'blob' | 'nclob' | 'clob' | 'boolean' | 'set' | 'list' | 'map' | 'tuple';
  'length'?: number;
  'precision'?: number;
  'scale'?: number;
};

export type RuleObjectLocator = {
  'schema-name': string;
  'table-name'?: string;
  'table-tablespace-name'?: string;
  'index-tablespace-name'?: string;
  'table-type'?: 'table' | 'view' | 'all';
  'column-name'?: string;
  'data-type'?: DataType;
};

export type FilterCondition = {
  'filter-operator'?: string;
  'start-value'?: string;
  'end-value'?: string;
};

export type Filter = {
  'filter-type': string;
  'column-name'?: string;
  'filter-conditions'?: FilterCondition[];
};

export type BaseRule = {};

export interface SelectionRule extends BaseRule {
  'rule-type': 'selection';
  'rule-id': string;
  'rule-name': string;
  'rule-action'?: 'include' | 'exclude' | 'explicit';
  'object-locator'?: RuleObjectLocator;
  'load-order'?: number;
  'filters'?: Filter[]
};

export type BeforeImageDef = {
  'column-prefix'?: string;
  'column-suffix'?: string;
  'column-filter'?: 'pk-only' | 'non-blob' | 'all';
}

export interface TransformationRule extends BaseRule {
  'rule-type': 'transformation';
  'rule-id': string;
  'rule-name': string;
  'object-locator'?: RuleObjectLocator;
  'rule-action'?: 'add-column' | 'include-column' | 'remove-column' | 'rename' | 'convert-lowercase' | 'convert-uppercase' | 'add-prefix' | 'remove-prefix' | 'replace-prefix' | 'add-suffix' | 'remove-suffix' | 'replace-suffix' | 'define-primary-key' | 'change-data-type' | 'add-before-image-columns';
  'rule-target'?: 'schema' | 'table' | 'column' | 'table-tablespace' | 'index-tablespace';
  'value'?: string | null;
  'old-value'?: string | null;
  'data-type'?: DataType;
  'expression'?: string;
  'primary-key-def'?: string;
  'before-image-def'?: BeforeImageDef;
  'filters'?: Filter[]
};


export type Rules = {
    'rules': BaseRule[];
};

