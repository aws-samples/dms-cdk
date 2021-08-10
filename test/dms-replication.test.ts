import { expect as expectCDK, haveResource, NegatedAssertion } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import assert = require('assert');
import * as ec2 from '@aws-cdk/aws-ec2';
import { DMSTestStack } from './stacks/dms-test-stack';
import { SynthUtils } from '@aws-cdk/assert';
import { ContextProps, TaskSettings } from '../lib/context-props';
import * as Dms from '../lib/dms-stack';

let stack: DMSTestStack;

test('init stack', () => {
  const app = new cdk.App();
  // WHEN
  stack = new DMSTestStack(app, 'DMSTestStack');
  assert(stack.stackName, 'DMSTestStack');
});

test('should have AWS::DMS::ReplicationInstance', () => {
  expect(stack).toHaveResource('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms-mysql-uk',
    ReplicationInstanceIdentifier: 'test-repl-01',
    AllocatedStorage: 50,
    VpcSecurityGroupIds: ['vpc-security'],
  });
});

test('should have depends on in AWS::DMS::ReplicationInstance', () => {
  const { Resources } = SynthUtils.toCloudFormation(stack);

  //filters out ReplicationInstance from json
  const [repInstance1] = Object.keys(Resources)
    .map(resId => {
      return Resources[resId];
    })
    .filter(res => res.Type === 'AWS::DMS::ReplicationInstance');

  expect(repInstance1.DependsOn).toHaveLength(1);
});

test('should have AWS::DMS::ReplicationSubnetGroup', () => {
  expect(stack).toHaveResource('AWS::DMS::ReplicationSubnetGroup', {
    ReplicationSubnetGroupIdentifier: 'subnet-group',
  });
});

test('should allocated storage AWS::DMS::ReplicationInstance', () => {
  expect(stack).toHaveResource('AWS::DMS::ReplicationInstance', {
    ReplicationInstanceClass: 'dms-mysql-uk',
    AllocatedStorage: 50,
  });
});

test('test create endpoint', () => {
  // Create source endpoint
  const sourceEndpoint = stack.dmsReplication.createMySQLEndpoint(
    'src-endpoint-1',
    'source',
    'srcSecretRoleARN',
    'srcSecret'
  );

  // Create target endpoint
  const targetEndpoint = stack.dmsReplication.createMySQLEndpoint(
    'tgt-endpoint-2',
    'target',
    'targetSecretRoleARN',
    'targetSecret'
  );
  expect(stack).toCountResources('AWS::DMS::Endpoint', 2);
  expect(stack).toHaveResource('AWS::DMS::Endpoint');
  assert(sourceEndpoint.ref.length > 0);
  assert(targetEndpoint.ref.length > 0);
});

test('test target endpoint has Foreign key disabled', () => {
  // Create target endpoint
  const targetEndpoint = stack.dmsReplication.createMySQLEndpoint(
    'tgt-endpoint-3',
    'target',
    'targetSecretRoleARN',
    'targetSecret'
  );
  expect(stack).toHaveResourceLike('AWS::DMS::Endpoint', {
    ExtraConnectionAttributes: 'parallelLoadThreads=1 maxFileSize=512',
  });
});

test('test create replication task', () => {
  // Create source endpoint
  const sourceEndpoint = stack.dmsReplication.createMySQLEndpoint(
    'src-endpoint-3',
    'source',
    'srcSecretRoleARN',
    'srcSecret'
  );

  // Create target endpoint
  const targetEndpoint = stack.dmsReplication.createMySQLEndpoint(
    'tgt-endpoint-4',
    'target',
    'targetSecretRoleARN',
    'targetSecret'
  );

  stack.dmsReplication.createReplicationTask('replication-task', 'platform', sourceEndpoint, targetEndpoint);
  expect(stack).toHaveResourceLike('AWS::DMS::ReplicationTask', {
    MigrationType: 'full-load',
    ReplicationTaskIdentifier: 'replication-task',
  });

  expect(stack).toHaveResourceLike('AWS::DMS::ReplicationTask', {
    TableMappings:
      '{"rules":[{"rule-type":"selection","rule-id":"1","rule-name":"1","object-locator":{"schema-name":"platform","table-name":"%"},"rule-action":"include"}]}',
  });
});

jest.mock('../lib/resource-importer', () => {
  return {
    ResourceImporter: jest.fn().mockImplementation(() => {
      return {
        getVpc: (vpcId: string, scope: cdk.Construct) => {
          return new ec2.Vpc(scope, vpcId, {
            cidr: '10.2.0.0/16',
          });
        },
      };
    }),
  };
});
