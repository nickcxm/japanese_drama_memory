# 日本的记忆

一个记录日剧、日本旅行与画面之外历史的个人档案网站。

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。

## 内容与图片

- 记忆记录保存在提交到 Git 的 `data/memory.db`。
- 本地原图放在 `public/memories/`，记录里的 `image.localPath` 是网站的保底 URL。
- 唯一主数据源是提交到 Git 的 `data/memory.db`；数据库中的 `memories`、`image_assets`、`image_uploads`、`memory_tags` 和 `memory_keywords` 表分别保存记忆、图片、图床历史、标签和关键词。
- `image.remoteUrl` 用于记录当前 Imgur 链接；远程链接失效时，前端会自动回退到本地图片，完整 Imgur 历史保存在 `image.uploads`。
- `.env.example` 中的 `IMGUR_CLIENT_ID` 只在服务端使用，不能写进浏览器代码。
- `POST /api/imgur` 接收 multipart 字段 `file`，上传成功后返回 `id`、`url` 和 `deleteHash`。
- 迁移现有 JSON 到数据库使用 `pnpm db:migrate`；默认上传数据库中尚未上传的图片：`pnpm upload:imgur`；单张图片可使用 `pnpm upload:imgur -- --memory-id=记忆ID`。需要重新上传时使用 `--force`，旧的 Imgur 记录会保留。

当前数据库共有 5 条已归档记录，包含《悠长假日》画面、冲绳旅行和 7 Premium 商品。图片均保留本地副本并记录 Imgur 上传信息；没有 EXIF 时间或 GPS 的图片按“原图未提供”处理，不使用附件传入时间代替拍摄时间。

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
