# 典之的21岁像素散步

一个无需后端、无需安装依赖的手机生日网页游戏。

## 打开游戏

直接双击 `index.html` 即可试玩。正式分享时，可将整个 `dianzhi-birthday` 文件夹部署到 GitHub Pages、Netlify、Cloudflare Pages 等任意静态托管服务。

## 替换照片

1. 将 8 张照片放入 `assets/photos/`。
2. 文件名依次设为 `photo-1.jpg` 至 `photo-8.jpg`。
3. 建议使用横向 4:3 图片并压缩到每张 1 MB 以内。

缺少照片不会影响游戏，页面会自动显示“照片待投放”占位框。若使用 PNG 或其他文件名，请同步修改 `game.js` 顶部 `CONFIG.memories` 中的 `photo` 路径。

## 修改文字

姓名、日期、场景、回忆文案、照片路径与彩蛋文案都集中在 `game.js` 顶部的 `CONFIG` 对象中。最终生日祝福位于 `index.html` 的 `endingScreen` 区域。

## 操作

- 手机：屏幕左下角左右键移动，右下角按钮跳跃。
- 电脑：方向键或 A/D 移动，空格、W 或上方向键跳跃。
- 全程没有失败机制，未收集齐彩蛋或照片也可以抵达结尾。
