/* eslint-disable jest/expect-expect */
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import DmsStack from '../lib/dms-stack';

let stackOracleToPostgres: DmsStack;
let stackMultiSchemaMySql: DmsStack;
let template: Template;
let multiSchemaTemplate: Template;

test('init stack', () => {
  const app = new cdk.App();

  stackOracleToPostgres = new DmsStack(app, 'DmsOraclePostGresStack', {
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
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': 'demo_test',
                'table-name': '%',
              },
              'rule-action': 'include',
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

  stackMultiSchemaMySql = new DmsStack(app, 'DmsMultiSchemaStack', {
    vpcId: 'vpc-id',
    subnetIds: ['subnet-1a', 'subnet-1b'],
    replicationInstanceClass: 'dms.r5.4xlarge',
    replicationInstanceIdentifier: 'test-repl-01',
    replicationSubnetGroupIdentifier: 'subnet-group',
    vpcSecurityGroupIds: ['vpc-sg'],
    engineVersion: '3.4.6',
    tasks: [
      {
        name: 'task_1',
        sourceSecretsManagerSecretId: 'sourceSecretsManagerSecretId',
        targetSecretsManagerSecretId: 'targetSecretsManagerSecretId',
        migrationType: 'full-load',
        engineName: 'mysql',
        targetEngineName: 'mysql',
        tableMappings: {
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': 'Database_1',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        },
      },
      {
        name: 'task_2',
        sourceSecretsManagerSecretId: 'sourceSecretsManagerSecretId',
        targetSecretsManagerSecretId: 'targetSecretsManagerSecretId',
        migrationType: 'cdc',
        engineName: 'mysql',
        targetEngineName: 'sqlserver',
        tableMappings: {
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': 'Database_2',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        },
      },
      {
        name: 'task_3',
        sourceSecretsManagerSecretId: 'sourceSecretsManagerSecretId',
        targetSecretsManagerSecretId: 'targetSecretsManagerSecretId',
        migrationType: 'full-load',
        engineName: 'mysql',
        targetEngineName: 'aurora-postgresql',
        tableMappings: {
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': 'Database_3',
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

  template = Template.fromStack(stackOracleToPostgres);
  multiSchemaTemplate = Template.fromStack(stackMultiSchemaMySql);
});

test('subnet group', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
    SubnetIds: ['subnet-1a', 'subnet-1b'],
  });
});

test('replication instance class and engine version', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms.r5.4xlarge',
    VpcSecurityGroupIds: ['vpc-sg'],
    EngineVersion: '3.4.6',
  });
});

test('DMS endpoints', () => {
  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    EndpointIdentifier: 'source-demo-stack-test-repl-01',
    EngineName: 'oracle',
    ExtraConnectionAttributes: 'addSupplementalLogging=true',
    OracleSettings: {
      SecretsManagerSecretId: 'sourceSecretsManagerSecretId',
    },
  });

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    EndpointIdentifier: 'target-demo-stack-test-repl-01',
    EngineName: 'aurora-postgresql',
    ExtraConnectionAttributes: 'executeTimeout=180',
    PostgreSqlSettings: {
      SecretsManagerSecretId: 'targetSecretsManagerSecretId',
    },
  });

  template.resourceCountIs('AWS::DMS::Endpoint', 2);
});

test('Publicly accessible is true', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms.r5.4xlarge',
    PubliclyAccessible: true,
  });
});

// Multiple schemas test
test('Multiple schemas test', () => {
  multiSchemaTemplate.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"Database_1","table-name":"%"},"rule-action":"include"}]}',
  });

  multiSchemaTemplate.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'cdc',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"Database_2","table-name":"%"},"rule-action":"include"}]}',
  });

  multiSchemaTemplate.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"Database_3","table-name":"%"},"rule-action":"include"}]}',
  });

  multiSchemaTemplate.resourceCountIs('AWS::DMS::ReplicationTask', 3);
  multiSchemaTemplate.resourceCountIs('AWS::DMS::ReplicationInstance', 1);
});
