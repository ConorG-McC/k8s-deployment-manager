import React from 'react';
import './ProgressBar.css';
import { VariantType } from 'data-types';

interface ProgressBarProps {
  progress: number;
  variant: VariantType;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant,
  label,
}) => (
  <div className='progress-container'>
    <progress
      max='100'
      value={progress}
      className={`progress ${variant}`}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label='Deployment Progress'
    ></progress>
    {label !== undefined && <span className='progress-label'>{label}</span>}
  </div>
);

export default ProgressBar;
