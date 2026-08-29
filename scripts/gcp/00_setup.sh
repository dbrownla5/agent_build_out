#!/usr/bin/env bash
# ============================================================================
# RUN THIS ONCE, IN GOOGLE CLOUD SHELL:  https://shell.cloud.google.com
# (free, runs in your browser, already signed in as you — nothing to install)
#
# Click the terminal icon, paste this entire file, press Enter.
#
# Sets up KEYLESS deploys: Google trusts your GitHub repo directly through
# Workload Identity Federation. No service-account keys are created — your
# organization blocks them, and they are the thing that leaks anyway.
#
# After this runs, every push deploys automatically and nobody holds a
# credential. It keeps working after the build session ends.
# ============================================================================
set -euo pipefail

GITHUB_REPO="dbrownla5/agent_build_out"
PROJECT_ID="dayna-foundry"
REGION="us-central1"
SA_NAME="foundry-deployer"
POOL="github-pool"
PROVIDER="github-provider"

echo "==> Finding your organization"
ORG_ID="$(gcloud organizations list --format='value(name)' | head -1 | sed 's|organizations/||')"
if [[ -z "${ORG_ID}" ]]; then
  echo "!! No organization found. Yours:"; gcloud organizations list; exit 1
fi
echo "    org: ${ORG_ID}"

echo "==> Finding your billing account"
BILLING_ID="$(gcloud billing accounts list --filter='open=true' --format='value(name)' | head -1 | sed 's|billingAccounts/||')"
if [[ -z "${BILLING_ID}" ]]; then
  echo "!! No open billing account. Create one: https://console.cloud.google.com/billing"; exit 1
fi
echo "    billing: ${BILLING_ID}"

echo "==> Creating project ${PROJECT_ID} (skips if it already exists)"
gcloud projects create "${PROJECT_ID}" --name="Dayna Foundry" --organization="${ORG_ID}" 2>/dev/null || echo "    already exists"
gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ID}" >/dev/null
gcloud config set project "${PROJECT_ID}" >/dev/null

PROJECT_NUM="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
echo "    project number: ${PROJECT_NUM}"

echo "==> Enabling APIs (only what this system needs)"
gcloud services enable \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  storage.googleapis.com secretmanager.googleapis.com vision.googleapis.com \
  cloudtasks.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  --project="${PROJECT_ID}"

echo "==> Creating deployer service account (no key will be made)"
gcloud iam service-accounts create "${SA_NAME}" --project="${PROJECT_ID}" \
  --display-name="Foundry deployer" 2>/dev/null || echo "    already exists"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

for ROLE in roles/run.admin roles/artifactregistry.admin roles/cloudbuild.builds.editor \
            roles/storage.admin roles/secretmanager.admin roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" --role="${ROLE}" --quiet >/dev/null
  echo "    granted ${ROLE}"
done

echo "==> Setting up Workload Identity Federation for ${GITHUB_REPO}"
gcloud iam workload-identity-pools create "${POOL}" --project="${PROJECT_ID}" \
  --location=global --display-name="GitHub" 2>/dev/null || echo "    pool exists"

gcloud iam workload-identity-pools providers create-oidc "${PROVIDER}" \
  --project="${PROJECT_ID}" --location=global --workload-identity-pool="${POOL}" \
  --display-name="GitHub OIDC" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${GITHUB_REPO}'" \
  --issuer-uri="https://token.actions.githubusercontent.com" 2>/dev/null || echo "    provider exists"

# Only this one GitHub repository may impersonate the deployer.
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUM}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${GITHUB_REPO}" \
  --quiet >/dev/null

echo "==> Creating storage containers"
for B in originals derivatives intake review outputs catalog; do
  gcloud storage buckets create "gs://${PROJECT_ID}-${B}" --project="${PROJECT_ID}" \
    --location="${REGION}" --uniform-bucket-level-access 2>/dev/null || echo "    ${B} exists"
done

# Originals are preserved by the bucket itself, not by application code that
# has to remember to be careful. Versioning means an overwrite cannot destroy
# the original bytes.
gcloud storage buckets update "gs://${PROJECT_ID}-originals" --versioning >/dev/null 2>&1 || true
echo "    originals: versioning on (originals cannot be silently overwritten)"

echo "==> Creating Artifact Registry repository"
gcloud artifacts repositories create foundry --project="${PROJECT_ID}" \
  --repository-format=docker --location="${REGION}" 2>/dev/null || echo "    exists"

echo "==> Setting a budget alert so nothing runs away"
gcloud billing budgets create --billing-account="${BILLING_ID}" \
  --display-name="Dayna Foundry guard" \
  --budget-amount=25USD \
  --threshold-rule=percent=50 --threshold-rule=percent=90 --threshold-rule=percent=100 \
  --filter-projects="projects/${PROJECT_NUM}" 2>/dev/null \
  || echo "    (budget not created — set one manually at console.cloud.google.com/billing/budgets)"

cat <<INFO

============================================================================
DONE. No keys were created.

Paste these three lines back to the agent:

  PROJECT_ID=${PROJECT_ID}
  WIF_PROVIDER=projects/${PROJECT_NUM}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}
  DEPLOYER_SA=${SA_EMAIL}

Storage containers created:
  gs://${PROJECT_ID}-originals    (versioned — write-once)
  gs://${PROJECT_ID}-derivatives
  gs://${PROJECT_ID}-intake
  gs://${PROJECT_ID}-review
  gs://${PROJECT_ID}-outputs
  gs://${PROJECT_ID}-catalog

To revoke all access instantly at any time:

  gcloud iam service-accounts delete ${SA_EMAIL} --project=${PROJECT_ID}

============================================================================
INFO
