# 灯罩开料计算器 - Vercel/Netlify 部署教程

本教程将手把手教您如何将项目部署到 Vercel 或 Netlify，并绑定自定义域名。

---

## 方案一：部署到 Vercel（推荐）⭐

Vercel 是最适合 Vite 项目的托管平台，提供最快的部署速度和最好的性能。

### 第一步：注册并登录 Vercel

1. 访问 **https://vercel.com**
2. 点击右上角 **Sign Up**（注册）
3. 选择 **Continue with GitHub**（使用 GitHub 登录）
4. 授权 Vercel 访问您的 GitHub 账号

### 第二步：导入项目

1. 登录后，点击 **Add New...** → **Project**
2. 在项目列表中找到 **lampshade-calculator**
3. 点击 **Import**（导入）

### 第三步：配置构建设置

Vercel 会自动检测到这是一个 Vite 项目，但需要确认以下设置：

```
Framework Preset: Vite
Root Directory: ./
Build Command: pnpm build
Output Directory: client/dist
Install Command: pnpm install
```

**重要**：如果 Vercel 没有自动检测到正确的输出目录，请手动设置：
- 点击 **Build and Output Settings** 展开
- 将 **Output Directory** 改为 `client/dist`

### 第四步：部署

1. 确认设置无误后，点击 **Deploy**（部署）
2. 等待 2-3 分钟，Vercel 会自动构建和部署
3. 部署成功后，您会看到一个临时域名，如：
   ```
   https://lampshade-calculator-xxx.vercel.app
   ```
4. 点击 **Visit**（访问）测试网站是否正常运行

### 第五步：绑定自定义域名

#### 如果您已有域名：

1. 在 Vercel 项目页面，点击 **Settings** → **Domains**
2. 输入您的域名（如 `lampshade.yourdomain.com`）
3. 点击 **Add**
4. Vercel 会提示您配置 DNS 记录：

**方式 A：CNAME 记录（推荐）**
```
类型: CNAME
名称: lampshade（或您想要的子域名）
值: cname.vercel-dns.com
```

**方式 B：A 记录**
```
类型: A
名称: @（或您想要的子域名）
值: 76.76.21.21
```

5. 前往您的域名注册商（如阿里云、腾讯云、GoDaddy）添加上述 DNS 记录
6. 等待 5-30 分钟 DNS 生效
7. 返回 Vercel，点击 **Refresh** 检查状态
8. 看到绿色的 ✓ 表示域名已成功绑定

#### 如果您没有域名：

您可以在以下平台购买域名：
- **阿里云**：https://wanwang.aliyun.com
- **腾讯云**：https://dnspod.cloud.tencent.com
- **Namecheap**：https://www.namecheap.com
- **GoDaddy**：https://www.godaddy.com

购买后按照上述步骤配置 DNS。

### 第六步：自动部署（可选）

现在每次您推送代码到 GitHub，Vercel 会自动重新部署：

```bash
# 修改代码后
git add .
git commit -m "更新功能"
git push

# Vercel 会自动检测并重新部署
```

---

## 方案二：部署到 Netlify

Netlify 也是一个优秀的托管平台，操作类似 Vercel。

### 第一步：注册并登录 Netlify

1. 访问 **https://app.netlify.com**
2. 点击 **Sign up**（注册）
3. 选择 **GitHub**（使用 GitHub 登录）
4. 授权 Netlify 访问您的 GitHub 账号

### 第二步：导入项目

1. 登录后，点击 **Add new site** → **Import an existing project**
2. 选择 **Deploy with GitHub**
3. 在仓库列表中找到 **lampshade-calculator**
4. 点击仓库名称

### 第三步：配置构建设置

```
Branch to deploy: main
Base directory: (留空)
Build command: pnpm build
Publish directory: client/dist
```

**重要**：确保 **Publish directory** 设置为 `client/dist`

### 第四步：部署

1. 点击 **Deploy site**（部署站点）
2. 等待 2-3 分钟构建完成
3. 部署成功后，您会看到一个临时域名，如：
   ```
   https://random-name-123456.netlify.app
   ```
4. 点击域名访问测试

### 第五步：自定义域名

1. 在站点页面，点击 **Domain settings**
2. 点击 **Add custom domain**
3. 输入您的域名（如 `lampshade.yourdomain.com`）
4. 点击 **Verify**

Netlify 会提示您配置 DNS：

```
类型: CNAME
名称: lampshade
值: random-name-123456.netlify.app
```

5. 前往域名注册商添加 DNS 记录
6. 等待 DNS 生效（5-30 分钟）
7. 返回 Netlify 检查状态

### 第六步：启用 HTTPS

1. 在 **Domain settings** 页面
2. 找到 **HTTPS** 部分
3. 点击 **Verify DNS configuration**
4. 等待 SSL 证书自动配置（通常几分钟）
5. 看到 **Your site has HTTPS enabled** 表示成功

---

## 常见问题解答

### Q1: 部署后页面显示 404

**原因**：输出目录配置错误

**解决方案**：
- Vercel: 确保 Output Directory 是 `client/dist`
- Netlify: 确保 Publish directory 是 `client/dist`

### Q2: 构建失败，提示找不到 pnpm

**解决方案**：

**Vercel**：
1. 进入项目 Settings → General
2. 找到 **Node.js Version**，选择 18.x 或更高
3. 重新部署

**Netlify**：
1. 在项目根目录创建 `netlify.toml` 文件：
```toml
[build]
  command = "npm install -g pnpm && pnpm install && pnpm build"
  publish = "client/dist"

[build.environment]
  NODE_VERSION = "18"
```
2. 提交并推送到 GitHub

### Q3: DNS 配置后多久生效？

通常 5-30 分钟，最长可能需要 24-48 小时。可以使用以下命令检查：

```bash
# Windows
nslookup lampshade.yourdomain.com

# Mac/Linux
dig lampshade.yourdomain.com
```

### Q4: 如何查看部署日志？

**Vercel**：
- 进入项目页面
- 点击 **Deployments**
- 点击具体的部署记录
- 查看 **Build Logs**

**Netlify**：
- 进入站点页面
- 点击 **Deploys**
- 点击具体的部署记录
- 查看构建日志

### Q5: 如何回滚到之前的版本？

**Vercel**：
1. 进入 **Deployments**
2. 找到想要回滚的版本
3. 点击右侧的 **...** → **Promote to Production**

**Netlify**：
1. 进入 **Deploys**
2. 找到想要回滚的版本
3. 点击 **Publish deploy**

### Q6: 如何更新网站内容？

只需推送代码到 GitHub，平台会自动重新部署：

```bash
# 本地修改代码后
git add .
git commit -m "更新内容"
git push

# 等待 2-3 分钟自动部署完成
```

---

## 性能优化建议

### 1. 启用 Gzip 压缩

**Vercel 和 Netlify 默认已启用**，无需额外配置。

### 2. 配置缓存策略

在项目根目录创建 `vercel.json`（Vercel）或 `netlify.toml`（Netlify）：

**Vercel (`vercel.json`)**：
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Netlify (`netlify.toml`)**：
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 3. 启用 HTTP/2

Vercel 和 Netlify 默认支持 HTTP/2，无需配置。

---

## 费用说明

### Vercel 免费额度

- ✅ 无限制的网站数量
- ✅ 100 GB 带宽/月
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署

**超出免费额度**：$20/月起

### Netlify 免费额度

- ✅ 无限制的网站数量
- ✅ 100 GB 带宽/月
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署

**超出免费额度**：$19/月起

---

## 推荐选择

| 特性 | Vercel | Netlify |
|------|--------|---------|
| 部署速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 文档质量 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 社区支持 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**建议**：对于 Vite 项目，推荐使用 **Vercel**，它对 Vite 的支持最好，部署速度最快。

---

## 需要帮助？

如果在部署过程中遇到问题，可以：

1. 查看平台的官方文档：
   - Vercel: https://vercel.com/docs
   - Netlify: https://docs.netlify.com

2. 检查构建日志中的错误信息

3. 确认 GitHub 仓库中的代码是最新的

祝您部署顺利！🚀
