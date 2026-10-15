#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
name="azzo-room-db-test-$$"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
docker run --rm -d --name "$name" --network none -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17 >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$name" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
for file in tests/db-bootstrap.sql supabase/migrations/20261015190001_schema_inicial.sql supabase/migrations/20261015190002_profiles_and_workspace_flows.sql supabase/migrations/20261015190003_runtime_grants.sql tests/db-isolation.sql; do
  docker exec -i "$name" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done
