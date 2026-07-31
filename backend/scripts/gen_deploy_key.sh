#!/usr/bin/env bash
set -euo pipefail

# Generates an ed25519 key pair for deploy and prints next steps.
# Usage: bash scripts/gen_deploy_key.sh

KEY_PATH=./deploy_key

if [ -f "$KEY_PATH" ] || [ -f "${KEY_PATH}.pub" ]; then
  echo "Key already exists at ${KEY_PATH} or ${KEY_PATH}.pub. Aborting to avoid overwrite."
  exit 1
fi

ssh-keygen -t ed25519 -f "$KEY_PATH" -C "deploy@ovh" -N ""
echo "Generated key pair: ${KEY_PATH} and ${KEY_PATH}.pub"
echo "Add the public key to your server's deploy user with:"
echo "  ssh-copy-id -i ${KEY_PATH}.pub deploy@SERVER_IP"
echo "Or paste contents of ${KEY_PATH}.pub into /home/deploy/.ssh/authorized_keys on the server."
echo "Keep ${KEY_PATH} private — do NOT commit it to the repository."
echo "Next: add private key contents to GitHub secret 'SSH_PRIVATE_KEY' and set SSH_USER, SSH_HOST, DEPLOY_PATH secrets."
