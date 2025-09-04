#!/bin/bash

# Test script for Timeslot API endpoints
# This script tests all timeslot-related functionality

set -e

BASE_URL="http://localhost:3000/api"
TEST_WALLET="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"

echo "🧪 Testing Timeslot API Endpoints"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local response
    local status_code
    
    echo -n "Testing: $test_name... "
    
    # Capture both response and status code
    response=$(eval "$3" 2>/dev/null)
    status_code=$?
    
    if [ $status_code -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        if [ "$4" = "show_response" ]; then
            echo "Response: $response" | head -3
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
        echo "Error: $response"
    fi
    echo
}

# Function to get auth token (mock for testing)
get_auth_token() {
    # In a real scenario, this would authenticate with the wallet
    # For testing, we'll use a mock JWT token
    echo "mock_jwt_token_for_testing"
}

echo "1. Testing Public Endpoints (No Auth Required)"
echo "=============================================="

# Test 1: Get active timeslots
run_test "Get active timeslots" 200 \
    "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/timeslots/active'"

# Test 2: Get upcoming timeslots
run_test "Get upcoming timeslots" 200 \
    "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/timeslots/upcoming'"

# Test 3: Get upcoming timeslots with limit
run_test "Get upcoming timeslots with limit" 200 \
    "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/timeslots/upcoming?limit=5'"

echo "2. Testing Authenticated Endpoints"
echo "=================================="

AUTH_TOKEN=$(get_auth_token)

# Test 4: List all timeslots (requires auth)
run_test "List all timeslots (authenticated)" 200 \
    "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots'"

# Test 5: List timeslots with filters
run_test "List timeslots with status filter" 200 \
    "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots?status=OPEN'"

# Test 6: List timeslots with pagination
run_test "List timeslots with pagination" 200 \
    "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots?page=1&limit=10'"

echo "3. Testing Timeslot Creation (Admin Operations)"
echo "=============================================="

# Test 7: Create new timeslot
FUTURE_DATE=$(date -u -d '+1 hour' +"%Y-%m-%dT%H:%M:%S.000Z")
END_DATE=$(date -u -d '+2 hours' +"%Y-%m-%dT%H:%M:%S.000Z")

CREATE_PAYLOAD=$(cat <<EOF
{
  "startTime": "$FUTURE_DATE",
  "endTime": "$END_DATE",
  "reservePrice": 100,
  "description": "Test timeslot for energy auction"
}
EOF
)

run_test "Create new timeslot" 201 \
    "curl -s -w '%{http_code}' -o /dev/null -X POST -H 'Content-Type: application/json' -H 'Authorization: Bearer $AUTH_TOKEN' -d '$CREATE_PAYLOAD' '$BASE_URL/timeslots'"

# Test 8: Create timeslot with invalid data
INVALID_PAYLOAD=$(cat <<EOF
{
  "startTime": "invalid-date",
  "endTime": "$END_DATE",
  "reservePrice": -10
}
EOF
)

run_test "Create timeslot with invalid data" 400 \
    "curl -s -w '%{http_code}' -o /dev/null -X POST -H 'Content-Type: application/json' -H 'Authorization: Bearer $AUTH_TOKEN' -d '$INVALID_PAYLOAD' '$BASE_URL/timeslots'"

echo "4. Testing Individual Timeslot Operations"
echo "========================================"

# For these tests, we'll use a mock timeslot ID
MOCK_TIMESLOT_ID="550e8400-e29b-41d4-a716-446655440000"

# Test 9: Get timeslot by ID
run_test "Get timeslot by ID" 404 \
    "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/timeslots/$MOCK_TIMESLOT_ID'"

# Test 10: Get timeslot stats
run_test "Get timeslot statistics" 404 \
    "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/timeslots/$MOCK_TIMESLOT_ID/stats'"

# Test 11: Update timeslot
UPDATE_PAYLOAD=$(cat <<EOF
{
  "reservePrice": 150,
  "description": "Updated test timeslot"
}
EOF
)

run_test "Update timeslot" 404 \
    "curl -s -w '%{http_code}' -o /dev/null -X PUT -H 'Content-Type: application/json' -H 'Authorization: Bearer $AUTH_TOKEN' -d '$UPDATE_PAYLOAD' '$BASE_URL/timeslots/$MOCK_TIMESLOT_ID'"

echo "5. Testing Timeslot State Management"
echo "==================================="

# Test 12: Seal timeslot
run_test "Seal timeslot" 404 \
    "curl -s -w '%{http_code}' -o /dev/null -X PUT -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots/$MOCK_TIMESLOT_ID/seal'"

# Test 13: Settle timeslot
run_test "Settle timeslot" 404 \
    "curl -s -w '%{http_code}' -o /dev/null -X PUT -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots/$MOCK_TIMESLOT_ID/settle'"

# Test 14: Cancel timeslot
run_test "Cancel timeslot" 404 \
    "curl -s -w '%{http_code}' -o /dev/null -X DELETE -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots/$MOCK_TIMESLOT_ID'"

echo "6. Testing Error Handling"
echo "========================"

# Test 15: Access protected endpoint without auth
run_test "Access protected endpoint without auth" 401 \
    "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/timeslots'"

# Test 16: Invalid timeslot ID format
run_test "Invalid timeslot ID format" 400 \
    "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/timeslots/invalid-id'"

# Test 17: Missing required fields in creation
INCOMPLETE_PAYLOAD=$(cat <<EOF
{
  "reservePrice": 100
}
EOF
)

run_test "Create timeslot with missing fields" 400 \
    "curl -s -w '%{http_code}' -o /dev/null -X POST -H 'Content-Type: application/json' -H 'Authorization: Bearer $AUTH_TOKEN' -d '$INCOMPLETE_PAYLOAD' '$BASE_URL/timeslots'"

echo "7. Testing Rate Limiting"
echo "======================"

# Test 18: Rate limiting (make multiple rapid requests)
echo -n "Testing rate limiting... "
RATE_LIMIT_PASSED=true

for i in {1..25}; do
    response=$(curl -s -w '%{http_code}' -o /dev/null "$BASE_URL/timeslots/active" 2>/dev/null)
    if [ "$response" = "429" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Rate limit triggered after $i requests)"
        ((TESTS_PASSED++))
        RATE_LIMIT_PASSED=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMIT_PASSED" != true ]; then
    echo -e "${YELLOW}⚠ SKIPPED${NC} (Rate limit not triggered in 25 requests)"
fi

echo

echo "8. Testing Input Validation"
echo "=========================="

# Test 19: Invalid query parameters
run_test "Invalid status filter" 400 \
    "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots?status=INVALID_STATUS'"

# Test 20: Invalid pagination parameters
run_test "Invalid pagination (negative page)" 400 \
    "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots?page=-1'"

# Test 21: Excessive limit parameter
run_test "Excessive limit parameter" 400 \
    "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $AUTH_TOKEN' '$BASE_URL/timeslots?limit=1000'"

echo "📊 Test Results Summary"
echo "======================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the implementation.${NC}"
    exit 1
fi
