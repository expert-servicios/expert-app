#!/usr/bin/env bash
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is required}"

evidence_dir="${REGULATORY_PREFLIGHT_EVIDENCE_DIR:-$RUNNER_TEMP/regulatory-ledger-preflight}"
mkdir -p "$evidence_dir"
chmod 700 "$evidence_dir"

mapfile -t local_files < <(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort
)

test "${#local_files[@]}" -ge 36 || {
  echo "STOP: migration baseline is incomplete"
  exit 1
}
test "${local_files[0]}" = '20260912000100_baseline_public_primitives.sql' || {
  echo "STOP: unexpected first local migration"
  exit 1
}
test "${local_files[35]}" = '20260912003600_baseline_public_acl.sql' || {
  echo "STOP: unexpected end of recovery baseline"
  exit 1
}

local_versions=()
for file in "${local_files[@]}"; do
  version="${file:0:14}"
  [[ "$version" =~ ^[0-9]{14}$ ]] || {
    echo "STOP: migration without 14-digit version: $file"
    exit 1
  }
  local_versions+=("$version")
done

test "$(printf '%s\n' "${local_versions[@]}" | sort -u | wc -l)" -eq "${#local_versions[@]}" || {
  echo "STOP: duplicate local migration versions"
  exit 1
}

raw="$evidence_dir/schema_migrations.raw.sql"
supabase db dump \
  --linked \
  --schema supabase_migrations \
  --data-only \
  --use-copy \
  --file "$raw"
test -s "$raw"

mapfile -t remote_versions < <(
  awk 'BEGIN { FS="\t" }
    /^COPY .*schema_migrations.*FROM stdin;$/ { inside=1; next }
    inside && $0 == "\\." { inside=0; next }
    inside { print $1 }
  ' "$raw" | sort
)

remote_count="${#remote_versions[@]}"
local_count="${#local_versions[@]}"
test "$remote_count" -gt 0 || {
  echo "STOP: empty production migration ledger"
  exit 1
}
test "$remote_count" -le "$local_count" || {
  echo "STOP: production contains more migration versions than the repository"
  exit 1
}

for ((i=0; i<remote_count; i+=1)); do
  if [ "${remote_versions[$i]}" != "${local_versions[$i]}" ]; then
    echo "STOP: production ledger is not an exact prefix of local migrations"
    echo "index=$i remote=${remote_versions[$i]} local=${local_versions[$i]}"
    exit 1
  fi
done

empty_statements="$(awk 'BEGIN { FS="\t" }
  /^COPY .*schema_migrations.*FROM stdin;$/ { inside=1; next }
  inside && $0 == "\\." { inside=0; next }
  inside && ($2 == "\\N" || $2 == "{}" || $2 == "") { empty++ }
  END { print empty+0 }
' "$raw")"
test "$empty_statements" -eq 0 || {
  echo "STOP: $empty_statements production ledger rows have empty statements"
  exit 1
}

last_index=$((remote_count - 1))
remote_tip="${remote_versions[$last_index]}"
pending=("${local_versions[@]:remote_count}")
pending_count="${#pending[@]}"

for version in "${pending[@]}"; do
  test "$version" ">" "$remote_tip" || {
    echo "STOP: non-forward migration $version follows production tip $remote_tip"
    exit 1
  }
done

audited_batch=(
  20260920111500
  20260920123000
  20260920133000
  20260920150000
  20260920163000
  20260920180000
  20260920201500
  20260920213000
  20260920230000
)
predeploy_tip='20260920073758'
recovery_tip='20260920163000'
final_batch_tip='20260920230000'
recovery_tail=(
  20260920180000
  20260920201500
  20260920213000
  20260920230000
)

if [ "$remote_tip" = "$predeploy_tip" ]; then
  test "$remote_count" -eq 72 || {
    echo "STOP: audited pre-deploy tip found with unexpected ledger row count $remote_count"
    exit 1
  }
  test "$pending_count" -eq "${#audited_batch[@]}" || {
    echo "STOP: expected exactly 9 audited regulatory migrations before deployment, got $pending_count"
    exit 1
  }
  test "$(printf '%s\n' "${pending[@]}")" = "$(printf '%s\n' "${audited_batch[@]}")" || {
    echo "STOP: pending tail differs from the audited v1.3-v1.5 batch"
    exit 1
  }
  ledger_state='audited_pre_deploy'
elif [ "$remote_tip" = "$recovery_tip" ]; then
  test "$remote_count" -eq 77 || {
    echo "STOP: audited recovery tip found with unexpected ledger row count $remote_count"
    exit 1
  }
  test "$pending_count" -eq "${#recovery_tail[@]}" || {
    echo "STOP: expected exactly 4 migrations in audited v1.5 recovery tail, got $pending_count"
    exit 1
  }
  test "$(printf '%s\n' "${pending[@]}")" = "$(printf '%s\n' "${recovery_tail[@]}")" || {
    echo "STOP: pending tail differs from the audited v1.5 recovery batch"
    exit 1
  }
  ledger_state='audited_partial_v15_recovery'
elif printf '%s\n' "${audited_batch[@]:0:8}" | grep -qx "$remote_tip"; then
  echo "STOP: unexpected partial v1.3-v1.5 production deployment detected at $remote_tip"
  exit 1
elif [ "$remote_tip" = "$final_batch_tip" ]; then
  test "$remote_count" -ge 81 || {
    echo "STOP: final regulatory batch tip found with incomplete ledger"
    exit 1
  }
  ledger_state='post_regulatory_batch'
elif [ "$remote_tip" ">" "$final_batch_tip" ]; then
  ledger_state='forward_after_regulatory_batch'
else
  ledger_state='forward_before_regulatory_batch'
fi

supabase migration list --linked 2>&1 | tee "$evidence_dir/migration-list.txt"
supabase db push --linked --dry-run 2>&1 | tee "$evidence_dir/db-push-dry-run.txt"

for version in "${pending[@]}"; do
  grep -q "$version" "$evidence_dir/db-push-dry-run.txt" || {
    echo "STOP: pending migration $version is missing from db push --dry-run"
    exit 1
  }
done

raw_hash="$(sha256sum "$raw" | cut -d' ' -f1)"
{
  printf 'ledger_state=%s\n' "$ledger_state"
  printf 'remote_rows=%s\n' "$remote_count"
  printf 'local_rows=%s\n' "$local_count"
  printf 'remote_tip=%s\n' "$remote_tip"
  printf 'pending_count=%s\n' "$pending_count"
  printf 'empty_statements=0\n'
  printf 'sha256=%s\n' "$raw_hash"
  if [ "$pending_count" -gt 0 ]; then
    printf 'pending_versions=%s\n' "$(IFS=,; echo "${pending[*]}")"
  else
    printf 'pending_versions=\n'
  fi
} > "$evidence_dir/ledger-summary.txt"

rm -f "$raw"

echo "Regulatory ledger preflight OK: state=$ledger_state remote=$remote_count local=$local_count pending=$pending_count"
