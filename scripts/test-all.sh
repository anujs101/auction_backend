#!/bin/bash

echo "🧪 Comprehensive Testing of Auction Backend"
echo "=========================================="

BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response:"
        cat /tmp/response.json | jq . 2>/dev/null || cat /tmp/response.json
        return 1
    fi
}

echo ""
echo "1. 🏥 Basic Health Checks"
echo "------------------------"
test_endpoint "GET" "/health" "200" "Server health check"
test_endpoint "GET" "/api/health" "200" "API health check"
test_endpoint "GET" "/api/" "200" "API info endpoint"

echo ""
echo "2. 🔗 Blockchain Integration"
echo "---------------------------"
test_endpoint "GET" "/api/blockchain/health" "200" "Blockchain connection health"
test_endpoint "GET" "/api/blockchain/global-state" "200" "Global state retrieval"
test_endpoint "GET" "/api/blockchain/time-info" "200" "Time information"
test_endpoint "GET" "/api/blockchain/timeslots/active" "200" "Active timeslots"
test_endpoint "GET" "/api/blockchain/timeslots/1234567890" "404" "Specific timeslot (not found)"
test_endpoint "GET" "/api/blockchain/timeslots/1234567890/bids" "200" "Timeslot bids"
test_endpoint "GET" "/api/blockchain/timeslots/1234567890/supplies" "200" "Timeslot supplies"

echo ""
echo "3. 🔐 Authentication System"
echo "--------------------------"
test_endpoint "POST" "/api/auth/init" "200" "Auth initialization" '{"walletAddress":"11111111111111111111111111111112"}'
test_endpoint "POST" "/api/auth/init" "400" "Auth init with invalid wallet" '{"walletAddress":"invalid"}'
test_endpoint "GET" "/api/auth/profile" "401" "Profile without auth"

echo ""
echo "4. 🛡️ Validation Endpoints"
echo "-------------------------"
test_endpoint "POST" "/api/blockchain/validate/bid" "200" "Bid validation" '{"timeslotEpoch":1234567890,"price":0.1,"quantity":100}'
test_endpoint "POST" "/api/blockchain/validate/supply" "200" "Supply validation" '{"timeslotEpoch":1234567890,"reservePrice":0.05,"quantity":200}'
test_endpoint "POST" "/api/blockchain/validate/bid" "400" "Invalid bid params" '{"price":-1}'

echo ""
echo "5. 🔍 PDA Address Calculation"
echo "----------------------------"
test_endpoint "GET" "/api/blockchain/pda-addresses?epoch=1234567890&walletAddress=11111111111111111111111111111112" "200" "PDA address calculation"

echo ""
echo "6. 💰 Account Balance"
echo "-------------------"
test_endpoint "GET" "/api/blockchain/accounts/11111111111111111111111111111112/balance" "200" "Valid wallet balance"
test_endpoint "GET" "/api/blockchain/accounts/invalid-wallet/balance" "400" "Invalid wallet balance"

echo ""
echo "7. 🚫 Error Handling"
echo "-------------------"
test_endpoint "GET" "/api/nonexistent" "404" "Non-existent endpoint"
test_endpoint "POST" "/api/auth/init" "400" "Missing request body" '{}'

echo ""
echo "8. 📊 Rate Limiting (Quick Test)"
echo "-------------------------------"
for i in {1..5}; do
    test_endpoint "GET" "/api/blockchain/health" "200" "Rate limit test $i/5"
done

echo ""
echo "=========================================="
echo "🎯 Test Summary Complete"
echo "=========================================="
