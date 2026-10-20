FROM node:20-alpine
RUN addgroup -S gymgroup && adduser -S gymuser -G gymgroup
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
RUN chown -R gymuser:gymgroup /usr/src/app
USER gymuser
EXPOSE 3000
CMD ["npm", "start"]
