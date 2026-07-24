Quick Docker + docker-compose deployment

This project includes Dockerfiles and a `docker-compose.yml` to run the frontend (nginx) and backend (Node) as containers.

Prerequisites on your OVH instance
- Docker
- Docker Compose (or use Docker's compose v2)
- Access to a MongoDB instance (MongoDB Atlas recommended) and network access from the server

Steps
1. Copy `.env.example` to `.env` and set real values.
2. Option A: Build and run locally on the server

```bash
git clone <repo> /opt/lecolier
cd /opt/lecolier
cp .env.example .env
# edit .env with real secrets
docker compose build
docker compose up -d
```

3. Verify
- Frontend: http://<server-ip>/ (served by nginx)
- Backend health: http://<server-ip>:5000/api/hello

Notes
- In production we recommend storing `MONGO_URI` in a secret store and using MongoDB Atlas.
- If you're using an OVH load balancer or custom domain, configure DNS to point to the instance and obtain TLS certs with certbot or use a managed certificate service.

CI / CD (GitHub Actions)
------------------------
This repository includes a GitHub Actions workflow at `.github/workflows/ci-cd.yml` that
performs CI (install, test, build) and can deploy to your OVH VPS via SSH + rsync + Docker Compose.

Required repository secrets (Settings → Secrets → Actions):
- `SSH_PRIVATE_KEY` - private key for the deploy user (no passphrase recommended)
- `SSH_USER` - ssh username on your OVH server
- `SSH_HOST` - server IP or hostname
- `DEPLOY_PATH` - path on the remote server where repo will be synced (e.g. `/opt/lecolier`)

How the workflow works
- On push to `main` it runs tests and builds the frontend.
- It then rsyncs the repository to `${DEPLOY_PATH}` on your server and runs:
	- `docker compose pull || true`
	- `docker compose build --no-cache`
	- `docker compose up -d --remove-orphans`

Security notes
- Add the public part of `SSH_PRIVATE_KEY` to the `~/.ssh/authorized_keys` of the `SSH_USER` on your server.
- Keep `MONGO_URI`, `JWT_SECRET`, and other secrets out of the repo and defined in the remote `.env`.

If you want, I can also provide a workflow variant that builds and pushes images to Docker Hub or GitHub Container Registry and then deploys by pulling images on the server.

Optional: Use `pm2` or `systemd` only if you decide not to use Docker.

Container-based CI/CD (GHCR)
----------------------------
I added `.github/workflows/ci-cd-containers.yml` which builds and pushes container images to GitHub Container Registry (GHCR) and deploys by SSH to your server where it pulls the images and runs `docker compose`.

Required repository secrets for this workflow:
- `SSH_PRIVATE_KEY` - private key used for SSH to the server
- `SSH_USER` - username on the server
- `SSH_HOST` - server IP or hostname
- `DEPLOY_PATH` - the directory on the server where the deployment is placed (workflow copies a generated `docker-compose.prod.yml` there)

Notes:
- The workflow pushes both `:latest` and a commit-sha tagged image to GHCR. The generated `docker-compose.prod.yml` references `:latest`.
- Ensure the server has Docker and Docker Compose and that the `DEPLOY_PATH` contains a valid `.env` with production secrets.
- If you prefer Docker Hub (instead of GHCR), I can change the workflow to push there — it will require Docker Hub credentials in secrets.

Important GHCR notes:
- The workflow requires the Actions `GITHUB_TOKEN` to have `packages: write` permission to push images to GHCR. The included workflow file already requests this permission.
- Required repository secrets for GHCR deploy: `SSH_PRIVATE_KEY`, `SSH_USER`, `SSH_HOST`, `DEPLOY_PATH`. The workflow uses `GITHUB_TOKEN` to authenticate to GHCR.


Jenkins CI/CD
-------------
If you prefer Jenkins instead of GitHub Actions, there is a `Jenkinsfile` at the repo root that builds the frontend, runs tests, builds and pushes Docker images, and deploys via SSH to the server.

Recommended Jenkins credentials and configuration:
- `dockerhub-creds` (Username/Password) — for Docker Hub push, or configure a GHCR token instead and update the pipeline.
- `ssh-deploy-key` (SSH private key) — used in `sshagent` for remote commands.
- `DOCKER_IMAGE_BASE` — plaintext credential or global variable like `myorg/lecolier` used as the image prefix.
- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` — server connection details (store as credentials or global env in Jenkins).

Customize the `Jenkinsfile` environment section to match your credential IDs and organization names.

## OVH VPS Quickstart (Ubuntu 22.04)

1) Create an OVH VPS and note its public IP.

2) SSH to the server as root and run the bootstrap script from this repo:

```bash
# on your machine
scp scripts/setup_server.sh root@SERVER_IP:/tmp/setup_server.sh
ssh root@SERVER_IP 'bash /tmp/setup_server.sh deploy /opt/lecolier'
```

3) Add your deploy user's public key:

```bash
# on your machine
ssh-copy-id -i ./deploy_key.pub deploy@SERVER_IP
```

4) Copy `.env` and `docker-compose.prod.yml` to the server deploy dir and start:

```bash
scp .env deploy@SERVER_IP:/opt/lecolier/.env
scp docker-compose.prod.yml deploy@SERVER_IP:/opt/lecolier/docker-compose.prod.yml
ssh deploy@SERVER_IP 'cd /opt/lecolier && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d'
```

5) (Optional) Enable systemd service so the stack starts on boot:

```bash
scp deploy/lecolier.service deploy@SERVER_IP:/tmp/lecolier.service
ssh deploy@SERVER_IP 'sudo mv /tmp/lecolier.service /etc/systemd/system/lecolier.service && sudo systemctl daemon-reload && sudo systemctl enable --now lecolier.service'
```

Notes:
- Ensure `MONGO_URI` in `.env` is reachable by the server. Using MongoDB Atlas is recommended for production.
- For TLS, either run `certbot` on the server or put an nginx reverse proxy in front that uses Let’s Encrypt.

Local image build & test
------------------------
To verify the production images locally before pushing to GHCR, run:

```bash
bash scripts/test_build_and_run.sh
```

This builds backend/frontend images and starts a temporary test stack with MongoDB. Frontend will be available on `http://localhost:8080` and backend health on `http://localhost:5001/health`.

Generating deploy SSH key
-------------------------
To generate a deploy key for CI and add it to the server:

```bash
bash scripts/gen_deploy_key.sh
# then on your machine
ssh-copy-id -i ./deploy_key.pub deploy@SERVER_IP
```

After generating the key, add the private key contents to the GitHub repository secret `SSH_PRIVATE_KEY` and set `SSH_USER`, `SSH_HOST`, and `DEPLOY_PATH`.

Copying `.env` to the server (secure)
-------------------------------
After you fill `.env` from `.env.prod.example`, use the helper script to securely copy it and trigger a deploy:

```bash
# ensure .env is in repo root (NOT committed)
bash scripts/copy_env_to_server.sh deploy@SERVER_IP /opt/lecolier
```

This script will `scp` the `.env` into the remote `DEPLOY_PATH` and run `docker compose pull && docker compose up -d` remotely.



