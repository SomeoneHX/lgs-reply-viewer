# LGS Reply Viewer

洛谷文章评论区**只读**嵌入组件。输入文章链接即可生成 iframe 地址，风格类似 giscus，但只展示、不发布。

由 [洛谷保存站](https://www.luogu.me) 提供数据支持。

界面与数据字段完整移植自 [luogu-saver](https://github.com/laikit-dev/luogu-saver) 的
`ArticleComments` 组件（头像、用户名颜色、OI / ICPC 等级徽章、楼层、时间、来源说明），
数据源为 `https://api.luogu.me`（`access-control-allow-origin: *`，可直连）。

- 技术栈：npm + TypeScript + Vue 3 + Vite
- 部署：静态站点，可直接托管到 GitHub Pages
- 嵌入：`<iframe>` 直连，或一行 `<script>` 自动创建并同步高度

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物在 dist/
npm run preview
```

## 页面

| 路由 | 说明 |
| --- | --- |
| `#/` | 首页：粘贴文章链接 → 实时生成 iframe 地址 + 嵌入代码 + 下方实时预览 |
| `#/embed` | 嵌入页：扁平化只读评论区，供 iframe 引用 |
| `/demo.html` | 用 `embed.js` 在普通页面里嵌入两个实例的示例 |

> 使用 **hash 路由**，因为 GitHub Pages 没有 rewrite 规则，路径式路由刷新会 404。
> 构建 `base` 默认为 `./`（相对路径），同一份产物可放在任意子目录或自定义域名下。

## 嵌入方式

### 1. 脚本（推荐，自动高度）

```html
<script src="https://someonehx.github.io/lgs-reply-viewer/embed.js"
        data-article="lwr2bdre"
        data-theme="auto"
        data-collapse="20"
        async></script>
```

脚本会创建 iframe 并通过 `postMessage` 监听高度变化，宿主页面不需要写 `onload`。

### 2. 手写 iframe

```html
<iframe
    src="https://someonehx.github.io/lgs-reply-viewer/#/embed?article=lwr2bdre&theme=auto"
    loading="lazy"
    style="width: 100%; border: 0"
></iframe>
```

## 参数

嵌入页 `#/embed` 支持的查询参数（脚本方式用同名 `data-*`）：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `article` | — | **必填**，文章 ID（1–8 位字母数字），也接受 `id` / `articleId` / `lid` |
| `theme` | `auto` | `light` / `dark` / `auto`（跟随系统 `prefers-color-scheme`） |
| `title` | `1` | 是否显示标题栏（含文章标题、条数） |
| `refresh` | `1` | 是否显示刷新按钮（触发上游重新抓取） |
| `floor` | `1` | 是否显示楼层号 |
| `note` | `1` | 是否显示「评论来源于洛谷」脚注 |
| `max` | `0` | 硬截断条数，0 为不限 |
| `collapse` | `0` | 超过该条数时折叠，显示「展开剩余 N 条」；0 为不折叠 |

建议评论较多时设 `collapse`（例如 `20`），否则 iframe 会非常高。

## 链接解析

首页输入框接受：

```
lwr2bdre
https://www.luogu.com.cn/article/lwr2bdre
https://www.luogu.com/article/lwr2bdre
https://luogu.store/article/lwr2bdre
https://example.com/?article=lwr2bdre
https://example.com/#/article/lwr2bdre
```

## 部署到 GitHub Pages

1. 推送到 `main` 分支，仓库设置 → Pages → Source 选 **GitHub Actions**。
2. `.github/workflows/deploy.yml` 会自动构建并发布 `dist/`。

可选：在仓库 Settings → Variables 里设置

- `VITE_BASE`：改成 `/<repo>/` 之类的绝对路径（默认是相对路径 `./`，通常不需要改）
- `VITE_API_BASE`：指向自建的 luogu-saver API（默认 `https://api.luogu.me`）

`public/.nojekyll` 已包含，避免 Jekyll 忽略下划线开头的文件。

## 数据来源与说明

- `GET  /article/comments/:id` — 评论列表
- `POST /article/comments/:id/refresh` — 请求重新抓取（刷新按钮）
- `GET  /article/query/:id` — 仅用于显示文章标题，失败不影响评论区

上游在数据过期时会派发抓取任务；本项目无 WebSocket，改为在数据 `stale` 时延迟 8 秒重取一次。

组件**只读**：不提供发布、点赞、删除等写入能力。数据版权归洛谷及原作者所有。

## 致谢

本项目由 [洛谷保存站](https://www.luogu.me) 提供数据与接口支持，界面与字段逻辑移植自
[laikit-dev/luogu-saver](https://github.com/laikit-dev/luogu-saver)。

## 许可证

[GNU Affero General Public License v3.0](LICENSE)（AGPL-3.0）。

- 界面与数据字段的移植逻辑来源于 [laikit-dev/luogu-saver](https://github.com/laikit-dev/luogu-saver)（AGPL-3.0）。
- 数据由 [洛谷保存站](https://www.luogu.me) 提供，仅供只读展示；数据版权归洛谷及原作者所有。
