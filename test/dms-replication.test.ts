/* eslint-disable jest/expect-expect */
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DmsReplication, DmsProps } from '../lib/dms-replication';

class DmsTestStack extends cdk.Stack {
  public dmsReplication: DmsReplication;

  constructor(scope: cdk.App, id: string, props: DmsProps) {
    super(scope, id, { env: { region: 'us-east-1' } });

    this.dmsReplication = new DmsReplication(this, 'DMSReplicationService', props);
    let source;

    switch (props.engineName) {
      case 'mysql':
        source = this.dmsReplication.createMySQLEndpoint('db-on-source', 'source', 'sourceSecretsManagerSecretId');
        break;
      case 'oracle':
        source = this.dmsReplication.createOracleEndpoint(
          'db-on-source',
          'source',
          'sourceSecretsManagerSecretId',
          'orcl'
        );
        break;
      default:
        source = this.dmsReplication.createMySQLEndpoint('db-on-source', 'source', 'sourceSecretsManagerSecretId');
        break;
    }

    const target = this.dmsReplication.createMySQLEndpoint('rds-target', 'target', 'targetSecretsManagerSecretId');

    this.dmsReplication.createReplicationTask('test-replication-task', 'platform', source, target);
  }
}

let template: Template;
let stack: DmsTestStack;

test('init stack', () => {
  const app = new cdk.App();
  const dmsProps = {
    subnetIds: ['subnet-1', 'subnet-2'],
    replicationInstanceClass: 'dms-mysql-uk',
    replicationInstanceIdentifier: 'test-repl-01',
    replicationSubnetGroupIdentifier: 'subnet-group',
    vpcSecurityGroupIds: ['vpc-security'],
    engineName: 'mysql',
    region: 'us-east-1',
    engineVersion: '3.4.7',
  };
  stack = new DmsTestStack(app, 'DmsTestStack', dmsProps);
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

// Create oracle endpoint
test('oracle endpoint created with correct attributes', () => {
  const app = new cdk.App();
  const dmsOracleProps = {
    subnetIds: ['subnet-1', 'subnet-2'],
    replicationInstanceClass: 'dms-oracle',
    replicationInstanceIdentifier: 'test-repl-02',
    replicationSubnetGroupIdentifier: 'subnet-group-oracle',
    vpcSecurityGroupIds: ['vpc-security'],
    engineName: 'oracle',
    region: 'eu-west-1',
    engineVersion: '3.4.7',
  };

  const oracleStack = new DmsTestStack(app, 'DmsOracleTestStack', dmsOracleProps);
  const oracleTemplate = Template.fromStack(oracleStack);

  oracleTemplate.hasResourceProperties('AWS::DMS::Endpoint', {
    EndpointType: 'source',
    EngineName: 'oracle',
  });
});
