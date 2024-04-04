FROM tapo-base

# Copy the rest of the application code
COPY . .

RUN npm run build  # Adjust the command as per your project setup

# Expose port 3057 (replace with your API's port if different)
EXPOSE 3057

# Command to run the API
CMD ["node", "dist/index.js"]