# 🐳 Docker Deployment Guide - Laser Tag System

This guide explains how to run the entire Laser Tag system using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 4GB RAM available for Docker
- Ports 80, 3000, and 27017 available

## 🏗️ Architecture

The Docker setup includes 4 services:

1. **MongoDB** (Port 27017) - Database for students and games
2. **Backend API** (Port 3000) - Express.js REST API
3. **Frontend UI** (Port 80) - React app served via Nginx
4. **NFC Reader** (Optional) - PN532 card reader service

## 🚀 Quick Start

### 1. Build and Start All Services (Without NFC Reader)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017

### 3. Start with NFC Reader (Requires Hardware)

```bash
# For Linux/Mac (USB serial port)
docker-compose --profile nfc up -d

# For Windows, modify docker-compose.yml first:
# Change device mapping from /dev/ttyUSB0 to your COM port
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGO_INITDB_DATABASE=lasertag
MONGODB_URI=mongodb://mongodb:27017/lasertag

# Backend
NODE_ENV=production
PORT=3000

# NFC Reader
SERIAL_PATH=/dev/ttyUSB0  # Linux/Mac
# SERIAL_PATH=COM5        # Windows
BACKEND_URL=http://backend:3000
```

### NFC Reader Setup (Windows)

For Windows, you need to modify `docker-compose.yml`:

```yaml
nfc-reader:
  # ... existing config
  environment:
    - SERIAL_PATH=COM5  # Change to your COM port
  devices:
    - //./COM5://./COM5  # Windows device mapping
```

**Note**: Docker on Windows doesn't support USB device passthrough well. Consider running the NFC reader outside Docker:

```bash
cd pn532.js
set SERIAL_PATH=COM5
set BACKEND_URL=http://localhost:3000
node examples/nfc-read-memory.js
```

## 📦 Docker Commands

### Start Services
```bash
# Start all (without NFC)
docker-compose up -d

# Start all with NFC reader
docker-compose --profile nfc up -d

# Start specific service
docker-compose up -d backend
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop and remove volumes (deletes database)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Execute Commands in Container
```bash
# Access backend shell
docker-compose exec backend sh

# Access MongoDB shell
docker-compose exec mongodb mongosh lasertag

# Run npm commands in backend
docker-compose exec backend npm run seed
```

## 🗄️ Database Management

### Import Initial Data

The `contacts_rolls.json` file is automatically mounted to MongoDB. To import it:

```bash
# Access MongoDB container
docker-compose exec mongodb mongosh lasertag

# In MongoDB shell:
db.students.drop()
db.registered.drop()

# Exit and import from host
docker-compose exec -T mongodb mongoimport \
  --db lasertag \
  --collection students \
  --file /docker-entrypoint-initdb.d/contacts_rolls.json \
  --jsonArray
```

### Backup Database

```bash
# Backup
docker-compose exec mongodb mongodump \
  --db lasertag \
  --out /data/backup

# Copy to host
docker cp lasertag-mongodb:/data/backup ./mongodb-backup
```

### Restore Database

```bash
# Copy to container
docker cp ./mongodb-backup lasertag-mongodb:/data/backup

# Restore
docker-compose exec mongodb mongorestore \
  --db lasertag \
  /data/backup/lasertag
```

## 🔍 Monitoring & Health Checks

### Check Service Status
```bash
docker-compose ps
```

### Health Check Endpoints
- Backend: http://localhost:3000/teams
- Frontend: http://localhost/

### Container Stats
```bash
docker stats
```

## 🐛 Troubleshooting

### Backend Can't Connect to MongoDB

1. Check if MongoDB is running:
   ```bash
   docker-compose ps mongodb
   ```

2. Check MongoDB logs:
   ```bash
   docker-compose logs mongodb
   ```

3. Verify network connectivity:
   ```bash
   docker-compose exec backend ping mongodb
   ```

### Frontend Can't Reach Backend

1. Check nginx configuration:
   ```bash
   docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
   ```

2. Check backend is responding:
   ```bash
   curl http://localhost:3000/teams
   ```

3. Check frontend logs:
   ```bash
   docker-compose logs frontend
   ```

### NFC Reader Not Working

1. Check serial port permissions (Linux):
   ```bash
   sudo chmod 666 /dev/ttyUSB0
   ```

2. List available ports:
   ```bash
   # Linux/Mac
   ls /dev/tty*
   
   # Windows (PowerShell)
   [System.IO.Ports.SerialPort]::getportnames()
   ```

3. Run NFC reader outside Docker (Windows):
   ```bash
   cd pn532.js
   set SERIAL_PATH=COM5
   node examples/nfc-read-memory.js
   ```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 80 to 8080
  
  backend:
    ports:
      - "3001:3000"  # Change 3000 to 3001
```

## 🔒 Production Deployment

### Security Recommendations

1. **Use environment files for secrets**:
   ```bash
   docker-compose --env-file .env.production up -d
   ```

2. **Enable MongoDB authentication**:
   ```yaml
   mongodb:
     environment:
       MONGO_INITDB_ROOT_USERNAME: admin
       MONGO_INITDB_ROOT_PASSWORD: securepassword
   ```

3. **Use HTTPS** (add SSL certificates to nginx):
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
   }
   ```

4. **Limit resource usage**:
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           cpus: '1'
           memory: 512M
   ```

### Network Configuration

For production, use a custom network with specific IP ranges:

```yaml
networks:
  lasertag-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

## 📊 Performance Optimization

### Backend Optimization
```yaml
backend:
  environment:
    - NODE_ENV=production
    - NODE_OPTIONS=--max-old-space-size=512
```

### Frontend Optimization
- Static assets are cached for 1 year
- Gzip compression enabled
- Build optimizations in `npm run build`

### MongoDB Optimization
```yaml
mongodb:
  command: mongod --wiredTigerCacheSizeGB 1
```

## 🔄 Updates and Maintenance

### Update Images
```bash
# Pull latest base images
docker-compose pull

# Rebuild with new base images
docker-compose build --pull

# Restart with new images
docker-compose up -d
```

### Clean Up
```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove all unused resources
docker system prune -a
```

## 📝 Development vs Production

### Development Mode
```bash
# Use volumes for hot-reload
docker-compose -f docker-compose.dev.yml up
```

### Production Mode
```bash
# Use optimized builds
docker-compose -f docker-compose.yml up -d
```

## 🆘 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify all services are healthy: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Full reset: `docker-compose down -v && docker-compose up -d`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)
