/* eslint-disable jest/expect-expect */
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import DmsStack from '../lib/dms-stack';

let stack: DmsStack;
let template: Template;

const app = new cdk.App();

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

// test('AWS::DMS::ReplicationSubnetGroup', () => {
//   template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
//     SubnetIds: ['subnet-1', 'subnet-2'],
//   });
// });

// test('AWS::DMS::ReplicationInstance', () => {
//   template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
//     ReplicationInstanceClass: 'dms.r5.4xlarge',
//     VpcSecurityGroupIds: ['vpc-sg'],
//     EngineVersion: '3.4.6',
//   });
// });

// test('Target AWS::DMS::Endpoint', () => {
//   template.hasResourceProperties('AWS::DMS::Endpoint', {
//     EndpointType: 'target',
//     MySqlSettings: {
//       SecretsManagerSecretId: 'targetSecretIdDatabase1',
//     },
//   });

//   template.hasResourceProperties('AWS::DMS::Endpoint', {
//     EndpointType: 'target',
//     MySqlSettings: {
//       SecretsManagerSecretId: 'targetSecretIdDatabase2',
//     },
//   });

//   template.hasResourceProperties('AWS::DMS::Endpoint', {
//     EndpointType: 'target',
//     MySqlSettings: {
//       SecretsManagerSecretId: 'targetSecretIdDatabase3',
//     },
//   });

//   template.resourceCountIs('AWS::DMS::Endpoint', 6);
// });

// test('Source Oracle AWS::DMS::Endpoint', () => {
//   template.hasResourceProperties('AWS::DMS::Endpoint', {
//     EndpointType: 'source',
//     EngineName: 'oracle',
//     DatabaseName: 'demo-db',
//     OracleSettings: {
//       SecretsManagerSecretId: 'sourceSecretId',
//     },
//   });
// });

// test('AWS::DMS::ReplicationTask TableMappings', () => {
//   template.hasResourceProperties('AWS::DMS::ReplicationTask', {
//     MigrationType: 'full-load',
//     TableMappings:
//       '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"Database1","table-name":"%"},"rule-action":"include"}]}',
//   });

//   template.resourceCountIs('AWS::DMS::ReplicationTask', 3);
// });

// test('Publicly accessible is true', () => {
//   template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
//     ReplicationInstanceClass: 'dms.r5.4xlarge',
//     PubliclyAccessible: true,
//   });
// });
