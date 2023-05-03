/* eslint-disable import/prefer-default-export */
/* eslint-disable camelcase */
import * as dms from 'aws-cdk-lib/aws-dms';
import * as cdk from 'aws-cdk-lib';
import { Role, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  CfnReplicationSubnetGroup,
  CfnReplicationInstance,
  CfnReplicationTask,
  CfnEndpoint,
} from 'aws-cdk-lib/aws-dms';
import { Construct } from 'constructs';
import { DmsProps } from './dms-props';
import { TaskSettings } from '../conf/task_settings.json';
import { Rules } from './rules-props';

class DmsReplication extends Construct {
  private instance: dms.CfnReplicationInstance;

  private region: string;

  private secretsManagerAccessRole: Role;

  constructor(scope: Construct, id: string, props: DmsProps) {
    super(scope, id);

    const subnetGrp = this.createSubnetGroup(props);
    this.region = cdk.Stack.of(this).region;
    this.secretsManagerAccessRole = this.createRoleForSecretsManagerAccess();
    const replicationInstance = this.createReplicationInstance(props);
    replicationInstance.addDependsOn(subnetGrp);

    this.instance = replicationInstance;
  }

  /**
   * Creates subnet group where DMS runs its task
   *
   * @param replicationSubnetGroupIdentifier
   * @param subnetIds
   * @returns
   */
  public createSubnetGroup(props: DmsProps): CfnReplicationSubnetGroup {
    const subnet = new CfnReplicationSubnetGroup(this, 'dms-subnet-group', {
      replicationSubnetGroupIdentifier: props.replicationSubnetGroupIdentifier,
      replicationSubnetGroupDescription: 'Private subnets that have access to my data source and target',
      subnetIds: props.subnetIds,
    });
    return subnet;
  }

  /**
   * Creates IAM role to access secrets manager for provisioning DMS endpoints.
   *
   * @returns
   */
  public createRoleForSecretsManagerAccess(): Role {
    const role = new Role(this, 'dms-secretsmgr-access-role', {
      assumedBy: new ServicePrincipal(`dms.${this.region}.amazonaws.com`),
    });

    role.addToPolicy(
      new PolicyStatement({
        resources: ['*'],
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
          'secretsmanager:ListSecretVersionIds',
          'secretsmanager:ListSecrets',
        ],
      })
    );

    return role;
  }

  /**
   * Creates replication instance where DMS multiple DMS replication tasks runs.
   *
   * @param props
   * @returns
   */
  private createReplicationInstance(props: DmsProps): CfnReplicationInstance {
    const instance = new CfnReplicationInstance(this, 'dms-replication-instance', {
      replicationInstanceClass: props.replicationInstanceClass || 'dms.t3.medium',
      replicationSubnetGroupIdentifier: props.replicationSubnetGroupIdentifier,
      replicationInstanceIdentifier: props.replicationInstanceIdentifier,
      vpcSecurityGroupIds: props.vpcSecurityGroupIds,
      allocatedStorage: props.allocatedStorage,
      publiclyAccessible: props.publiclyAccessible,
      engineVersion: props.engineVersion,
    });

    return instance;
  }

  /**
   * Creates endpoints for DMS tasks targeted for MySQL DB. Endpoint represents database source and target destionation.
   *
   * @param endpointIdentifier
   * @param endpointType
   * @param secretId - Secret ARN for the database which contains database, user, password...
   * @param secretAccessRoleArn Role to be assumed by DMS to access the secrets store
   * @returns CfnEndpoint
   */
  public createMySQLEndpoint(
    endpointIdentifier: string,
    endpointType: 'source' | 'target',
    secretId: string
  ): CfnEndpoint {
    const target_extra_conn_attr = 'parallelLoadThreads=1 maxFileSize=512';
    const endpoint = new CfnEndpoint(this, `mysql-${endpointType}-${endpointIdentifier}`, {
      endpointIdentifier,
      endpointType,
      engineName: 'mysql',
      mySqlSettings: {
        secretsManagerAccessRoleArn: this.secretsManagerAccessRole.roleArn,
        secretsManagerSecretId: secretId,
      },
      extraConnectionAttributes: endpointType === 'source' ? 'parallelLoadThreads=1' : target_extra_conn_attr,
    });

    return endpoint;
  }

  /**
   * Creates endpoint for oracle database
   *
   * @param endpointIdentifier
   * @param endpointType
   * @param secretId
   * @param databaseName
   * @returns
   */
  public createOracleEndpoint(
    endpointIdentifier: string,
    endpointType: 'source' | 'target',
    secretId: string,
    databaseName: string
  ): CfnEndpoint {
    const target_extra_conn_attr =
      'useLogMinerReader=N;useBfile=Y;failTasksOnLobTruncation=true;numberDataTypeScale=-2';
    const endpoint = new CfnEndpoint(this, `oracle-${endpointType}-${endpointIdentifier}`, {
      endpointIdentifier,
      endpointType,
      engineName: 'oracle',
      databaseName,
      oracleSettings: {
        secretsManagerAccessRoleArn: this.secretsManagerAccessRole.roleArn,
        secretsManagerSecretId: secretId,
      },
      extraConnectionAttributes: endpointType === 'source' ? 'addSupplementalLogging=true' : target_extra_conn_attr,
    });

    return endpoint;
  }

  /**
   * Creates endpoint for Aurora PostgresSql
   *
   * @param endpointIdentifier
   * @param endpointType
   * @param secretId
   * @param databaseName
   * @returns
   */
  public createAuroraPostgresEndpoint(
    endpointIdentifier: string,
    endpointType: 'source' | 'target',
    secretId: string,
    databaseName: string
  ): CfnEndpoint {
    const target_extra_conn_attr = 'executeTimeout=180';
    const endpoint = new CfnEndpoint(this, `aurora-postgresql-${endpointType}-${endpointIdentifier}`, {
      endpointIdentifier,
      endpointType,
      engineName: 'aurora-postgresql',
      databaseName,
      postgreSqlSettings: {
        secretsManagerAccessRoleArn: this.secretsManagerAccessRole.roleArn,
        secretsManagerSecretId: secretId,
      },
      extraConnectionAttributes: endpointType === 'source' ? 'heartbeatFrequency=5' : target_extra_conn_attr,
    });

    return endpoint;
  }

  /**
   * Creates endpoint for PostgresSql
   *
   * @param endpointIdentifier
   * @param endpointType
   * @param secretId
   * @param databaseName
   * @returns
   */
  public createPostgresEndpoint(
    endpointIdentifier: string,
    endpointType: 'source' | 'target',
    secretId: string,
    databaseName: string
  ): CfnEndpoint {
    const target_extra_conn_attr = 'executeTimeout=180';
    const endpoint = new CfnEndpoint(this, `postgresql-${endpointType}-${endpointIdentifier}`, {
      endpointIdentifier,
      endpointType,
      engineName: 'postgres',
      databaseName,
      postgreSqlSettings: {
        secretsManagerAccessRoleArn: this.secretsManagerAccessRole.roleArn,
        secretsManagerSecretId: secretId,
      },
      extraConnectionAttributes: endpointType === 'source' ? 'heartbeatFrequency=5' : target_extra_conn_attr,
    });

    return endpoint;
  }

  /**
   * Creates endpoint for Microsoft SqlServer
   *
   * @param endpointIdentifier
   * @param endpointType
   * @param secretId
   * @param databaseName
   * @returns
   */
  public createSqlServerEndpoint(
    endpointIdentifier: string,
    endpointType: 'source' | 'target',
    secretId: string,
    databaseName: string
  ): CfnEndpoint {
    const endpoint = new CfnEndpoint(this, `sqlserver-${endpointType}-${endpointIdentifier}`, {
      endpointIdentifier,
      endpointType,
      engineName: 'sqlserver',
      databaseName,
      microsoftSqlServerSettings: {
        secretsManagerAccessRoleArn: this.secretsManagerAccessRole.roleArn,
        secretsManagerSecretId: secretId,
      },
    });

    return endpoint;
  }

  /**
   * Creates replication tasks for per schema. Replication tasks runs in replication instance.
   *
   * @param props DMS properties
   * @returns CfnReplicationTask
   */
  public createReplicationTask(
    replicationTaskIdentifier: string,
    source: CfnEndpoint,
    target: CfnEndpoint,
    migrationType: 'cdc' | 'full-load' | 'full-load-and-cdc',
    rules: Rules
  ): CfnReplicationTask {
    const replicationTask = new CfnReplicationTask(this, replicationTaskIdentifier, {
      replicationInstanceArn: this.instance.ref,
      replicationTaskIdentifier,
      migrationType: migrationType || 'full-load',
      sourceEndpointArn: source.ref,
      targetEndpointArn: target.ref,
      replicationTaskSettings: JSON.stringify(TaskSettings),
      tableMappings: JSON.stringify(rules),
    });
    return replicationTask;
  }
}

export { DmsReplication };
