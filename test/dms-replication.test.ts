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
    schemas: [
      {
        name: 'demo_test',
        sourceSecretsManagerSecretId: 'sourceSecretsManagerSecretId',
        targetSecretsManagerSecretId: 'targetSecretMgrId',
        migrationType: 'full-load',
        engineName: 'mysql',
        targetEngineName: 'oracle',
        rules: JSON.stringify({
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
        }),
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
    ReplicationTaskIdentifier: 'demo_test-replication-test-repl-01',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"demo_test","table-name":"%"},"rule-action":"include"}]}',
  });
});

// Create oracle endpoint
// test('oracle endpoint created with correct attributes', () => {
//   const app = new cdk.App();
//   const dmsOracleProps = {
//     subnetIds: ['subnet-1', 'subnet-2'],
//     replicationInstanceClass: 'dms-oracle',
//     replicationInstanceIdentifier: 'test-repl-02',
//     replicationSubnetGroupIdentifier: 'subnet-group-oracle',
//     vpcSecurityGroupIds: ['vpc-security'],
//     engineName: 'oracle',
//     region: 'eu-west-1',
//     engineVersion: '3.4.7',
//   };

//   const oracleStack = new DmsStack(app, 'DmsOracleTestStack', dmsOracleProps);
//   const oracleTemplate = Template.fromStack(oracleStack);

//   oracleTemplate.hasResourceProperties('AWS::DMS::Endpoint', {
//     EndpointType: 'source',
//     EngineName: 'oracle',
//   });
// });
