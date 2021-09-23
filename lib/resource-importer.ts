import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

export class ResourceImporter {
  getVpc(vpcId: string, scope: cdk.Construct): ec2.IVpc {
    const vpc = ec2.Vpc.fromLookup(scope, 'ImportedVPC', {
      vpcId,
    });

    return vpc;
  }
}
