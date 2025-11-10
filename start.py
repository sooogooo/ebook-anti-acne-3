#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
小痘痘，快离开~ - 静态网站启动脚本
支持同时启动文档系统和现代化UI应用
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time
from urllib.parse import urlparse

# 配置信息
PORT = 8080
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP请求处理器，支持CORS和更好的文件类型处理"""

    def end_headers(self):
        # 添加CORS头部，支持跨域请求
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # 添加安全头部
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        super().end_headers()

    def log_message(self, format, *args):
        """自定义日志格式"""
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {self.address_string()} - {format % args}")

def check_ports():
    """检查端口是否被占用"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((HOST, PORT))
        return True
    except OSError:
        return False

def open_browsers():
    """延迟打开浏览器"""
    time.sleep(2)  # 等待服务器启动

    urls = [
        f'http://{HOST}:{PORT}/ui/index.html',     # 现代化UI应用
        f'http://{HOST}:{PORT}/docs/index.html'    # MkDocs文档系统
    ]

    print("\n🌐 正在打开浏览器...")
    for i, url in enumerate(urls, 1):
        try:
            webbrowser.open(url)
            print(f"   ✅ 已打开标签页 {i}: {url}")
        except Exception as e:
            print(f"   ❌ 无法打开浏览器: {e}")
            print(f"   📎 请手动访问: {url}")

def print_startup_info():
    """打印启动信息"""
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                🚀 小痘痘，快离开~ - 静态网站版                 ║
    ║              精准战"痘"方案与身心愈肤指南                         ║
    ╚═══════════════════════════════════════════════════════════════╝

    📚 服务信息:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🌐 服务地址: http://{}:{}
    📱 现代化UI: http://{}:{}/ui/index.html
    📖 文档系统: http://{}:{}/docs/index.html

    ⚡ 功能特性:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ✅ AI智能咨询助手      ✅ 个性化护肤方案设计
    ✅ 划词AI解释功能      ✅ 4种优雅配色主题
    ✅ 深色模式支持        ✅ 完美的移动端适配
    ✅ 专业医学内容        ✅ 响应式设计

    📝 操作说明:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    • 按 Ctrl+C 停止服务器
    • 服务启动后自动打开浏览器
    • 支持所有现代浏览器访问

    """.format(HOST, PORT, HOST, PORT, HOST, PORT))

def main():
    """主函数"""
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # 检查端口
    if not check_ports():
        print(f"❌ 端口 {PORT} 已被占用，请关闭其他使用该端口的程序后重试")
        sys.exit(1)

    # 打印启动信息
    print_startup_info()

    try:
        # 创建HTTP服务器
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print(f"🚀 服务器启动成功！监听端口: {PORT}")

            # 在后台线程中打开浏览器
            browser_thread = threading.Thread(target=open_browsers, daemon=True)
            browser_thread.start()

            # 启动服务器
            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n\n👋 服务器已停止")
        print("💖 感谢使用小痘痘，快离开~ 静态网站版！")
    except Exception as e:
        print(f"\n❌ 服务器启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()