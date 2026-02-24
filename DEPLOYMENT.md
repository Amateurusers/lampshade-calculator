# 灯罩开料计算器 - 独立部署指南

本文档说明如何将灯罩开料计算器网站导出并部署到您自己的服务器或托管平台。

## 一、从 Manus 导出代码

### 方法 1：导出到 GitHub（推荐）

1. 打开右侧管理面板
2. 点击 **Settings（设置）** → **GitHub**
3. 选择您的 GitHub 账号
4. 输入仓库名称（如 `lampshade-calculator`）
5. 点击导出，代码将自动推送到您的 GitHub 仓库

### 方法 2：下载代码压缩包

1. 打开右侧管理面板
2. 点击 **Code（代码）** 标签
3. 点击右上角的下载按钮
4. 下载完整的项目代码压缩包

---

## 二、本地开发环境配置

### 系统要求

- **Node.js**: 18.0 或更高版本
- **包管理器**: pnpm（推荐）或 npm

### 安装依赖

```bash
# 进入项目目录
cd lampshade-calculator

# 安装 pnpm（如果尚未安装）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 本地运行

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

### 构建生产版本

```bash
# 构建静态文件
pnpm build

# 构建产物位于 client/dist/ 目录
```

---

## 三、部署到托管平台

### 选项 1：Vercel（推荐，免费）

Vercel 是最简单的部署方式，提供免费的 HTTPS 和全球 CDN。

#### 通过 GitHub 自动部署

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 **New Project**
4. 导入您的 `lampshade-calculator` 仓库
5. 配置构建设置：
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `client/dist`
6. 点击 **Deploy**

#### 绑定自定义域名

1. 在 Vercel 项目设置中点击 **Domains**
2. 添加您的域名（如 `lampshade.yourdomain.com`）
3. 按照提示配置 DNS 记录（CNAME 或 A 记录）
4. 等待 DNS 生效（通常 5-30 分钟）

### 选项 2：Netlify（免费）

1. 访问 [netlify.com](https://netlify.com)
2. 使用 GitHub 账号登录
3. 点击 **Add new site** → **Import an existing project**
4. 选择您的 GitHub 仓库
5. 配置构建设置：
   - **Base directory**: `./`
   - **Build command**: `pnpm build`
   - **Publish directory**: `client/dist`
6. 点击 **Deploy site**

绑定自定义域名：在 **Domain settings** 中添加域名并配置 DNS。

### 选项 3：Cloudflare Pages（免费）

1. 访问 [pages.cloudflare.com](https://pages.cloudflare.com)
2. 登录 Cloudflare 账号
3. 点击 **Create a project**
4. 连接您的 GitHub 仓库
5. 配置构建设置：
   - **Build command**: `pnpm build`
   - **Build output directory**: `client/dist`
6. 点击 **Save and Deploy**

Cloudflare Pages 提供免费的全球 CDN 和自动 HTTPS。

### 选项 4：GitHub Pages（免费）

适合简单的静态网站托管。

1. 在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./client/dist
```

2. 在 GitHub 仓库设置中启用 GitHub Pages
3. 选择 `gh-pages` 分支作为源
4. 访问 `https://yourusername.github.io/lampshade-calculator`

---

## 四、部署到自己的服务器

### 使用 Nginx（Linux 服务器）

#### 1. 构建项目

```bash
pnpm build
```

#### 2. 上传构建产物

将 `client/dist/` 目录中的所有文件上传到服务器（如 `/var/www/lampshade`）

#### 3. 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/lampshade`：

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/lampshade;
    index index.html;
    
    # 支持单页应用路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 4. 启用站点并重启 Nginx

```bash
sudo ln -s /etc/nginx/sites-available/lampshade /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. 配置 HTTPS（使用 Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 五、域名配置

### DNS 记录配置

根据您选择的托管平台，配置相应的 DNS 记录：

#### Vercel / Netlify
```
类型: CNAME
名称: @ 或 www
值: <平台提供的域名>
```

#### Cloudflare Pages
```
类型: CNAME
名称: @ 或 www
值: <your-project>.pages.dev
```

#### 自己的服务器
```
类型: A
名称: @
值: <服务器 IP 地址>

类型: A
名称: www
值: <服务器 IP 地址>
```

---

## 六、环境变量配置（可选）

如果您需要自定义配置，可以在项目根目录创建 `.env` 文件：

```env
# 网站标题
VITE_APP_TITLE=灯罩开料计算器

# 其他自定义配置
# ...
```

---

## 七、常见问题

### Q: 部署后页面空白或 404

**解决方案**：
- 检查构建产物路径是否正确（`client/dist`）
- 确保服务器配置支持单页应用路由（`try_files` 或 `fallback`）
- 检查浏览器控制台是否有资源加载错误

### Q: 如何更新网站内容？

**方案 1（GitHub 自动部署）**：
1. 修改代码并推送到 GitHub
2. Vercel/Netlify/Cloudflare Pages 会自动重新构建和部署

**方案 2（手动部署）**：
1. 本地运行 `pnpm build`
2. 上传 `client/dist/` 到服务器
3. 清除浏览器缓存

### Q: 如何优化加载速度？

- 启用 Gzip/Brotli 压缩
- 配置静态资源缓存
- 使用 CDN 加速
- 启用 HTTP/2

---

## 八、技术支持

如果在部署过程中遇到问题：

1. **查看构建日志**：检查是否有构建错误
2. **检查浏览器控制台**：查看是否有 JavaScript 错误
3. **验证 DNS 配置**：使用 `nslookup` 或 `dig` 命令检查 DNS 解析
4. **测试本地构建**：先在本地运行 `pnpm build && pnpm preview` 验证构建产物

---

## 九、推荐部署方案对比

| 平台 | 难度 | 费用 | HTTPS | CDN | 自动部署 | 推荐指数 |
|------|------|------|-------|-----|----------|----------|
| **Vercel** | ⭐ | 免费 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **Netlify** | ⭐ | 免费 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **Cloudflare Pages** | ⭐ | 免费 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **GitHub Pages** | ⭐⭐ | 免费 | ✅ | ❌ | ✅ | ⭐⭐⭐⭐ |
| **自己的服务器** | ⭐⭐⭐⭐ | 付费 | 需配置 | 需配置 | 需配置 | ⭐⭐⭐ |

**建议**：对于大多数用户，推荐使用 **Vercel** 或 **Netlify**，它们提供最简单的部署体验和最好的性能。

---

祝您部署顺利！🎉
