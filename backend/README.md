# Booking System Backend

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with required variables:
   ```env
   # Database credentials
   DB_USER=postgres
   DB_PASSWORD=admin
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=booking_system

   # Server port
   PORT=5000

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000

   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h

   # File Upload Configuration
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=5242880  # 5MB in bytes
   ```

3. Database Management:
   ```bash
   # Safe update - won't delete data
   npm run update-db

   # WARNING: This will delete all data!
   npm run reset-db
   ```

4. Start server:
   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- POST /api/users/signup
- POST /api/users/login

### Bookings
- GET /api/bookings
- POST /api/bookings
- PUT /api/bookings/:id
- DELETE /api/bookings/:id

### Certificates
- GET /api/certificates
- POST /api/certificates/:bookingId

### Analytics
- GET /api/analytics

### Backups
- GET /api/backups
- POST /api/backups/:period

### Reports
- GET /api/reports/:period

## Database Commands

### Safe Schema Update
Use this command to update the database schema without losing data:
```bash
npm run update-db
```
This will:
- Create tables if they don't exist
- Add new columns safely
- Create indexes
- Preserve all existing data

### Reset Database
⚠️ WARNING: This command will delete all data!
```bash
npm run reset-db
```
This will:
- Drop all existing tables
- Recreate tables from scratch
- Reset all data

### Backup and Restore Commands

#### Create Database Backup
```bash
# Backup entire database
pg_dump -U postgres booking_system > backup_filename.sql

# Backup specific tables
pg_dump -U postgres -t users -t bookings booking_system > tables_backup.sql

# Backup with timestamp
pg_dump -U postgres booking_system > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup in custom format (compressed)
pg_dump -U postgres -Fc booking_system > backup.dump
```

#### Restore Database
```bash
# Restore entire database
psql -U postgres booking_system < backup_filename.sql

# Restore from custom format
pg_restore -U postgres -d booking_system backup.dump

# Restore specific tables
psql -U postgres -d booking_system -t users -t bookings < tables_backup.sql
```

#### Automated Backup Script
Create a backup script `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U postgres booking_system > $BACKUP_FILE

# Keep only last 5 backups
ls -t $BACKUP_DIR/backup_*.sql | tail -n +6 | xargs -r rm
```

Make it executable:
```bash
chmod +x backup.sh
```

### Common Backup Options
- `-U` : Username
- `-d` : Database name
- `-t` : Specific table
- `-F` : Output format (c for custom, p for plain text)
- `-Z` : Compression level (0-9)
- `-v` : Verbose mode
- `-a` : Data only (no schema)
- `-s` : Schema only (no data)

### Examples

1. Backup with compression:
```bash
pg_dump -U postgres -Z9 booking_system > backup_compressed.sql.gz
```

2. Restore compressed backup:
```bash
gunzip -c backup_compressed.sql.gz | psql -U postgres booking_system
```

3. Backup specific tables with data only:
```bash
pg_dump -U postgres -t users -t bookings -a booking_system > data_backup.sql
```

4. Schema-only backup:
```bash
pg_dump -U postgres -s booking_system > schema_backup.sql
```

## Automated Backup System

### 1. Setup Daily Backup Script
1. Create the backup script:
   ```bash
   # Copy the backup script to your backend directory
   cp backup_daily.sh /path/to/backend/
   
   # Make it executable
   chmod +x backup_daily.sh
   ```

2. Configure backup settings in `backup_daily.sh`:
   ```bash
   BACKUP_DIR="./backups"    # Backup directory
   DB_NAME="booking_system"  # Your database name
   DB_USER="postgres"        # Your database user
   RETENTION_DAYS=7         # Number of days to keep backups
   ```

### 2. Setup Cron Job
1. Open crontab editor:
   ```bash
   crontab -e
   ```

2. Add this line to run backup daily at 1 AM:
   ```bash
   0 1 * * * cd /path/to/your/backend && ./backup_daily.sh >> ./backups/backup.log 2>&1
   ```

### 3. Backup Status Monitoring
Check backup status through the API:
```bash
# Get backup status
curl -H "Authorization: Bearer your_token" http://localhost:5000/api/backups/status
```

Response example:
```json
{
  "status": "OK",
  "message": "Backup is up to date",
  "lastBackup": "2024-01-20T01:00:00.000Z",
  "backupFile": "db_backup_20240120_010000.sql.gz"
}
```

### 4. Manual Backup Commands
Create backups manually:
```bash
# Run full backup
./backup_daily.sh

# Check backup logs
tail -f ./backups/backup.log
```

### 5. Backup Types
The system creates two types of backups:
1. SQL Database Dump (`db_backup_*.sql.gz`)
2. JSON Data Export (`json_backup_*.json.gz`)

### 6. Backup Retention
- Backups are kept for 7 days by default
- Older backups are automatically deleted
- Modify `RETENTION_DAYS` in `backup_daily.sh` to change retention period

### 7. Backup Location
Backups are stored in:
```
backend/backups/
├── db_backup_*.sql.gz     # Database dumps
├── json_backup_*.json.gz  # JSON exports
└── backup.log            # Backup logs
```

### 8. Restore from Backup
To restore from a backup:
```bash
# For SQL backup
gunzip -c backups/db_backup_*.sql.gz | psql -U postgres booking_system

# For JSON backup
node utils/backup.js restore backups/json_backup_*.json.gz
```

## Development

### File Structure
```
backend/
├── config/
│   └── db.js         # Database configuration
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
├── routes/          # API routes
├── db/              # Database scripts
│   ├── schema.sql   # Safe schema updates
│   └── reset_db.sql # Complete reset script
└── uploads/         # File uploads directory
```

### Environment Variables
Make sure all required environment variables are set in your `.env` file before starting the server.

### Error Handling
The application includes centralized error handling through middleware and proper HTTP status codes.

### Security
- JWT authentication
- Password hashing
- Input validation
- File upload restrictions
- CORS configuration

## Component Creation & Route Debugging Guide

### Step-by-Step Component Integration

1. **Database Setup**
   ```sql
   -- First, create and verify database table
   CREATE TABLE IF NOT EXISTS component_name (
     id SERIAL PRIMARY KEY,
     // ... other columns
   );
   ```

2. **Backend Route Setup**
   ```javascript
   // routes/componentRoutes.js
   const express = require('express');
   const router = express.Router();
   
   // Add debug middleware
   router.use((req, res, next) => {
     console.log('Route accessed:', {
       method: req.method,
       path: req.path,
       body: req.body
     });
     next();
   });
   
   // Define routes with logging
   router.get('/', verifyToken, componentController.getItems);
   ```

3. **Controller Setup**
   ```javascript
   // controllers/componentController.js
   const debug = (message, data = '') => {
     console.log(`[ComponentController] ${message}`, data);
   };
   
   async function getItems(req, res) {
     debug('Getting items for user:', req.user.userId);
     try {
       // Verify table exists
       const tableCheck = await db.query(`
         SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'your_table'
         );
       `);
       
       if (!tableCheck.rows[0].exists) {
         debug('Table does not exist');
         // Handle table creation or error
       }
       
       // Continue with operation
     } catch (error) {
       debug('Error:', error);
       res.status(500).json({ message: error.message });
     }
   }
   ```

4. **Route Registration in app.js**
   ```javascript
   // Add debug logging
   app.use((req, res, next) => {
     console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
     next();
   });
   
   // Register route
   app.use('/api/component', require('./routes/componentRoutes'));
   ```

5. **Frontend API Integration**
   ```javascript
   // services/api.js
   const componentEndpoints = {
     getItems: async () => {
       try {
         const response = await fetch(`${API_URL}/component`, {
           headers: {
             'Authorization': `Bearer ${localStorage.getItem('token')}`
           }
         });
         return handleResponse(response);
       } catch (error) {
         throw new Error(error.message || 'Failed to fetch items');
       }
     }
   };
   ```

### Debugging Process

1. **Verify Database Table**
   ```bash
   psql -U postgres -d your_database -c "\dt your_table"
   ```

2. **Test Route Registration**
   ```bash
   node -e "console.log(require('./app.js')._router.stack.map(r => r.route?.path || r.name).filter(Boolean))"
   ```

3. **Check Route Access**
   ```bash
   curl -X GET http://localhost:5000/api/your-route \
   -H "Authorization: Bearer your_token_here"
   ```

4. **Common Issues & Solutions**
   - Route not found: Check route registration in app.js
   - Database errors: Verify table existence and schema
   - Authentication errors: Check token validity and middleware
   - CORS issues: Verify CORS configuration in app.js

### Best Practices

1. **Logging Strategy**
   - Use descriptive debug messages
   - Log important operations and errors
   - Include relevant data in logs
   - Use consistent logging format

2. **Error Handling**
   - Validate input data
   - Check database operations
   - Return appropriate status codes
   - Provide meaningful error messages

3. **Testing Steps**
   - Verify database setup
   - Test API endpoints
   - Check frontend integration
   - Validate error handling

4. **Security Considerations**
   - Implement proper authentication
   - Validate user permissions
   - Sanitize user input
   - Protect sensitive data

This methodology ensures reliable component integration and simplifies debugging.