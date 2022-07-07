import * as cdk from 'aws-cdk-lib';
import { Rules } from './rules-props';

export declare type SchemaConfig = {
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
   * Role to access source secretTaskSettings;
   */
  sourceSecretsManagerRoleArn?: string;

  /**
   * Type of migration full-load (default) or fullload-with-cdc
   */
  migrationType: 'cdc' | 'full-load' | 'full-load-and-cdc';

  /** Source database Engine names */
  engineName: 'mysql' | 'oracle' | 'aurora-postgresql' | 'sqlserver' | 'postgres';

  /** Target database Engine names */
  targetEngineName: 'mysql' | 'oracle' | 'aurora-postgresql' | 'sqlserver' | 'postgres';

  /** Database name for oracle and postgres */
  databaseName?: string;

  /** Mapping or Transformation rules */
  tableMappings: Rules;
};

export declare type DmsProps = cdk.StackProps & {
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

  /** DMS is publicly accessible */
  publiclyAccessible?: boolean;

  /** DMS Engine Version */
  engineVersion?: '3.4.6' | '3.4.7';

  allocatedStorage?: number;
};
