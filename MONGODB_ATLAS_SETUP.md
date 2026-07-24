# MongoDB Atlas Setup Guide

This guide provides step-by-step instructions for setting up MongoDB Atlas for the L'Écolier e-commerce website.

## Prerequisites

- MongoDB Atlas account (free tier available)
- Basic understanding of MongoDB
- Access to the project codebase

## Step 1: Create MongoDB Atlas Account

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free" or "Sign Up"
3. Choose your authentication method (Google, GitHub, or email)
4. Complete the registration process
5. Verify your email address if required

## Step 2: Create a New Cluster

1. After logging in, click "Build a Database"
2. Choose your preferred cloud provider:
   - AWS (recommended for most regions)
   - Google Cloud
   - Azure
3. Select a region closest to your target audience:
   - For Tunisia: Choose Europe (Frankfurt, London, or Paris)
   - For global: Choose a centrally located region
4. Select cluster tier:
   - **M0 Sandbox** (Free tier) - Good for development/testing
   - **M2/M5** - For small production applications
   - Higher tiers for larger applications
5. Click "Create Cluster"
6. Wait for cluster creation (2-5 minutes)

## Step 3: Create Database User

1. Navigate to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Fill in user details:
   - **Username**: Choose a secure username (e.g., `lecolier_admin`)
   - **Password**: Generate a strong password (32+ characters)
   - **Database User Privileges**: Select "Read and write to any database"
4. Click "Create User"
5. **Important**: Save the username and password securely - you'll need them for the connection string

## Step 4: Configure Network Access (IP Whitelisting)

1. Navigate to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose one of the following options:
   
   **Option A: Allow Access from Anywhere (Not Recommended for Production)**
   - Select "Allow Access from Anywhere"
   - Click "Confirm"
   
   **Option B: Specific IP Address (Recommended)**
   - Select "Allow Access from Anywhere" temporarily for setup
   - After deployment, add your server's specific IP address
   
   **Option C: VPC Peering (Advanced)**
   - For production deployments with VPC
   - Follow MongoDB's VPC peering documentation

4. Click "Confirm"

## Step 5: Get Connection String

1. Navigate to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select your Node.js version (14.1 or later)
5. Copy the connection string

The connection string will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Step 6: Update Environment Variables

1. Open your `.env` file in the project root
2. Add/update the following variables:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/lecolier?retryWrites=true&w=majority
MONGODB_DB_NAME=lecolier
```

Replace:
- `YOUR_USERNAME` with your database username
- `YOUR_PASSWORD` with your database password
- `cluster0.xxxxx.mongodb.net` with your actual cluster address
- `lecolier` with your preferred database name

## Step 7: Test Connection

1. Start your application:
```bash
npm run dev:all
```

2. Check the console output for:
```
Successfully connected to MongoDB Atlas.
```

3. If you see connection errors:
   - Verify your connection string is correct
   - Check IP whitelisting
   - Ensure username/password are correct
   - Verify cluster is running

## Step 8: Migrate Existing Data (Optional)

If you have existing data in local MongoDB:

1. Export local data:
```bash
mongodump --db=bomi --out=./backup
```

2. Import to Atlas:
```bash
mongorestore --uri="MONGODB_URI" --db=lecolier ./backup/bomi
```

3. Verify data in Atlas Dashboard under "Collections"

## Step 9: Security Best Practices

### For Production:

1. **Use Strong Passwords**
   - Minimum 32 characters
   - Mix of uppercase, lowercase, numbers, and special characters
   - Use a password manager

2. **Enable IP Whitelisting**
   - Only allow specific IP addresses
   - Regularly review and update allowed IPs
   - Remove "Allow Access from Anywhere" in production

3. **Enable Atlas Security Features**
   - Enable encryption at rest (default in Atlas)
   - Enable encryption in transit (TLS/SSL)
   - Enable audit logging for compliance

4. **Regular Backups**
   - Enable automated backups in Atlas
   - Configure backup retention period
   - Test restore procedures

5. **Monitor Usage**
   - Set up alerts for unusual activity
   - Monitor connection counts
   - Track storage usage

## Step 10: Troubleshooting

### Common Issues:

**Connection Timeout**
- Check network access/IP whitelisting
- Verify cluster is running
- Check firewall settings

**Authentication Failed**
- Verify username and password
- Check user has correct privileges
- Ensure user is created for the correct database

**SSL/TLS Errors**
- Ensure TLS is enabled in connection options
- Check if your Node.js version supports TLS
- Verify certificate settings

**Performance Issues**
- Check cluster tier (upgrade if needed)
- Review indexes on frequently queried fields
- Monitor connection pool settings

## Step 11: Cost Considerations

### Free Tier (M0 Sandbox):
- 512 MB storage
- Shared RAM
- Good for development and testing
- No cost

### Paid Tiers:
- M2/M5: Starting at ~$9/month
- Higher tiers for production workloads
- Pay for storage and compute
- Consider backup costs

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Driver Documentation](https://mongodb.github.io/node-mongodb-native/)
- [Atlas Security Best Practices](https://docs.atlas.mongodb.com/security-best-practices/)

## Support

If you encounter issues:
1. Check MongoDB Atlas status page
2. Review Atlas logs in Dashboard
3. Consult MongoDB documentation
4. Check application logs for specific error messages
