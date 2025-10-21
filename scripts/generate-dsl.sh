#!/usr/bin/env bash
set -euo pipefail
pages=("docs-overview" "about" "contact" "pricing" "blog" "careers" "changelog" "security" "legal" "privacy" "terms")
for page in "${pages[@]}"; do
  npx hygen page new --name "$page"
done
pnpm apg:generate
pnpm apg:extract
