# Pacific China Time

洛杉矶与北京时间同步工具。React + TypeScript + Vite 纯前端 SPA，可直接由 Cloudflare Pages 托管。

初版日期：2026.10.28。仓库：[kent-Leo/pacific-china-time](https://github.com/kent-Leo/pacific-china-time)。线上网站：[pacific-china-time.pages.dev](https://pacific-china-time.pages.dev/)。

## 本地运行

使用 **Node.js 22.23.4**（`.node-version`）和 npm。系统上的 Node 24 不属于本项目声明的运行环境；请用已有的版本管理器切换到 Node 22，不必替换其他项目使用的版本。

```sh
# 已安装 nvm 时
nvm install 22.23.4
nvm use 22.23.4

npm ci
npm run dev
```

访问终端打印的本地地址，默认 `http://127.0.0.1:5173/`。也可以通过 [Node.js 官方下载](https://nodejs.org/download/release/v22.23.4/) 安装同一版本。项目不需要 API Key、环境变量、账户或后端服务。

```sh
npm run lint       # ESLint，零警告
npm run typecheck  # 包括 src/tests、Vite 配置的 TypeScript 检查
npm run test       # Vitest 一次执行并退出
npm run check      # 上述检查 + 生产构建
npm run build      # TypeScript 检查 + Vite 静态构建
npm run preview    # 预览 dist，默认 4173 端口
```

`npm ci` 依赖已提交的 `package-lock.json`，不使用 `--force` 或 `--legacy-peer-deps`。`dist` 和 `node_modules` 不提交。开发服务器只用于开发；部署后不需要 Node.js 服务器。

## 功能

- 两个时钟共享一个设备时钟的 UTC 时间点，每秒重新读取 `Date.now()`；标签页可见、窗口获得焦点或页面恢复时立即刷新。
- 自动 PT 使用 `America/Los_Angeles`，随日期切换 PST / PDT；固定 PST 使用 `-08:00`，全年不切换夏令时。
- 北京使用 `Asia/Shanghai`。经需求确认，日期范围从 **1992 年起**，输入使用四位年份（最大 9999）；两地显示日期都须在此范围内。由此避开北京早期历史夏令时与“固定 UTC+8”的冲突。
- 双向编辑日期和当地小时、分钟；有效输入立即同步时钟和时间轴。人工编辑后进入手动模式，“返回现在”恢复实时显示。
- 春季不存在的时间明确报错，不自动挪到其他时刻；秋季重复时间显示第一次 / 第二次及对应 UTC 偏移供用户选择。
- 时间轴覆盖完整太平洋当地日：通常 24 小时，春季切换日 23 小时、秋季切换日 25 小时。重复小时分别标注偏移，北京午夜标注新日期。
- 点击、拖动时间轴或用键盘方向键按分钟选择。窄屏时间轴可横向滚动；双时钟和表单自动纵向排列。
- 中英文、12 / 24 小时显示、浅色 / 深色 / 跟随系统。主题、语言、小时制和太平洋模式保存于 `localStorage`；存储被禁用时仍可在当前页面使用。
- 复制转换结果、会议时段及分享链接。剪贴板不可用时给出可选择的文本。
- 页面不发送用户输入、分析统计或时间查询请求；字体、图标与静态资源随应用构建。

展示日期统一为 `YYYY.M.D`，例如 `2026.3.8`。URL、HTML 原生日期选择器底层值和时区库使用标准 ISO 格式；系统原生日历的呈现由浏览器决定。时间输入始终明确标注为 24 小时制，12 / 24 切换影响结果显示。

## 时间计算约定

所有计算统一导入 `@js-temporal/polyfill`，不依赖浏览器原生 `Temporal`，不使用用户设备时区替代目标时区，也不通过固定加减 15 / 16 小时实现自动模式。

`resolveLocal()` 分别计算 `earlier` / `later`，并回查得到的当地日期时间是否等于原输入：不相等为春季缺失时间；相等但 UTC 不同为秋季重复时间。正常输入只有一个 UTC 结果。

内部保存 UTC 毫秒。转换器输入精度为分钟，编辑会把秒归零；实时与分享链接可保留毫秒。两地时钟始终使用同一个时间点。

本工具使用设备时钟，**没有独立网络校时源**。时区计算依赖浏览器或 Node 内置的 IANA 时区数据库；未来政策变更需要更新运行环境。白天 / 夜晚仅指当地 06:00–18:00 / 其余时段，不表示真实日出日落。

## 会议规划的日期语义

会议日期代表一个完整的**太平洋当地日**。计算器生成两地每天的工作时间区间，将其转换为 UTC，求交集并裁剪到这个太平洋当地日。北京会自动使用实际对应的日期，可能包含当天及后一天。

- 默认工作时间均为当地 09:00–18:00。
- 夏季（PDT）默认没有交集；冬季（PST）默认有太平洋 17:00–18:00 / 北京次日 09:00–10:00 的一小时交集。
- 结束时间早于开始时间表示跨午夜，也计算前一工作日延续到当天的部分；开始等于结束视为无效输入，不默认为全天。
- 工作时段按每天重复，包含周末与节假日；不自动排除休息日。
- 工作边界若落入不存在时刻，会要求调整；落入重复时刻，会要求选定第一次或第二次。
- 区间端点使用 `[开始, 结束)`，复制信息明确标注结束端点。结果为可用时段，不会创建预约或发送邀请。

## 可分享链接

参数为 `at`（必须是带 `Z` 的 UTC ISO 时间）、`mode`（`auto` / `fixed`）、`lang`（`zh` / `en`）、`clock`（`12` / `24`）、`theme`（`system` / `light` / `dark`）。

```text
https://YOUR-PAGES-DOMAIN/?at=2026-11-01T09%3A30%3A00Z&mode=auto&lang=zh&clock=24&theme=light
```

此示例代表秋季回拨后第二次出现的太平洋 01:30 PST。URL 不通过设备本地时间解析。无效时间、越界日期、重复参数、未知字段或无效设置会使整个分享状态失效，并显示提示、恢复当前设备时间及本地设置。清空手动选择后也清理地址中的旧分享参数。

## 项目结构

```text
src/
  components/   界面、输入、复制与主题控件
  hooks/        设备时钟及系统主题监听
  lib/          时区、格式化、歧义解析、时间轴、会议、URL 与配置
  types/        共享类型
  tests/        可重复执行的 Vitest 单元测试
  App.tsx       单一时间点和设置状态
  main.tsx
  index.css     Tailwind CSS + 响应式主题样式
public/
.github/workflows/ci.yml
```

仓库入口在 `src/lib/config.ts` 的 `GITHUB_URL` 中配置；空字符串隐藏入口，必须使用实际存在的仓库。

## GitHub

公开仓库已创建为 `kent-Leo/pacific-china-time`。后续更新：

```sh
git clone https://github.com/kent-Leo/pacific-china-time.git
cd pacific-china-time
npm ci
npm run check

# 仅暂存本次需要提交的文件
git add <changed-files>
git commit -m "Describe the change"
git push origin main
```

CI 在 push 和 pull request 上执行 `npm ci`、lint、typecheck、test、build；Node 版本来自 `.node-version`。所有部署使用相同的 `npm run build`。推送及 GitHub Actions 成功与 Cloudflare Pages 部署成功是不同状态。

## Cloudflare Pages 自动部署

在 Cloudflare 控制台选择 **Workers & Pages → Create application → Pages → Connect to Git**，关联 GitHub 仓库 `kent-Leo/pacific-china-time`。如果新的界面首先展示 Worker 部署，切换到 **Pages**。

| 设置                   | 值                                 |
| ---------------------- | ---------------------------------- |
| Framework preset       | React (Vite)                       |
| Root directory         | `/`（仓库根目录）                  |
| Production branch      | `main`                             |
| Build command          | `npm run build`                    |
| Build output directory | `dist`                             |
| Node.js                | `22.23.4`，由 `.node-version` 指定 |
| Package manager        | npm，提交的 `package-lock.json`    |
| 环境变量               | 不需要                             |

保存后 Pages 从 GitHub 自动安装依赖和构建。以后向 `main` 推送会触发生产构建；若账户配置允许，其他分支与 PR 可生成预览部署。

这是 Vite 默认静态构建，没有 SSR、数据库、Worker、Pages Functions、Wrangler 配置或后端运行时。`dist/index.html` 为入口，资源由 Vite 输出到 `dist/assets/`。第一版没有客户端路由，分享链接只使用根路径查询参数，直接访问和刷新不依赖重写规则。

部署验收应检查 Pages 的构建日志、实际生成的线上地址、页面资源和分享链接；仓库存在或本地构建成功本身不证明线上已部署。最新线上验收见 [验收记录-2026.10.29.md](验收记录-2026.10.29.md)；本地开发阶段的记录保留在 `验收记录-2026.10.28.md`。

## 验证范围

单元测试覆盖 PST / PDT 时差、2026.3.8 与 2026.11.1 的切换、缺失及重复时刻、跨月 / 跨年 / 闰年、固定 PST、第三时区设备、UTC 往返、输入及分享 URL 验证、23 / 24 / 25 小时时间轴、跨日及跨夜会议、默认冬夏工作交集。

构建目标为现代 Chrome / Edge、Firefox 和 Safari；Tailwind 4 的基线是 Safari 16.4+、Chrome 111+、Firefox 128+。实际已验证的浏览器与仍需真机验证的范围以验收记录为准。

## 依据

- [Temporal：时区、缺失时间与重复时间](https://tc39.es/proposal-temporal/docs/timezone.html)
- [Temporal Polyfill](https://github.com/js-temporal/temporal-polyfill)
- [Vite 8 的 Node 支持要求](https://vite.dev/blog/announcing-vite8)
- [Tailwind CSS 的 Vite 集成](https://tailwindcss.com/docs/installation/using-vite)
- [Cloudflare Pages 的 Vite 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
- [Cloudflare Pages 构建环境与 Node 版本文件](https://developers.cloudflare.com/pages/configuration/build-image/)
