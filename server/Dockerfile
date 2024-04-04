# Use official Node.js image as base
FROM node:14

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npm run build  # Adjust the command as per your project setup

# Expose port 3000 (replace with your API's port if different)
EXPOSE 3057

# Command to run the API
CMD ["node", "dist/index.js"]
