const fs = require('fs');
const path = require('path');

// Cross-platform directory copy function
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('Starting build copy process...');

// Create dist directory
const distDir = path.join(__dirname, '..', 'dist');

// Remove existing dist directory
if (fs.existsSync(distDir)) {
  console.log('Removing existing dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Create fresh dist directory
console.log('Creating fresh dist directory...');
fs.mkdirSync(distDir, { recursive: true });

// Copy container build as root
console.log('Copying container build to root...');
const containerDist = path.join(__dirname, '..', 'container', 'dist');
if (fs.existsSync(containerDist)) {
  // Use cross-platform copy
  const files = fs.readdirSync(containerDist);
  files.forEach(file => {
    const srcPath = path.join(containerDist, file);
    const destPath = path.join(distDir, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      // Copy directory recursively
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  });
  console.log('Container build copied successfully');
} else {
  console.error('Container dist directory not found!');
  process.exit(1);
}

// Copy microfrontends to subdirectories
const microfrontends = ['products', 'cart', 'auth'];

microfrontends.forEach(mf => {
  const mfDistDir = path.join(__dirname, '..', mf, 'dist');
  const targetDir = path.join(distDir, mf);
  
  console.log(`Copying ${mf} build...`);
  
  if (fs.existsSync(mfDistDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    copyDir(mfDistDir, targetDir);
    
    // Ensure Vercel does not serve the microfrontend's own index.html directly
    const mfIndex = path.join(targetDir, 'index.html');
    if (fs.existsSync(mfIndex)) {
      try {
        fs.rmSync(mfIndex);
      } catch (err) {
        console.warn(`Could not remove ${mf}/index.html:`, err && err.message ? err.message : err);
      }
    }
    
    // Verify remoteEntry.js exists
    const remoteEntryPath = path.join(targetDir, 'remoteEntry.js');
    if (fs.existsSync(remoteEntryPath)) {
      console.log(`${mf} build copied successfully (remoteEntry.js found)`);
    } else {
      console.warn(`${mf} build copied but remoteEntry.js not found!`);
    }
  } else {
    console.error(`${mf} dist directory not found!`);
    process.exit(1);
  }
});

// Create a basic health check endpoint
console.log('Creating health check...');
fs.writeFileSync(
  path.join(distDir, 'health.html'),
  `<!DOCTYPE html>
<html>
<head>
  <title>Health Check</title>
</head>
<body>
  <h1>Microfrontend Platform is Running</h1>
  <p>Timestamp: ${new Date().toISOString()}</p>
  <script>
    console.log('Health check passed');
  </script>
</body>
</html>`
);

console.log('Build copy completed successfully!');
