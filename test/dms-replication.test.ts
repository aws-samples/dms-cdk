import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DMSProps, DMSReplication } from '../lib/dms-replication';
import { ContextProps, TaskSettings } from '../lib/context-props';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as Dms from '../lib/dms-stack';


let stack: DMSTestStack;
let template : Template;

export class DMSTestStack extends cdk.Stack {
  public dmsReplication: DMSReplication;
  private props: DMSProps;

  constructor(scope: cdk.App, id: string) {
    super(scope, id, { env: { region: 'us-east-1' } });

    const vpc = new ec2.Vpc(this, 'DMSVpc');
    this.props = {
      subnetIds: ['subnet-1', 'subnet-2'],
      replicationInstanceClass: 'dms-mysql-uk',
      replicationInstanceIdentifier: 'test-repl-01',
      replicationSubnetGroupIdentifier: 'subnet-group',
      vpcSecurityGroupIds: ['vpc-security'],
      engineName: 'mysql',
      region: 'us-east-1',
      engineVersion: '3.4.7'
    };

    this.dmsReplication = new DMSReplication(this, 'DMSReplicationService', this.props);

    const source = this.dmsReplication.createMySQLEndpoint(
      'db-on-source',
      'source',
      'sourceSecretsManagerSecretId'
    );
    const target = this.dmsReplication.createMySQLEndpoint(
      'rds-target',
      'target',
      'targetSecretsManagerSecretId'
    );

    this.dmsReplication.createReplicationTask('test-replication-task', 'platform', source, target);
  }
}

test('init stack', () => {
  const app = new cdk.App();
  stack = new DMSTestStack(app, 'DMSTestStack');
  template = Template.fromStack(stack);
});

test('should have AWS::DMS::ReplicationInstance', () => {
  template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms-mysql-uk',
    ReplicationInstanceIdentifier: 'test-repl-01',
    AllocatedStorage: 50,
    VpcSecurityGroupIds: ['vpc-security'],
    EngineVersion: '3.4.7'
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


test('test target endpoint created with correct attributes', () => {

  // Create source endpoint
  const sourceEndpoint = stack.dmsReplication.createMySQLEndpoint(
    'src-endpoint-1',
    'source',
    'sourceSecretId'
  );

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    EngineName: 'mysql',
    ExtraConnectionAttributes: 'parallelLoadThreads=1',
    MySqlSettings: {
      SecretsManagerSecretId: 'sourceSecretsManagerSecretId'
     }
  });

  // Create target endpoint
  const targetEndpoint = stack.dmsReplication.createMySQLEndpoint(
    'tgt-endpoint-3',
    'target',
    'targetSecret'
  );

  template.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'target',
    ExtraConnectionAttributes: 'parallelLoadThreads=1 maxFileSize=512',
  });
});

test('test create replication task', () => {
 template.hasResourceProperties('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    ReplicationTaskIdentifier: 'test-replication-task',
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"platform","table-name":"%"},"rule-action":"include"}]}',
  });
});
