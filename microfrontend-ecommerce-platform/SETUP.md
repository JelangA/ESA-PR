# Setup Guide

This guide will help you set up and run the Microfrontend E-commerce project locally.

## Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Version 8 or higher  
- **Git**: For cloning the repository

You can check your versions with:
```bash
node --version
npm --version
git --version
```

## Quick Start

### Option 1: Automated Setup (Recommended)

**For Windows:**
```bash
./start-dev.bat
```

**For macOS/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

This will automatically:
1. Install all dependencies
2. Build the shared package
3. Start all development servers
4. Open the application at http://localhost:3000

### Option 2: Manual Setup

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install all microfrontend dependencies:**
   ```bash
   npm run install:all
   ```

3. **Build shared package:**
   ```bash
   cd shared && npm run build && cd ..
   ```

4. **Start all development servers:**
   ```bash
   npm run dev
   ```

## Development URLs

Once running, you can access:

- **Main Application**: http://localhost:3000
- **Products Service**: http://localhost:3001
- **Cart Service**: http://localhost:3002
- **Auth Service**: http://localhost:3003

## Demo Credentials

The application uses the Fake Store API for authentication. You can use these demo credentials:

| Username | Password |
|----------|----------|
| mor_2314 | 83r5^_ |
| kevinryan | kev02937@ |
| donero | ewedon |
| derek | jklg*_56 |

## Development Workflow

### Making Changes

1. **Container App (React)**: Edit files in `/container/src/`
2. **Products (Vue.js)**: Edit files in `/products/src/`
3. **Cart (React)**: Edit files in `/cart/src/`
4. **Auth (React)**: Edit files in `/auth/src/`
5. **Shared Utils**: Edit files in `/shared/src/`

### Hot Reload

All microfrontends support hot reload:
- Changes to React components will refresh automatically
- Changes to Vue components will refresh automatically
- Changes to shared utilities require rebuilding: `cd shared && npm run build`

### Building for Production

Build all microfrontends:
```bash
npm run build:all
```

Build individual services:
```bash
npm run build:container
npm run build:products
npm run build:cart
npm run build:auth
```

## Docker Setup (Optional)

To run with Docker:

```bash
docker-compose up --build
```

This will build and start all services in containers.

## Troubleshooting

### Port Already in Use

If ports 3000-3003 are already in use, you can:
1. Stop the conflicting processes
2. Modify the ports in the webpack.config.js files
3. Update the Module Federation remote URLs accordingly

### Dependencies Issues

If you encounter dependency issues:
```bash
# Clean all node_modules
rm -rf node_modules container/node_modules products/node_modules cart/node_modules auth/node_modules shared/node_modules

# Reinstall everything
npm run install:all
```

### Module Federation Errors

If microfrontends fail to load:
1. Ensure all services are running
2. Check browser console for network errors
3. Verify remote URLs in webpack configs match running ports

### Build Issues

For shared package build issues:
```bash
cd shared
npm run clean
npm run build
```

## Project Structure

```
microfrontend/
├── container/          # React container app (port 3000)
├── products/          # Vue.js products service (port 3001)
├── cart/             # React cart service (port 3002)
├── auth/             # React auth service (port 3003)
├── shared/           # Shared utilities and types
├── start-dev.sh      # Unix startup script
├── start-dev.bat     # Windows startup script
├── docker-compose.yml # Docker configuration
└── README.md         # Main documentation
```

## Next Steps

1. Explore the codebase to understand the microfrontend architecture
2. Try adding products to cart and logging in
3. Modify components to see hot reload in action
4. Add new features to any of the microfrontends

For more detailed information, see the main [README.md](README.md) file.
