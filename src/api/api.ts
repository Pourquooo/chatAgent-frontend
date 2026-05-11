import { get, post, patch, del, BASE_URL } from "./http.ts";
import type { ChatMessageVO, MessageType } from "../types";

// 类型定义
export interface ChatOptions {
  temperature?: number;
  topP?: number;
  messageLength?: number;
}

export type ModelType = "deepseek-chat" | "glm-4.6";

export interface CreateAgentRequest {
  name: string;
  description?: string;
  systemPrompt?: string;
  model: ModelType;
  allowedTools?: string[];
  allowedKbs?: string[];
  allowedSkills?: string[];
  allowedMcps?: string[];
  chatOptions?: ChatOptions;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  systemPrompt?: string;
  model?: ModelType;
  allowedTools?: string[];
  allowedKbs?: string[];
  allowedSkills?: string[];
  allowedMcps?: string[];
  chatOptions?: ChatOptions;
}

export interface CreateAgentResponse {
  agentId: string;
}

export interface AgentVO {
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  model: ModelType;
  allowedTools?: string[];
  allowedKbs?: string[];
  allowedSkills?: string[];
  allowedMcps?: string[];
  chatOptions?: ChatOptions;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetAgentsResponse {
  agents: AgentVO[];
}

/**
 * 获取所有 agents
 */
export async function getAgents(): Promise<GetAgentsResponse> {
  return get<GetAgentsResponse>("/agents");
}

/**
 * 创建 agent
 */
export async function createAgent(
  request: CreateAgentRequest,
): Promise<CreateAgentResponse> {
  return post<CreateAgentResponse>("/agents", request);
}

/**
 * 删除 agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  return del<void>(`/agents/${agentId}`);
}

/**
 * 更新 agent
 */
export async function updateAgent(
  agentId: string,
  request: UpdateAgentRequest,
): Promise<void> {
  return patch<void>(`/agents/${agentId}`, request);
}

/**
 * 创建聊天会话
 */
export interface CreateChatSessionRequest {
  agentId: string;
  title?: string;
}

export interface CreateChatSessionResponse {
  chatSessionId: string;
}

export async function createChatSession(
  request: CreateChatSessionRequest,
): Promise<CreateChatSessionResponse> {
  return post<CreateChatSessionResponse>("/chat-sessions", request);
}

/**
 * 聊天会话相关类型和接口
 */
export interface ChatSessionVO {
  id: string;
  agentId: string;
  title?: string;
}

export interface GetChatSessionsResponse {
  chatSessions: ChatSessionVO[];
}

export interface GetChatSessionResponse {
  chatSession: ChatSessionVO;
}

export interface UpdateChatSessionRequest {
  title?: string;
}

/**
 * 获取所有聊天会话
 */
export async function getChatSessions(): Promise<GetChatSessionsResponse> {
  return get<GetChatSessionsResponse>("/chat-sessions");
}

/**
 * 获取单个聊天会话
 */
export async function getChatSession(
  chatSessionId: string,
): Promise<GetChatSessionResponse> {
  return get<GetChatSessionResponse>(`/chat-sessions/${chatSessionId}`);
}

/**
 * 根据 agentId 获取聊天会话
 */
export async function getChatSessionsByAgentId(
  agentId: string,
): Promise<GetChatSessionsResponse> {
  return get<GetChatSessionsResponse>(`/chat-sessions/agent/${agentId}`);
}

/**
 * 更新聊天会话
 */
export async function updateChatSession(
  chatSessionId: string,
  request: UpdateChatSessionRequest,
): Promise<void> {
  return patch<void>(`/chat-sessions/${chatSessionId}`, request);
}

/**
 * 删除聊天会话
 */
export async function deleteChatSession(chatSessionId: string): Promise<void> {
  return del<void>(`/chat-sessions/${chatSessionId}`);
}

/**
 * 聊天消息相关类型和接口
 */
export interface MetaData {
  [key: string]: unknown;
}

export interface GetChatMessagesResponse {
  chatMessages: ChatMessageVO[];
}

export interface CreateChatMessageRequest {
  agentId: string;
  sessionId: string;
  role: MessageType;
  content: string;
  metadata?: MetaData;
}

export interface CreateChatMessageResponse {
  chatMessageId: string;
}

export interface UpdateChatMessageRequest {
  content?: string;
  metadata?: MetaData;
}

/**
 * 根据 sessionId 获取聊天消息
 */
export async function getChatMessagesBySessionId(
  sessionId: string,
): Promise<GetChatMessagesResponse> {
  return get<GetChatMessagesResponse>(`/chat-messages/session/${sessionId}`);
}

/**
 * 创建聊天消息
 */
export async function createChatMessage(
  request: CreateChatMessageRequest,
): Promise<CreateChatMessageResponse> {
  return post<CreateChatMessageResponse>("/chat-messages", request);
}

/**
 * 更新聊天消息
 */
export async function updateChatMessage(
  chatMessageId: string,
  request: UpdateChatMessageRequest,
): Promise<void> {
  return patch<void>(`/chat-messages/${chatMessageId}`, request);
}

/**
 * 删除聊天消息
 */
export async function deleteChatMessage(chatMessageId: string): Promise<void> {
  return del<void>(`/chat-messages/${chatMessageId}`);
}

/**
 * 知识库相关类型和接口
 */
export interface KnowledgeBaseVO {
  id: string;
  name: string;
  description?: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
}

export interface GetKnowledgeBasesResponse {
  knowledgeBases: KnowledgeBaseVO[];
}

export interface CreateKnowledgeBaseResponse {
  knowledgeBaseId: string;
}

/**
 * 获取所有知识库
 */
export async function getKnowledgeBases(): Promise<GetKnowledgeBasesResponse> {
  return get<GetKnowledgeBasesResponse>("/knowledge-bases");
}

/**
 * 创建知识库
 */
export async function createKnowledgeBase(
  request: CreateKnowledgeBaseRequest,
): Promise<CreateKnowledgeBaseResponse> {
  return post<CreateKnowledgeBaseResponse>("/knowledge-bases", request);
}

/**
 * 删除知识库
 */
export async function deleteKnowledgeBase(
  knowledgeBaseId: string,
): Promise<void> {
  return del<void>(`/knowledge-bases/${knowledgeBaseId}`);
}

/**
 * 更新知识库
 */
export async function updateKnowledgeBase(
  knowledgeBaseId: string,
  request: UpdateKnowledgeBaseRequest,
): Promise<void> {
  return patch<void>(`/knowledge-bases/${knowledgeBaseId}`, request);
}

/**
 * 文档相关类型和接口
 */
export interface DocumentVO {
  id: string;
  kbId: string;
  filename: string;
  filetype: string;
  size: number;
}

export interface GetDocumentsResponse {
  documents: DocumentVO[];
}

export interface CreateDocumentResponse {
  documentId: string;
}

/**
 * 根据知识库 ID 获取文档列表
 */
export async function getDocumentsByKbId(
  kbId: string,
): Promise<GetDocumentsResponse> {
  return get<GetDocumentsResponse>(`/documents/kb/${kbId}`);
}

/**
 * 上传文档
 */
export async function uploadDocument(
  kbId: string,
  file: File,
): Promise<CreateDocumentResponse> {
  const formData = new FormData();
  formData.append("kbId", kbId);
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const apiResponse = await response.json();
  if (apiResponse.code !== 200) {
    throw new Error(apiResponse.message || "上传失败");
  }

  return apiResponse.data;
}

/**
 * 删除文档
 */
export async function deleteDocument(documentId: string): Promise<void> {
  return del<void>(`/documents/${documentId}`);
}

/**
 * 工具相关类型和接口
 */
export type ToolType = "FIXED" | "OPTIONAL";

export interface ToolVO {
  name: string;
  description: string;
  type: ToolType;
}

export interface GetOptionalToolsResponse {
  tools: ToolVO[];
}

/**
 * 获取可选工具列表
 */
export async function getOptionalTools(): Promise<GetOptionalToolsResponse> {
  const tools = await get<ToolVO[]>("/tools");
  return { tools };
}

/**
 * Skill 相关类型和接口
 */
export interface SkillMetadata {
  id: string;
  name?: string;
  description?: string;
  version?: string;
  triggers?: string[];
  systemPromptFragment?: string;
  tools?: string[];
}

/**
 * 获取全部 Skill 元数据
 */
export async function getSkills(): Promise<SkillMetadata[]> {
  return get<SkillMetadata[]>("/skills");
}

/**
 * MCP 服务器相关类型和接口
 */
export type McpTransport = "SSE" | "STREAMABLE_HTTP";
export type McpAuthType = "NONE" | "HEADER" | "OAUTH2";

export interface McpAuthConfig {
  /** HEADER 模式: 请求头键值对; 回显时 value 被脱敏为 ****** */
  headers?: Record<string, string>;
  /** OAUTH2 模式: Client Credentials 授权 */
  tokenUrl?: string;
  clientId?: string;
  /** 回显时脱敏为 ******; 提交时若值为 ****** 表示保留旧值 */
  clientSecret?: string;
  scope?: string;
  audience?: string;
}

export interface McpServerVO {
  id: string;
  name: string;
  description?: string;
  transport: McpTransport;
  endpoint: string;
  authType: McpAuthType;
  authConfig?: McpAuthConfig;
  enabled: boolean;
}

export interface CreateMcpServerRequest {
  name: string;
  description?: string;
  transport: McpTransport;
  endpoint: string;
  authType: McpAuthType;
  authConfig?: McpAuthConfig;
  enabled?: boolean;
}

export interface UpdateMcpServerRequest {
  name?: string;
  description?: string;
  transport?: McpTransport;
  endpoint?: string;
  authType?: McpAuthType;
  authConfig?: McpAuthConfig;
  enabled?: boolean;
}

export interface GetMcpServersResponse {
  mcpServers: McpServerVO[];
}

export interface CreateMcpServerResponse {
  mcpServerId: string;
}

export interface McpToolPreviewVO {
  name: string;
  description?: string;
  /** JSON Schema 序列化后的字符串, 可能为 null */
  inputSchema?: string;
}

export async function getMcpServers(): Promise<GetMcpServersResponse> {
  return get<GetMcpServersResponse>("/mcp-servers");
}

export async function createMcpServer(
  request: CreateMcpServerRequest,
): Promise<CreateMcpServerResponse> {
  return post<CreateMcpServerResponse>("/mcp-servers", request);
}

export async function deleteMcpServer(mcpServerId: string): Promise<void> {
  return del<void>(`/mcp-servers/${mcpServerId}`);
}

export async function updateMcpServer(
  mcpServerId: string,
  request: UpdateMcpServerRequest,
): Promise<void> {
  return patch<void>(`/mcp-servers/${mcpServerId}`, request);
}

export async function previewMcpTools(
  mcpServerId: string,
): Promise<McpToolPreviewVO[]> {
  return get<McpToolPreviewVO[]>(`/mcp-servers/${mcpServerId}/tools`);
}

export async function pingMcpServer(
  mcpServerId: string,
): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>(`/mcp-servers/${mcpServerId}/ping`);
}

/**
 * Agent 执行 Trace（可观测性）相关类型和接口
 */
export type TraceStatus = "RUNNING" | "FINISHED" | "SUCCESS" | "ERROR";
export type TracePhase = "THINK" | "EXECUTE";

export interface AgentTrace {
  id: string;
  sessionId: string;
  agentId: string;
  userMessage?: string;
  status: TraceStatus;
  totalSteps?: number;
  totalLatencyMs?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentStepTrace {
  id: string;
  traceId: string;
  stepIndex: number;
  phase: TracePhase;
  modelName?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  status: TraceStatus;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

export interface ToolCallTrace {
  id: string;
  traceId: string;
  stepId: string;
  toolName: string;
  arguments?: string;
  result?: string;
  latencyMs?: number;
  status: TraceStatus;
  errorMessage?: string;
  /** LOCAL / MCP:<serverId>; 旧数据可能为空, 前端按 LOCAL 显示 */
  source?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

export interface GetTraceDetailResponse {
  trace: AgentTrace;
  steps: AgentStepTrace[];
  toolCalls: ToolCallTrace[];
}

/**
 * 按会话列出所有 trace（最新在前）
 */
export async function getTracesBySessionId(
  sessionId: string,
): Promise<AgentTrace[]> {
  return get<AgentTrace[]>(`/traces/session/${sessionId}`);
}

/**
 * 获取单条 trace 的完整链路
 */
export async function getTraceDetail(
  traceId: string,
): Promise<GetTraceDetailResponse> {
  return get<GetTraceDetailResponse>(`/traces/${traceId}`);
}
