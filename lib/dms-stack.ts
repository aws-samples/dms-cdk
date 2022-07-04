import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ContextProps } from './context-props';
import DMSReplication from './dms-replication';
import getTaskSettings from './task-settings';

type DmsProps = cdk.StackProps & {
  context: ContextProps;
};

class DmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DmsProps) {
    super(scope, id, props);
    const context = getTaskSettings(props.context);

    const dmsProps = {
      subnetIds: context.subnetIds,
      replicationSubnetGroupIdentifier: context.replicationSubnetGroupIdentifier,
      replicationInstanceClass: context.replicationInstanceClass,
      replicationInstanceIdentifier: context.replicationInstanceIdentifier,
      vpcSecurityGroupIds: context.vpcSecurityGroupIds,
      engineName: 'mysql',
      region: cdk.Stack.of(this).region,
      engineVersion: context.engineVersion ? context.engineVersion : '3.4.6',
    };

    const dmsReplication = new DMSReplication(this, 'Replication', dmsProps);
    const suffix = context.replicationInstanceIdentifier;

    // Creates DMS Task for each schema
    context.schemas.forEach(
      (schema: { name: string; sourceSecretsManagerSecretId: string; targetSecretsManagerSecretId: string }) => {
        const source = dmsReplication.createMySQLEndpoint(
          `source-${schema.name}-${suffix}`,
          'source',
          schema.sourceSecretsManagerSecretId
        );

        const target = dmsReplication.createMySQLEndpoint(
          `target-${schema.name}-${suffix}`,
          'target',
          schema.targetSecretsManagerSecretId
        );

        dmsReplication.createReplicationTask(
          `${schema.name}-replication-${suffix}`,
          schema.name,
          source,
          target,
          context.migrationType,
          context.replicationTaskSettings
        );
      }
    );
  }
}
export default DmsStack;
