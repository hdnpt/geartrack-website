FROM node:7
COPY . /geartrack-website
ENV NODE_ENV=production
WORKDIR /geartrack-website
EXPOSE 3000
RUN npm install
ENTRYPOINT ["npm", "start"]