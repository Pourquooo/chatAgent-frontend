import { useEffect, useState } from "react";
import {
  createMcpServer,
  deleteMcpServer,
  getMcpServers,
  updateMcpServer,
  type CreateMcpServerRequest,
  type McpServerVO,
  type UpdateMcpServerRequest,
} from "../api/api.ts";

/**
 * MCP 服务器列表 hook - 与 useAgents / useKnowledgeBases 同构.
 * 所有写入操作后都会重新拉取列表, 保证 UI 状态与后端一致.
 */
export function useMcpServers() {
  const [mcpServers, setMcpServers] = useState<McpServerVO[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const resp = await getMcpServers();
      setMcpServers(resp.mcpServers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().then();
  }, []);

  async function createMcpServerHandle(request: CreateMcpServerRequest) {
    await createMcpServer(request);
    await refresh();
  }

  async function updateMcpServerHandle(
    mcpServerId: string,
    request: UpdateMcpServerRequest,
  ) {
    await updateMcpServer(mcpServerId, request);
    await refresh();
  }

  async function deleteMcpServerHandle(mcpServerId: string) {
    await deleteMcpServer(mcpServerId);
    await refresh();
  }

  return {
    mcpServers,
    loading,
    refresh,
    createMcpServerHandle,
    updateMcpServerHandle,
    deleteMcpServerHandle,
  };
}
