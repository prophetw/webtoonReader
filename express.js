const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const app = express();
// const wss = new WebSocket.Server({ server });

const ws = new WebSocket('ws://localhost:8796');


const toJSON = (data) => {
	return JSON.stringify(data);
}

app.get('/', (req, res) => {
	const targetNodePath = path.join(__dirname, './test.js');
	const { spawn } = require('child_process');
	const process = spawn('node', [targetNodePath]);


	process.stdout.on('data', (data) => {
		console.log('Received chunk data', data.toString());
		// Send log data to the existing WebSocket server
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(toJSON({
				type: 'log',
				msg: data.toString()
			}));
		}
	});

	process.on('close', (code) => {
		console.log(`Child process exited with code ${code}`);
		// Notify the WebSocket server that the process has exited
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(toJSON({
				type: 'exit',
				msg: code
			}));
		}
	});

	res.json({ msg: 'Process started' });
})

const PORT = 3003;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});