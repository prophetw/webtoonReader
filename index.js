const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const tagsFilePath = path.join(__dirname, 'comicMeta.json');

app.use(cors());
const baseUrl = `https://se8.us/index.php/chapter/`;
const taskIdToPInfoMap = new Map(); // task id to process info map

app.use(express.json());

app.use('/static/manhua', express.static('manhua'));

app.use('/static/comic', express.static('comic'));

// 日志中间件
app.use((req, res, next) => {
  const start = Date.now(); // 请求开始时间

  // 完成响应后的操作
  res.on('finish', () => {
    const duration = Date.now() - start; // 计算请求处理的持续时间
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    ); // 输出日志
  });

  next(); // 确保请求可以继续处理
});

// 获取所有标签
app.get('/api/metaInfo', (req, res) => {
  fs.readFile(tagsFilePath, (err, data) => {
    if (err) {
      res.status(500).send('Error reading tags file.');
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/updateTags/:mangaName', (req, res) => {
  const mangaName = req.params.mangaName;
  const newTags = req.body.tags; // 假设请求体中传递的是一个标签数组
  console.log(' newTags ', newTags);

  // 读取现有的标签文件
  fs.readFile(tagsFilePath, (err, data) => {
    if (err) {
      res.status(500).send('Error reading tags file.');
      return;
    }

    // 解析现有的标签数据
    const metaData = JSON.parse(data);

    // 更新特定漫画的标签
    if (!metaData[mangaName]) {
      metaData[mangaName] = {
        tags: [],
        cover: '',
        score: 0,
      };
    }
    metaData[mangaName].tags = newTags;

    // 写回修改后的标签数据到文件
    fs.writeFile(tagsFilePath, JSON.stringify(metaData, null, 2), (err) => {
      if (err) {
        res.status(500).send('Error writing tags file.');
        return;
      }
      res.send(`Tags for ${mangaName} updated successfully.`);
    });
  });
});

// 更新特定漫画的标签
app.post('/api/updateScores/:mangaName', (req, res) => {
  const mangaName = req.params.mangaName;
  const newScore = req.body.score; // 假设请求体中传递的是一个分数

  // 读取现有的标签文件
  fs.readFile(tagsFilePath, (err, data) => {
    if (err) {
      res.status(500).send('Error reading tags file.');
      return;
    }

    // 解析现有的标签数据
    const metaData = JSON.parse(data);

    // 更新特定漫画的标签
    if (!metaData[mangaName]) {
      metaData[mangaName] = {
        tags: [],
        cover: '',
        score: 0,
      };
    }
    metaData[mangaName].score = newScore;

    // 写回修改后的标签数据到文件
    fs.writeFile(tagsFilePath, JSON.stringify(metaData, null, 2), (err) => {
      if (err) {
        res.status(500).send('Error writing tags file.');
        return;
      }
      res.send(`Score for ${mangaName} updated successfully.`);
    });
  });
});

app.get('/api/comics', (req, res) => {
  const comicsDir = path.join(__dirname, 'manhua');
  fs.readdir(comicsDir, (err, files) => {
    if (err) {
      res.status(500).send('Error reading comics directory');
      return;
    }
    const comicsAry = files
      .filter((name) => !name.startsWith('.'))
      .sort((a, b) => {
        return a.localeCompare(b, 'zh-Hans-CN');
      });
    // fs.writeFileSync(path.join(__dirname, 'comicList.json'), JSON.stringify(comicsAry, null, 2))
    res.json(comicsAry);
  });
});

app.get('/api/comicsDetail/:id', (req, res) => {
  const id = req.params.id;
  const pid = taskIdToPInfoMap.get(id);
  if (pid) {
    return res.send('running');
  }

  const taskId = generateUUIDv4();
  const task = {
    id: taskId,
    complete: false,
    error: null,
    pid: null,
  };
  taskIdToPInfoMap.set(id, task);

  // execute nodejs script to get response from that script
  const { spawn } = require('child_process');
  const nodejsProgramPath = path.join(
    '/home/ubuntu/code/scratchWeb/src',
    'getContentList.js'
  );
  const process = spawn('node', [nodejsProgramPath, baseUrl + id]);
  taskIdToPInfoMap.set(id, process.pid);

  process.stdout.on('data', (data) => {
    console.log('data', data);
    res.send(data.toString());
  });
  process.stderr.on('data', (data) => {
    res.send(data.toString());
  });
  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    taskIdToPInfoMap.delete(id);
  });
});

app.get('/api/comics/apiList', (req, res) => {
  const { spawn } = require('child_process');
});

app.get('/api/comics/:comicName', (req, res) => {
  const episodesDir = path.join(__dirname, 'manhua', req.params.comicName);
  fs.readdir(episodesDir, (err, files) => {
    if (err) {
      res.status(500).send('Error reading episodes directory');
      return;
    }
    res.json(
      files.sort((a, b) => {
        const matchA = a.match(/\d+/);
        const matchB = b.match(/\d+/);
        const numA = matchA ? parseInt(matchA[0], 10) : 0;
        const numB = matchB ? parseInt(matchB[0], 10) : 0;
        return numA - numB;
      })
    );
  });
});

app.get('/api/comics/:comicName/:episode', (req, res) => {
  const imagesDir = path.join(
    __dirname,
    'manhua',
    req.params.comicName,
    req.params.episode
  );
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      res.status(500).send('Error reading images directory');
      return;
    }
    res.json(
      files
        .sort((a, b) => {
          const matchA = a.match(/\d+/);
          const matchB = b.match(/\d+/);
          const numA = matchA ? parseInt(matchA[0], 10) : 0;
          const numB = matchB ? parseInt(matchB[0], 10) : 0;
          return numA - numB;
        })
        .map(
          (file) =>
            `/static/manhua/${req.params.comicName}/${req.params.episode}/${file}`
        )
    );
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
