<!--
 * @Author: aliyun9402055519
 * @Date: 2026-07-16 16:37:08
 * @LastEditors: aliyun9402055519
 * @LastEditTime: 2026-08-04 14:22:26
 * @FilePath: /change/README.md
 * @Description: 默认
-->
# 微信小程序服务端

基于 NestJS 的后端服务，为 `miniprogram/` 小程序提供商品、登录、用户与购物车 API。

## 快速开始

```bash
cd server
npm install
cp .env.example .env
npm run start:dev
```

服务默认运行在 `http://localhost:3000`，API 前缀为 `/api`。

## API 概览

### 商品（无需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 获取商品列表 |
| GET | `/api/products/:id` | 获取商品详情 |

### 微信登录

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/wechat/login` | 使用 `wx.login` 返回的 code 登录 |

请求体：

```json
{ "code": "wx_login_code" }
```

响应：

```json
{
  "token": "session_token",
  "user": {
    "openid": "...",
    "avatarUrl": "",
    "nickName": "",
    "lastLoginAt": 1710000000000
  }
}
```

### 用户（需登录）

请求头：`Authorization: Bearer <token>`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 |
| PATCH | `/api/users/me` | 更新头像、昵称 |

### 购物车（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cart` | 获取购物车 |
| POST | `/api/cart/items` | 添加商品 |
| PATCH | `/api/cart/items/:key/quantity` | 修改数量 |
| PATCH | `/api/cart/items/:key/spec` | 修改规格 |
| DELETE | `/api/cart/items/:key` | 删除商品 |
| DELETE | `/api/cart` | 清空购物车 |

## 环境变量

| 变量 | 说明 |
|------|------|
| `PORT` | 服务端口，默认 `3000` |

未配置微信凭证时，登录接口会进入开发模式，使用 `dev_<code>` 作为 mock openid。

## 本地检查

```bash
npm run build
npm run lint
npm run test
```
