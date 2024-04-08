FROM tapo-base

# Copy the rest of the application code
COPY . .

RUN npm run build  # Adjust the command as per your project setup

EXPOSE 3057
EXPOSE 9999


# Command to run the API
CMD ["node", "dist/index.js"]