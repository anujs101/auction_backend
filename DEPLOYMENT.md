# Energy Auction Platform - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Energy Auction Platform backend to production environments. It covers infrastructure setup, security configuration, monitoring, and operational procedures.

## Infrastructure Requirements

### Minimum System Requirements

- **CPU**: 2 cores (4 cores recommended)
- **Memory**: 4GB RAM (8GB recommended)
- **Storage**: 20GB SSD (50GB recommended)
- **Network**: Stable internet connection with low latency to Solana RPC
- **OS**: Ubuntu 20.04+ or similar Linux distribution

### Recommended Production Setup

- **Application Server**: 4 cores, 8GB RAM
- **Database Server**: 4 cores, 16GB RAM, SSD storage
- **Redis Server**: 2 cores, 4GB RAM
- **Load Balancer**: 2 cores, 4GB RAM

## Pre-Deployment Checklist

### Environment Preparation

- [ ] Server provisioned and accessible via SSH
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates obtained
- [ ] Domain name configured
- [ ] Firewall rules configured
- [ ] Backup strategy implemented

### Security Configuration

- [ ] SSH key-based authentication enabled
- [ ] Root login disabled
- [ ] Firewall configured (UFW or iptables)
- [ ] Fail2ban installed and configured
- [ ] SSL/TLS certificates installed
- [ ] Environment variables secured

### Database Setup

- [ ] PostgreSQL 15+ installed
- [ ] Database user created with limited privileges
- [ ] Database backup strategy implemented
- [ ] Connection pooling configured
- [ ] Performance monitoring enabled

## Environment Variables

### Required Production Variables

Create a `.env.production` file with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://auction_user:SECURE_PASSWORD@localhost:5432/auction_backend"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
BULL_REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="your-super-secure-jwt-secret-minimum-64-characters-long"
JWT_EXPIRES_IN="24h"

# Solana Blockchain
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_PROGRAM_ID="your-deployed-program-id"
SOLANA_COMMITMENT="confirmed"
PRIVATE_KEY="your-base58-encoded-private-key"

# Server Configuration
PORT=3000
NODE_ENV="production"

# CORS Configuration
CORS_ORIGIN="https://yourdomain.com"
WEBSOCKET_CORS_ORIGIN="https://yourdomain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Security
HELMET_CSP_ENABLED=true

# PostgreSQL Password (for Docker Compose)
POSTGRES_PASSWORD="your-secure-database-password"
```

### Security Best Practices for Environment Variables

1. **Use Strong Passwords**: Generate random, complex passwords
2. **Rotate Secrets Regularly**: Update JWT secrets and database passwords
3. **Limit Access**: Restrict file permissions to 600
4. **Use Secret Management**: Consider using HashiCorp Vault or AWS Secrets Manager
5. **Never Commit Secrets**: Use `.gitignore` to exclude environment files

## Docker Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
      - /etc/ssl/certs:/etc/ssl/certs:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: auction_backend
      POSTGRES_USER: auction_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U auction_user -d auction_backend"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/private:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/ssl/private/fullchain.pem;
        ssl_certificate_key /etc/ssl/private/privkey.pem;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Authentication endpoints (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://app/api/health;
            access_log off;
        }
    }
}
```

## Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/auction-backend
sudo chown $USER:$USER /opt/auction-backend
cd /opt/auction-backend
```

### 2. Code Deployment

```bash
# Clone repository
git clone <your-repository-url> .

# Copy environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production

# Set proper permissions
chmod 600 .env.production
```

### 3. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to project directory
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/
```

### 4. Database Initialization

```bash
# Start database services
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for services to be ready
sleep 30

# Run database migrations
docker-compose -f docker-compose.prod.yml exec app bun run prisma:migrate:deploy

# Seed database (optional)
docker-compose -f docker-compose.prod.yml exec app bun run prisma:seed
```

### 5. Application Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Verification

```bash
# Test health endpoint
curl -k https://yourdomain.com/health

# Test API endpoint
curl -k https://yourdomain.com/api/

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## Monitoring and Logging

### Application Monitoring

Create `monitoring/docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  prometheus_data:
  grafana_data:
```

### Log Management

```bash
# Create log rotation configuration
sudo tee /etc/logrotate.d/auction-backend << EOF
/opt/auction-backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        docker-compose -f /opt/auction-backend/docker-compose.prod.yml restart app
    endscript
}
EOF
```

## Backup Strategy

### Database Backup

Create `scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/auction-backend/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="auction_backend_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
docker-compose -f /opt/auction-backend/docker-compose.prod.yml exec -T postgres pg_dump -U auction_user auction_backend > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Automated Backup with Cron

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Add to crontab (daily backup at 2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/auction-backend/scripts/backup.sh
```

## Security Hardening

### Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### Fail2Ban Configuration

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Create jail configuration
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /opt/auction-backend/logs/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /opt/auction-backend/logs/nginx/error.log
maxretry = 10
EOF

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_users_wallet_address ON users(wallet_address);
CREATE INDEX CONCURRENTLY idx_bids_user_id ON bids(user_id);
CREATE INDEX CONCURRENTLY idx_bids_timeslot_id ON bids(timeslot_id);
CREATE INDEX CONCURRENTLY idx_supplies_user_id ON supplies(user_id);
CREATE INDEX CONCURRENTLY idx_supplies_timeslot_id ON supplies(timeslot_id);
CREATE INDEX CONCURRENTLY idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY idx_transactions_tx_signature ON transactions(tx_signature);
```

### Application Optimization

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize Docker settings
echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Weekly**:
   - Review application logs
   - Check disk space usage
   - Verify backup integrity
   - Update security patches

2. **Monthly**:
   - Rotate SSL certificates (if needed)
   - Review performance metrics
   - Update dependencies
   - Database maintenance

3. **Quarterly**:
   - Security audit
   - Disaster recovery testing
   - Performance optimization review
   - Infrastructure scaling assessment

### Update Procedure

```bash
# 1. Backup current state
./scripts/backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Rebuild and restart services
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations if needed
docker-compose -f docker-compose.prod.yml exec app bun run prisma:migrate:deploy

# 5. Verify deployment
curl -k https://yourdomain.com/health
```

## Troubleshooting

### Common Issues

**Service Won't Start**:
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET)"
```

**Database Connection Issues**:
```bash
# Test database connectivity
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U auction_user

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

**High Memory Usage**:
```bash
# Monitor resource usage
docker stats

# Restart services if needed
docker-compose -f docker-compose.prod.yml restart app
```

### Emergency Procedures

**Service Outage**:
1. Check service status: `docker-compose ps`
2. Review logs: `docker-compose logs`
3. Restart affected services: `docker-compose restart <service>`
4. If needed, restore from backup

**Database Corruption**:
1. Stop application: `docker-compose stop app`
2. Create emergency backup: `./scripts/backup.sh`
3. Restore from latest good backup
4. Restart services: `docker-compose up -d`

## Scaling Considerations

### Horizontal Scaling

For high-traffic deployments:

1. **Load Balancer**: Use nginx or HAProxy
2. **Multiple App Instances**: Deploy across multiple servers
3. **Database Clustering**: Consider PostgreSQL clustering
4. **Redis Clustering**: Implement Redis cluster for session storage

### Vertical Scaling

Monitor these metrics to determine when to scale:

- CPU usage > 70% sustained
- Memory usage > 80%
- Database connection pool exhaustion
- Response times > 2 seconds

---

This deployment guide provides a comprehensive foundation for production deployment. Adjust configurations based on your specific infrastructure requirements and security policies.
