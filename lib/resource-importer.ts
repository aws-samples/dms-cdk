import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

class ResourceImporter {
  getVpc(vpcId: string, scope: Construct): ec2.IVpc {
    const vpc = ec2.Vpc.fromLookup(scope, 'ImportedVPC', {
      vpcId,
    });

    return vpc;
  }
}

export default ResourceImporter;
