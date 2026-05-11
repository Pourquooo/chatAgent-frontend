import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Select,
  Switch,
  message,
  Tag,
  Spin,
  Collapse,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { SaveOutlined, ApiOutlined, EyeOutlined } from "@ant-design/icons";
import {
  type CreateMcpServerRequest,
  type UpdateMcpServerRequest,
  type McpServerVO,
  type McpAuthConfig,
  type McpAuthType,
  type McpTransport,
  type McpToolPreviewVO,
  pingMcpServer,
  previewMcpTools,
} from "../../api/api.ts";

interface AddMcpServerModalProps {
  open: boolean;
  onClose: () => void;
  createMcpServerHandle: (request: CreateMcpServerRequest) => Promise<void>;
  updateMcpServerHandle?: (
    mcpServerId: string,
    request: UpdateMcpServerRequest,
  ) => Promise<void>;
  editingMcpServer?: McpServerVO | null;
}

const menuItems = [
  { key: "base", label: "基础设置" },
  { key: "auth", label: "认证配置" },
  { key: "diagnose", label: "连通性 / 工具预览" },
];

const defaultForm: CreateMcpServerRequest = {
  name: "",
  description: "",
  transport: "SSE",
  endpoint: "",
  authType: "NONE",
  authConfig: {},
  enabled: true,
};

const AddMcpServerModal: React.FC<AddMcpServerModalProps> = ({
  open,
  onClose,
  createMcpServerHandle,
  updateMcpServerHandle,
  editingMcpServer,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>("base");
  const [formData, setFormData] = useState<CreateMcpServerRequest>(defaultForm);
  const [saveLoading, setSaveLoading] = useState(false);

  // 诊断状态
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<"ok" | "fail" | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTools, setPreviewTools] = useState<McpToolPreviewVO[]>([]);

  // 编辑模式下的 headers 以 kv 数组维护, 方便动态增删
  const [headerPairs, setHeaderPairs] = useState<{ key: string; value: string }[]>(
    [],
  );

  const isEditMode = !!editingMcpServer;

  useEffect(() => {
    if (!open) return;
    setSelectedKey("base");
    setPingResult(null);
    setPreviewTools([]);
    if (editingMcpServer) {
      setFormData({
        name: editingMcpServer.name,
        description: editingMcpServer.description || "",
        transport: editingMcpServer.transport,
        endpoint: editingMcpServer.endpoint,
        authType: editingMcpServer.authType,
        authConfig: editingMcpServer.authConfig || {},
        enabled: editingMcpServer.enabled,
      });
      const hs = editingMcpServer.authConfig?.headers || {};
      setHeaderPairs(
        Object.entries(hs).map(([k, v]) => ({ key: k, value: v as string })),
      );
    } else {
      setFormData(defaultForm);
      setHeaderPairs([]);
    }
  }, [editingMcpServer, open]);

  // headerPairs -> authConfig.headers 同步
  useEffect(() => {
    if (formData.authType !== "HEADER") return;
    const headers: Record<string, string> = {};
    for (const p of headerPairs) {
      if (p.key.trim()) headers[p.key.trim()] = p.value;
    }
    setFormData((prev) => ({
      ...prev,
      authConfig: { ...(prev.authConfig || {}), headers },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerPairs]);

  const updateAuthConfig = (patch: Partial<McpAuthConfig>) => {
    setFormData((prev) => ({
      ...prev,
      authConfig: { ...(prev.authConfig || {}), ...patch },
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      message.warning("请输入名称");
      return;
    }
    if (!formData.endpoint.trim()) {
      message.warning("请输入 endpoint");
      return;
    }
    setSaveLoading(true);
    try {
      if (isEditMode && editingMcpServer && updateMcpServerHandle) {
        await updateMcpServerHandle(editingMcpServer.id, formData);
        message.success("更新成功");
      } else {
        await createMcpServerHandle(formData);
        message.success("创建成功");
      }
      onClose();
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePing = async () => {
    if (!editingMcpServer) {
      message.info("请先保存后再测试连通");
      return;
    }
    setPingLoading(true);
    setPingResult(null);
    try {
      const r = await pingMcpServer(editingMcpServer.id);
      setPingResult(r.ok ? "ok" : "fail");
    } catch {
      setPingResult("fail");
    } finally {
      setPingLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!editingMcpServer) {
      message.info("请先保存后再预览工具");
      return;
    }
    setPreviewLoading(true);
    setPreviewTools([]);
    try {
      const tools = await previewMcpTools(editingMcpServer.id);
      setPreviewTools(tools || []);
      if ((tools || []).length === 0) {
        message.info("服务器返回了空工具列表");
      }
    } catch {
      // http 层已经 message.error 过
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={isEditMode ? "编辑 MCP 服务器" : "新建 MCP 服务器"}
      footer={null}
      width={820}
      centered
    >
      <div className="flex h-[520px]">
        <div className="w-[150px] h-full border-r border-gray-200 pr-2">
          <div className="flex flex-col gap-0.5 select-none cursor-pointer">
            {menuItems.map((item) => {
              const isSelected = selectedKey === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  className={`px-3 py-2 rounded-lg hover:bg-gray-100 ${
                    isSelected
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600"
                  }`}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 h-full relative">
          <div className="px-4 pb-16 overflow-y-scroll h-full">
            {selectedKey === "base" && (
              <div>
                <div className="mb-3">
                  <label className="block text-gray-700 font-medium mb-1">
                    名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="如: github-mcp / jira-mcp"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 font-medium mb-1">
                    描述
                  </label>
                  <TextArea
                    placeholder="这个 MCP 服务器提供什么能力"
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 font-medium mb-1">
                    传输方式 <span className="text-red-500">*</span>
                  </label>
                  <Select
                    style={{ width: 220 }}
                    options={[
                      { value: "SSE", label: "SSE" },
                      { value: "STREAMABLE_HTTP", label: "Streamable HTTP" },
                    ]}
                    value={formData.transport}
                    onChange={(v: McpTransport) =>
                      setFormData({ ...formData, transport: v })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 font-medium mb-1">
                    Endpoint URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="https://example.com/sse 或 https://example.com/mcp"
                    value={formData.endpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, endpoint: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    必须是完整 URL。SSE 指向 /sse 端点，Streamable HTTP 指向 /mcp 端点。
                  </p>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <label className="text-gray-700 font-medium">启用</label>
                  <Switch
                    checked={formData.enabled}
                    onChange={(v) =>
                      setFormData({ ...formData, enabled: v })
                    }
                  />
                  <span className="text-xs text-gray-400">
                    禁用后 Agent 不会连接此服务器
                  </span>
                </div>
              </div>
            )}

            {selectedKey === "auth" && (
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    认证类型
                  </label>
                  <Select
                    style={{ width: 260 }}
                    options={[
                      { value: "NONE", label: "NONE (无认证)" },
                      { value: "HEADER", label: "HEADER (静态请求头)" },
                      {
                        value: "OAUTH2",
                        label: "OAUTH2 (Client Credentials)",
                      },
                    ]}
                    value={formData.authType}
                    onChange={(v: McpAuthType) =>
                      setFormData({ ...formData, authType: v })
                    }
                  />
                </div>

                {formData.authType === "HEADER" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-gray-700 font-medium">
                        请求头
                      </label>
                      <Button
                        size="small"
                        onClick={() =>
                          setHeaderPairs([
                            ...headerPairs,
                            { key: "", value: "" },
                          ])
                        }
                      >
                        添加一行
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      编辑已有服务器时，值若保留为 <code>******</code> 表示不修改旧值。
                    </p>
                    {headerPairs.length === 0 && (
                      <div className="text-sm text-gray-400">暂无请求头</div>
                    )}
                    <div className="space-y-2">
                      {headerPairs.map((pair, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            placeholder="Key"
                            style={{ width: 200 }}
                            value={pair.key}
                            onChange={(e) => {
                              const next = [...headerPairs];
                              next[idx] = { ...pair, key: e.target.value };
                              setHeaderPairs(next);
                            }}
                          />
                          <Input.Password
                            placeholder="Value"
                            value={pair.value}
                            visibilityToggle
                            onChange={(e) => {
                              const next = [...headerPairs];
                              next[idx] = { ...pair, value: e.target.value };
                              setHeaderPairs(next);
                            }}
                          />
                          <Button
                            danger
                            onClick={() =>
                              setHeaderPairs(
                                headerPairs.filter((_, i) => i !== idx),
                              )
                            }
                          >
                            删除
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.authType === "OAUTH2" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Token URL <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="https://auth.example.com/oauth/token"
                        value={formData.authConfig?.tokenUrl || ""}
                        onChange={(e) =>
                          updateAuthConfig({ tokenUrl: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Client ID <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.authConfig?.clientId || ""}
                        onChange={(e) =>
                          updateAuthConfig({ clientId: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Client Secret <span className="text-red-500">*</span>
                      </label>
                      <Input.Password
                        placeholder={
                          isEditMode
                            ? "留空或保留 ****** 则不修改"
                            : ""
                        }
                        value={formData.authConfig?.clientSecret || ""}
                        onChange={(e) =>
                          updateAuthConfig({ clientSecret: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Scope
                      </label>
                      <Input
                        placeholder="可选, 空格分隔多个 scope"
                        value={formData.authConfig?.scope || ""}
                        onChange={(e) =>
                          updateAuthConfig({ scope: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Audience
                      </label>
                      <Input
                        placeholder="可选 (Auth0 等需要)"
                        value={formData.authConfig?.audience || ""}
                        onChange={(e) =>
                          updateAuthConfig({ audience: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {formData.authType === "NONE" && (
                  <p className="text-sm text-gray-500">
                    无需认证, 服务器将以匿名方式访问。
                  </p>
                )}
              </div>
            )}

            {selectedKey === "diagnose" && (
              <div>
                {!isEditMode && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    诊断功能需要先保存服务器。请先切到"基础设置"填完配置并点击保存。
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    连通性检查
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      icon={<ApiOutlined />}
                      onClick={handlePing}
                      loading={pingLoading}
                      disabled={!isEditMode}
                    >
                      Ping
                    </Button>
                    {pingResult === "ok" && <Tag color="green">连接成功</Tag>}
                    {pingResult === "fail" && <Tag color="red">连接失败</Tag>}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-700 font-medium">
                      工具预览
                    </label>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={handlePreview}
                      loading={previewLoading}
                      disabled={!isEditMode}
                    >
                      拉取工具列表
                    </Button>
                  </div>
                  {previewLoading && <Spin />}
                  {!previewLoading && previewTools.length > 0 && (
                    <Collapse
                      size="small"
                      items={previewTools.map((t, i) => ({
                        key: String(i),
                        label: (
                          <span>
                            <code className="text-xs bg-gray-100 px-1 rounded mr-2">
                              {t.name}
                            </code>
                            <span className="text-xs text-gray-500">
                              {t.description}
                            </span>
                          </span>
                        ),
                        children: (
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {t.inputSchema || "(无 inputSchema)"}
                          </pre>
                        ),
                      }))}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 right-0 flex gap-2">
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveLoading}
              onClick={handleSave}
            >
              {isEditMode ? "更新" : "保存"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddMcpServerModal;
