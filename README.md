# Dockerized Node.js App

> A small, production-ready Dockerized Node.js application built with Express, designed for easy local development and straightforward deployment to AWS ECR & ECS via GitHub Actions.

## Table of Contents
- **Overview:** Project summary
- **Tech Stack:** Key technologies used
- **Quick Start:** Local setup and run
- **Docker:** Build and run container
- **CI/CD:** GitHub Actions example (ECR push + ECS deploy)
- **AWS Deployment:** Manual/CLI steps to push to ECR and update ECS
- **Environment:** Required environment variables
- **Contributing & License**

## Overview

This repository contains a small Express-based web application with authentication scaffolding and a Postgres-backed session store. The project is containerized with Docker, and the intended deployment flow uses GitHub Actions to build the Docker image, push it to Amazon ECR, and deploy an updated task definition to Amazon ECS (Fargate recommended).

## Tech Stack

- **Node.js** (ES module project)
- **Express** for web server and views (EJS)
- **Postgres** for persistence (via `pg`)
- **Docker** for containerization
- **AWS ECR / ECS** for container registry and runtime
- **GitHub Actions** for CI/CD

## Quick Start (Local)

1. Clone the repo:

   git clone <your-repo-url>

2. Install dependencies:

   npm install

3. Create a `.env` in the project root and add required env vars (see _Environment_ section).

4. Run the app in development:

   npm run dev

5. Open http://localhost:3000

## Docker (Build & Run)

Build the image locally:

```bash
docker build -t my-app:latest .
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env my-app:latest
```

The `Dockerfile` exposes port `3000` and the default command uses `npm run dev`.

## GitHub Actions: Build, Push to ECR & Deploy to ECS

Below is a minimal example workflow (save to `.github/workflows/deploy.yml`). It builds the Docker image, pushes to ECR, and deploys an ECS task definition.

```yaml
name: CI/CD - Build, Push to ECR & Deploy to ECS

on:
  push:
    branches: [ main ]

env:
  ECR_REPOSITORY: my-app-repo
  ECS_CLUSTER: my-ecs-cluster
  ECS_SERVICE: my-ecs-service
  CONTAINER_NAME: my-app

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, Tag, and Push Docker image to ECR
        env:
          IMAGE_TAG: ${{ github.sha }}
          AWS_ACCOUNT_ID: ${{ secrets.AWS_ACCOUNT_ID }}
        run: |
          REPO_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}
          docker build -t $REPO_URI:$IMAGE_TAG .
          docker push $REPO_URI:$IMAGE_TAG

      - name: Deploy to Amazon ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: taskdef.json # or path/to/your/td-template.json
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

Notes:
- Add the following repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ACCOUNT_ID`.
- Set environment variables in the workflow or as organization-level variables for `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, and `CONTAINER_NAME`.
- `taskdef.json` can be a template you keep in the repo; use the `aws-actions/amazon-ecs-render-task-definition` action to render image placeholders if you prefer.

## AWS: Manual / CLI Steps (ECR & ECS)

1. Create an ECR repository:

```bash
aws ecr create-repository --repository-name my-app-repo --region us-east-1
```

2. Authenticate Docker to ECR and push an image (example):

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker build -t my-app:latest .
docker tag my-app:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/my-app-repo:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/my-app-repo:latest
```

3. Create (or update) an ECS Task Definition that references the pushed image. Example minimal container definition JSON:

```json
{
  "family": "my-app-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "my-app",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/my-app-repo:latest",
      "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
      "essential": true
    }
  ]
}
```

4. Register the task definition and update the service:

```bash
aws ecs register-task-definition --cli-input-json file://taskdef.json
aws ecs update-service --cluster my-ecs-cluster --service my-ecs-service --force-new-deployment
```

## Environment

Create a `.env` with values required by the app. Common variables in this project include:

- **PORT**: 3000
- **DATABASE_URL**: Postgres connection string
- **SESSION_SECRET**: secret for session cookies
- **NODE_ENV**: development | production

Adjust values for your environment and AWS secrets.

## Troubleshooting

- If ECS fails to start, check the task logs in CloudWatch and verify that the container can connect to the database and required external services.
- Ensure security groups and subnets are configured correctly for Fargate tasks (ENI allocation).

## Contributing

Contributions are welcome. Please open an issue or a pull request with a clear description of the change and testing steps.
