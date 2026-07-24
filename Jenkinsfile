pipeline {
  agent any

  environment {
    // Set this in the Jenkins job configuration to your Docker Hub or registry namespace
    DOCKER_IMAGE_BASE = credentials('DOCKER_IMAGE_BASE') // plaintext credential or use env var via job
    DOCKERHUB_CREDS = 'dockerhub-creds' // Jenkins credentials ID (username/password)
    SSH_CREDENTIALS_ID = 'ssh-deploy-key' // Jenkins SSH private key credential ID
    DEPLOY_USER = credentials('DEPLOY_USER')
    DEPLOY_HOST = credentials('DEPLOY_HOST')
    DEPLOY_PATH = credentials('DEPLOY_PATH')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm install -g pnpm'
        sh 'pnpm install'
      }
    }

    stage('Test') {
      steps {
        sh 'pnpm --filter lecolier-server test'
      }
    }

    stage('Build Frontend') {
      steps {
        sh 'pnpm --filter lecolier-client build'
      }
    }

    stage('Build & Push Images') {
      steps {
        script {
          def backendImage = "${DOCKER_IMAGE_BASE}-backend:${env.GIT_COMMIT}"
          def frontendImage = "${DOCKER_IMAGE_BASE}-frontend:${env.GIT_COMMIT}"

          sh "docker build -f Dockerfile.backend -t ${backendImage} ./server"
          sh "docker build -f Dockerfile.frontend -t ${frontendImage} ./client"

          docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDS) {
            sh "docker push ${backendImage}"
            sh "docker tag ${backendImage} ${DOCKER_IMAGE_BASE}-backend:latest"
            sh "docker push ${DOCKER_IMAGE_BASE}-backend:latest"

            sh "docker push ${frontendImage}"
            sh "docker tag ${frontendImage} ${DOCKER_IMAGE_BASE}-frontend:latest"
            sh "docker push ${DOCKER_IMAGE_BASE}-frontend:latest"
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        sshagent (credentials: [SSH_CREDENTIALS_ID]) {
          sh "ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} 'mkdir -p ${DEPLOY_PATH}'"
          sh "ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'cd ${DEPLOY_PATH} && cat > docker-compose.prod.yml <<'YAML'\nversion: '3.8'\nservices:\n  backend:\n    image: ${DOCKER_IMAGE_BASE}-backend:latest\n    env_file: .env\n    restart: unless-stopped\n    ports:\n      - \"5000:5000\"\n  frontend:\n    image: ${DOCKER_IMAGE_BASE}-frontend:latest\n    restart: unless-stopped\n    ports:\n      - \"80:80\"\nYAML'"
          sh "ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'cd ${DEPLOY_PATH} && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d --remove-orphans'"
        }
      }
    }
  }

  post {
    failure {
      echo 'Build or deploy failed.'
    }
  }
}
