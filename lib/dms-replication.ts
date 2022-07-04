import * as dms from 'aws-cdk-lib/aws-dms';
import { TaskSettings } from './context-props';
import { Role, PolicyDocument, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnReplicationSubnetGroup, CfnReplicationInstance, CfnReplicationTask, CfnEndpoint } from 'aws-cdk-lib/aws-dms';
import { Construct } from 'constructs';

export type DMSProps = {
  subnetIds: string[];
  replicationInstanceClass?: string;
  replicationInstanceIdentifier: string;
  replicationSubnetGroupIdentifier: string;
  vpcSecurityGroupIds: string[];
  allocatedStorage?: number;
  engineName?: string;
  publiclyAccessible?: false;
  region: string;
  engineVersion?: string;
};

export class DMSReplication extends Construct {
  private instance: dms.CfnReplicationInstance;
  private region: string;
  private secretsManagerAccessRole: Role;

  constructor(scope: Construct, id: string, props: DMSProps) {
    super(scope, id);

    props = getPropsWithDefaults(props);
    const subnetGrp = this.createSubnetGroup(props);
    this.region = props.region;
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
  public createSubnetGroup(props: DMSProps): CfnReplicationSubnetGroup {
    const subnet = new CfnReplicationSubnetGroup(this, 'dms-subnet-group', {
      replicationSubnetGroupIdentifier: props.replicationSubnetGroupIdentifier,
      replicationSubnetGroupDescription: 'Private subnets that have access to my data source and target',
      subnetIds: props.subnetIds,
    });
    return subnet;
  }

  /**
   * Creates IAM role to access secrets manager for setting up DMS endpoints.
   *
   * @returns
   */
  public createRoleForSecretsManagerAccess(): Role {
    const role = new Role(this, 'dms-secretsmgr-access-role', {
      assumedBy: new ServicePrincipal('dms.' + this.region + '.amazonaws.com'),
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
   * Creates replication instance where DMS replication tasks runs.
   *
   * @param id
   * @param subnet
   * @returns CfnReplicationInstance Replication Instance
   */
  private createReplicationInstance(props: DMSProps): CfnReplicationInstance {
    const instance = new CfnReplicationInstance(this, 'dms-replication-instance', {
      replicationInstanceClass: props.replicationInstanceClass || 'dms.t3.medium',
      replicationSubnetGroupIdentifier: props.replicationSubnetGroupIdentifier,
      replicationInstanceIdentifier: props.replicationInstanceIdentifier,
      vpcSecurityGroupIds: props.vpcSecurityGroupIds,
      allocatedStorage: props.allocatedStorage,
      publiclyAccessible: props.publiclyAccessible,
      engineVersion: props.engineVersion
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
    const endpoint = new CfnEndpoint(this, 'dms-' + endpointType + '-' + endpointIdentifier, {
      endpointIdentifier: endpointIdentifier,
      endpointType: endpointType,
      engineName: 'mysql',
      mySqlSettings: { secretsManagerAccessRoleArn: this.secretsManagerAccessRole.roleArn, secretsManagerSecretId: secretId },
      extraConnectionAttributes: endpointType == 'source' ? 'parallelLoadThreads=1' : target_extra_conn_attr,
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
    schema: string,
    source: CfnEndpoint,
    target: CfnEndpoint,
    migrationType?: 'cdc' | 'full-load' | 'full-load-and-cdc',
    replicationTaskSettings?: TaskSettings
  ): CfnReplicationTask {
    const replicationTask = new CfnReplicationTask(this, replicationTaskIdentifier, {
      replicationInstanceArn: this.instance.ref,
      replicationTaskIdentifier: replicationTaskIdentifier,
      migrationType: migrationType || 'full-load',
      sourceEndpointArn: source.ref,
      targetEndpointArn: target.ref,
      replicationTaskSettings: JSON.stringify(replicationTaskSettings),
      tableMappings: JSON.stringify({
        rules: [
          {
            'rule-type': 'selection',
            'rule-id': '1',
            'rule-name': '1',
            'object-locator': {
              'schema-name': schema,
              'table-name': '%',
            },
            'rule-action': 'include',
          },
        ],
      }),
    });

    return replicationTask;
  }
}

/**
 * Returns default sets of properties
 *
 * @param props
 * @returns
 */
function getPropsWithDefaults(props: DMSProps): DMSProps {
  const propsWithDefaults = Object.assign(
    {
      replicationInstanceClass: 'dms.t3.medium',
      replicationSubnetGroupIdentifier: 'default-subnet-group',
      sourceDBPort: 3306,
      targetDBPort: 3306,
      allocatedStorage: 50,
      engineName: 'mysql' || 'mariadb' || 'oracle',
      publiclyAccessible: false,
      engineVersion: '3.4.6'
    },
    props
  );

  return propsWithDefaults;
}
