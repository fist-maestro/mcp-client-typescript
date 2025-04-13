# MCP Client TypeScript

这是一个基于TypeScript实现的MCP（Model Context Protocol）客户端，用于与各种LLM服务提供商（如DeepSeek、Anthropic等）进行交互，并支持调用外部工具（如天气查询服务）。

## 工作流程

当用户发送一个查询请求时，系统按以下步骤处理：

1. **工具发现阶段**
   - ChatController接收用户输入
   - ManagerService从MCP服务器获取可用工具列表
   - 将工具列表和用户查询准备发送给LLM服务

2. **查询处理阶段**
   - 用户的查询连同工具描述被发送到选定的LLM服务（DeepSeek或Anthropic）
   - LLM服务分析查询内容，决定是否需要调用工具
   - 如果需要工具调用，LLM会指定使用哪些工具及其参数

3. **工具调用阶段**
   - ManagerService接收LLM的工具调用请求
   - 通过MCP服务器执行相应的工具调用（如天气查询）
   - 收集工具调用的结果

4. **响应生成阶段**
   - 工具调用结果返回给LLM服务
   - LLM服务生成自然语言响应
   - ChatController将响应展示给用户

例如，当用户查询"深圳的天气"时：
1. 系统识别可用的天气查询工具
2. LLM决定使用天气查询工具
3. 系统调用天气API获取深圳天气数据
4. LLM将天气数据转换为自然语言响应
5. 用户收到格式化的天气信息

## 开发环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- TypeScript >= 5.0.0
- Cursor IDE（最新版本）
- Git（最新版本）

## 项目结构

```
├ mcp-client-typescript/
├── src/                     # 源代码目录
│   ├── index.ts            # 应用程序入口文件(程序启动配置、命令行参数处理、服务初始化)
│   ├── controllers/        # 控制器层：处理用户交互（用户输入处理、会话管理、响应展示）
│   │   └── ChatController.ts  # 聊天控制器
│   ├── services/           # 服务层：核心业务逻辑
│   │   ├── ManagerService.ts  # 服务管理器（MCP服务协调、工具调用管理、LLM服务路由）
│   │   ├── ManagerInfa.ts     # 服务管理器接口定义
│   │   └── llm-providers/     # LLM服务提供商实现
│   │       ├── DeepSeekService.ts   # DeepSeek服务
│   │       └── AnthropicService.ts  # Anthropic服务
│   └── common/            # 公共代码
│       ├── config/        # 配置管理
│       │   ├── llm-config/    # LLM服务配置
│       │   │   ├── deepseek.ts    # DeepSeek配置
│       │   │   └── anthropic.ts   # Anthropic配置
│       │   └── mcp-servers-config/ # MCP服务器配置
│       │       └── weather.json    # 天气服务配置
│       ├── types/         # 类型定义
│       │   └── tool.ts    # 工具相关接口和类型
│       └── utils/         # 工具函数
│           ├── logger.ts      # 日志工具
│           └── cityNameMap.ts # 城市名称映射
│   ├── package.json           # 项目配置文件：依赖管理、脚本命令
│   ├── package-lock.json      # 依赖版本锁定文件
│   ├── tsconfig.json         # TypeScript编译配置
│   ├── .gitignore           # Git忽略规则配置
│   └── README.md            # 项目说明文档
```

## 代码分层架构

### 1. 表示层（Presentation Layer）
- **ChatController**
  - 处理用户输入输出
  - 管理交互会话
  - 格式化响应数据
- **职责**：用户交互界面的管理和展示

### 2. 服务层（Service Layer）
- **ManagerService**
  - 服务生命周期管理
  - 服务间通信协调
  - 工具调用管理
- **LLM服务提供商**
  - DeepSeek服务实现
  - Anthropic服务实现
- **职责**：业务逻辑的核心处理

### 3. 工具层（Tool Layer）
- **外部工具服务**
  - 天气查询服务
  - 工具调用接口
- **职责**：提供具体的功能实现

### 4. 基础设施层（Infrastructure Layer）
- **配置管理**
  - LLM服务配置
  - MCP服务器配置
- **工具函数**
  - 日志记录
  - 城市名称映射
- **职责**：提供基础支持服务



## 快速开始

### 安装

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
npm install
```

### 运行

1. **构建项目**
```bash
npm run build
```

2. **启动客户端**

使用DeepSeek（默认）：
```bash
npm start
```

或指定LLM提供商：
```bash
npm start --provider=deepseek  # 使用DeepSeek
npm start --provider=anthropic # 使用Anthropic
```

### 使用示例

```bash
# 启动客户端
npm start --provider=deepseek

# 查询天气
> 查询深圳的天气
[输出天气信息]

# 退出程序
> quit
```

## 配置说明

### LLM服务配置

配置文件位置：`src/common/config/llm-config/`

- `deepseek.ts`: DeepSeek API配置
- `anthropic.ts`: Anthropic API配置

### MCP服务器配置

配置文件位置：`src/common/config/mcp-servers-config/`

- `weather.json`: 天气服务配置

## 开发指南

### 添加新的LLM提供商

1. 在 `src/services/llm-providers/` 下创建新的服务类
2. 实现 `LLMProvider` 接口
3. 在 `ManagerService` 中注册新的提供商

### 添加新的工具

1. 在 `src/common/config/mcp-servers-config/` 下添加工具配置
2. 实现相应的MCP服务器
3. 在工具调用链中注册新工具

## 日志系统

- 日志文件位置：`logs/`
- 日志格式：`[时间戳] [日志级别] [消息]`
- 支持INFO和ERROR两个级别的日志

## 错误处理

系统实现了完整的错误处理机制：
- 网络错误处理
- API调用错误处理
- 工具调用错误处理
- 用户输入错误处理

## 注意事项

1. 确保所有必要的API密钥已正确配置
2. 网络连接问题可能影响服务调用
3. 某些工具调用可能有超时限制

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建Pull Request

## 许可证

[许可证类型]