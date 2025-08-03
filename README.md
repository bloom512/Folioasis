# 栖叶(Folioasis) - 家庭养花软件

简洁优雅的家庭植物管理工具，帮助您记录和管理家中植物的生长状况。

## 功能特点

- **展示页面**：查看植物照片、名称、浇花频率，进行浇花打卡
- **管理后台**：上传植物信息、编辑植物详情、查看浇水记录
- **数据记录**：自动记录每次浇花时间和总浇花次数
- **响应式设计**：适配桌面和移动设备
- **日式极简风格**：简洁、优雅的用户界面

## 技术栈

- **前端**：React + Vite + Tailwind CSS
- **后端**：Supabase
- **动效**：Framer Motion
- **图标**：Font Awesome

## 环境要求

- Node.js 16+ 
- npm 8+ 
- Supabase账号

## 安装和运行

1. 克隆仓库
```bash
git clone https://github.com/yourusername/folioasis.git
cd folioasis
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建`.env`文件，填入Supabase配置：
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. 初始化数据库
在Supabase控制台执行`init-db.sql`文件中的SQL语句。

5. 运行开发服务器
```bash
npm run dev
```

## 项目结构

```
folioasis/
├── src/
│   ├── components/       # 组件
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── pages/            # 页面
│   │   ├── Home.jsx
│   │   ├── PlantDetail.jsx
│   │   ├── Login.jsx
│   │   ├── Admin.jsx
│   │   ├── AddPlant.jsx
│   │   ├── EditPlant.jsx
│   │   └── WateringRecord.jsx
│   ├── supabaseClient.js # Supabase客户端配置
│   ├── main.jsx          # 入口文件
│   └── App.jsx           # 应用组件
├── .env                  # 环境变量
├── init-db.sql           # 数据库初始化脚本
├── package.json
└── README.md
```

## 部署

1. 构建项目
```bash
npm run build
```

2. 部署到Vercel
- 登录Vercel账号
- 导入项目
- 配置环境变量
- 部署

## 设计理念

采用日式极简风格，强调：
- 留白空间
- 简洁线条
- 自然色彩（灰白色背景+绿色点缀）
- 层次感和对比
- 优雅的动效

## 鸣谢

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Font Awesome](https://fontawesome.com/)