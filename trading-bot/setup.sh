#!/bin/bash

echo "🚀 Setting up Cyborg Trading Bot..."

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
mkdir -p logs
mkdir -p data

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
    cp .env.template .env
    echo "✅ Created .env file from template - please add your API keys"
fi

echo "✅ Setup complete!"
echo ""
echo "To start the bot:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Configure your API keys in .env"
echo "3. Run the bot: python main.py"