import * as cdk from '@aws-cdk/core';
import { Stack } from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-dms';
import { DMSReplication } from '../lib/dms-replication';

export class DemoDMSStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'DMSVpc', {});

    const dmsProps = {
      subnetIds: ['subnet-1', 'subnet-2'],
      replicationSubnetGroupIdentifier: 'dms-subnet-private',
      replicationInstanceClass: 'dms-replication-instance-t3',
      replicationInstanceIdentifier: 'dms-mysql-dev',
      vpcSecurityGroupIds: ['sg-xxxx'],
      engineName: 'mysql',
      region: Stack.of(this).region
    };

    const dmsReplication = new DMSReplication(this, 'DMSReplicationService', dmsProps);
    const source = dmsReplication.createMySQLEndpoint(
      'db-on-source',
      'source',
      'sourceSecretsManagerSecretId',
      'sourceSecretsManagerRoleArn'
    );
    const target = dmsReplication.createMySQLEndpoint(
      'rds-target',
      'target',
      'targetSecretsManagerSecretId',
      'targetSecretsManagerRoleArn'
    );

    dmsReplication.createReplicationTask('platform-replication-task', 'platform', source, target);
  }
}
