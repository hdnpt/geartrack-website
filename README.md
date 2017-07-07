# Geartrack 1.0 (No further updates to this version)

[![Join the chat at https://gitter.im/hdnpt/geartrack-website](https://badges.gitter.im/hdnpt/geartrack-website.svg)](https://gitter.im/hdnpt/geartrack-website?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

>Online version: [https://geartrack.pt](https://geartrack.pt)

**Geartrack 2.0 is under development, this version will no longer be mantained. Use the online version which will always be updated :)**

This is an Express.js app.

### Screenshot
![Screen](http://i.imgur.com/wUhzJO3.png)

### Requirements
- Node
- Environment variables:
    - (optional) **GEARTRACK_PROXYS**: `ip,ip,ip`  - Some trackers may block your machine ip, use different proxys to get the data.
    - (optional) **GEARTRACK_BUGSNAG**: `apikey` - When an exception occurs on production you are notified by email.

### Instructions
- clone this repo to a folder
- `npm install`
- `npm start` - will run `node bin/wwww`

### Developer instructions
- `npm test` - Runs a local server and watches for file changes to reload the page.

### Docker instructions
To build and run locally:
- `docker build -t geartrack-website .`
- `docker run -d -p 80:3000 geartrack-website`

Using the public image on docker hub:
- `docker run -d -p 80:3000 hdnpt/geartrack-website` - the latest image will be downloaded and the geartrack will be availabe at `http://localhost` (to stop use `docker stop [containerid]`)

Passing environment variables:
- `docker run -d -p 80:3000 -e "GEARTRACK_BUGSNAG=apikey" hdnpt/geartrack-website`

### Todo
- A better version is under development using .net core and will support notifications and other features!

### License
MIT
