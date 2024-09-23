import React from 'react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type = 'info',
}) => {
  return <p className={`${styles.message} ${styles[type]}`}>{message}</p>;
};

export default StatusMessage;
