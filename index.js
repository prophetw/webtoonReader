const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

app.use(cors());
const baseUrl = `https://se8.us/index.php/chapter/`
const idToPidMap = new Map()


app.use('/static/manhua', express.static('manhua'));

app.use('/static/comic', express.static('comic'));

app.get('/api/comics', (req, res) => {
    const comicsDir = path.join(__dirname, 'manhua');
    fs.readdir(comicsDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading comics directory');
            return;
        }
        const comicsAry = files.filter(name => !name.startsWith('.')).sort((a, b) => {
            return a.localeCompare(b, 'zh-Hans-CN')
        })
        res.json(comicsAry);
    });
});

app.get('/api/comicsDetail/:id', (req, res) => {
    const id = req.params.id;
    const pid = idToPidMap.get(id);
    if (pid) {
        return res.send('running')
    }
    // execute nodejs script to get response from that script 
    const { spawn } = require('child_process');
    const nodejsProgramPath = path.join('/home/ubuntu/code/scratchWeb/src', 'getContentList.js');
    const process = spawn('node', [nodejsProgramPath, baseUrl + id]);
    idToPidMap.set(id, process.pid)

    process.stdout.on('data', (data) => {
        console.log('data', data);
        res.send(data.toString());
    });
    process.stderr.on('data', (data) => {
        res.send(data.toString());
    });
    process.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        idToPidMap.delete(id)
    });

})

app.get('/api/comics/apiList', (req, res) => {
    const { spawn } = require('child_process');
})

app.get('/api/comics/:comicName', (req, res) => {
    const episodesDir = path.join(__dirname, 'manhua', req.params.comicName);
    fs.readdir(episodesDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading episodes directory');
            return;
        }
        res.json(files.sort((a, b) => {
            const matchA = a.match(/\d+/);
            const matchB = b.match(/\d+/);
            const numA = matchA ? parseInt(matchA[0], 10) : 0;
            const numB = matchB ? parseInt(matchB[0], 10) : 0;
            return numA - numB;
        }));
    });
});

app.get('/api/comics/:comicName/:episode', (req, res) => {
    const imagesDir = path.join(__dirname, 'manhua', req.params.comicName, req.params.episode);
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading images directory');
            return;
        }
        res.json(files.sort((a, b) => {
            const matchA = a.match(/\d+/);
            const matchB = b.match(/\d+/);
            const numA = matchA ? parseInt(matchA[0], 10) : 0;
            const numB = matchB ? parseInt(matchB[0], 10) : 0;
            return numA - numB;
        }).map(file => `/static/manhua/${req.params.comicName}/${req.params.episode}/${file}`));
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

