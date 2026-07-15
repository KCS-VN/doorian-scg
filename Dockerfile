#Stage 1
FROM node:18-alpine as build
#Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json .

# Install the dependencies
RUN npm install

# Copy the app files
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve the app
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy built application from the build stage
COPY --from=build /app/dist /app

# Install serve to serve the built app
RUN npm install -g serve

# Expose the port
EXPOSE 5173

# Start the application
CMD ["serve", "-s", "/app", "-l", "5173"]
