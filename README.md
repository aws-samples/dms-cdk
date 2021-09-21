# Introduction

This CDK application contains CDK constructs to provision AWS DMS (data migration service) related resources. The solution provided is primarily based on RDS MySQL database as the source and target database used for migration. The  

1. A subnet group that defines where DMS tasks are run
1. A DMS Replication Instance .
1. DMS database endpoints (source and target) that is configurable
1. DMS task(s) for replication that is configurable 

# Pre-requisite

1. Connectivity: DMS needs a network connectivity between the source database and the target database. If the source database in located on-premise ensure port (default 3306 for mysql) is opened by your corporate firewall. For configuring target endpoint ensure that your target RDS security group allows the necessary connectivity. 

1. Secrets Manager to store database credentials : The solution assumes all database creentials are stored in the AWS Secrets manager.Configure the secrets manager for both the source and target databases with necessary parameters like hostname, port, database needed for connectivity. 

1. VPC endpoints for DMS, Secrets Manager. This ensures traffic is routed via AWS backbone and provides additional security.

1. CDK v1.100.x
1. Nodejs v 14.x

# Solution Architecture

High level architecture for DMS is shown below. The main components involved are

1. A dedicated network (VPN or Direct connect) with a connectivity to the customers VPC (Virtual Private Cloud)
1. Source database preferably with a dedicated slave. This helps to offload the database load coming from read operations during migration.
1. A target RDS database where data is migrated.
1. Source and target DMS endpoints with database credentials stored in AWS Secrets Manager
1. DMS replication instance and a number of replication tasks for replicating the data


![DMS Architecture](./docs/dms-architecture.png)

# Installation

Repository: https://github.com/aws-samples/dms-cdk/

1. Install Nodejs and npm. See the link https://nodejs.org/en/download/package-manager/#macos

1. Install CDK for typescript (https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) or use the command below
   ```
      npm install -g aws-cdk 
   ```

1. Create an aws profile (if you do not have one)
   ```
      $ aws configure --profile dms
   ```

1. Deploy the solution using the profile created above. Provide the account where DMS resources should be provisioned by CDK .

   ```
    $ npm install  ( compiles and installes necessary dependencies)
    $ npm test     (runs unit tests)
   ```
1. Deploy the solution
   ```
    cdk deploy -c environment="dev" -c account="<ACCOUNT TO DEPLOY DMS>" --profile dms
   ```
# CDK construct Overview

The solution described in this post relies mainly on 2 classes mainly - DMSReplication and DMStack and uses out of the box CDK construct library '@aws-cdk/aws-dms'
The solution is primarily designed for RDS MySQL database. However, it can easily be adopted or extended for use with other databases like PostgreSQL or Oracle.
 
- DMSReplication class is construct responsible for creating resources such as replication instance, task settings, subnet-group and IAM role for accessing AWS Secrets Manager. Note that all database credentials are stored in AWS secrets manager.
  
- DMSStack class is construct that leverages  DMSReplication to provision the actual  resource(s) based on parameters provided by you via cdk.json
  
- ContextProps  is a  type that helps to map input parameters from cdk.json file in a type safe manner. The cdk.json file  includes settings related to DMS resources like replication instance, task settings, logging etc.  ContextProps also defines default values which can be overridden by you by defining it in the cdk.json file 

![dms-cdk-classes](./docs/dms-cdk-classes.png)


```

import * as cdk from '@aws-cdk/core';
import { DMSReplication } from '../lib/dms-replication';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-dms';

export class DemoDMSStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'DMSVpc', {});

    const dmsProps = {
      subnetIds: ['subnet-1', 'subnet-2'],
      replicationSubnetGroupIdentifier: 'dms-subnet-private',
      replicationInstanceClass: 'dms-replication-instance-t3',
      replicationInstanceIdentifier: 'dms-mysql-dev',
      migrationType: 'full-load',
      vpcSecurityGroupIds: ['sg-xxxx'],
      engineName: 'mysql',
      schemas: ['platform'],
      region: 'eu-central-1',
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

```

## Configuration Options

In the cdk.json file you define the DMS related settings.

| Params                              | Description                                                                    | Default       | Required |
| ----------------------------------- | :----------------------------------------------------------------------------- | :------------ | -------- |
| environment                         | Name of your environment to deploy the CDK application                         |   dev         |  y       |        
| subnetIds                           | Private/Public subnet ids of your VPC. If not publicly accessible use private  |               |  y       | 
| replicationInstanceClass            | The type of DMS instance class                                                 | dms.t3.medium |  n       | 
| replicationSubnetGroupIdentifier    | The identifier of teh subnet group where replication instance would be located |               |  n       |
| replicationInstanceIdentifier       | The unique identifier of the replication instance                              |               |  y       |
| migrationType                       | The type of migration. full-load or cdc or full-load-with-cdc                  | full-load     |  n       |
| sourceSecretsManagerSecretId        | ARN of secrets manager for source database credentials                         |               |  y       |
| sourceSecretsManagerRoleArn         | Role ARN to access secrets manager for sourceSecretsManagerSecretId            |               |  n       |
| targetSecretsManagerSecretId        | ARN of secrets manager for target database                                     |               |  y       |
| targetSecretsManagerRoleArn         | Role ARN to access secrets manager for sourceSecretsManagerSecretId            |               |  n       |
| allocatedStorage                    | Storage space for the replication instance (should be based on log size)       |  50g          |  n       |
| engineName                          | The name of database engine. Only mysql and maridb is allowed                  | mysql         |  n       |
| publiclyAccessible                  | If the DMS instance is publicly accessible.                                    | false         |  y       |


```
Example of cdk.json 

"context": {
    "environment": "dev",
    "account": "111111111111",

    "dev": {
      "region": "eu-central-1",
      "vpcId": "vpc-xxxxxxxxxxxxx",
      "subnetIds": [
        "subnet-xxxxxxxxxxxxxxxx",
        "subnet-xxxxxxxxxxxxxxxx"
      ],
      "vpcSecurityGroupIds": [
        "sg-08a0aa1614c454c63"
      ],
      "schemas": [
        {
          "name": "demo-src-db",
          "sourceSecretsManagerSecretId": "arn:aws:secretsmanager:eu-central-1:111111111111:secret:dev/mysql/app-p2I4pp",
          "targetSecretsManagerSecretId": "arn:aws:secretsmanager:eu-central-1:111111111111:secret:dev/mysql/app-p2I4pp"
        }        
      ],
      "replicationInstanceClass": "dms.r5.4xlarge",
      "replicationInstanceIdentifier": "dms-dev-eu",
      "replicationSubnetGroupIdentifier": "dms-dev-subnet-eu",
      "replicationTaskSettings": {
      },
      "migrationType": "full-load-and-cdc"
    }         
  }

```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
