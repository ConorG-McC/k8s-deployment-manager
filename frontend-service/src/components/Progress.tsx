import React from 'react';
import styles from './Progress.module.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface ProgressProps {
  stages: string[];
  currentStage: number;
  errorStage: number | null;
}

const Progress: React.FC<ProgressProps> = ({
  stages,
  currentStage,
  errorStage,
}) => {
  return (
    <div className={styles.progressContainer}>
      {stages.map((stage, index) => (
        <div
          key={index}
          className={`${styles.progressStage} ${
            currentStage >= index + 1 ? styles.completed : ''
          } ${errorStage === index + 1 ? styles.error : ''}`}
        >
          {currentStage > index + 1 && <FaCheckCircle />}
          {errorStage === index + 1 && <FaTimesCircle />}
          <span>{stage}</span>
        </div>
      ))}
    </div>
  );
};

export default Progress;
