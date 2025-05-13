# WhatsApp Proxy API

A Node.js RESTful API built on top of [Baileys](https://github.com/WhiskeySockets/Baileys) that allows you to send and receive WhatsApp messages, fetch groups, and interact with WhatsApp Web through HTTP endpoints.

> Built with Express + Baileys  
> Designed to be a plug-and-play WhatsApp automation API.


## Features

- Receive WhatsApp messages via REST
- Send text messages to users or groups
- Fetch WhatsApp group info
- QR-based login via terminal
- In-memory storage (can be extended to a database)


## Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/skvortsovden/whatsapp-proxy.git
cd whatsapp-proxy
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Server

```bash
node index.js
```

You'll see a QR code in the terminal — scan it with WhatsApp Web on your phone to authenticate.


## API Endpoints

### `GET /api/messages`

Fetch all received WhatsApp messages (stored in memory).

### `POST /api/messages/send`

Send a message to a contact or group.

**Request Body:**

```json
{
  "to": "PHONE_OR_GROUP_ID",
  "message": "Hello from API"
}
```

### `GET /api/groups`

Fetch a list of WhatsApp groups the user is participating in.

---

## Example Requests

**Send Message:**

```bash
curl -X POST http://localhost:3000/api/messages/send \
     -H "Content-Type: application/json" \
     -d '{"to": "123456789@s.whatsapp.net", "message": "Hi!"}'
```

**Get Groups:**

```bash
curl http://localhost:3000/api/groups
```



## Podman (Containerized)

To run this app using Podman:

Create a Dockerfile:

```Dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "index.js"]
```

Build and run:

```bash
podman build -t whatsapp-proxy .
podman run -it --rm -p 3000:3000 -v $(pwd)/auth:/app/auth whatsapp-proxy
```


## Disclaimer

This is not an official WhatsApp API. It simulates a WhatsApp Web session and may break if WhatsApp changes its protocol. Use responsibly.