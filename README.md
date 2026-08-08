# 日本的记忆

一个记录日剧、日本旅行与画面之外历史的个人档案网站。

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。

## 内容与图片

- 记忆记录保存在 `data/memories.json`。
- 本地原图放在 `public/memories/`，记录里的 `image.localPath` 是网站的保底 URL。
- `image.remoteUrl` 用于记录 Imgur 链接；远程链接失效时，前端会自动回退到本地图片。
- `.env.example` 中的 `IMGUR_CLIENT_ID` 只在服务端使用，不能写进浏览器代码。
- `POST /api/imgur` 接收 multipart 字段 `file`，上传成功后返回 `url`，再把 URL 写回对应记忆记录。

当前 3 条记录是《悠长假日》的草稿，已保存本地图片；EXIF 中没有可读的拍摄时间或 GPS，集数、建筑/广告地点和啤酒具体型号暂列为待确认。

## PM2 与 Caddy

生产构建与 PM2 原子切换：

```bash
pnpm deploy
pm2 save
```

应用监听 `127.0.0.1:53120`。Caddy 配置见 `deploy/Caddyfile`，启用后访问 <http://jp.home>。第一次使用时，把下面这一行加入 `/etc/hosts`：

```text
127.0.0.1 jp.home
```

验证 Caddy 配置：

```bash
caddy validate --config deploy/Caddyfile --adapter caddyfile
```
