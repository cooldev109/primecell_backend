module.exports = {
  apps: [
    {
      name: 'primecell-api',
      script: 'dist/main.js',
      instances: 1, // Use 'max' for cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 1997,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 1997,
      },
      // Run migrations and seed before starting
      // This runs once when the app starts
      post_deploy: 'npm run db:setup && pm2 reload ecosystem.config.js --env production',
    },
  ],

  // Deployment configuration (optional - for remote servers)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourname/primecell.git',
      path: '/var/www/primecell',
      'pre-deploy-local': '',
      'post-deploy': 'cd apps/api && npm install && npm run build && npm run db:setup && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
