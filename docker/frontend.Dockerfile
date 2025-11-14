FROM node:18

WORKDIR /app

# Copy package files
COPY frontend/package.json ./

# Install dependencies without lock file to avoid optional deps bug
RUN npm install --legacy-peer-deps

# Explicitly install rollup native bindings (fixes npm optional deps bug)
RUN npm install @rollup/rollup-linux-x64-gnu --save-optional || \
    (npm rebuild rollup && npm install @rollup/rollup-linux-x64-gnu --save-optional)

# Copy application code
COPY frontend/ .

# Expose port
EXPOSE 5173

# Run development server
CMD ["npm", "run", "dev", "--", "--host"]

