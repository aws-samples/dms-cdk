/* eslint-disable jest/expect-expect */
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import DmsStack from '../lib/dms-stack';
import { ContextProps } from '../lib/context-props';

let stack: DmsStack;
let template: Template;

test('init stack', () => {
  const app = new cdk.App();

  const contextProps: ContextProps = {
    environment: 'dev',
    account: '',
    region: '',
    vpcId: 'test-vpc',
    subnetIds: ['subnet-1', 'subnet-2'],
    vpcSecurityGroupIds: ['vpc-sg'],
    schemas: [
      {
        name: 'Database1',
        sourceSecretsManagerSecretId: 'sourceSecretId',
        sourceSecretsManagerRoleArn: 'sourceSecretRoleArn',
        targetSecretsManagerSecretId: 'targetSecretIdDatabase1',
        targetSecretsManagerRoleArn: 'targetSecretRoleDatabase1',
      },
      {
        name: 'Database2',
        sourceSecretsManagerSecretId: 'sourceSecretId',
        sourceSecretsManagerRoleArn: 'sourceSecretRoleArn',
        targetSecretsManagerSecretId: 'targetSecretIdDatabase2',
        targetSecretsManagerRoleArn: 'targetSecretRoleDatabase2',
      },
      {
        name: 'Database3',
        sourceSecretsManagerSecretId: 'sourceSecretId',
        sourceSecretsManagerRoleArn: 'sourceSecretRoleArn',
        targetSecretsManagerSecretId: 'targetSecretIdDatabase3',
        targetSecretsManagerRoleArn: 'targetSecretRoleDatabase3',
      },
    ],
    replicationInstanceClass: 'dms.t3.medium',
    replicationInstanceIdentifier: 'replication-id',
    replicationSubnetGroupIdentifier: 'test-replication-id',
    replicationTaskSettings: {
      ValidationSettings: {
        EnableValidation: true,
        ThreadCount: 15,
      },
      Logging: {
        EnableLogging: false,
      },
    },
    migrationType: 'full-load',
    engineVersion: '3.4.6',
  };

  const dmsProps = { context: contextProps };

  stack = new DmsStack(app, 'MyDmsStack', dmsProps);
  template = Template.fromStack(stack);
});

test('AWS::DMS::ReplicationSubnetGroup', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
    SubnetIds: ['subnet-1', 'subnet-2'],
  });
});

test('AWS::DMS::ReplicationInstance', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms.t3.medium',
    VpcSecurityGroupIds: ['vpc-sg'],
    EngineVersion: '3.4.6',
  });
});

test('Source AWS::DMS::Endpoint', () => {
  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    MySqlSettings: {
      SecretsManagerSecretId: 'sourceSecretId',
    },
  });
});

test('Target AWS::DMS::Endpoint', () => {
  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    MySqlSettings: {
      SecretsManagerSecretId: 'targetSecretIdDatabase1',
    },
  });

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    MySqlSettings: {
      SecretsManagerSecretId: 'targetSecretIdDatabase2',
    },
  });

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    MySqlSettings: {
      SecretsManagerSecretId: 'targetSecretIdDatabase3',
    },
  });

  template.resourceCountIs('AWS::DMS::Endpoint', 6);
});

test('AWS::DMS::ReplicationTask TableMappings', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"Database1","table-name":"%"},"rule-action":"include"}]}',
  });

  template.resourceCountIs('AWS::DMS::ReplicationTask', 3);
});
