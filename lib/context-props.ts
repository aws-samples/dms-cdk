export type ContextProps = {
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
   *  Security group Ids from target RDS for DMS task runningin replication instance access
   */
  vpcSecurityGroupIds: string[];

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
};

export type SchemaConfig = {
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
};

export type TaskSettings = {
  TargetMetadata?: TargetMetadataSettings;
  FullLoadSettings?: FullLoadSettings;
  Logging?: LoggingSettings;
  ControlTablesSettings?: ControlTablesSettings;
  StreamBufferSettings?: StreamBufferSettings;
  ChangeProcessingDdlHandlingPolicy?: ChangeProcessingDdlHandlingPolicy;
  ErrorBehavior?: ErrorBehavior;
  ChangeProcessingTuning?: ChangeProcessingTuning;
  ValidationSettings?: ValidationSettings;
  FailTaskWhenCleanTaskResourceFailed?: boolean;

  /*
  PostProcessingRules: null,
  CharacterSetSettings: null,
  LoopbackPreventionSettings: null,
  BeforeImageSettings: null,
  */
};

export type TargetMetadataSettings = {
  TargetSchema?: string;
  SupportLobs?: boolean;
  FullLobMode?: boolean;
  LobChunkSize?: Number;
  LimitedSizeLobMode?: boolean;
  LobMaxSize?: Number;
  InlineLobMaxSize?: Number;
  LoadMaxFileSize?: Number;
  ParallelLoadThreads?: Number;
  ParallelLoadBufferSize?: Number;
  BatchApplyEnabled?: boolean;
  TaskRecoveryTableEnabled?: boolean;
  ParallelLoadQueuesPerThread?: Number;
  ParallelApplyThreads?: Number;
  ParallelApplyBufferSize?: Number;
  ParallelApplyQueuesPerThread?: Number;
};

export type FullLoadSettings = {
  TargetTablePrepMode?: string;
  CreatePkAfterFullLoad?: boolean;
  StopTaskCachedChangesApplied?: boolean;
  StopTaskCachedChangesNotApplied?: boolean;
  MaxFullLoadSubTasks?: Number;
  TransactionConsistencyTimeout?: Number;
  CommitRate?: Number;
};

export type LoggingSettings = {
  EnableLogging?: boolean;
  LogComponents?: LogComponentEntry[];
};

export type LogComponentEntry = {
  Id: string;
  Severity: string;
};

export type ControlTablesSettings = {
  ControlSchema?: string;
  HistoryTimeslotInMinutes?: Number;
  HistoryTableEnabled?: boolean;
  SuspendedTablesTableEnabled?: boolean;
  StatusTableEnabled?: boolean;
  FullLoadExceptionTableEnabled?: boolean;
};

export type StreamBufferSettings = {
  StreamBufferCount?: Number;
  StreamBufferSizeInMB?: Number;
  CtrlStreamBufferSizeInMB?: Number;
};

export type ChangeProcessingDdlHandlingPolicy = {
  HandleSourceTableDropped?: boolean;
  HandleSourceTableTruncated?: boolean;
  HandleSourceTableAltered?: boolean;
};

export type ErrorBehavior = {
  DataErrorPolicy?: string;
  DataTruncationErrorPolicy?: string;
  DataErrorEscalationPolicy?: string;
  DataErrorEscalationCount?: Number;
  TableErrorPolicy?: string;
  TableErrorEscalationPolicy?: string;
  TableErrorEscalationCount?: Number;
  RecoverableErrorCount?: Number;
  RecoverableErrorInterval?: Number;
  RecoverableErrorThrottling?: boolean;
  RecoverableErrorThrottlingMax?: Number;
  RecoverableErrorStopRetryAfterThrottlingMax?: boolean;
  ApplyErrorDeletePolicy?: string;
  ApplyErrorInsertPolicy?: string;
  ApplyErrorUpdatePolicy?: string;
  ApplyErrorEscalationPolicy?: string;
  ApplyErrorEscalationCount?: Number;
  ApplyErrorFailOnTruncationDdl?: boolean;
  FullLoadIgnoreConflicts?: boolean;
  FailOnTransactionConsistencyBreached?: boolean;
  FailOnNoTablesCaptured?: boolean;
};

export type ChangeProcessingTuning = {
  BatchApplyPreserveTransaction?: boolean;
  BatchApplyTimeoutMin?: number;
  BatchApplyTimeoutMax?: number;
  BatchApplyMemoryLimit?: number;
  BatchSplitSize?: number;
  MinTransactionSize?: number;
  CommitTimeout?: number;
  MemoryLimitTotal?: number;
  MemoryKeepTime?: number;
  StatementCacheSize?: number;
};

export type ValidationSettings = {
  EnableValidation?: boolean;
  ValidationMode?: string;
  ThreadCount?: number;
  PartitionSize?: number;
  FailureMaxCount?: number;
  RecordFailureDelayInMinutes?: number;
  RecordSuspendDelayInMinutes?: number;
  MaxKeyColumnSize?: number;
  TableFailureMaxCount?: number;
  ValidationOnly?: boolean;
  HandleCollationDiff?: boolean;
  RecordFailureDelayLimitInMinutes?: number;
  SkipLobColumns?: boolean;
  ValidationPartialLobSize?: number;
  ValidationQueryCdcDelaySeconds?: number;
};
