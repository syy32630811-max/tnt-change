# Change

基于 NestJS + TypeORM + MySQL 的页面码入口系统，提供管理后台、物料互换、物料定制三类前端页面，以及对应 REST API。

## 功能概览

### 页面码入口

- 访问 `/page/`，输入标识码进入对应页面
- 支持三种页面类型：`admin`（管理）、`exchange`（物料互换）、`custom`（物料定制）
- 管理端可生成 12 位随机页面码、启停用
- 子页面刷新时会校验 URL 中的 `code`：缺失、无效或类型不匹配时退回入口页

### 管理后台（`/page/admin/?code=...`）

| 模块 | 能力 |
|------|------|
| 物料管理 | 增改互换物料（名称、图片、数量、到期时间、有效状态） |
| 互换记录 | 查看有效且物料在有效期内的兑换记录 |
| 商品管理 | 增改定制商品与多规格（名称、图、价格） |
| 订单管理 | 查看订单、改状态、填快递单号 |
| 页面码管理 | 生成页面码、切换有效状态 |
| 上传 | 图片上传至 `/uploads/` |

### 物料互换（`/page/exchange/?code=...`）

- 按库存数量降序展示可互换物料
- 一个页面码仅可绑定一条有效互换记录
- 选择物料时填写平台与平台用户 ID，生成兑换码与二维码（「我的记录」中查看）
- 支持取消当前选择（软取消，恢复库存），再选其他物料

### 物料定制（`/page/custom/?code=...`）

| Tab | 能力 |
|-----|------|
| 商品列表 | 浏览商品/规格，设置数量加入购物车，展示已加购数量 |
| 购物车 | 本地存储；勾选结算；改数量；删除 |
| 我的订单 | 按页面码查看订单；非「已发货 / 已取消」状态可修改收货信息 |

订单状态：`已提交` → `已支付` → `定制中` → `已发货`，以及 `已取消`。时间统一按东八区（Asia/Shanghai）展示。

## 技术栈

- **后端**：NestJS 11、TypeORM、MySQL、class-validator
- **前端**：静态 HTML / CSS / JS（由 Nest 托管）
- **启动**：自动建库（若不存在）、自动跑迁移

## 快速开始

```bash
npm install
cp .env.example .env
# 按需修改 .env 中的数据库等配置
npm run start:dev
```

- API：`http://localhost:3000/api`（端口以 `PORT` 为准）
- 入口页：`http://localhost:3000/page/`

其他命令：

```bash
npm run build
npm run start:prod
npm run migration:run
npm run lint
npm run test
```

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 服务端口 | `3000` |
| `DB_HOST` | MySQL 主机 | `localhost` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `DB_USERNAME` | 数据库用户 | `root` |
| `DB_PASSWORD` | 数据库密码 | 空 |
| `DB_NAME` | 数据库名 | `wechat` |
| `QR_CODE_API` | 二维码生成接口，`{code}` 为占位符 | qrserver 示例地址 |

## 目录结构

```
├── page/                 # 前端静态页
│   ├── index.html        # 页面码入口
│   ├── admin/            # 管理后台
│   ├── exchange/         # 物料互换
│   ├── custom/           # 物料定制
│   └── assets/           # JS / CSS
├── src/                  # NestJS 源码
│   ├── page-entry-code/  # 页面码
│   ├── material/         # 互换物料
│   ├── material-exchange/# 互换记录与二维码
│   ├── product/          # 定制商品
│   ├── order/            # 订单
│   ├── upload/           # 文件上传
│   └── database/         # 数据源与迁移
└── uploads/              # 上传文件与二维码图片
```

## API 概览

前缀均为 `/api`。

### 页面码

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/page-entry-codes` | 列表 |
| POST | `/page-entry-codes` | 创建（自动生成 12 位码） |
| PATCH | `/page-entry-codes/:id` | 更新（如启停用） |
| GET | `/page-entry-codes/:code` | 解析页面码（入口 / 刷新校验） |

### 物料

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/materials` | 列表 |
| GET | `/materials/:id` | 详情 |
| POST | `/materials` | 创建 |
| PATCH | `/materials/:id` | 更新 |
| GET | `/exchange-materials` | 互换页可用物料（有效且未过期） |

### 互换记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/material-exchange-records` | 管理端列表 |
| GET | `/material-exchange-records/by-code/:pageCode` | 按页面码查询 |
| POST | `/material-exchange-records` | 创建（选物料） |
| PATCH | `/material-exchange-records/by-code/:pageCode` | 更新 |
| DELETE | `/material-exchange-records/by-code/:pageCode` | 取消（`is_valid=0`，回库存） |

二维码内容为：`物料名 + 平台 + 平台用户ID + 4 位兑换码`；图片保存到 `/uploads/`。

### 商品

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/products` | 列表（含规格） |
| GET | `/products/:id` | 详情 |
| POST | `/products` | 创建 |
| PATCH | `/products/:id` | 更新 |

### 订单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/orders` | 全部订单；`?pageCode=` 按页面码筛选 |
| GET | `/orders/:id` | 详情 |
| POST | `/orders` | 下单（绑定页面码与收货信息） |
| PATCH | `/orders/:id/status` | 更新状态 |
| PATCH | `/orders/:id/tracking` | 更新快递单号 |
| PATCH | `/orders/:id/shipping` | 修改收货信息（已发货 / 已取消不可改） |

### 上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/uploads` | `multipart/form-data`，字段名 `file` |

## 使用流程建议

1. 启动服务，打开 `/page/`
2. 用管理类页面码进入后台，配置物料、商品，并分别生成互换 / 定制页面码
3. 用对应页面码进入互换或定制页进行业务操作
4. 在后台查看互换记录与订单，更新订单状态与物流
