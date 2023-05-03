import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DmsReplication } from './dms-replication';
import { DmsProps } from './dms-props';

class DmsStack extends cdk.Stack {
  public dmsReplication;

  constructor(scope: Construct, id: string, props: DmsProps) {
    super(scope, id, props);

    this.dmsReplication = new DmsReplication(this, 'Replication', props);
    const suffix = props.replicationInstanceIdentifier;

    // Creates DMS Task for each schema
    props.tasks.forEach(task => {
      let source;
      let target;

      // endpoints cannot have underscore
      const schemaName = task.name.includes('_') ? task.name.replace('_', '-') : task.name;

      // source
      switch (task.engineName) {
        case 'mysql':
          source = this.dmsReplication.createMySQLEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            task.sourceSecretsManagerSecretId
          );
          break;
        case 'oracle':
          source = this.dmsReplication.createOracleEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            task.sourceSecretsManagerSecretId,
            task.databaseName!
          );
          break;
        case 'sqlserver':
          source = this.dmsReplication.createSqlServerEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            task.sourceSecretsManagerSecretId,
            task.databaseName!
          );
          break;
        case 'postgres':
          source = this.dmsReplication.createPostgresEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            task.sourceSecretsManagerSecretId,
            task.databaseName!
          );
          break;
        default:
          source = this.dmsReplication.createMySQLEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            task.sourceSecretsManagerSecretId
          );
          break;
      }

      // target
      switch (task.targetEngineName) {
        case 'mysql':
          target = this.dmsReplication.createMySQLEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            task.targetSecretsManagerSecretId
          );
          break;
        case 'oracle':
          target = this.dmsReplication.createOracleEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            task.targetSecretsManagerSecretId,
            task.databaseName!
          );
          break;
        case 'aurora-postgresql':
          target = this.dmsReplication.createAuroraPostgresEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            task.targetSecretsManagerSecretId,
            task.databaseName!
          );
          break;
        case 'sqlserver':
          target = this.dmsReplication.createSqlServerEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            task.targetSecretsManagerSecretId,
            task.databaseName!
          );
          break;
        case 'postgres':
          target = this.dmsReplication.createPostgresEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            task.targetSecretsManagerSecretId,
            task.databaseName!
          );
          break;
        default:
          target = this.dmsReplication.createMySQLEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            task.targetSecretsManagerSecretId
          );
          break;
      }

      this.dmsReplication.createReplicationTask(
        `${schemaName}-replication-${suffix}`,
        source,
        target,
        task.migrationType,
        task.tableMappings
      );
    });
  }
}
export default DmsStack;
