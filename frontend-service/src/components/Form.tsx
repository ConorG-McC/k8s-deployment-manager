import React, { useState } from 'react';
import styles from './Form.module.css';

interface FormProps {
  onSubmit: (formData: {
    imageName: string;
    serviceName: string;
    port: string;
    replicas: number;
  }) => void;
  isDeploying: boolean;
}

const Form: React.FC<FormProps> = ({ onSubmit, isDeploying }) => {
  const [imageName, setImageName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [port, setPort] = useState('');
  const [replicas, setReplicas] = useState(1);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ imageName, serviceName, port, replicas });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor='imageName' className={styles.label}>
          Image Name:
        </label>
        <input
          id='imageName'
          type='text'
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
          required
          className={styles.input}
          placeholder='e.g., my-app-image'
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor='serviceName' className={styles.label}>
          Service Name:
        </label>
        <input
          id='serviceName'
          type='text'
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
          className={styles.input}
          placeholder='e.g., my-service'
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor='port' className={styles.label}>
          Port:
        </label>
        <input
          id='port'
          type='number'
          value={port}
          onChange={(e) => setPort(e.target.value)}
          required
          className={styles.input}
          placeholder='e.g., 8080'
          min='1'
          max='65535'
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor='replicas' className={styles.label}>
          Replicas:
        </label>
        <input
          id='replicas'
          type='number'
          value={replicas}
          onChange={(e) => setReplicas(Number(e.target.value))}
          min='1'
          className={styles.input}
          placeholder='e.g., 2'
        />
      </div>
      <button
        type='submit'
        disabled={isDeploying}
        className={`${styles.button} ${
          isDeploying ? styles.buttonDisabled : ''
        }`}
      >
        {isDeploying ? 'Deploying...' : 'Deploy'}
      </button>
    </form>
  );
};

export default Form;
