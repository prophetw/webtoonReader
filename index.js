const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

app.use(cors());


// 为漫画资源提供静态文件服务
app.use('/static/manhua', express.static('manhua'));

// 为另一个目录提供静态文件服务，例如存放音乐的目录
app.use('/static/comic', express.static('comic'));


// API接口：获取漫画列表
app.get('/api/comics', (req, res) => {
    const comicsDir = path.join(__dirname, 'manhua');
    fs.readdir(comicsDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading comics directory');
            return;
        }
        res.json(files);
    });
});

// API接口：获取指定漫画的所有集数
app.get('/api/comics/:comicName', (req, res) => {
    const episodesDir = path.join(__dirname, 'manhua', req.params.comicName);
    fs.readdir(episodesDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading episodes directory');
            return;
        }
        res.json(files.sort((a, b) => {
 const matchA = a.match(/\d+/); // 提取字符串中的数字
    const matchB = b.match(/\d+/);
    const numA = matchA ? parseInt(matchA[0], 10) : 0; // 如果存在数字则转换为整数，否则默认为0
    const numB = matchB ? parseInt(matchB[0], 10) : 0;
    return numA - numB; // 根据数字升序排序
}));
    });
});

// API接口：获取指定漫画集的图片列表
app.get('/api/comics/:comicName/:episode', (req, res) => {
    const imagesDir = path.join(__dirname, 'manhua', req.params.comicName, req.params.episode);
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading images directory');
            return;
        }
        res.json(files.sort((a, b) => {
 const matchA = a.match(/\d+/); // 提取字符串中的数字
    const matchB = b.match(/\d+/);
    const numA = matchA ? parseInt(matchA[0], 10) : 0; // 如果存在数字则转换为整数，否则默认为0
    const numB = matchB ? parseInt(matchB[0], 10) : 0;
    return numA - numB; // 根据数字升序排序
}).map(file => `/static/manhua/${req.params.comicName}/${req.params.episode}/${file}`));
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

