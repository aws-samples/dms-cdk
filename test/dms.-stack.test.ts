import '@aws-cdk/assert/jest';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as Dms from '../lib/dms-stack';
import { ContextProps, TaskSettings } from '../lib/context-props';
import { SynthUtils } from '@aws-cdk/assert';

jest.mock('../lib/resource-importer', () => {
  return {
    ResourceImporter: jest.fn().mockImplementation(() => {
      return {
        getVpc: (vpcId: string, scope: cdk.Construct) => {
          return new ec2.Vpc(scope, vpcId, {
            cidr: '10.2.0.0/16',
          });
        },
      };
    }),
  };
});

let stack: Dms.DmsStack;

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
        name: 'platform',
        sourceSecretsManagerSecretId: 'sourceSecretId',
        sourceSecretsManagerRoleArn: 'sourceSecretRoleArn',
        targetSecretsManagerSecretId: 'targetSecretIdPlatform',
        targetSecretsManagerRoleArn: 'targetSecretRolePlatform',
      },
      {
        name: 'solman',
        sourceSecretsManagerSecretId: 'sourceSecretId',
        sourceSecretsManagerRoleArn: 'sourceSecretRoleArn',
        targetSecretsManagerSecretId: 'targetSecretIdSolman',
        targetSecretsManagerRoleArn: 'targetSecretRoleSolman',
      },
      {
        name: 'archive',
        sourceSecretsManagerSecretId: 'sourceSecretId',
        sourceSecretsManagerRoleArn: 'sourceSecretRoleArn',
        targetSecretsManagerSecretId: 'targetSecretIdArchive',
        targetSecretsManagerRoleArn: 'targetSecretRoleArchive',
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
  };

  const dmsProps = { context: contextProps };

  stack = new Dms.DmsStack(app, 'MyDmsStack', dmsProps);
});

test('Test AWS::DMS::ReplicationSubnetGroup', () => {
  expect(stack).toHaveResourceLike('AWS::DMS::ReplicationSubnetGroup', {
    SubnetIds: ['subnet-1', 'subnet-2'],
  });
});

test('Test AWS::DMS::ReplicationInstance', () => {
  expect(stack).toHaveResource('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms.t3.medium',
    VpcSecurityGroupIds: ['vpc-sg'],
    EngineVersion: '3.4.4',
  });
});

test('Test Source AWS::DMS::Endpoint', () => {
  expect(stack).toHaveResourceLike('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    MySqlSettings: {
      SecretsManagerAccessRoleArn: 'sourceSecretRoleArn',
      SecretsManagerSecretId: 'sourceSecretId',
    },
  });
});

test('Test Target AWS::DMS::Endpoint', () => {
  expect(stack).toHaveResourceLike('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    MySqlSettings: {
      SecretsManagerAccessRoleArn: 'targetSecretRolePlatform',
      SecretsManagerSecretId: 'targetSecretIdPlatform',
    },
  });

  expect(stack).toHaveResourceLike('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    MySqlSettings: {
      SecretsManagerAccessRoleArn: 'targetSecretRoleSolman',
      SecretsManagerSecretId: 'targetSecretIdSolman',
    },
  });

  expect(stack).toHaveResourceLike('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    MySqlSettings: {
      SecretsManagerAccessRoleArn: 'targetSecretRoleArchive',
      SecretsManagerSecretId: 'targetSecretIdArchive',
    },
  });

  expect(stack).toCountResources('AWS::DMS::Endpoint', 6);
});

test('Test AWS::DMS::ReplicationTask TableMappings', () => {
  expect(stack).toHaveResourceLike('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"platform","table-name":"%"},"rule-action":"include"}]}',
  });

  expect(stack).toCountResources('AWS::DMS::ReplicationTask', 3);
});

test('Test AWS::DMS::ReplicationTask TaskSettings', () => {
  const resources = SynthUtils.toCloudFormation(stack).Resources;

  const replicationTask = Object.keys(resources)
    .map((resourceId: string) => resources[resourceId])
    .find((resource: any) => resource.Type === 'AWS::DMS::ReplicationTask');
  expect(replicationTask.Properties.MigrationType).toEqual('full-load');

  const replicationTaskSettings: TaskSettings = JSON.parse(replicationTask.Properties.ReplicationTaskSettings);
  expect(replicationTaskSettings.ValidationSettings?.EnableValidation).toEqual(true);
  expect(replicationTaskSettings.ValidationSettings?.ThreadCount).toEqual(15);
  expect(replicationTaskSettings.Logging?.EnableLogging).toEqual(false);

  expect(stack).toCountResources('AWS::DMS::ReplicationTask', 3);
});
