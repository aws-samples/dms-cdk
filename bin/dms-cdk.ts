#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import DmsStack from '../lib/dms-stack';

const app = new cdk.App();

// get context params
const env = app.node.tryGetContext('environment');

// get context from conf
const context = JSON.parse(fs.readFileSync('./conf/env.json', 'utf-8'));

new DmsStack(app, 'DmsStack', {
  context,
  env: {
    account: context[env].account,
    region: context[env].region,
  },
});
