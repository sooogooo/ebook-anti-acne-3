# 🚀 部署指南

## 📋 静态网站部署说明

本项目的 `release-static` 目录包含完整的静态网站版本，可以直接部署到任何静态Web服务器。

## 🌐 部署选项

### 1. 传统Web服务器部署

#### Apache HTTP Server
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/release-static

    <Directory /path/to/release-static>
        AllowOverride All
        Require all granted
    </Directory>

    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
    </Location>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/release-static;
    index index.html;

    # 启用压缩
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location /ui/ {
        try_files $uri $uri/ /ui/index.html;
    }
}
```

### 2. 云服务部署

#### GitHub Pages
```bash
# 1. 创建GitHub仓库
# 2. 克隆到本地
git clone https://github.com/sooogooo/acne-book.git
cd acne-book

# 3. 复制静态文件
cp -r /path/to/release-static/* .

# 4. 提交并推送
git add .
git commit -m "Add static website"
git push origin main

# 5. 在GitHub仓库设置中启用GitHub Pages
```

#### Netlify
```bash
# 1. 注册Netlify账户
# 2. 拖拽release-static文件夹到Netlify部署界面
# 或者使用命令行工具:
netlify deploy --prod --dir=/path/to/release-static
```

#### Vercel
```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 部署
vercel --prod /path/to/release-static
```

### 3. CDN部署

#### 阿里云OSS + CDN
```bash
# 1. 创建OSS存储桶
# 2. 上传release-static目录内容
# 3. 配置静态网站托管
# 4. 绑定自定义域名并启用CDN
```

#### 腾讯云COS + CDN
```bash
# 1. 创建COS存储桶
# 2. 配置静态网站功能
# 3. 上传文件并配置CDN加速
```

## 🔧 配置优化

### 1. HTTPS配置（推荐）
建议为生产环境启用HTTPS：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }
}
```

### 2. 性能优化
```nginx
# 启用Brotli压缩（如果支持）
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# HTTP/2推送
http2_push /ui/assets/css/styles.css;
http2_push /ui/assets/css/themes.css;
http2_push /ui/assets/js/main.js;
```

### 3. 安全配置
```nginx
# 安全头部
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 📱 移动端优化

### 1. PWA支持（可选）
```html
<!-- 在ui/index.html中添加 -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#009688">
```

### 2. iOS优化
```html
<!-- 添加到主屏幕支持 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="小痘痘，快离开~">
<link rel="apple-touch-icon" href="/ui/assets/images/apple-touch-icon.png">
```

## 🔍 SEO优化

### 1. sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://your-domain.com/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://your-domain.com/ui/index.html</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://your-domain.com/docs/index.html</loc>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
</urlset>
```

### 2. robots.txt
```
User-agent: *
Allow: /
Sitemap: https://your-domain.com/sitemap.xml
```

## 📊 监控和分析

### 1. Google Analytics
```html
<!-- 在页面头部添加 -->
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. 性能监控
- 使用Google PageSpeed Insights
- 配置Web Vitals监控
- 设置错误追踪

## 🚨 故障排除

### 常见问题

1. **CSS/JS文件404错误**
   - 检查文件路径是否正确
   - 确认Web服务器配置

2. **跨域问题**
   - 检查CORS配置
   - 确认静态资源域名设置

3. **移动端显示异常**
   - 检查viewport设置
   - 确认响应式CSS配置

4. **HTTPS证书问题**
   - 确认证书有效性
   - 检查证书链完整性

### 日志监控
```nginx
# 访问日志
access_log /var/log/nginx/acne-book_access.log;

# 错误日志
error_log /var/log/nginx/acne-book_error.log;
```

---

*如有部署问题，请参考具体服务器文档或联系技术支持。*