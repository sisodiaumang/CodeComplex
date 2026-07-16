module.exports = {
  apps: [
    {
      name: "devarena-backend",
      script: "dist/index.js",
      cwd: "./backendServer",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8000
      }
    },
    {
      name: "devarena-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./client",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1.5G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
