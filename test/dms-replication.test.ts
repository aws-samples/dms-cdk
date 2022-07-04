/* eslint-disable jest/expect-expect */
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import DMSReplication, { DMSProps } from '../lib/dms-replication';

class DmsTestStack extends cdk.Stack {
  public dmsReplication: DMSReplication;

  private props: DMSProps;

  constructor(scope: cdk.App, id: string) {
    super(scope, id, { env: { region: 'us-east-1' } });

    new ec2.Vpc(this, 'DMSVpc');
    this.props = {
      subnetIds: ['subnet-1', 'subnet-2'],
      replicationInstanceClass: 'dms-mysql-uk',
      replicationInstanceIdentifier: 'test-repl-01',
      replicationSubnetGroupIdentifier: 'subnet-group',
      vpcSecurityGroupIds: ['vpc-security'],
      engineName: 'mysql',
      region: 'us-east-1',
      engineVersion: '3.4.7',
    };

    this.dmsReplication = new DMSReplication(this, 'DMSReplicationService', this.props);

    const source = this.dmsReplication.createMySQLEndpoint('db-on-source', 'source', 'sourceSecretsManagerSecretId');
    const target = this.dmsReplication.createMySQLEndpoint('rds-target', 'target', 'targetSecretsManagerSecretId');

    this.dmsReplication.createReplicationTask('test-replication-task', 'platform', source, target);
  }
}

let template: Template;
let stack: DmsTestStack;

test('init stack', () => {
  const app = new cdk.App();
  stack = new DmsTestStack(app, 'DMSTestStack');
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
  // Create source endpoint
  stack.dmsReplication.createMySQLEndpoint('src-endpoint-1', 'source', 'sourceSecretId');

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    EngineName: 'mysql',
    ExtraConnectionAttributes: 'parallelLoadThreads=1',
    MySqlSettings: {
      SecretsManagerSecretId: 'sourceSecretsManagerSecretId',
    },
  });

  // Create target endpoint
  stack.dmsReplication.createMySQLEndpoint('tgt-endpoint-3', 'target', 'targetSecret');

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    ExtraConnectionAttributes: 'parallelLoadThreads=1 maxFileSize=512',
  });
});

test('create replication task', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    ReplicationTaskIdentifier: 'test-replication-task',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"platform","table-name":"%"},"rule-action":"include"}]}',
  });
});
