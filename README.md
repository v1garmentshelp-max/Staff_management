# Vandana Mall — Staff Manager

## One-time database setup (run locally once)
```bash
npm install
npm run db:init    # creates all tables in Neon
npm run db:seed    # loads all 84 staff members
```

## Deploy to Vercel
1. Push this folder to a GitHub repository
2. Go to vercel.com → New Project → Import your repo
3. Add environment variable in Vercel dashboard:
   - Key:   DATABASE_URL
   - Value: your Neon connection string
4. Click Deploy — done!

## Local development
```bash
npm run dev
```
The /api/ routes work locally via Vite proxy or directly.
# Staff_management
