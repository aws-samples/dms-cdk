/* eslint-disable no-unused-vars */
import * as cdk from 'aws-cdk-lib';
import DmsStack from '../lib/dms-stack';

const app = new cdk.App();
const dmsStack = new DmsStack(app, 'DmsOraclePostGresStack', {
  vpcId: 'vpc-id',
  subnetIds: ['subnet-1a', 'subnet-1b'],
  replicationInstanceClass: 'dms.r5.4xlarge',
  replicationInstanceIdentifier: 'test-repl-01',
  replicationSubnetGroupIdentifier: 'subnet-group',
  vpcSecurityGroupIds: ['vpc-sg'],
  engineVersion: '3.4.6',
  tasks: [
    {
      name: 'demo_stack',
      sourceSecretsManagerSecretId: 'sourceSecretsManagerSecretId',
      targetSecretsManagerSecretId: 'targetSecretsManagerSecretId',
      migrationType: 'cdc',
      engineName: 'oracle',
      targetEngineName: 'aurora-postgresql',
      tableMappings: {
        rules: [
          {
            'rule-type': 'selection',
            'rule-id': '1',
            'rule-name': '1',
            'object-locator': {
              'schema-name': 'demo_test',
              'table-name': '%',
            },
            'rule-action': 'include',
          },
        ],
      },
    },
  ],
  publiclyAccessible: true,
  allocatedStorage: 50,
  env: {
    account: '11111111111',
    region: 'eu-central-1',
  },
});
