# Geartrack

[![Join the chat at https://gitter.im/hdnpt/geartrack-website](https://badges.gitter.im/hdnpt/geartrack-website.svg)](https://gitter.im/hdnpt/geartrack-website?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

>Online version: [https://geartrack.pt](https://geartrack.pt)

Locate Gearbest Packages using these methods:
- **PQ** Spain Priority Line (Spain Express)
- **NL** Netherlands Post surface mail
- **LV** Bpost International
- **SYB** Malasya Pos
- **GE, SB** Switzerland Post Unregistered
- **Q..XX** Sweden Registered
- **R..HU** Hungary Registered
- **numeric** DHL

Locate Geekbuying Packages using these methods:
- **YT..** Yun Express
- **R..AT** Austrian Post

Locate AliExpress Packages using these methods:
- **RF..SG** Singapore Post
- **RQ..MY** Malaysia Post
- **R...SE** Sweden Post
- **R...CN** China Post Register Airmail
- **R...NL** Netherlands Post
- **L...CN** China EMS ePacket
- **U..YP** Special Line YW
- **LP..** AliExpress Standard Shipping
- **BZ..CN** China EMS ePacket
- **CP..CN** China Post
- **numeric** China Post Ordinary Small Packet Plus, Yanwen or DHL

Locate CTT Expresso Packages using these methods:
- **E..PT**
- **R..PT**
- **L..PT**

Locate Ebay Packages using these methods:
- **ID..CN** Winit
- **YF..** Yanwen
- **UPA..** Pitney Bowes
- **LA..** Laos Post
- **HK..AM** SFC
- **EY..** Chukou1
- **R..GB** Royal Mail
- **R..GB** Royal Mail
- **numeric** PTT Turkey

This is an Express.js app

### Requirements
- Node
- Environment variable: `GEARTRACK_PROXYS` with `ip,ip,ip` 

### Instructions
- clone this repo to a folder
- `npm install`
- `npm start` - will run `node bin/wwww`

### Docker instructions
To build and run locally:
- `docker build -t geartrack-website .`
- `docker run -d -p 80:3000 geartrack-website`

Using the public image on docker hub:
- `docker run -d -p 80:3000 hdnpt/geartrack-website` - the image will be downloaded

### Todo
- A better version is under development using .net core and will support notifications and other features!

### License
MIT
