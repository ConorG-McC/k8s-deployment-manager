# Kubernetes Deployment Manager

## Overview

Kubernetes Deployment Manager is an application designed to automate and track Kubernetes deployments. It provides a user-friendly interface for deploying applications and monitoring their status.

This has been completed as the artefact for my university honours project, accompanied by thorough documentation of the project process.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Docker (for containerization)
- Minikube
- AWS account (for deploying to EKS)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ConorG-McC/k8s-deployment-manager.git
   cd k8s-deployment-manager
   ```

2. Build the data-types package:

   ```bash
   cd data-types
   npm install
   npm run build
   ```

3. Install dependencies for all workspaces:

   ```bash
   cd ..
   npm install --workspaces
   ```

### Running the Application

1. Ensure you have a running cluster.

   For a local solution i use [Minikube](https://minikube.sigs.k8s.io/docs/) but the application will work with others.

   ```bash
   minikube start
   ```

2. Start the backend server:

   ```bash
   cd backend
   npm start
   ```

3. Start the frontend application:

   ```bash
   cd frontend
   npm start
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the application.

   The backend will be running on [http://localhost:3001](http://localhost:3001)

### Running Tests

To run tests for all workspaces, use:

```bash
npm run test --workspaces
```

### Deployment

For deploying the application to AWS EKS, navigate to the `infrastructure` folder and follow the Terraform instructions.

```bash
cd infrastructure
terraform init
terraform apply
```
