import React from 'react';
import styles from './DeployedAppLink.module.css';

interface DeployedAppLinkProps {
  appUrl: string;
}

const DeployedAppLink: React.FC<DeployedAppLinkProps> = ({ appUrl }) => {
  return (
    <p className={styles.linkContainer}>
      Your application is running at:{' '}
      <a
        href={appUrl}
        target='_blank'
        rel='noopener noreferrer'
        className={styles.link}
      >
        {appUrl}
      </a>
    </p>
  );
};

export default DeployedAppLink;
