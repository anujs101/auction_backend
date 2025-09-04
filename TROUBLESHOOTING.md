# Energy Auction Platform - Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting information for common issues encountered when developing, deploying, or operating the Energy Auction Platform backend.

## Quick Diagnosis

### System Health Check

Run these commands to quickly assess system health:

```bash
# Check application health
curl http://localhost:3000/api/health

# Check Docker services
docker-compose ps

# Check logs for errors
docker-compose logs --tail=50 app | grep -i error

# Check system resources
docker stats --no-stream
```

### Common Symptoms and Quick Fixes

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| 500 Internal Server Error | Database connection issue | `docker-compose restart postgres` |
| Authentication fails | JWT secret mismatch | Check `JWT_SECRET` in environment |
| WebSocket connection drops | CORS configuration | Verify `WEBSOCKET_CORS_ORIGIN` |
| High memory usage | Memory leak | `docker-compose restart app` |
| Slow API responses | Database performance | Check database connections |

## Application Issues

### Authentication Problems

#### Issue: "Invalid signature" error during wallet authentication

**Symptoms:**
- Users cannot authenticate with wallet
- Error message: "Wallet signature verification failed"
- 401 Unauthorized responses

**Diagnosis:**
```bash
# Check authentication logs
docker-compose logs app | grep "authentication"

# Verify JWT secret
docker-compose exec app env | grep JWT_SECRET

# Test signature verification
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"test","signature":"test","message":"test"}'
```

**Solutions:**
1. **Verify wallet signature format:**
   ```typescript
   // Ensure signature is base58 encoded
   const signature = bs58.encode(signatureUint8Array);
   ```

2. **Check message format:**
   ```typescript
   // Message must match exactly what was signed
   const message = `Sign this message to authenticate: ${nonce}`;
   ```

3. **Validate nonce expiration:**
   ```bash
   # Check database for expired nonces
   docker-compose exec postgres psql -U auction_user -d auction_backend \
     -c "SELECT * FROM auth_nonces WHERE expires_at < NOW();"
   ```

#### Issue: JWT token validation fails

**Symptoms:**
- "Invalid token" errors on protected endpoints
- Users logged out unexpectedly
- 401 responses with valid tokens

**Diagnosis:**
```bash
# Check JWT configuration
docker-compose exec app env | grep -E "(JWT_SECRET|JWT_EXPIRES_IN)"

# Decode JWT token (without verification)
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | cut -d. -f2 | base64 -d
```

**Solutions:**
1. **Verify JWT secret consistency:**
   ```bash
   # Ensure JWT_SECRET is at least 32 characters
   echo $JWT_SECRET | wc -c
   ```

2. **Check token expiration:**
   ```typescript
   // Verify token hasn't expired
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   console.log('Token expires:', new Date(decoded.exp * 1000));
   ```

3. **Restart application if secret changed:**
   ```bash
   docker-compose restart app
   ```

### Database Issues

#### Issue: Database connection failures

**Symptoms:**
- "Connection refused" errors
- "Too many connections" errors
- Application startup failures

**Diagnosis:**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U auction_user

# Check connection count
docker-compose exec postgres psql -U auction_user -d auction_backend \
  -c "SELECT count(*) FROM pg_stat_activity WHERE datname='auction_backend';"

# Check database logs
docker-compose logs postgres | tail -50
```

**Solutions:**
1. **Restart database service:**
   ```bash
   docker-compose restart postgres
   ```

2. **Check connection string:**
   ```bash
   # Verify DATABASE_URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:5432/database
   ```

3. **Increase connection limit:**
   ```sql
   -- Connect to database and check/update max_connections
   SHOW max_connections;
   ALTER SYSTEM SET max_connections = 200;
   SELECT pg_reload_conf();
   ```

4. **Clear connection pool:**
   ```bash
   # Restart application to reset connection pool
   docker-compose restart app
   ```

#### Issue: Database migration failures

**Symptoms:**
- Migration errors during deployment
- Schema mismatch errors
- "Relation does not exist" errors

**Diagnosis:**
```bash
# Check migration status
docker-compose exec app bun run prisma migrate status

# Check database schema
docker-compose exec postgres psql -U auction_user -d auction_backend \
  -c "\dt" # List tables
```

**Solutions:**
1. **Reset database (development only):**
   ```bash
   docker-compose exec app bun run prisma migrate reset
   ```

2. **Apply pending migrations:**
   ```bash
   docker-compose exec app bun run prisma migrate deploy
   ```

3. **Resolve migration conflicts:**
   ```bash
   # Mark problematic migration as applied
   docker-compose exec app bun run prisma migrate resolve --applied "migration_name"
   ```

### Blockchain Integration Issues

#### Issue: Solana RPC connection failures

**Symptoms:**
- "Failed to connect to Solana RPC" errors
- Blockchain health check failures
- Transaction timeouts

**Diagnosis:**
```bash
# Test RPC connectivity
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  $SOLANA_RPC_URL

# Check blockchain service logs
docker-compose logs app | grep -i "blockchain"

# Verify RPC URL configuration
docker-compose exec app env | grep SOLANA_RPC_URL
```

**Solutions:**
1. **Switch to different RPC endpoint:**
   ```bash
   # Update environment variable
   export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   # Or for devnet: https://api.devnet.solana.com
   ```

2. **Increase timeout settings:**
   ```typescript
   // In blockchain service configuration
   const connection = new Connection(rpcUrl, {
     commitment: 'confirmed',
     confirmTransactionInitialTimeout: 120000, // 2 minutes
   });
   ```

3. **Implement RPC failover:**
   ```typescript
   const rpcEndpoints = [
     'https://api.mainnet-beta.solana.com',
     'https://solana-api.projectserum.com',
     'https://rpc.ankr.com/solana'
   ];
   ```

#### Issue: Program interaction failures

**Symptoms:**
- "Program not found" errors
- Invalid instruction errors
- Account not found errors

**Diagnosis:**
```bash
# Verify program ID
docker-compose exec app env | grep SOLANA_PROGRAM_ID

# Check program exists on blockchain
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["'$SOLANA_PROGRAM_ID'"]}' \
  $SOLANA_RPC_URL
```

**Solutions:**
1. **Verify program deployment:**
   ```bash
   # Check if program is deployed to correct network
   solana program show $SOLANA_PROGRAM_ID --url $SOLANA_RPC_URL
   ```

2. **Update program ID:**
   ```bash
   # Update environment variable with correct program ID
   export SOLANA_PROGRAM_ID="your-correct-program-id"
   ```

3. **Regenerate program addresses:**
   ```bash
   # Clear any cached PDAs and regenerate
   docker-compose restart app
   ```

### WebSocket Issues

#### Issue: WebSocket connections failing

**Symptoms:**
- WebSocket connection refused
- CORS errors in browser console
- Real-time updates not working

**Diagnosis:**
```bash
# Test WebSocket connection
wscat -c ws://localhost:3000

# Check CORS configuration
docker-compose exec app env | grep WEBSOCKET_CORS_ORIGIN

# Check WebSocket logs
docker-compose logs app | grep -i "websocket"
```

**Solutions:**
1. **Fix CORS configuration:**
   ```bash
   # Update CORS origins
   export WEBSOCKET_CORS_ORIGIN="http://localhost:3000,https://yourdomain.com"
   ```

2. **Check port binding:**
   ```bash
   # Ensure WebSocket port is accessible
   netstat -tlnp | grep :3000
   ```

3. **Restart WebSocket service:**
   ```bash
   docker-compose restart app
   ```

#### Issue: WebSocket authentication failures

**Symptoms:**
- "Authentication required" errors
- Users can't join authenticated rooms
- JWT token not recognized

**Diagnosis:**
```javascript
// Test WebSocket authentication
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token',
    walletAddress: 'your-wallet-address'
  }
});

socket.on('connect_error', (error) => {
  console.log('Connection error:', error);
});
```

**Solutions:**
1. **Verify token format:**
   ```javascript
   // Ensure token is passed correctly
   const socket = io('ws://localhost:3000', {
     auth: {
       token: token, // Without 'Bearer ' prefix
       walletAddress: walletAddress
     }
   });
   ```

2. **Check token validity:**
   ```bash
   # Test token with REST API first
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/auth/profile
   ```

## Performance Issues

### High Memory Usage

**Symptoms:**
- Application consuming excessive RAM
- Out of memory errors
- Slow response times

**Diagnosis:**
```bash
# Check memory usage
docker stats --no-stream

# Check Node.js heap usage
docker-compose exec app node -e "console.log(process.memoryUsage())"

# Profile memory usage
docker-compose exec app node --inspect=0.0.0.0:9229 dist/app.js
```

**Solutions:**
1. **Increase container memory limit:**
   ```yaml
   # In docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
   ```

2. **Optimize database queries:**
   ```typescript
   // Use select to limit returned fields
   const users = await prisma.user.findMany({
     select: {
       id: true,
       walletAddress: true
     }
   });
   ```

3. **Implement caching:**
   ```typescript
   // Cache frequently accessed data
   const cachedData = await redis.get(cacheKey);
   if (!cachedData) {
     const data = await expensiveOperation();
     await redis.setex(cacheKey, 300, JSON.stringify(data));
   }
   ```

### Slow Database Queries

**Symptoms:**
- API responses taking > 2 seconds
- Database CPU usage high
- Connection pool exhaustion

**Diagnosis:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check active connections
SELECT count(*) FROM pg_stat_activity 
WHERE state = 'active';

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solutions:**
1. **Add database indexes:**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX CONCURRENTLY idx_bids_user_timeslot 
   ON bids(user_id, timeslot_id);
   
   CREATE INDEX CONCURRENTLY idx_supplies_status 
   ON supplies(status) WHERE status IN ('COMMITTED', 'CONFIRMED');
   ```

2. **Optimize queries:**
   ```typescript
   // Use pagination for large result sets
   const bids = await prisma.bid.findMany({
     take: 50,
     skip: offset,
     orderBy: { createdAt: 'desc' }
   });
   ```

3. **Increase connection pool:**
   ```bash
   # Update DATABASE_URL
   export DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=50"
   ```

## Deployment Issues

### Docker Build Failures

**Symptoms:**
- "Docker build failed" errors
- Missing dependencies in container
- Build timeouts

**Diagnosis:**
```bash
# Check Docker build logs
docker-compose build --no-cache app

# Check Dockerfile syntax
docker run --rm -i hadolint/hadolint < Dockerfile

# Check available disk space
df -h
```

**Solutions:**
1. **Clear Docker cache:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

2. **Fix Dockerfile issues:**
   ```dockerfile
   # Ensure proper layer caching
   COPY package.json bun.lock ./
   RUN bun install --frozen-lockfile
   COPY . .
   RUN bun run build
   ```

3. **Increase build resources:**
   ```bash
   # Increase Docker memory limit
   # In Docker Desktop: Settings > Resources > Memory
   ```

### SSL Certificate Issues

**Symptoms:**
- "Certificate not trusted" warnings
- HTTPS connection failures
- Mixed content errors

**Diagnosis:**
```bash
# Check certificate validity
openssl x509 -in ssl/fullchain.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
openssl x509 -in ssl/fullchain.pem -noout -dates
```

**Solutions:**
1. **Renew SSL certificate:**
   ```bash
   # Using Certbot
   sudo certbot renew
   
   # Copy new certificates
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
   ```

2. **Fix certificate chain:**
   ```bash
   # Ensure full certificate chain is included
   cat cert.pem intermediate.pem root.pem > fullchain.pem
   ```

3. **Update nginx configuration:**
   ```nginx
   ssl_certificate /etc/ssl/private/fullchain.pem;
   ssl_certificate_key /etc/ssl/private/privkey.pem;
   ```

## Monitoring and Alerting

### Log Analysis

**Common log patterns to monitor:**

```bash
# Authentication failures
grep "authentication failed" logs/app.log

# Database connection issues
grep "database.*error" logs/app.log

# Blockchain errors
grep "blockchain.*error" logs/app.log

# High error rates
grep "ERROR" logs/app.log | wc -l

# Memory warnings
grep "memory" logs/app.log
```

### Setting Up Alerts

**Prometheus alerts configuration:**

```yaml
# alerts.yml
groups:
  - name: auction_backend
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          
      - alert: DatabaseConnectionHigh
        expr: pg_stat_activity_count > 80
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection count is high"
          
      - alert: MemoryUsageHigh
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container memory usage is high"
```

## Emergency Procedures

### Service Outage Response

1. **Immediate Assessment (0-5 minutes):**
   ```bash
   # Check service status
   docker-compose ps
   
   # Check recent logs
   docker-compose logs --tail=100 app
   
   # Check system resources
   docker stats --no-stream
   ```

2. **Quick Recovery (5-15 minutes):**
   ```bash
   # Restart affected services
   docker-compose restart app
   
   # If database issues
   docker-compose restart postgres
   
   # Check health after restart
   curl http://localhost:3000/api/health
   ```

3. **Full Recovery (15+ minutes):**
   ```bash
   # If restart doesn't work, rebuild
   docker-compose down
   docker-compose up -d --build
   
   # Restore from backup if needed
   ./scripts/restore-backup.sh latest
   ```

### Data Recovery

**Database corruption recovery:**

```bash
# 1. Stop application
docker-compose stop app

# 2. Create emergency backup
docker-compose exec postgres pg_dump -U auction_user auction_backend > emergency_backup.sql

# 3. Restore from latest good backup
docker-compose exec -T postgres psql -U auction_user auction_backend < backups/latest_backup.sql

# 4. Restart application
docker-compose start app

# 5. Verify data integrity
curl http://localhost:3000/api/health
```

### Rollback Procedures

**Application rollback:**

```bash
# 1. Identify last known good version
git log --oneline -10

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild and deploy
docker-compose down
docker-compose up -d --build

# 4. Run any necessary database migrations
docker-compose exec app bun run prisma migrate deploy
```

## Prevention Strategies

### Monitoring Setup

1. **Health Checks:**
   ```bash
   # Add to crontab for regular health monitoring
   */5 * * * * curl -f http://localhost:3000/api/health || echo "Health check failed" | mail -s "Service Alert" admin@example.com
   ```

2. **Log Rotation:**
   ```bash
   # Configure logrotate
   sudo tee /etc/logrotate.d/auction-backend << EOF
   /opt/auction-backend/logs/*.log {
       daily
       rotate 30
       compress
       delaycompress
       missingok
       notifempty
   }
   EOF
   ```

3. **Automated Backups:**
   ```bash
   # Add to crontab for daily backups
   0 2 * * * /opt/auction-backend/scripts/backup.sh
   ```

### Performance Monitoring

```bash
# Set up performance monitoring script
#!/bin/bash
# performance-monitor.sh

# Check API response time
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/api/health)
if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "High response time: ${RESPONSE_TIME}s" | mail -s "Performance Alert" admin@example.com
fi

# Check memory usage
MEMORY_USAGE=$(docker stats --no-stream --format "{{.MemPerc}}" auction_backend_app_1 | sed 's/%//')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "High memory usage: ${MEMORY_USAGE}%" | mail -s "Memory Alert" admin@example.com
fi
```

---

This troubleshooting guide covers the most common issues and their solutions. For issues not covered here, check the application logs and contact the development team with specific error messages and reproduction steps.
