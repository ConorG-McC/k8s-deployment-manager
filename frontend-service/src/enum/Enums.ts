enum StatusMessageTypes {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  None = '',
}

enum StatusMessages {
  DeploymentStarted = 'Deployment starting.',
  DeploymentFailed = 'Deployment failed. Please try again.',
  RequiredFields = 'All fields except Replicas are required.',
  PortRange = 'Port must be between 1 and 65535.',
  None = '',
}

enum DeploymentStages {
  StartingDeployment = 'Starting Deployment',
  PullingImage = 'Pulling Image',
  CreatingDeployment = 'Creating Deployment',
  SettingUpService = 'Setting Up Service',
  FinalizingDeployment = 'Finalizing Deployment',
  Completed = 'Completed',
}

export { StatusMessageTypes, StatusMessages, DeploymentStages };
