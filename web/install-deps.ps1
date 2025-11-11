# Script to install new dependencies for EdTech upgrade
Write-Host "Installing dependencies for EdTech Heritage Map..." -ForegroundColor Cyan

# Navigate to web directory
Set-Location -Path "d:\Ky 1 nam 4\Map\web"

# Install TailwindCSS and PostCSS
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Install state management
npm install zustand

# Install routing
npm install react-router-dom
npm install -D @types/react-router-dom

# Install i18n
npm install i18next react-i18next

# Install UI utilities
npm install clsx tailwind-merge class-variance-authority

# Install date utilities
npm install date-fns

Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx tailwindcss init -p" -ForegroundColor White
Write-Host "2. Rebuild Docker container: docker-compose up -d --build web" -ForegroundColor White
