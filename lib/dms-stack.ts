import * as cdk from 'aws-cdk-lib';
import { ContextProps } from './context-props';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { DMSReplication } from '..';
import { Construct } from 'constructs';

type DmsProps = cdk.StackProps & {
  context: ContextProps;
};

export class DMSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DmsProps) {
    super(scope, id, props);
    const context: ContextProps = propsWithDefaults(props.context);

    const dmsProps = {
      subnetIds: context.subnetIds,
      replicationSubnetGroupIdentifier: context.replicationSubnetGroupIdentifier,
      replicationInstanceClass: context.replicationInstanceClass,
      replicationInstanceIdentifier: context.replicationInstanceIdentifier,
      vpcSecurityGroupIds: context.vpcSecurityGroupIds,
      engineName: 'mysql',
      region: cdk.Stack.of(this).region,
      engineVersion: context.engineVersion ? context.engineVersion : '3.4.6'
    };

    const dmsReplication = new DMSReplication(this, 'Replication', dmsProps);
    const suffix = context.replicationInstanceIdentifier;


    //Creates DMS Task for each schema
    context.schemas.forEach(schema => {
      const source = dmsReplication.createMySQLEndpoint(
        'source-' + schema.name + '-' + suffix,
        'source',
        schema.sourceSecretsManagerSecretId
      );

      const target = dmsReplication.createMySQLEndpoint(
        'target-' + schema.name + '-' + suffix,
        'target',
        schema.targetSecretsManagerSecretId
      );

      dmsReplication.createReplicationTask(
        schema.name + '-replication-' + suffix,
        schema.name,
        source,
        target,
        context.migrationType,
        context.replicationTaskSettings
      );
    });
  }
}

function propsWithDefaults(context: ContextProps): ContextProps {
  context.replicationTaskSettings = context.replicationTaskSettings || {};

  context.replicationTaskSettings.TargetMetadata = Object.assign(
    {
      TargetSchema: '',
      SupportLobs: true,
      FullLobMode: true,
      LobChunkSize: 256,
      LimitedSizeLobMode: false,
      LobMaxSize: 0,
      InlineLobMaxSize: 64,
      LoadMaxFileSize: 500,
      ParallelLoadThreads: 0,
      ParallelLoadBufferSize: 0,
      BatchApplyEnabled: true,
      TaskRecoveryTableEnabled: true,
      ParallelLoadQueuesPerThread: 0,
      ParallelApplyThreads: 0,
      ParallelApplyBufferSize: 0,
      ParallelApplyQueuesPerThread: 0,
    },
    context.replicationTaskSettings.TargetMetadata
  );

  context.replicationTaskSettings.FullLoadSettings = Object.assign(
    {
      TargetTablePrepMode: 'TRUNCATE_BEFORE_LOAD',
      CreatePkAfterFullLoad: false,
      StopTaskCachedChangesApplied: false,
      StopTaskCachedChangesNotApplied: true,
      MaxFullLoadSubTasks: 16,
      TransactionConsistencyTimeout: 900,
      CommitRate: 50000,
    },
    context.replicationTaskSettings.FullLoadSettings
  );

  context.replicationTaskSettings.Logging = Object.assign(
    {
      EnableLogging: true,
      LogComponents: [
        {
          Id: 'TRANSFORMATION',
          Severity: 'LOGGER_SEVERITY_DEFAULT',
        },
        {
          Id: 'SOURCE_UNLOAD',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'IO',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'TARGET_LOAD',
          Severity: 'LOGGER_SEVERITY_DEFAULT',
        },
        {
          Id: 'PERFORMANCE',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'SOURCE_CAPTURE',
          Severity: 'LOGGER_SEVERITY_DEFAULT',
        },
        {
          Id: 'SORTER',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'REST_SERVER',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'VALIDATOR_EXT',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'TARGET_APPLY',
          Severity: 'LOGGER_SEVERITY_DEFAULT',
        },
        {
          Id: 'TASK_MANAGER',
          Severity: 'LOGGER_SEVERITY_DEFAULT',
        },
        {
          Id: 'TABLES_MANAGER',
          Severity: 'LOGGER_SEVERITY_DEFAULT',
        },
        {
          Id: 'METADATA_MANAGER',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'FILE_FACTORY',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'COMMON',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'ADDONS',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'DATA_STRUCTURE',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'COMMUNICATION',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
        {
          Id: 'FILE_TRANSFER',
          Severity: 'LOGGER_SEVERITY_ERROR',
        },
      ],
    },
    context.replicationTaskSettings.Logging
  );

  context.replicationTaskSettings.ControlTablesSettings = Object.assign(
    {
      ControlSchema: '',
      HistoryTimeslotInMinutes: 5,
      HistoryTableEnabled: false,
      SuspendedTablesTableEnabled: false,
      StatusTableEnabled: false,
      FullLoadExceptionTableEnabled: false,
    },
    context.replicationTaskSettings.ControlTablesSettings
  );

  context.replicationTaskSettings.StreamBufferSettings = Object.assign(
    {
      StreamBufferCount: 4,
      StreamBufferSizeInMB: 16,
      CtrlStreamBufferSizeInMB: 5,
    },
    context.replicationTaskSettings.StreamBufferSettings
  );

  context.replicationTaskSettings.ChangeProcessingDdlHandlingPolicy = Object.assign(
    {
      HandleSourceTableDropped: true,
      HandleSourceTableTruncated: true,
      HandleSourceTableAltered: true,
    },
    context.replicationTaskSettings.ChangeProcessingDdlHandlingPolicy
  );

  context.replicationTaskSettings.ErrorBehavior = Object.assign(
    {
      DataErrorPolicy: 'LOG_ERROR',
      DataTruncationErrorPolicy: 'LOG_ERROR',
      DataErrorEscalationPolicy: 'SUSPEND_TABLE',
      DataErrorEscalationCount: 0,
      TableErrorPolicy: 'SUSPEND_TABLE',
      TableErrorEscalationPolicy: 'STOP_TASK',
      TableErrorEscalationCount: 0,
      RecoverableErrorCount: -1,
      RecoverableErrorInterval: 5,
      RecoverableErrorThrottling: true,
      RecoverableErrorThrottlingMax: 1800,
      RecoverableErrorStopRetryAfterThrottlingMax: true,
      ApplyErrorDeletePolicy: 'IGNORE_RECORD',
      ApplyErrorInsertPolicy: 'LOG_ERROR',
      ApplyErrorUpdatePolicy: 'LOG_ERROR',
      ApplyErrorEscalationPolicy: 'LOG_ERROR',
      ApplyErrorEscalationCount: 0,
      ApplyErrorFailOnTruncationDdl: false,
      FullLoadIgnoreConflicts: true,
      FailOnTransactionConsistencyBreached: false,
      FailOnNoTablesCaptured: true,
    },
    context.replicationTaskSettings.ErrorBehavior
  );

  context.replicationTaskSettings.ChangeProcessingTuning = Object.assign(
    {
      BatchApplyPreserveTransaction: true,
      BatchApplyTimeoutMin: 1,
      BatchApplyTimeoutMax: 120,
      BatchApplyMemoryLimit: 500,
      BatchSplitSize: 0,
      MinTransactionSize: 1000,
      CommitTimeout: 1,
      MemoryLimitTotal: 2048,
      MemoryKeepTime: 120,
      StatementCacheSize: 50,
    },
    context.replicationTaskSettings.ChangeProcessingTuning
  );

  context.replicationTaskSettings.ValidationSettings = Object.assign(
    {
      EnableValidation: false,
      ValidationMode: 'ROW_LEVEL',
      ThreadCount: 8,
      PartitionSize: 10000,
      FailureMaxCount: 10000,
      RecordFailureDelayInMinutes: 5,
      RecordSuspendDelayInMinutes: 30,
      MaxKeyColumnSize: 8096,
      TableFailureMaxCount: 1000,
      ValidationOnly: false,
      HandleCollationDiff: false,
      RecordFailureDelayLimitInMinutes: 0,
      SkipLobColumns: false,
      ValidationPartialLobSize: 0,
      ValidationQueryCdcDelaySeconds: 0,
    },
    context.replicationTaskSettings.ValidationSettings
  );

  context.replicationTaskSettings.FailTaskWhenCleanTaskResourceFailed = Boolean(
    context.replicationTaskSettings.FailTaskWhenCleanTaskResourceFailed
  );

  return context;
}
