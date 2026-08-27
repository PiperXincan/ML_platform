# ML Studio V7 交接包

本目录包含可独立运行的最新版前端、最新需求文档、最新开发文档和项目交接说明。

## 阅读顺序

1. `PROJECT_HANDOFF.md`
2. `frontend-change-requirements-v7.md`
3. `机器学习训练平台前端开发文档.md`
4. `index.html` 与 V3–V7 源码

发生冲突时，以用户最新要求和 `frontend-change-requirements-v7.md` 为准。

## 运行方式

在本目录启动静态服务器：

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:4173/`。

## 文件范围

- `index.html`：最新版入口。
- `v3.js`–`v7.js`：当前实际加载的 JavaScript。
- `v3.css`、`v3-overrides.css`、`v4.css`–`v7.css`：当前实际加载的样式。
- `PROJECT_HANDOFF.md`：项目目标、完成情况、关键决策、禁改项和已知缺口。
- `frontend-change-requirements-v7.md`：最新修改需求。
- `机器学习训练平台前端开发文档.md`：最新完整开发文档 V7。

旧版未加载的 `app.js`、`v2.js` 和 `styles.css` 未放入本交接包，避免接手者误认为它们是当前入口依赖。

## 版本信息

- 来源仓库：`https://github.com/PiperXincan/ML_platform`
- 来源分支：`main`
- 最新已推送源码提交：`d2ec153 Update frontend to V7 requirements`
- 交接包创建日期：`2026-08-27`

