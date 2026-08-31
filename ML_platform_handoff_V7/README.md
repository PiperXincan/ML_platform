# ML Studio V8.9.2 交接包

本目录包含可独立运行的最新版前端、最新需求文档、最新开发文档和项目交接说明。

## 阅读顺序

1. `PROJECT_HANDOFF.md`
2. `frontend-change-requirements-v7.md`
3. `机器学习训练平台前端开发文档.md`
4. `index.html`、`app.js` 与 `app.css`

发生冲突时，以用户最新要求和 `frontend-change-requirements-v7.md` 为准。

## 运行方式

在本目录启动静态服务器：

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:4173/`。

## 文件范围

- `index.html`：最新版页面入口，只加载一个脚本和一个样式文件。
- `app.js`：当前完整 JavaScript，按原 V3–V8 加载顺序合并，内部保留来源分段注释；以后直接在此文件修改脚本。
- `app.css`：当前完整样式，按原 V3–V8 层叠顺序合并，内部保留来源分段注释；以后直接在此文件修改样式。
- `PROJECT_HANDOFF.md`：项目目标、完成情况、关键决策、禁改项和已知缺口。
- `frontend-change-requirements-v7.md`：最新修改需求。
- `机器学习训练平台前端开发文档.md`：最新完整开发文档 V8.9.2。

旧的 `v3.js`–`v8.js`、`v3.css`–`v8.css` 和 `v3-overrides.css` 已合并到 `app.js` 与 `app.css`，不再作为独立入口文件保留；需要追溯时使用 Git 历史。

## 版本信息

- 来源仓库：`https://github.com/PiperXincan/ML_platform`
- 来源分支：`main`
- 整合前回退提交：`77d8730 fix: refine threshold feedback and library filters`
- 交接包创建日期：`2026-08-27`
