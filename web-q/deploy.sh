#!/bin/bash
echo "Starting deployment process..."

# Check if logged in, if not login
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "You are not logged in. Please log in via the browser window that opens."
    firebase login
    if [ $? -ne 0 ]; then
        echo "Login failed. Please try again."
        exit 1
    fi
fi

# Check if project is selected
if [ ! -f .firebaserc ]; then
    echo "No project selected. Please select or create a Firebase project:"
    firebase use --add
fi

echo "Building project..."
npm run build

echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "Deployment complete!"
