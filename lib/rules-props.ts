/* eslint-disable prettier/prettier */

export interface DataType {
  'type': 'date' | 'time' | 'datetime' | 'int1' | 'int2' | 'int4' | 'int8' | 'numeric' | 'real4' | 'real8' | 'string' | 'uint1' | 'uint2' | 'uint4' | 'uint8' | 'wstring' | 'blob' | 'nclob' | 'clob' | 'boolean' | 'set' | 'list' | 'map' | 'tuple';
  'length'?: number;
  'precision'?: number;
  'scale'?: number;
};

export interface RuleObjectLocator {
  'schema-name': string;
  'table-name'?: string;
  'table-tablespace-name'?: string;
  'index-tablespace-name'?: string;
  'table-type'?: 'table' | 'view' | 'all';
  'column-name'?: string;
  'data-type'?: DataType;
};

export type FilterCondition = {
  'filter-operator'?: 'lte' | 'ste' | 'gte' | 'eq' | 'noteq' | 'between' | 'notbetween' | 'null' | 'notnull';
  'value'?: string;
  'start-value'?: string;
  'end-value'?: string;
};

export type Filter = {
  'filter-type': string;
  'column-name'?: string;
  'filter-conditions'?: FilterCondition[];
};

export interface BaseRule {};

export interface BeforeImageDef {
  'column-prefix'?: string;
  'column-suffix'?: string;
  'column-filter'?: 'pk-only' | 'non-blob' | 'all';
}

export interface ParallelLoad {
  'type'?: 'partitions-auto' | 'subpartitions-auto' | 'partitions-list' | 'ranges' | 'none';
  'partitions'?: string;
  'subpartitions'?: string;
  'columns'?: string;
  'boundaries'?: string;
  'number-of-partitions'?: number;
  'collection-count-from-metadata'?: 'true' | 'false';
  'max-records-skip-per-page'?: number;
  'batch-size'?: number;
  'lob-settings'?: string;
  'mode'?: 'limited' | 'unlimited' | 'none';
  'bulk-max-size'?: string
}

export interface SelectionRule extends BaseRule {
  'rule-type': 'selection';
  'rule-id': number;
  'rule-name': string;
  'rule-action'?: 'include' | 'exclude' | 'explicit';
  'object-locator'?: RuleObjectLocator;
  'load-order'?: number;
  'filters'?: Filter[]
};


export interface TransformationRule extends BaseRule {
  'rule-type': 'transformation';
  'rule-id': number;
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
export interface TableSettingsRule extends BaseRule {
  'rule-type': 'table-settings';
  'rule-id': number;
  'rule-name': string;
  'object-locator'?: RuleObjectLocator;
  'parallel-load'?: ParallelLoad;
};

export type Rules = {
    'rules': BaseRule[];
};

