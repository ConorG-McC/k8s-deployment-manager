import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DeploymentContextType {
  deploymentId: string | null;
  setDeploymentId: (id: string | null) => void;
}

const DeploymentIdContext = createContext<DeploymentContextType | undefined>(
  undefined
);

export const DeploymentIdContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  return (
    <DeploymentIdContext.Provider value={{ deploymentId, setDeploymentId }}>
      {children}
    </DeploymentIdContext.Provider>
  );
};

export const useDeploymentIdContext = () => {
  const context = useContext(DeploymentIdContext);
  if (!context) {
    throw new Error('useDeployment must be used within a DeploymentProvider');
  }
  return context;
};
