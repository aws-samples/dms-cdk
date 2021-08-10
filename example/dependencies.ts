import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

type Deps = {
  vpc: ec2.IVpc;
  allowedSecurityGroup: ec2.ISecurityGroup;
};

export function importDependencies(scope: cdk.Stack, vpcId: string, allowedSecurityGroupId: string): Deps {
  const vpc = ec2.Vpc.fromLookup(scope, 'ImportVPC', {
    vpcId,
  });

  const allowedSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(scope, 'ImportAllowedSG', allowedSecurityGroupId);

  return {
    vpc,
    allowedSecurityGroup,
  };
}
