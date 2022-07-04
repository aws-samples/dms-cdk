/* eslint-disable no-unused-vars */
import * as cdk from 'aws-cdk-lib';
import DMSReplication from '../lib/dms-replication';

class DemoDMSStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dmsProps = {
      subnetIds: ['subnet-1', 'subnet-2'],
      replicationSubnetGroupIdentifier: 'dms-subnet-private',
      replicationInstanceClass: 'dms-replication-instance-t3',
      replicationInstanceIdentifier: 'dms-mysql-dev',
      vpcSecurityGroupIds: ['sg-xxxx'],
      engineName: 'mysql',
      region: cdk.Stack.of(this).region,
    };

    const dmsReplication = new DMSReplication(this, 'DMSReplicationService', dmsProps);
    const source = dmsReplication.createMySQLEndpoint('db-on-source', 'source', 'sourceSecretsManagerSecretId');
    const target = dmsReplication.createMySQLEndpoint('rds-target', 'target', 'targetSecretsManagerSecretId');

    dmsReplication.createReplicationTask('platform-replication-task', 'platform', source, target);
  }
}
