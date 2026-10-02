# 换到个人电脑继续开发

更新日期：2026-10-02。仓库：[TPtrig/Inspiration_knowlege_base_assistant](https://github.com/TPtrig/Inspiration_knowlege_base_assistant)，继续从 `main` 分支开发。

## 先了解当前状态

- `/` 是产品展示页；`/workspace` 是桌面网页工作区。示例对话、素材、岛屿地图和 Inbox 来自前端种子数据，克隆仓库后仍会显示。
- 真实后端是 `backend/main.py`（FastAPI）。目前支持小宇宙单集链接和音频文件，通过对话框提交；会转写、提炼要点、让用户选择保存，再用所选要点回答问题。
- 播客要点提炼和知识库回答使用 `gpt-4o-mini`，检索使用 `text-embedding-3-small`。小于等于 25 MB 的受支持音频默认由 `whisper-1` 转写；较大文件或 AAC 走飞书妙记，需要本机安装并登录 `lark-cli`。这部分还没有改成独立于本机登录的云端流程。
- 真实问答会显示可点击的引用，引用指向已保存的要点和原播客。当前没有把要点绑定到逐字稿的说话人或时间点。
- 地图关系和 Inbox 仍以示例及简易规则为主；论文、视频和图片的真实解析尚未完成。详见 [PRD](./PRD.md) 和 [TRD](./TRD.md)。

## 在个人电脑启动

需要 Python 3.11 和 Node.js。先克隆仓库：

```bash
git clone https://github.com/TPtrig/Inspiration_knowlege_base_assistant.git
cd Inspiration_knowlege_base_assistant
```

在第一个终端启动后端：

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# 只在个人电脑编辑 backend/.env，把 OPENAI_API_KEY 的占位值换成自己的 key
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

在第二个终端启动前端：

```bash
cd frontend
npm ci
cp .env.example .env.local
# 将 NEXT_PUBLIC_API_BASE_URL 设为 http://127.0.0.1:8000
# 保持 NEXT_PUBLIC_DEMO_MODE=true，可以继续看到示例素材；真实播客仍会走后端
npm run dev
```

打开 `http://127.0.0.1:3000/workspace`。前端若改用其他端口，需在后端环境变量 `FRONTEND_ORIGINS` 中加入该网页地址。`backend/.env` 和 `frontend/.env.local` 均被 Git 忽略。`OPENAI_API_KEY` 只由后端读取；不要写入前端变量、源代码或公开仓库。没有 key 时，真实 AI 请求会显示后端配置错误，示例展示仍可使用。

## 本机数据是否要搬

2026-10-02 检查到这台电脑的 `backend/inspiration.db` 有 **0 个播客任务、0 条已保存知识、2 个空对话**；`backend/chroma_db` 不存在。因此，目前没有真实播客知识库需要搬迁。示例素材已经在 Git 仓库中。新电脑克隆后会创建自己的本地数据库。

如果之后在旧电脑上产生真实数据，迁移时需同时处理 `backend/inspiration.db` 和 `backend/chroma_db/`；它们没有进入 Git。先确认材料可以离开公司设备，再通过合适的私有渠道转移。`backend/tmp_audio/` 是临时文件，不需要迁移。个人电脑也应备份数据库和向量索引；GitHub 只能恢复代码。

## 开发与验证

```bash
cd backend
python -m unittest test_citations.py test_server_key.py

cd ../frontend
npm run lint
npx tsc --noEmit --incremental false
```

下一轮优先完成播客流程：让长音频不依赖公司电脑上的飞书登录，让任务中断后可恢复，再把要点关联到逐字稿证据与时间点。之后按 [TRD](./TRD.md) 补论文摘录、真实地图和持久 Inbox。

当前公开的 Vercel 页面只适合展示示例内容。个人电脑上的真实后端在关机时无法供他人使用；若以后要对外开放真实功能，还需部署后端、持久数据、登录和用量限制。
