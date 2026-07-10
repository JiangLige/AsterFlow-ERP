# AsterFlow ERP 前端认证会话闭环设计

## 状态

设计已由用户确认，等待规格复核后进入实施计划阶段。

## 背景

后端已经提供登录、刷新令牌和注销接口，并通过本地或 Redis 会话存储维护会话状态。前端目前只保存 access token，未保存 refresh token；统一请求层遇到 `UNAUTHORIZED` 时直接清理登录状态；退出按钮也只清理浏览器存储，没有调用后端注销接口。

此外，登录页预填密码与项目文档及数据库种子不一致。用户已明确要求两个演示账号统一使用密码 `123456`：

- 管理员：`admin / 123456`
- 普通员工：`staff / 123456`

## 目标

1. 登录后完整保存 access token、refresh token 和用户信息。
2. 业务请求收到 `UNAUTHORIZED` 时自动刷新一次，并使用新 access token 重试原请求一次。
3. 多个并发请求同时失效时只发送一个刷新请求。
4. 刷新失败后清理认证数据并跳转登录页，不出现无限重试。
5. 退出登录时调用后端注销接口撤销服务端会话，并始终清理本地认证数据。
6. 管理员和普通员工的默认密码统一为 `123456`，数据库、测试、页面和文档保持一致。
7. 引入轻量前端自动化测试，覆盖认证存储、刷新和注销行为。

## 非目标

- 不把令牌迁移到 HttpOnly Cookie。
- 不替换现有 JWT、会话存储或后端认证架构。
- 不引入完整 Spring Security 过滤器链。
- 不修改 access token 和 refresh token 的有效期。
- 不把前端测试扩展为全站浏览器端到端测试。
- 不修改管理员和普通员工的角色权限。

## 方案选择

采用集中式认证闭环方案：

- `client/src/lib/auth.ts` 负责浏览器认证数据的读写和清理。
- `client/src/lib/api.ts` 负责认证请求、刷新协调、单次重试和注销网络调用。
- 页面组件只调用上述公共能力，不自行实现令牌刷新。

未采用的方案：

- 页面内分别处理刷新：改动较少，但会重复逻辑，并在并发请求下产生多个刷新请求。
- HttpOnly Cookie/BFF 重构：安全边界更强，但需要重写认证协议，超出本轮范围。

## 前端认证数据

浏览器存储继续使用现有 localStorage 方案，并统一维护以下键：

- `token`：兼容现有页面的 access token 键。
- `accessToken`：明确保存当前 access token。
- `refreshToken`：保存当前 refresh token。
- `username`、`realName`、`role`：当前用户展示信息。

`saveAuth` 接受 `token` 或 `accessToken`，最终同时更新 `token` 与 `accessToken`，避免旧调用路径失效。刷新响应如果返回新的 refresh token，则覆盖旧值；如果只返回新的 access token，则保留当前 refresh token。

`clearAuthStorage` 必须同时删除两个 access token 键、refresh token 和用户信息。

## 登录流程

1. 登录页向 `/api/login` 提交用户名和密码。
2. Next.js API 代理转发到后端 `/api/auth/login`。
3. 登录成功后保存 `accessToken`、`refreshToken`、用户名、姓名和角色。
4. 跳转到 Dashboard。

登录页默认值调整为：

- 用户名：`admin`
- 密码：`123456`

数据库初始化脚本中 `admin` 和 `staff` 的 BCrypt 密码哈希都必须对应明文 `123456`。仓库中不得保存真实生产密码；该密码只用于本地演示种子账号。

## 自动刷新流程

`apiRequest` 继续作为业务页面唯一的认证请求入口。

请求流程：

1. 使用当前 access token 发送业务请求。
2. 成功时按现有 `ApiResponse` 结构返回 `data`。
3. 非认证错误继续抛出后端返回的业务消息。
4. 收到 `UNAUTHORIZED` 时检查 refresh token。
5. 没有 refresh token 时直接进入认证失败处理。
6. 有 refresh token 时调用 `/api/auth/refresh`。
7. 刷新成功后保存新令牌，并使用新 access token 重试原请求一次。
8. 重试仍返回 `UNAUTHORIZED` 时不再刷新，直接进入认证失败处理。

刷新接口调用不能复用会再次触发刷新的公开 `apiRequest` 路径，应使用内部、不可递归的请求逻辑。

模块内维护一个共享的 refresh Promise。多个业务请求同时收到 `UNAUTHORIZED` 时复用该 Promise；刷新完成或失败后清空引用，使后续会话仍可再次刷新。

## 认证失败处理

认证失败包括：

- 没有 refresh token。
- 刷新接口返回失败。
- 刷新响应缺少有效 access token。
- 刷新后的原请求仍返回 `UNAUTHORIZED`。
- 刷新请求网络异常或返回无法解析的响应。

处理规则：

1. 清理全部本地认证数据。
2. 浏览器当前不在 `/login` 时跳转 `/login`。
3. 向调用页面抛出明确错误，避免请求静默失败。
4. 禁止无限刷新或无限重试。

现有“非 JSON 响应预览”错误处理需要保留。

## 注销流程

前端新增统一的 `logoutSession` 网络能力：

1. 读取当前 access token 和 refresh token。
2. 向 `/api/auth/logout` 发送 `POST`。
3. 请求头携带 `Authorization: Bearer <accessToken>`。
4. 请求体携带 `{ "refreshToken": "..." }`。
5. 无论后端响应成功、失败或网络异常，都在 `finally` 中清理本地认证数据。
6. Layout 等待清理完成后跳转 `/login`。

退出按钮在请求进行时应禁用，防止重复提交。注销失败不阻止用户离开当前页面，但后端日志仍可记录失败原因。

## 默认账号同步

以下位置必须统一为密码 `123456`：

- `server/src/main/resources/db/init.sql` 的 admin、staff BCrypt 哈希。
- `server/src/test/resources/data.sql` 或测试创建用户的密码数据。
- 后端认证和安全集成测试中的登录密码。
- `client/src/pages/login.tsx` 的默认密码。
- `README.md`、项目路线图及相关演示文档中的账号说明。

不得把数据库密码、JWT Secret 或 OpenAI API Key 与演示账号密码混为一项配置。

## 测试设计

新增 Vitest 作为前端开发依赖，使用 Node 测试环境和可控的 localStorage/fetch 替身，不新增生产运行依赖。

重点测试：

1. `saveAuth` 同时保存 access token、refresh token 和用户信息。
2. `clearAuthStorage` 删除全部认证键。
3. 普通业务请求成功时不调用刷新接口。
4. 首次请求 `UNAUTHORIZED`、刷新成功后，原请求使用新 token 重试并成功。
5. 两个并发 `UNAUTHORIZED` 请求只发送一次刷新请求。
6. 缺少 refresh token 时清理状态并跳转登录页。
7. 刷新失败或重试仍未授权时只清理一次，不无限重试。
8. 注销请求同时携带 access token 和 refresh token。
9. 注销接口失败时仍清理本地认证数据。
10. 后端默认 admin、staff 账号都能使用 `123456` 登录。

CI 在前端生产构建前运行前端测试。后端现有认证、API 安全和完整测试必须继续通过。

## 预计修改范围

前端：

- `client/src/lib/auth.ts`
- `client/src/lib/api.ts`
- `client/src/components/Layout.tsx`
- `client/src/pages/login.tsx`
- `client/package.json`
- 前端认证测试文件

后端与数据：

- `server/src/main/resources/db/init.sql`
- `server/src/test/resources/data.sql`，如默认测试账号由该文件提供
- 认证和 API 安全集成测试

工程与文档：

- 根目录或 client 的 npm 测试脚本与 lockfile
- `.github/workflows/ci.yml`
- `README.md`
- `docs/PROJECT_ROADMAP.md`
- `docs/TESTING_GUIDE.md`

## 验收标准

- admin 和 staff 均可使用密码 `123456` 登录。
- 登录成功后浏览器保存 access token 和 refresh token。
- access token 失效后，业务请求自动刷新并成功重试一次。
- 并发失效请求共享一次刷新操作。
- 刷新失败后清理状态并跳转登录页。
- 退出登录会调用后端注销接口并清理本地状态。
- 前端认证测试全部通过。
- 前端生产构建通过。
- 后端 `clean verify` 通过。
- CI 同时验证前端测试、前端构建和后端测试。
- 文档、登录页和种子数据中的默认账号一致。

## 风险与控制

- localStorage 中的令牌仍受 XSS 风险影响。本轮保持现有架构，后续生产化阶段可迁移 HttpOnly Cookie。
- 多请求刷新可能产生竞态，通过共享 refresh Promise 控制。
- 自动重试可能重复写操作，只在后端明确返回 `UNAUTHORIZED` 且刷新成功后重试一次；危险写操作仍依赖现有幂等 Key 和业务状态校验。
- 演示账号密码较弱，只能用于本地演示数据，生产环境必须创建独立强密码账号。
- SQL 哈希必须通过 BCrypt 工具生成并由登录集成测试验证，禁止手写或猜测哈希。

## 完成定义

本设计在以下条件全部满足时完成：

- 所有验收标准均有代码或自动化测试证据。
- 没有真实密钥进入 Git。
- 认证失败不存在无限刷新或重试。
- 前后端默认账号、密码和文档保持一致。
- 工作区只包含本轮有意修改的文件。
