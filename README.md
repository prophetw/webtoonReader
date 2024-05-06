# Tree
```bash

├── README.md
├── comic // this is front-end build folder
│   ├── bundle.js
│   ├── bundle.js.map
│   └── index.html
├── index.js // comic server  express will serve  manhua 
├── manhua // comic folder you should put your comic here
|   └── comicA  // comicA folder   
│       ├── Chapter 1   // all the images of chapter 1  
│       └── Chapter 2   // all the images of chapter 2
├── nohup.out
├── package.json
├── pnpm-lock.yaml
├── src // comic reader front-end source code 
│   ├── README.md
│   ├── index.html
│   └── index.js
└── webpack.config.js

```

# comic reader front-end  development
```bash
pnpm start // will serve on port 4000
```

# express server
```bash
node index.js // will serve on port 3000

# if comic folder is build  by  pnpm build
# you can visit http://localhost:3000/static/comic/

```


# deploy comic reader front-end
```bash
# in root folder
pnpm build // will build comic folder
```

# deploy comic server
```bash
# in root folder
npm install pm2 -g
pm2 start index.js
pm2 startup  # 设置PM2为开机启动
pm2 save    # 保存当前应用列表

# put all the comic in manhua folder

```


## Express API
- GET /api/comics/  // get all the comics list
- GET /api/comics/:comicName  // get all the episodes of the comic
- GET /api/comics/:comicName/:episode // get all the images of the episode