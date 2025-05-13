import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  DisconnectReason
} from '@whiskeysockets/baileys';
import express from 'express';
import bodyParser from 'body-parser';
import pino from 'pino';

const app = express();
const port = 3000;

// In-memory storage for messages and updates
const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });

// Initialize WhatsApp connection state
const { state, saveCreds } = await useMultiFileAuthState('auth');
const { version } = await fetchLatestBaileysVersion();

// Create socket connection
const sock = makeWASocket({
  version,
  auth: state,
  printQRInTerminal: true,
  logger: pino({ level: 'info' }),
});

// Bind the store to listen for events
store.bind(sock.ev);

// Listen for incoming messages and updates
let messages = [];
sock.ev.on('messages.upsert', async ({ messages: incomingMessages, type }) => {
  const msg = incomingMessages[0];
  if (msg && !msg.key.fromMe) {
    messages.push(msg); // Store the messages in memory
  }
});

sock.ev.on('creds.update', saveCreds);

// WebSocket connection update events
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === 'close') {
    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
    if (shouldReconnect) {
      console.log('Connection closed, reconnecting...');
      startBot(); // Reconnect if needed
    } else {
      console.log('Logged out, restart process');
    }
  }
  if (connection === 'open') {
    console.log('✅ Connected to WhatsApp!');
  }
});

// Start the bot
async function startBot() {
  await sock.connect();
}

// Express middleware setup
app.use(bodyParser.json());

// API Endpoints

// Get all received messages
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// Get list of groups the user is in
app.get('/api/groups', async (req, res) => {
  try {
    const chats = await sock.groupFetchAllParticipating();
    const groups = Object.values(chats).map(group => ({
      id: group.id,
      name: group.subject,
      participants: group.participants?.map(p => p.id) || [],
    }));
    res.json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Send message to a specific contact/group
app.post('/api/messages/send', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing "to" or "message" field' });
  }

  try {
    await sock.sendMessage(to, { text: message });
    res.json({ status: 'success', message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Fetch updates
app.get('/api/updates', (req, res) => {
  res.json(store);
});

// Handle errors
app.use((err, req, res, next) => {
  if (Boom.isBoom(err)) {
    return res.status(err.output.statusCode).json(err.output.payload);
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

startBot().catch((err) => console.error('Error starting bot', err));

// Start the Express server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
