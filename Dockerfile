FROM node:7
COPY . /geartrack-website
ENV NODE_ENV=production
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y libc6:i386 libncurses5:i386 libstdc++6:i386 && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /geartrack-website
EXPOSE 3000
RUN npm install
ENTRYPOINT ["npm", "run"]