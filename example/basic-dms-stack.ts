import * as cdk from '@aws-cdk/core';
import { DMSReplication } from '../lib/dms-replication';
import * as ec2 from '@aws-cdk/aws-ec2';
import { importDependencies } from './dependencies';
import * as rds from '@aws-cdk/aws-dms';

export class LibDMSStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'DMSVpc', {});

    const dmsProps = {
      subnetIds: ['subnet-1', 'subnet-2'],
      replicationSubnetGroupIdentifier: 'dms-subnet-uk',
      replicationInstanceClass: 'dms-mysql-uk',
      replicationInstanceIdentifier: 'dms-uk',
      migrationType: 'full-load',
      vpcSecurityGroupIds: ['vpc-security'],
      engineName: 'mysql',
      schemas: ['platform'],
      region: 'us-east-1',
    };

    const dmsReplication = new DMSReplication(this, 'DMSReplicationService', dmsProps);
    const source = dmsReplication.createMySQLEndpoint(
      'db-onpprem-source',
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
