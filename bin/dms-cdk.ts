#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ContextProps } from '../lib/context-props';
import DmsStack from '../lib/dms-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment');
const context: ContextProps = app.node.tryGetContext(environment);
context.environment = environment;

const account = app.node.tryGetContext('account');
context.account = account;

new DmsStack(app, 'DmsStack', {
  context,
  env: {
    account: context.account,
    region: context.region,
  },
});
