FROM node:21

WORKDIR /usr/src/app
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean
    
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build  

EXPOSE 3057
EXPOSE 9999


# Command to run the API
CMD ["node", "dist/index.js"]
