#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import DmsStack from '../lib/dms-stack';

const app = new cdk.App();

// get context from conf
const environment = app.node.tryGetContext('environment');
const ctx = app.node.tryGetContext(environment);

const dmsProps = {
  vpcId: ctx.vpcId,
  subnetIds: ctx.subnetIds,
  replicationSubnetGroupIdentifier: ctx.replicationSubnetGroupIdentifier,
  replicationInstanceClass: ctx.replicationInstanceClass,
  replicationInstanceIdentifier: ctx.replicationInstanceIdentifier,
  schemas: ctx.schemas,
  publiclyAccessible: ctx.publiclyAccessible,
  stackName: `dms-cdk-stack`,
  env: {
    region: ctx.region,
    account: ctx.account,
  },
};

new DmsStack(app, 'DmsStack', dmsProps);
