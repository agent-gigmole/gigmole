#!/bin/bash
# =============================================================================
# AgLabor E2E Test — Full lifecycle against production API
# =============================================================================
set +e

BASE_URL="${1:-https://aglabor.vercel.app}"
PASS=0
FAIL=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

assert_status() {
  local test_name="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $test_name (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_field() {
  local test_name="$1"
  local json="$2"
  local field="$3"
  local expected="$4"
  TOTAL=$((TOTAL + 1))
  local actual
  actual=$(echo "$json" | jq -r "$field" 2>/dev/null || echo "PARSE_ERROR")
  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $test_name ($field = $expected)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name — $field expected '$expected', got '$actual'"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_not_null() {
  local test_name="$1"
  local json="$2"
  local field="$3"
  TOTAL=$((TOTAL + 1))
  local actual
  actual=$(echo "$json" | jq -r "$field" 2>/dev/null || echo "null")
  if [ "$actual" != "null" ] && [ "$actual" != "" ] && [ "$actual" != "PARSE_ERROR" ]; then
    echo -e "  ${GREEN}✓${NC} $test_name ($field = $actual)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name — $field is null or missing"
    FAIL=$((FAIL + 1))
  fi
}

# Helper: HTTP request returning "STATUS_CODE\nBODY"
req() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local auth="${4:-}"
  local headers=(-s -w "\n%{http_code}" --connect-timeout 10 --max-time 30 -H "Content-Type: application/json")
  if [ -n "$auth" ]; then
    headers+=(-H "Authorization: Bearer $auth")
  fi
  if [ -n "$data" ]; then
    curl "${headers[@]}" -X "$method" -d "$data" "${BASE_URL}${path}"
  else
    curl "${headers[@]}" -X "$method" "${BASE_URL}${path}"
  fi
}

parse_body() { echo "$1" | sed '$d'; }
parse_status() { echo "$1" | tail -1; }

echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     AgLabor E2E Test — $BASE_URL     ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 1] Platform Stats (Baseline)${NC}"
# =========================================================================
RESP=$(req GET /api/stats)
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "GET /api/stats" "200" "$STATUS"
assert_json_not_null "totalTasks exists" "$BODY" ".totalTasks"
assert_json_not_null "activeAgents exists" "$BODY" ".activeAgents"
BASELINE_TASKS=$(echo "$BODY" | jq -r '.totalTasks')
BASELINE_AGENTS=$(echo "$BODY" | jq -r '.activeAgents')
echo "    Baseline: $BASELINE_TASKS tasks, $BASELINE_AGENTS agents"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 2] Agent Registration${NC}"
# =========================================================================

# Register Publisher
RESP=$(req POST /api/agents/register '{"name":"TestPublisher","profile_bio":"I publish tasks for testing","skills":["testing","automation"]}')
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Register publisher" "201" "$STATUS"
assert_json_not_null "Publisher has id" "$BODY" ".id"
assert_json_not_null "Publisher has api_key" "$BODY" ".api_key"
PUBLISHER_ID=$(echo "$BODY" | jq -r '.id')
PUBLISHER_KEY=$(echo "$BODY" | jq -r '.api_key')
echo "    Publisher ID: $PUBLISHER_ID"

# Register Worker
RESP=$(req POST /api/agents/register '{"name":"TestWorker","profile_bio":"I am an AI worker agent","skills":["coding","analysis","writing"]}')
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Register worker" "201" "$STATUS"
WORKER_ID=$(echo "$BODY" | jq -r '.id')
WORKER_KEY=$(echo "$BODY" | jq -r '.api_key')
echo "    Worker ID: $WORKER_ID"

# Register a 2nd worker (for multiple bids)
RESP=$(req POST /api/agents/register '{"name":"TestWorker2","profile_bio":"Another worker","skills":["data","ml"]}')
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Register worker 2" "201" "$STATUS"
WORKER2_ID=$(echo "$BODY" | jq -r '.id')
WORKER2_KEY=$(echo "$BODY" | jq -r '.api_key')
echo "    Worker2 ID: $WORKER2_ID"

# Error: Register without name
RESP=$(req POST /api/agents/register '{}')
STATUS=$(parse_status "$RESP")
assert_status "Register without name → 400" "400" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 3] Agent Profile & Wallet${NC}"
# =========================================================================

# Get publisher profile
RESP=$(req GET "/api/agents/$PUBLISHER_ID")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get publisher profile" "200" "$STATUS"
assert_json_field "Publisher name correct" "$BODY" ".name" "TestPublisher"
assert_json_field "Publisher has skills" "$BODY" ".skills[0]" "testing"

# Get worker profile
RESP=$(req GET "/api/agents/$WORKER_ID")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get worker profile" "200" "$STATUS"
assert_json_field "Worker name correct" "$BODY" ".name" "TestWorker"

# Bind wallet — publisher
RESP=$(req POST /api/agents/bind-wallet '{"wallet_address":"PublisherWallet11111111111111111111111111111"}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Bind publisher wallet" "200" "$STATUS"

# Bind wallet — worker
RESP=$(req POST /api/agents/bind-wallet '{"wallet_address":"WorkerWallet1111111111111111111111111111111"}' "$WORKER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Bind worker wallet" "200" "$STATUS"

# Error: Bind wallet without auth
RESP=$(req POST /api/agents/bind-wallet '{"wallet_address":"NoAuth"}')
STATUS=$(parse_status "$RESP")
assert_status "Bind wallet no auth → 401" "401" "$STATUS"

# Get non-existent agent
RESP=$(req GET "/api/agents/00000000-0000-0000-0000-000000000000")
STATUS=$(parse_status "$RESP")
assert_status "Get non-existent agent → 404" "404" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 4] Task CRUD${NC}"
# =========================================================================

# Create task
RESP=$(req POST /api/tasks '{
  "title":"Translate README to Chinese",
  "description":"Translate the project README.md from English to Chinese. Must maintain technical accuracy.",
  "budget":5000000,
  "deliverableSpec":"A complete Chinese translation of README.md in Markdown format",
  "tags":["translation","documentation","chinese"]
}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Create task" "201" "$STATUS"
assert_json_field "Task status is open" "$BODY" ".status" "open"
assert_json_field "Task budget correct" "$BODY" ".budget" "5000000"
TASK_ID=$(echo "$BODY" | jq -r '.id')
echo "    Task ID: $TASK_ID"

# Create a 2nd task (for cancel test)
RESP=$(req POST /api/tasks '{
  "title":"Task to Cancel",
  "description":"This task will be cancelled",
  "budget":1000000,
  "tags":["test"]
}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
TASK2_ID=$(echo "$BODY" | jq -r '.id')
assert_status "Create task 2 (for cancel)" "201" "$(parse_status "$RESP")"

# Error: Create task without auth
RESP=$(req POST /api/tasks '{"title":"NoAuth","description":"test","budget":100}')
STATUS=$(parse_status "$RESP")
assert_status "Create task no auth → 401" "401" "$STATUS"

# List tasks
RESP=$(req GET "/api/tasks?limit=10")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "List tasks" "200" "$STATUS"

# Get task detail
RESP=$(req GET "/api/tasks/$TASK_ID")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get task detail" "200" "$STATUS"
assert_json_field "Task title correct" "$BODY" ".title" "Translate README to Chinese"

# Cancel task 2
RESP=$(req PATCH "/api/tasks/$TASK2_ID/cancel" '{}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Cancel task 2" "200" "$STATUS"
assert_json_field "Task 2 status cancelled" "$BODY" ".status" "cancelled"

# Error: Cancel already cancelled task
RESP=$(req PATCH "/api/tasks/$TASK2_ID/cancel" '{}' "$PUBLISHER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Cancel already cancelled → 409" "409" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 5] Bidding${NC}"
# =========================================================================

# Worker 1 bids
RESP=$(req POST "/api/tasks/$TASK_ID/bids" '{
  "price":4500000,
  "proposal":"I can translate this accurately using my NLP skills. Estimated completion: 2 hours.",
  "estimatedTime":2,
  "estimatedTokens":50000
}' "$WORKER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Worker 1 submits bid" "201" "$STATUS"
assert_json_not_null "Bid has id" "$BODY" ".id"
BID1_ID=$(echo "$BODY" | jq -r '.id')
echo "    Bid 1 ID: $BID1_ID"

# Worker 2 bids (cheaper)
RESP=$(req POST "/api/tasks/$TASK_ID/bids" '{
  "price":3800000,
  "proposal":"I specialize in technical translation. Can deliver in 1 hour.",
  "estimatedTime":1,
  "estimatedTokens":30000
}' "$WORKER2_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Worker 2 submits bid" "201" "$STATUS"
BID2_ID=$(echo "$BODY" | jq -r '.id')
echo "    Bid 2 ID: $BID2_ID"

# Error: Publisher bids on own task
RESP=$(req POST "/api/tasks/$TASK_ID/bids" '{"price":1000000,"proposal":"self bid"}' "$PUBLISHER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Publisher self-bid → 403" "403" "$STATUS"

# Get all bids
RESP=$(req GET "/api/tasks/$TASK_ID/bids")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get task bids" "200" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 6] Messaging${NC}"
# =========================================================================

# Worker sends message about the task
RESP=$(req POST /api/messages '{
  "content":"Hi, I have a question about the README. Does it include API documentation sections?",
  "task_id":"'"$TASK_ID"'"
}' "$WORKER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Worker sends message" "201" "$STATUS"
assert_json_field "Message linked to task" "$BODY" ".taskId" "$TASK_ID"

# Publisher replies
RESP=$(req POST /api/messages '{
  "content":"Yes, it includes the full API reference section. About 2000 words total.",
  "task_id":"'"$TASK_ID"'"
}' "$PUBLISHER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Publisher replies" "201" "$STATUS"

# Get messages for task
RESP=$(req GET "/api/messages?task_id=$TASK_ID")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get task messages" "200" "$STATUS"

# Error: Send message without auth
RESP=$(req POST /api/messages '{"content":"no auth"}')
STATUS=$(parse_status "$RESP")
assert_status "Message no auth → 401" "401" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 7] Award Bid${NC}"
# =========================================================================

# Award to worker 1
RESP=$(req POST "/api/tasks/$TASK_ID/award" "{\"bid_id\":\"$BID1_ID\"}" "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Award bid to worker 1" "200" "$STATUS"
assert_json_field "Task status in_progress" "$BODY" ".status" "in_progress"
assert_json_field "Awarded bid id set" "$BODY" ".awardedBidId" "$BID1_ID"

# Error: Worker tries to award (not publisher)
RESP=$(req POST "/api/tasks/$TASK_ID/award" "{\"bid_id\":\"$BID2_ID\"}" "$WORKER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Worker can't award → 403" "403" "$STATUS"

# Error: Award again (already awarded)
RESP=$(req POST "/api/tasks/$TASK_ID/award" "{\"bid_id\":\"$BID2_ID\"}" "$PUBLISHER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Award again → 409" "409" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 8] Submit Deliverable${NC}"
# =========================================================================

# Error: Publisher tries to submit (not the worker)
RESP=$(req POST "/api/tasks/$TASK_ID/submit" '{"content":"fake submission"}' "$PUBLISHER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Publisher can't submit → 403" "403" "$STATUS"

# Worker submits deliverable
RESP=$(req POST "/api/tasks/$TASK_ID/submit" '{
  "content":"# 项目说明\n\n这是一个 AI Agent 任务市场...\n\n## API 参考\n\n### 注册 Agent\nPOST /api/agents/register\n...",
  "tokens_used":42000
}' "$WORKER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Worker submits deliverable" "201" "$STATUS"
assert_json_field "Task status submitted" "$BODY" ".task.status" "submitted"
assert_json_not_null "Submission has content" "$BODY" ".submission.content"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 9] Accept Deliverable${NC}"
# =========================================================================

# Error: Worker tries to accept (not publisher)
RESP=$(req POST "/api/tasks/$TASK_ID/accept" '{}' "$WORKER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Worker can't accept → 403" "403" "$STATUS"

# Publisher accepts
RESP=$(req POST "/api/tasks/$TASK_ID/accept" '{}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Publisher accepts deliverable" "200" "$STATUS"
assert_json_field "Task status accepted" "$BODY" ".status" "accepted"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 10] Reviews (Dual Rating)${NC}"
# =========================================================================

# Publisher reviews worker
RESP=$(req POST "/api/tasks/$TASK_ID/reviews" "{
  \"rating\":5,
  \"reviewee_id\":\"$WORKER_ID\",
  \"comment\":\"Excellent translation quality, delivered on time.\"
}" "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Publisher reviews worker" "201" "$STATUS"
assert_json_field "Review rating is 5" "$BODY" ".rating" "5"

# Worker reviews publisher
RESP=$(req POST "/api/tasks/$TASK_ID/reviews" "{
  \"rating\":4,
  \"reviewee_id\":\"$PUBLISHER_ID\",
  \"comment\":\"Clear requirements, responsive communication.\"
}" "$WORKER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Worker reviews publisher" "201" "$STATUS"

# Get worker reviews
RESP=$(req GET "/api/agents/$WORKER_ID/reviews")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get worker reviews" "200" "$STATUS"

# Get publisher reviews
RESP=$(req GET "/api/agents/$PUBLISHER_ID/reviews")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get publisher reviews" "200" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 11] Reject Flow (Separate Task)${NC}"
# =========================================================================

# Create another task for reject flow
RESP=$(req POST /api/tasks '{
  "title":"Write Unit Tests",
  "description":"Write comprehensive unit tests for the auth module",
  "budget":3000000,
  "tags":["testing","typescript"]
}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
TASK3_ID=$(echo "$BODY" | jq -r '.id')
assert_status "Create task 3 (reject flow)" "201" "$(parse_status "$RESP")"

# Worker bids
RESP=$(req POST "/api/tasks/$TASK3_ID/bids" '{"price":2500000,"proposal":"I can write thorough tests.","estimatedTime":3}' "$WORKER_KEY")
BODY=$(parse_body "$RESP")
BID3_ID=$(echo "$BODY" | jq -r '.id')
assert_status "Worker bids on task 3" "201" "$(parse_status "$RESP")"

# Award
RESP=$(req POST "/api/tasks/$TASK3_ID/award" "{\"bid_id\":\"$BID3_ID\"}" "$PUBLISHER_KEY")
assert_status "Award task 3" "200" "$(parse_status "$RESP")"

# Submit (low quality)
RESP=$(req POST "/api/tasks/$TASK3_ID/submit" '{"content":"// TODO: write tests","tokens_used":500}' "$WORKER_KEY")
assert_status "Submit low quality" "201" "$(parse_status "$RESP")"

# Reject
RESP=$(req POST "/api/tasks/$TASK3_ID/reject" '{"reason":"Submission is just a TODO comment, no actual tests written."}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Publisher rejects deliverable" "200" "$STATUS"
assert_json_field "Task 3 status rejected" "$BODY" ".task.status" "rejected"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 12] Stats (Final)${NC}"
# =========================================================================
RESP=$(req GET /api/stats)
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "GET /api/stats (final)" "200" "$STATUS"
FINAL_TASKS=$(echo "$BODY" | jq -r '.totalTasks')
FINAL_AGENTS=$(echo "$BODY" | jq -r '.activeAgents')
echo "    Final: $FINAL_TASKS tasks (+$((FINAL_TASKS - BASELINE_TASKS))), $FINAL_AGENTS agents (+$((FINAL_AGENTS - BASELINE_AGENTS)))"
TOTAL=$((TOTAL + 1))
if [ "$FINAL_TASKS" -gt "$BASELINE_TASKS" ] && [ "$FINAL_AGENTS" -gt "$BASELINE_AGENTS" ]; then
  echo -e "  ${GREEN}✓${NC} Stats reflect new data"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} Stats did not increase"
  FAIL=$((FAIL + 1))
fi
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 13] Website Pages${NC}"
# =========================================================================

for page in "/" "/tasks" "/tasks/$TASK_ID" "/agents/$WORKER_ID" "/register" "/docs" "/plugins" "/forum"; do
  RESP=$(req GET "$page")
  STATUS=$(parse_status "$RESP")
  assert_status "Page $page loads" "200" "$STATUS"
done
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 14] Forum API${NC}"
# =========================================================================

# Create proposal
RESP=$(req POST /api/forum '{
  "title":"Support batch task publishing",
  "content":"Currently we can only publish one task at a time. It would be great to support batch publishing via a single API call.",
  "category":"proposal"
}' "$PUBLISHER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Create forum proposal" "201" "$STATUS"
assert_json_field "Proposal category" "$BODY" ".category" "proposal"
assert_json_field "Proposal status open" "$BODY" ".status" "open"
PROPOSAL_ID=$(echo "$BODY" | jq -r '.id')
echo "    Proposal ID: $PROPOSAL_ID"

# Create discussion
RESP=$(req POST /api/forum '{
  "title":"Best practices for task descriptions",
  "content":"What makes a good task description? Let us share tips.",
  "category":"discussion"
}' "$WORKER_KEY")
STATUS=$(parse_status "$RESP")
assert_status "Create forum discussion" "201" "$STATUS"

# Error: Create proposal without auth
RESP=$(req POST /api/forum '{"title":"No auth","content":"test","category":"proposal"}')
STATUS=$(parse_status "$RESP")
assert_status "Forum post no auth → 401" "401" "$STATUS"

# List proposals
RESP=$(req GET "/api/forum?category=proposal&limit=10")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "List forum proposals" "200" "$STATUS"
assert_json_not_null "Proposals array exists" "$BODY" ".proposals"

# Get proposal detail
RESP=$(req GET "/api/forum/$PROPOSAL_ID")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get proposal detail" "200" "$STATUS"
assert_json_field "Proposal title correct" "$BODY" ".proposal.title" "Support batch task publishing"

# Reply to proposal
RESP=$(req POST "/api/forum/$PROPOSAL_ID/replies" '{
  "content":"Great idea! We could also add CSV import support for batch publishing."
}' "$WORKER_KEY")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Reply to proposal" "201" "$STATUS"
assert_json_not_null "Reply has id" "$BODY" ".id"

# Error: Reply without auth
RESP=$(req POST "/api/forum/$PROPOSAL_ID/replies" '{"content":"no auth reply"}')
STATUS=$(parse_status "$RESP")
assert_status "Forum reply no auth → 401" "401" "$STATUS"

# Get proposal with replies
RESP=$(req GET "/api/forum/$PROPOSAL_ID")
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "Get proposal with replies" "200" "$STATUS"
echo ""

# =========================================================================
echo -e "${CYAN}[Phase 15] OpenAPI Spec${NC}"
# =========================================================================
RESP=$(req GET /api/openapi.json)
BODY=$(parse_body "$RESP")
STATUS=$(parse_status "$RESP")
assert_status "GET /api/openapi.json" "200" "$STATUS"
assert_json_field "OpenAPI version" "$BODY" ".openapi" "3.0.0"
assert_json_not_null "Has paths" "$BODY" ".paths"
echo ""

# =========================================================================
# Summary
# =========================================================================
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}ALL $TOTAL TESTS PASSED${NC} ($PASS passed, $FAIL failed)"
else
  echo -e "${RED}$FAIL/$TOTAL TESTS FAILED${NC} ($PASS passed, $FAIL failed)"
fi
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"

# Cleanup info
echo ""
echo "Test data created:"
echo "  Publisher: $PUBLISHER_ID (key: ${PUBLISHER_KEY:0:16}...)"
echo "  Worker:    $WORKER_ID (key: ${WORKER_KEY:0:16}...)"
echo "  Worker2:   $WORKER2_ID"
echo "  Tasks:     $TASK_ID, $TASK2_ID (cancelled), $TASK3_ID (rejected)"

exit $FAIL
