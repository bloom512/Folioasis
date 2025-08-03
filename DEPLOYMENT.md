# 项目部署指南

本指南将帮助您将Folioasis植物管理应用部署到各种平台。

## 前提条件
- 确保您已成功构建项目（执行了`npm run build`命令）
- 构建后的文件位于`dist`目录中

## 部署选项

### 选项1: 使用Vercel部署（推荐）
1. 访问 [Vercel](https://vercel.com/) 并使用GitHub账号登录
2. 点击"New Project"按钮
3. 选择您的Folioasis项目仓库
4. 在配置页面，保持默认设置（Vercel会自动检测到这是一个Vite项目）
5. 点击"Deploy"按钮
6. 等待部署完成，Vercel会提供一个URL

### 选项2: 使用Netlify部署
1. 访问 [Netlify](https://www.netlify.com/) 并使用GitHub账号登录
2. 点击"Add new site" > "Import an existing project"
3. 选择您的Folioasis项目仓库
4. 在构建配置页面:
   - 构建命令: `npm run build`
   - 发布目录: `dist`
5. 点击"Deploy site"
6. 等待部署完成，Netlify会提供一个URL

### 选项3: 部署到GitHub Pages
1. 安装gh-pages包: `npm install -g gh-pages`
2. 在`package.json`中添加以下脚本:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```
3. 执行部署命令: `npm run deploy`
4. 访问 `https://<your-username>.github.io/<repository-name>`

### 选项4: 部署到自己的服务器
1. 将`dist`目录中的所有文件上传到您的Web服务器
2. 确保服务器配置正确处理单页应用路由
   - 对于Nginx，添加以下配置:
     ```nginx
     location / {
       try_files $uri $uri/ /index.html;
     }
     ```
   - 对于Apache，创建`.htaccess`文件并添加:
     ```apache
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
     ```

## 环境变量配置
如果您的应用需要环境变量（如Supabase密钥），请确保在部署平台上正确设置:
- Vercel: 在项目设置的"Environment Variables"部分添加
- Netlify: 在项目设置的"Environment"部分添加
- 自己的服务器: 在服务器环境中设置或使用`.env`文件

## 数据库配置
确保您已在Supabase控制台执行了`allow_watering_records_insert.sql`文件中的SQL语句，以允许匿名用户创建浇花记录。

祝您部署顺利！如果遇到任何问题，请查看相关平台的官方文档或提交issue。