#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import DmsStack from '../lib/dms-stack';

const app = new cdk.App();

// get context params
const env = app.node.tryGetContext('environment');

// get context from conf
const context = JSON.parse(fs.readFileSync('./conf/env.json', 'utf-8'));

const dmsProps = {
  vpcId: context[env].vpcId,
  subnetIds: context[env].subnetIds,
  replicationSubnetGroupIdentifier: context[env].replicationSubnetGroupIdentifier,
  replicationInstanceClass: context[env].replicationInstanceClass,
  replicationInstanceIdentifier: context[env].replicationInstanceIdentifier,
  schemas: context[env].schemas,
  publiclyAccessible: context[env].publiclyAccessible,
};

new DmsStack(app, 'DmsStack', dmsProps);
