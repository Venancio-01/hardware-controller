# API 合约

> **生成日期**: 2025-12-26
> **API 版本**: v1

---

## 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `http://localhost:3000` |
| 认证方式 | JWT Bearer Token |

---

## 认证

### POST /api/auth/login

**描述**: 用户登录

**请求体**:
```json
{
  "username": "admin",
  "password": "password"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "expiresIn": 3600
  }
}
```

---

## 配置管理

### GET /api/config

**描述**: 获取当前配置

**认证**: 需要

**响应** (200):
```json
{
  "success": true,
  "data": {
    "deviceId": "device-001",
    "timeout": 3000,
    "retryCount": 3,
    "pollingInterval": 5000,
    "ipAddress": "192.168.1.100",
    "subnetMask": "255.255.255.0",
    "gateway": "192.168.1.1",
    "port": 80,
    "dns": ["8.8.8.8"]
  }
}
```

### PUT /api/config

**描述**: 更新配置

**认证**: 需要

**请求体**:
```json
{
  "deviceId": "device-001",
  "timeout": 3000,
  "retryCount": 3,
  "pollingInterval": 5000,
  "ipAddress": "192.168.1.100",
  "subnetMask": "255.255.255.0",
  "gateway": "192.168.1.1",
  "port": 80,
  "dns": ["8.8.8.8"]
}
```

**响应** (200):
```json
{
  "success": true,
  "message": "配置已保存",
  "needsRestart": true
}
```

### GET /api/config/export

**描述**: 导出配置文件

**认证**: 需要

**响应**: 下载 `config.json` 文件

### POST /api/config/import

**描述**: 导入配置

**认证**: 需要

**请求体**:
```json
{
  "config": { ... }
}
```

---

## 系统

### GET /health

**描述**: 健康检查

**认证**: 不需要

**响应** (200):
```json
{
  "status": "OK",
  "timestamp": "2025-12-26T03:00:00.000Z"
}
```

### POST /api/system/restart

**描述**: 重启系统

**认证**: 需要

**响应** (200):
```json
{
  "success": true,
  "message": "系统正在重启"
}
```

### GET /api/status

**描述**: 获取系统状态

**认证**: 需要

---

## 冲突检测

### GET /api/config/check-conflict

**描述**: 检测配置冲突

**认证**: 需要

---

## 错误响应

所有错误使用统一格式：

```json
{
  "success": false,
  "error": "错误描述",
  "validationErrors": { ... }  // 可选，验证错误详情
}
```

| 状态码 | 描述 |
|--------|------|
| 400 | 验证错误 |
| 401 | 未认证 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
