import React, { useCallback, useEffect, useState } from "react";
import {
  Drawer,
  Spin,
  Empty,
  Tag,
  Button,
  Descriptions,
  Timeline,
  Collapse,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ToolOutlined,
  ApiOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import {
  getTracesBySessionId,
  getTraceDetail,
  type AgentTrace,
  type AgentStepTrace,
  type ToolCallTrace,
  type GetTraceDetailResponse,
  type TraceStatus,
} from "../../../api/api";

interface TraceDrawerProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

// ========== helpers ==========
const formatDuration = (ms?: number): string => {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const formatTime = (iso?: string): string => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
};

const statusTag = (status?: TraceStatus) => {
  switch (status) {
    case "FINISHED":
    case "SUCCESS":
      return <Tag color="success" icon={<CheckCircleOutlined />}>{status}</Tag>;
    case "ERROR":
      return <Tag color="error" icon={<CloseCircleOutlined />}>ERROR</Tag>;
    case "RUNNING":
      return <Tag color="processing" icon={<SyncOutlined spin />}>RUNNING</Tag>;
    default:
      return <Tag>{status ?? "-"}</Tag>;
  }
};

/**
 * 工具来源标签. source 格式:
 *   - "LOCAL" / 空 / null  -> 本地 Spring Bean
 *   - "MCP:<uuid>"         -> MCP 远端, 取前 8 位显示
 */
const sourceTag = (source?: string) => {
  if (!source || source === "LOCAL") {
    return (
      <Tag color="default" icon={<DesktopOutlined />} className="!m-0">
        本地
      </Tag>
    );
  }
  if (source.startsWith("MCP:")) {
    const serverId = source.substring(4);
    const short = serverId.replace(/-/g, "").substring(0, 8);
    return (
      <Tag
        color="geekblue"
        icon={<ApiOutlined />}
        title={`MCP Server: ${serverId}`}
        className="!m-0"
      >
        MCP · {short}
      </Tag>
    );
  }
  return <Tag className="!m-0">{source}</Tag>;
};

// ========== 列表项 ==========
const TraceListItem: React.FC<{
  trace: AgentTrace;
  onClick: () => void;
}> = ({ trace, onClick }) => (
  <div
    className="p-3 mb-2 border border-gray-200 rounded-md cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-1">
      {statusTag(trace.status)}
      <span className="text-xs text-gray-400">{formatTime(trace.startedAt)}</span>
    </div>
    <div className="text-sm text-gray-700 line-clamp-2 mb-1">
      {trace.userMessage || <span className="text-gray-400">(无用户消息)</span>}
    </div>
    <div className="text-xs text-gray-500 flex gap-3">
      <span>步数: {trace.totalSteps ?? 0}</span>
      <span>耗时: {formatDuration(trace.totalLatencyMs)}</span>
      <span>
        tokens: {(trace.totalPromptTokens ?? 0) + (trace.totalCompletionTokens ?? 0)}
      </span>
    </div>
  </div>
);

// ========== 主组件 ==========
const TraceDrawer: React.FC<TraceDrawerProps> = ({ open, onClose, sessionId }) => {
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [detail, setDetail] = useState<GetTraceDetailResponse | null>(null);

  const loadList = useCallback(async () => {
    if (!sessionId) return;
    setListLoading(true);
    try {
      const list = await getTracesBySessionId(sessionId);
      setTraces(list ?? []);
    } finally {
      setListLoading(false);
    }
  }, [sessionId]);

  const openDetail = useCallback(async (traceId: string) => {
    setDetailLoading(true);
    try {
      const d = await getTraceDetail(traceId);
      setDetail(d);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setDetail(null);
      loadList();
    }
  }, [open, loadList]);

  const title = detail ? (
    <div className="flex items-center gap-2">
      <Button
        type="text"
        size="small"
        icon={<ArrowLeftOutlined />}
        onClick={() => setDetail(null)}
      />
      <span>执行详情</span>
    </div>
  ) : (
    <div className="flex items-center justify-between w-full">
      <span>执行历史</span>
      <Button
        type="text"
        size="small"
        icon={<ReloadOutlined />}
        loading={listLoading}
        onClick={loadList}
      />
    </div>
  );

  return (
    <Drawer title={title} placement="right" size="large" open={open} onClose={onClose}>
      {/* DETAIL_VIEW_PLACEHOLDER */}
      {!detail && (
        <Spin spinning={listLoading}>
          {traces.length === 0 && !listLoading ? (
            <Empty description="暂无执行记录" />
          ) : (
            traces.map((t) => (
              <TraceListItem key={t.id} trace={t} onClick={() => openDetail(t.id)} />
            ))
          )}
        </Spin>
      )}
      {detail && (
        <Spin spinning={detailLoading}>
          <TraceDetailView detail={detail} />
        </Spin>
      )}
    </Drawer>
  );
};

export default TraceDrawer;

// ========== 详情视图 ==========
const phaseLabel = (phase: string): string => {
  if (phase === "THINK") return "思考";
  if (phase === "EXECUTE") return "执行";
  return phase;
};

const phaseColor = (phase: string, status?: TraceStatus): string => {
  if (status === "ERROR") return "red";
  if (status === "RUNNING") return "blue";
  return phase === "THINK" ? "purple" : "green";
};

const prettifyJson = (s?: string): string => {
  if (!s) return "";
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
};

/**
 * 在 step 级别的 "工具调用(N)" 标题旁, 总结本次 step 里工具的来源分布,
 * 方便一眼看出这一步里 MCP 工具参与了几次.
 */
const summarizeSources = (calls: ToolCallTrace[]) => {
  let local = 0;
  const mcpServers = new Set<string>();
  for (const c of calls) {
    if (!c.source || c.source === "LOCAL") {
      local++;
    } else if (c.source.startsWith("MCP:")) {
      mcpServers.add(c.source.substring(4));
    }
  }
  const tags: React.ReactNode[] = [];
  if (local > 0) {
    tags.push(
      <Tag key="local" color="default" className="!m-0 !text-xs">
        本地 {local}
      </Tag>,
    );
  }
  if (mcpServers.size > 0) {
    tags.push(
      <Tag key="mcp" color="geekblue" className="!m-0 !text-xs">
        MCP · {mcpServers.size} 服务器
      </Tag>,
    );
  }
  return <>{tags}</>;
};

const ToolCallItem: React.FC<{ toolCall: ToolCallTrace }> = ({ toolCall }) => (
  <div className="mb-2 last:mb-0">
    <div className="flex items-center gap-2 mb-1 text-xs flex-wrap">
      <ToolOutlined className="text-blue-500" />
      <span className="font-mono text-blue-600">{toolCall.toolName}</span>
      {sourceTag(toolCall.source)}
      {statusTag(toolCall.status)}
    </div>
    {toolCall.arguments && (
      <div className="mb-1">
        <div className="text-xs text-gray-500 mb-0.5">参数</div>
        <pre className="text-xs bg-gray-50 rounded p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto border border-gray-100">
          {prettifyJson(toolCall.arguments)}
        </pre>
      </div>
    )}
    {toolCall.result && (
      <div>
        <div className="text-xs text-gray-500 mb-0.5">返回</div>
        <pre className="text-xs bg-gray-50 rounded p-2 whitespace-pre-wrap break-words max-h-60 overflow-auto border border-gray-100">
          {toolCall.result}
        </pre>
      </div>
    )}
    {toolCall.errorMessage && (
      <Typography.Text type="danger" className="text-xs block mt-1">
        {toolCall.errorMessage}
      </Typography.Text>
    )}
  </div>
);

const TraceDetailView: React.FC<{ detail: GetTraceDetailResponse }> = ({ detail }) => {
  const { trace, steps, toolCalls } = detail;
  const toolCallsByStep = new Map<string, ToolCallTrace[]>();
  for (const tc of toolCalls) {
    const arr = toolCallsByStep.get(tc.stepId) ?? [];
    arr.push(tc);
    toolCallsByStep.set(tc.stepId, arr);
  }

  return (
    <div>
      <Descriptions size="small" column={2} bordered className="mb-4">
        <Descriptions.Item label="状态" span={2}>{statusTag(trace.status)}</Descriptions.Item>
        <Descriptions.Item label="用户消息" span={2}>
          <span className="text-sm text-gray-700">{trace.userMessage || "-"}</span>
        </Descriptions.Item>
        <Descriptions.Item label="总步数">{trace.totalSteps ?? 0}</Descriptions.Item>
        <Descriptions.Item label="总耗时">{formatDuration(trace.totalLatencyMs)}</Descriptions.Item>
        <Descriptions.Item label="prompt tokens">{trace.totalPromptTokens ?? 0}</Descriptions.Item>
        <Descriptions.Item label="completion tokens">{trace.totalCompletionTokens ?? 0}</Descriptions.Item>
        <Descriptions.Item label="开始时间" span={2}>{formatTime(trace.startedAt)}</Descriptions.Item>
        <Descriptions.Item label="结束时间" span={2}>{formatTime(trace.finishedAt)}</Descriptions.Item>
        {trace.errorMessage && (
          <Descriptions.Item label="错误信息" span={2}>
            <Typography.Text type="danger">{trace.errorMessage}</Typography.Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Timeline
        items={steps.map((step: AgentStepTrace) => {
          const relatedCalls = toolCallsByStep.get(step.id) ?? [];
          const tokensSum = (step.promptTokens ?? 0) + (step.completionTokens ?? 0);
          return {
            color: phaseColor(step.phase, step.status),
            children: (
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium">#{step.stepIndex} {phaseLabel(step.phase)}</span>
                  {statusTag(step.status)}
                  {step.modelName && (
                    <span className="text-xs text-gray-500 font-mono">{step.modelName}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex gap-3 flex-wrap mb-2">
                  <span>耗时: {formatDuration(step.latencyMs)}</span>
                  {tokensSum > 0 && (
                    <span>
                      tokens: {step.promptTokens ?? 0} / {step.completionTokens ?? 0}
                    </span>
                  )}
                </div>
                {step.errorMessage && (
                  <Typography.Text type="danger" className="text-xs block mb-2">
                    {step.errorMessage}
                  </Typography.Text>
                )}
                {relatedCalls.length > 0 && (
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: "tools",
                        label: (
                          <span className="flex items-center gap-2 flex-wrap">
                            <span>工具调用 ({relatedCalls.length})</span>
                            {summarizeSources(relatedCalls)}
                          </span>
                        ),
                        children: relatedCalls.map((tc) => (
                          <ToolCallItem key={tc.id} toolCall={tc} />
                        )),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          };
        })}
      />
    </div>
  );
};
