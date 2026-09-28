---
title: 横向封面测试:用一条命令把本地服务暴露给手机调试
description: 在手机上调试桌面开发的页面,不需要装任何东西,一条命令就够。
pubDate: 2026-08-06
category: 工具
tags: [调试, 开发工具, 移动端]
cover: /images/covers/wide.svg
coverAlt: 横向抽象渐变封面,苔绿色与珊瑚色的柔和过渡
coverPosition: center
draft: false
featured: true
---

## 场景

电脑上开发得好好的页面,手机上打开排版全歪。Chrome DevTools 的设备模拟能覆盖大部分情况,但总有几种问题只有真机才出现,比如 `100vh` 在移动 Safari 上的经典陷阱。

## 做法

开发服务器绑定到局域网地址,手机连同一个 Wi-Fi,直接访问电脑的 IP:

```bash
npm run dev -- --host
```

Astro 和 Vite 都支持 `--host`,启动后终端里会打印出 Network 地址,形如 `http://192.168.x.x:4321`,手机浏览器直接输入即可。

## 几个坑

1. Windows 防火墙第一次会拦截,记得允许专用网络;
2. 公司网络常开 AP 隔离,手机根本看不到电脑,换手机热点就行;
3. 如果页面里写死了 `localhost` 的接口地址,真机上记得换成局域网 IP。

## 为什么不用内网穿透

ngrok 一类的工具当然也行,但对「手机就在旁边」这个场景来说,多一层转发就多一层延迟和一次注册。局域网直达是最短路径。
