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
    props.schemas.forEach(schema => {
      let source;
      let target;

      const schemaName = schema.name.includes('_') ? schema.name.replace('_', '-') : schema.name;
      // source
      switch (schema.engineName) {
        case 'mysql':
          source = this.dmsReplication.createMySQLEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            schema.sourceSecretsManagerSecretId
          );
          break;
        case 'oracle':
          source = this.dmsReplication.createOracleEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            schema.sourceSecretsManagerSecretId,
            schema.databaseName!
          );
          break;
        case 'sqlserver':
          source = this.dmsReplication.createSqlServerEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            schema.sourceSecretsManagerSecretId,
            schema.databaseName!
          );
          break;
        case 'postgres':
          source = this.dmsReplication.createPostgresEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            schema.sourceSecretsManagerSecretId,
            schema.databaseName!
          );
          break;
        default:
          source = this.dmsReplication.createMySQLEndpoint(
            `source-${schemaName}-${suffix}`,
            'source',
            schema.sourceSecretsManagerSecretId
          );
          break;
      }

      // target
      switch (schema.targetEngineName) {
        case 'mysql':
          target = this.dmsReplication.createMySQLEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            schema.targetSecretsManagerSecretId
          );
          break;
        case 'oracle':
          target = this.dmsReplication.createOracleEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            schema.targetSecretsManagerSecretId,
            schema.databaseName!
          );
          break;
        case 'aurora-postgresql':
          target = this.dmsReplication.createAuroraPostgresEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            schema.targetSecretsManagerSecretId,
            schema.databaseName!
          );
          break;
        case 'sqlserver':
          target = this.dmsReplication.createSqlServerEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            schema.targetSecretsManagerSecretId,
            schema.databaseName!
          );
          break;
        case 'postgres':
          target = this.dmsReplication.createPostgresEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            schema.targetSecretsManagerSecretId,
            schema.databaseName!
          );
          break;
        default:
          target = this.dmsReplication.createMySQLEndpoint(
            `target-${schemaName}-${suffix}`,
            'target',
            schema.targetSecretsManagerSecretId
          );
          break;
      }

      this.dmsReplication.createReplicationTask(
        `${schema.name}-replication-${suffix}`,
        schema.name,
        source,
        target,
        schema.migrationType
      );
    });
  }
}
export default DmsStack;
