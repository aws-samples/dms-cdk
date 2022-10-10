/* eslint-disable prettier/prettier */
/* eslint-disable jest/expect-expect */
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import DmsStack from '../lib/dms-stack';

let template: Template;
let stack: DmsStack;

test('init stack', () => {
  const app = new cdk.App();

  stack = new DmsStack(app, 'DmsTestStack', {
    vpcId: 'vpc-id',
    subnetIds: ['subnet-1', 'subnet-2'],
    replicationInstanceClass: 'dms-mysql-uk',
    replicationInstanceIdentifier: 'test-repl-01',
    replicationSubnetGroupIdentifier: 'subnet-group',
    vpcSecurityGroupIds: ['vpc-security'],
    engineVersion: '3.4.7',
    tasks: [
      {
        name: 'demo_test',
        sourceSecretsManagerSecretId: 'sourceSecretsManagerSecretId',
        targetSecretsManagerSecretId: 'targetSecretMgrId',
        migrationType: 'full-load',
        engineName: 'mysql',
        targetEngineName: 'oracle',
        tableMappings: {
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': 'demo_schema',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        },
      },
    ],
    publiclyAccessible: false,
    allocatedStorage: 50,
    env: {
      account: '11111111111',
      region: 'eu-central-1',
    },
  });

  template = Template.fromStack(stack);
});

test('should have AWS::DMS::ReplicationInstance', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms-mysql-uk',
    ReplicationInstanceIdentifier: 'test-repl-01',
    AllocatedStorage: 50,
    VpcSecurityGroupIds: ['vpc-security'],
    EngineVersion: '3.4.7',
  });
});

test('should have AWS::DMS::ReplicationSubnetGroup', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
    ReplicationSubnetGroupIdentifier: 'subnet-group',
  });
});

test('should allocated storage AWS::DMS::ReplicationInstance', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms-mysql-uk',
    AllocatedStorage: 50,
  });
});

test('target endpoint created with correct attributes', () => {
  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    EngineName: 'mysql',
    ExtraConnectionAttributes: 'parallelLoadThreads=1',
    MySqlSettings: {
      SecretsManagerSecretId: 'sourceSecretsManagerSecretId',
    },
  });

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    EngineName: 'oracle',
  });
});

test('create replication task', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    ReplicationTaskIdentifier: 'demo-test-replication-test-repl-01',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"demo_schema","table-name":"%"},"rule-action":"include"}]}',
  });
});

// Oracle transformation rules test
test('oracle transformation rules and attributes', () => {
  const app = new cdk.App();
  const oracleStack = new DmsStack(app, 'DmsOraclePostGresStack', {
    vpcId: 'vpc-id',
    subnetIds: ['subnet-1a', 'subnet-1b'],
    replicationInstanceClass: 'dms.r5.4xlarge',
    replicationInstanceIdentifier: 'test-repl-01',
    replicationSubnetGroupIdentifier: 'subnet-group',
    vpcSecurityGroupIds: ['vpc-sg'],
    engineVersion: '3.4.6',
    tasks: [
      {
        name: 'demo_stack',
        sourceSecretsManagerSecretId: 'sourceSecretsManagerSecretId',
        targetSecretsManagerSecretId: 'targetSecretsManagerSecretId',
        migrationType: 'cdc',
        engineName: 'oracle',
        targetEngineName: 'aurora-postgresql',
        tableMappings: {
          rules: [
            {
              'rule-type': 'transformation',
              'rule-id': '1',
              'rule-name': 'Default Lowercase Table Rule',
              'rule-target': 'table',
              'object-locator': {
                'schema-name': 'DMS_SAMPLE',
                'table-name': '%',
              },
              'rule-action': 'convert-lowercase',
              'value': null,
              'old-value': null
            },
            {
              'rule-type': 'transformation',
              'rule-id': '2',
              'rule-name': 'Default Lowercase Schema Rule',
              'rule-action': 'convert-lowercase',
              'rule-target': 'schema',
              'object-locator': {
                'schema-name': 'DMS_SAMPLE',
              },
            },
            {
              'rule-type': 'transformation',
              'rule-id': '3',
              'rule-name': 'Default Lowercase Column Rule',
              'rule-action': 'convert-lowercase',
              'rule-target': 'column',
              'object-locator': {
                'schema-name': 'DMS_SAMPLE',
                'table-name': '%',
                'column-name': '%',
              },
            },
            {
              'rule-type': 'transformation',
              'rule-id': '10',
              'rule-name': 'Rename Schema Rule',
              'rule-target': 'schema',
              'object-locator': {
                'schema-name': 'DMS_SAMPLE',
              },
              'rule-action': 'rename',
              'value': 'dms_sample',
              'old-value': null
            },
            {
              'rule-type': 'selection',
              'rule-id': '11',
              'rule-name': 'Selection Rule DMS_SAMPLE',
              'object-locator': {
                'schema-name': 'DMS_SAMPLE',
                'table-name': '%',
              },
              'rule-action': 'include',
              'filters': []
            },
            {
              'rule-action': 'change-data-type',
              'object-locator': {
                'schema-name': 'DMS_SAMPLE',
                'column-name': 'COL1_NUMBER_INT',
                'table-name': 'SAMPLE_NUMBER_DATA_TYPE',
              },
              'rule-target': 'column',
              'rule-type': 'transformation',
              'rule-id': '1',
              'data-type': {
                'type': 'numeric',
              },
              'rule-name': '30',
            },
          ],
        },
      },
    ],
    publiclyAccessible: true,
    allocatedStorage: 50,
    env: {
      account: '11111111111',
      region: 'eu-central-1',
    },
  });

  const oracleTemplate = Template.fromStack(oracleStack);

  oracleTemplate.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    EngineName: 'oracle',
  });
});
