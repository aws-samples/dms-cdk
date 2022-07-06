import { TaskSettings } from '../conf/task_settings.json';
import { TableMapping } from './table-mapping';

export interface SchemaConfig {
  name: string;

  /**
   * Secrets manager arn for the target database
   */
  targetSecretsManagerSecretId: string;

  /**
   * Role to access target secret
   */
  targetSecretsManagerRoleArn?: string;

  /**
   * Secrets manager arn for the target database
   */
  sourceSecretsManagerSecretId: string;

  /**
   * Role to access source secret
   */
  sourceSecretsManagerRoleArn?: string;
}

export interface ContextProps {
  /**
   * This property is populated by code
   */
  environment: string;
  /**
   * This property is populated by code
   */
  account: string;
  /**
   * Target AWS region where CDK is provisioning the resources
   */
  region: string;
  /**
   * Target VPC where CDK is provisioning the RDS instances and Security Groups
   */
  vpcId: string;
  /**
   * Target Subnets where CDK is deploying the RDS instances
   */
  subnetIds: string[];

  /**
   *  Security group Ids of target RDS for DMS task access
   */
  vpcSecurityGroupIds?: string[];

  /**
   * List of databases to be migrated
   */
  schemas: SchemaConfig[];

  /**
   *  Type of replication instance dms.t3.medium (default)
   */
  replicationInstanceClass: string;

  /**
   * Identifier for the replication instance
   */
  replicationInstanceIdentifier: string;

  /**
   * Subnet Group identfier for DMS tasks to run. This should be private subnet in a vpc
   */
  replicationSubnetGroupIdentifier: string;

  /**
   * Type of migration full-load (default) or fullload-with-cdc
   */
  migrationType: 'cdc' | 'full-load' | 'full-load-and-cdc';

  /**
   * See https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Tasks.CustomizingTasks.TaskSettings.html
   */
  replicationTaskSettings?: TaskSettings;

  /** DMS Engine Version */
  engineVersion?: '3.4.6' | '3.4.7';

  /** Source database Engine names */
  engineName: 'mysql' | 'oracle' | 'aurora-postgresql' | 'sqlserver' | 'postgres';

  /** Target database Engine names */
  targetEngineName: 'mysql' | 'oracle' | 'aurora-postgresql' | 'sqlserver' | 'postgres';

  /** Database name for oracle and postgres */
  databaseName?: string;

  /** DMS is publicly accessible */
  publiclyAccessible: boolean;
}
