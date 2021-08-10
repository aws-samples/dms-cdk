import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as dms from '@aws-cdk/aws-dms';
import { DMSProps, DMSReplication } from '../../lib/dms-replication';

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
    };

    this.dmsReplication = new DMSReplication(this, 'DMSReplicationService', this.props);
  }
}
