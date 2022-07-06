import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ContextProps } from './context-props';
import { DmsReplication } from './dms-replication';
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
      vpcSecurityGroupIds: context.vpcSecurityGroupIds!,
      engineName: context.engineName,
      targetEngineName: context.targetEngineName,
      region: cdk.Stack.of(this).region,
      engineVersion: context.engineVersion ? context.engineVersion : '3.4.6',
      databaseName: context.databaseName,
      publiclyAccessible: context.publiclyAccessible,
    };

    const dmsReplication = new DmsReplication(this, 'Replication', dmsProps);
    const suffix = context.replicationInstanceIdentifier;

    // Creates DMS Task for each schema
    context.schemas.forEach(
      (schema: { name: string; sourceSecretsManagerSecretId: string; targetSecretsManagerSecretId: string }) => {
        let source;
        let target;

        let schemaName = schema.name;

        if (schema.name.includes('_')) {
          schemaName = schema.name.replace('_', '-');
        }

        switch (context.engineName) {
          case 'mysql':
            source = dmsReplication.createMySQLEndpoint(
              `source-${schemaName}-${suffix}`,
              'source',
              schema.sourceSecretsManagerSecretId
            );
            break;
          case 'oracle':
            source = dmsReplication.createOracleEndpoint(
              `source-${schemaName}-${suffix}`,
              'source',
              schema.sourceSecretsManagerSecretId,
              context.databaseName!
            );
            break;
          case 'sqlserver':
            source = dmsReplication.createSqlServerEndpoint(
              `source-${schemaName}-${suffix}`,
              'source',
              schema.sourceSecretsManagerSecretId,
              context.databaseName!
            );
            break;
          case 'postgres':
            source = dmsReplication.createPostgresEndpoint(
              `source-${schemaName}-${suffix}`,
              'source',
              schema.sourceSecretsManagerSecretId,
              context.databaseName!
            );
            break;
          default:
            source = dmsReplication.createMySQLEndpoint(
              `source-${schemaName}-${suffix}`,
              'source',
              schema.sourceSecretsManagerSecretId
            );
            break;
        }

        switch (context.targetEngineName) {
          case 'mysql':
            target = dmsReplication.createMySQLEndpoint(
              `target-${schemaName}-${suffix}`,
              'target',
              schema.targetSecretsManagerSecretId
            );
            break;
          case 'oracle':
            target = dmsReplication.createOracleEndpoint(
              `target-${schemaName}-${suffix}`,
              'target',
              schema.targetSecretsManagerSecretId,
              context.databaseName!
            );
            break;
          case 'aurora-postgresql':
            target = dmsReplication.createAuroraPostgresEndpoint(
              `target-${schemaName}-${suffix}`,
              'target',
              schema.targetSecretsManagerSecretId,
              context.databaseName!
            );
            break;
          case 'sqlserver':
            target = dmsReplication.createSqlServerEndpoint(
              `target-${schemaName}-${suffix}`,
              'target',
              schema.targetSecretsManagerSecretId,
              context.databaseName!
            );
            break;
          case 'postgres':
            target = dmsReplication.createPostgresEndpoint(
              `target-${schemaName}-${suffix}`,
              'target',
              schema.targetSecretsManagerSecretId,
              context.databaseName!
            );
            break;
          default:
            target = dmsReplication.createMySQLEndpoint(
              `target-${schemaName}-${suffix}`,
              'target',
              schema.targetSecretsManagerSecretId
            );
            break;
        }

        dmsReplication.createReplicationTask(
          `${schemaName}-replication-${suffix}`,
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
