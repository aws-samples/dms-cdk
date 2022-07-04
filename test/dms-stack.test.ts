import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as Dms from '../lib/dms-stack';
import { ContextProps, TaskSettings } from '../lib/context-props';

jest.mock('../lib/resource-importer', () => {
  return {
    ResourceImporter: jest.fn().mockImplementation(() => {
      return {
        getVpc: (vpcId: string, scope: Construct) => {
          return new ec2.Vpc(scope, vpcId, {
            cidr: '10.2.0.0/16',
          });
        },
      };
    }),
  };
});

let stack: Dms.DMSStack;
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
    engineVersion: '3.4.6'
  };

  const dmsProps = { context: contextProps };

  stack = new Dms.DMSStack(app, 'MyDmsStack', dmsProps);
  template = Template.fromStack(stack)
});

test('Test AWS::DMS::ReplicationSubnetGroup', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
    SubnetIds: ['subnet-1', 'subnet-2'],
  });
});

test('Test AWS::DMS::ReplicationInstance', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms.t3.medium',
    VpcSecurityGroupIds: ['vpc-sg'],
    EngineVersion: '3.4.6',
  });
});

test('Test Source AWS::DMS::Endpoint', () => {
  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    MySqlSettings: {
      SecretsManagerSecretId: 'sourceSecretId',
    },
  });
});

test('Test Target AWS::DMS::Endpoint', () => {
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

test('Test AWS::DMS::ReplicationTask TableMappings', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"Database1","table-name":"%"},"rule-action":"include"}]}',
  });

  template.resourceCountIs('AWS::DMS::ReplicationTask', 3);
});

// test('Test AWS::DMS::ReplicationTask TaskSettings', () => {
//   const resources = SynthUtils.toCloudFormation(stack).Resources;

//   const replicationTask = Object.keys(resources)
//     .map((resourceId: string) => resources[resourceId])
//     .find((resource: any) => resource.Type === 'AWS::DMS::ReplicationTask');
//   expect(replicationTask.Properties.MigrationType).toEqual('full-load');

//   const replicationTaskSettings: TaskSettings = JSON.parse(replicationTask.Properties.ReplicationTaskSettings);
//   expect(replicationTaskSettings.ValidationSettings?.EnableValidation).toEqual(true);
//   expect(replicationTaskSettings.ValidationSettings?.ThreadCount).toEqual(15);
//   expect(replicationTaskSettings.Logging?.EnableLogging).toEqual(false);

//   template.resourceCountIs('AWS::DMS::ReplicationTask', 3);
// });
