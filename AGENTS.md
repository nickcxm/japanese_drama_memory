<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 日本的记忆：固定工作规则

### 图片录入流程

收到用户图片后，默认按“分析、研究、保存、托管、归档、部署”的完整流程处理，不把图片只当作临时附件：

1. 先读取原图可用信息：EXIF 拍摄时间、GPS、设备、尺寸、方向、文件名；同时检查画面中的文字、人物、剧名、地点、建筑、商品、广告、海岸线和其他地标。
2. 对日剧画面、广告、商品、旅行地点和历史背景主动查证。优先使用官方资料、地方政府/旅游机构、品牌官方资料、剧集取景资料和可靠的一手来源；必要时使用图片搜索或地图资料进行比对。
3. 尽量自己判断，不把所有内容写成“草稿”“待确认”或“待整理”。能确认的直接确认；根据画面和资料做出的合理判断要直接记录，并在正文中用“推测”“很可能”等准确表达推断边界。
4. 只有关键结论确实无法判断、且用户补充后会明显改变记录时，才向用户提出一个最小问题。用户提供的剧名、季数、集数、日期和地点优先于自动推断。
5. 没有 EXIF 时间或 GPS 时，不能用附件传入时间代替拍摄时间，也不能虚构坐标。应记录“原图未提供”这一事实，并继续完成其他可确认信息。

### 图片保存与 Imgur 托管

所有用户图片默认执行“双重保存”：

- 原图必须保存到 `public/memories/`，作为永久本地保底；不能因为上传 Imgur 成功而删除或替换本地文件。
- 默认必须使用用户自己的 Imgur Client ID 上传到 Imgur。Client ID 只从本机 `.env.local` 或生产环境的 `IMGUR_CLIENT_ID` 读取，不得硬编码到源码、`AGENTS.md`、Git 提交或浏览器端。
- 上传成功后，必须在本地 JSON 中记录 Imgur 的 `id`、`url`、`deleteHash`（如果 API 返回）和 `uploadedAt`；页面显示远程图片时仍必须保留本地 URL 作为 fallback。
- Imgur 上传失败时，仍然保留本地图片，但不能把这张图标记为“已完成上传”；应明确报告失败原因，并在有条件时重试。
- 每张图片都必须有永久不变的本地 `assetId`，例如 `jdm-0001`。`assetId` 不能因文件重命名、Imgur URL 变化或迁移到其他图床而改变。
- `data/image-assets.json` 是图片资产清单：记录 `assetId`、对应 `memoryId`、本地路径、原始文件名，以及按 provider 追加的上传记录。`data/memories.json` 中的 `image.assetId` 必须与它一致。
- 以后迁移到其他图床时，保留原 `assetId` 和本地文件，在 `uploads` 中追加新的 provider 记录；不能覆盖或丢失 Imgur 历史记录。任何迁移脚本都必须依据本地资产清单和 `assetId` 工作。
- 不要把 Imgur 当作唯一来源；Imgur 被限制上传、图片失效或服务不可用时，网站仍必须能够使用本地图片正常展示。

### 记忆数据要求

每条记忆尽量补齐：`kind`、标题、中英文标题、剧名/旅行系列、季集信息、场景、地点层级、日期、故事、历史说明、标签、关键词、本地图片、远程上传记录和来源链接。

历史说明必须回答“这是什么、为什么出现在这里、它有什么历史”，而不是只写“待核实”。例如：

- 啤酒要识别品牌、产品系列、包装年代和品牌沿革；
- 广告要判断是商品广告、局台自宣传、场景装置还是节目内视觉，并介绍其背景；
- 日剧建筑要结合剧中设定、取景资料和建筑本身历史定位；
- 旅行照片要结合用户提供的日期地点、画面特征和当地资料，补充地理与文化背景。

对事实和推断要分开写，所有外部研究结论尽量附来源链接，页面可通过“查阅资料”访问来源。

### 网站视觉与交互

- 首页默认随机展示一条记忆，不展示没有意义的状态词，例如“已存 · ARCHIVE”“DRAFT”等；
- 视觉方向保持纸张、旧照片、私人档案、取景考据和文学编辑感，使用克制的色彩、衬线字体、留白、细线和图像阴影，避免后台管理面板风格；
- 图片上可以有简洁的基础图注，至少包含剧名/旅行系列和地点；没有地点时显示准确的替代信息，例如“室内场景”，不要遮挡主体画面；
- 详细故事、历史和来源放在图片旁边或下方，图片上的文字只承担照片背面的简短注记功能。

### 修改、验证与交付

- 修改前先阅读现有架构、接口和 Next.js 项目规范，优先复用现有 Imgur API 与数据结构，不凭空创造重复接口；
- 修改后至少运行 lint、生产构建和图片/页面可访问性检查；
- 本地部署使用现有 PM2 应用和 Caddy `jp.home` 配置；部署成功后确认 PM2 在线、首页可访问、本地图片可访问、Imgur URL 已写入数据；
- 完成后提交 Git，并推送到配置好的远程仓库。不要提交 `.env.local`、Client ID 或其他凭据。
