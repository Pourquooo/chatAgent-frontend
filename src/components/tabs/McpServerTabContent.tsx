import React from "react";
import { Button, Divider, Dropdown, Modal, Tag } from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import type { McpServerVO } from "../../api/api.ts";

interface McpServerTabContentProps {
  mcpServers: McpServerVO[];
  onCreateMcpServerClick: () => void;
  onEditMcpServer?: (server: McpServerVO) => void;
  onDeleteMcpServer?: (mcpServerId: string) => void;
}

const McpServerTabContent: React.FC<McpServerTabContentProps> = ({
  mcpServers,
  onCreateMcpServerClick,
  onEditMcpServer,
  onDeleteMcpServer,
}) => {
  const getContextMenuItems = (server: McpServerVO): MenuProps["items"] => {
    const items: MenuProps["items"] = [];
    if (onEditMcpServer) {
      items.push({
        key: "edit",
        label: "编辑",
        icon: <EditOutlined />,
        onClick: (e) => {
          e.domEvent.stopPropagation();
          onEditMcpServer(server);
        },
      });
    }
    if (onDeleteMcpServer) {
      items.push({
        key: "delete",
        label: "删除",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: (e) => {
          e.domEvent.stopPropagation();
          Modal.confirm({
            title: "删除该 MCP 服务器?",
            content: "引用它的 Agent 将无法再使用其中的远端工具",
            okText: "删除",
            cancelText: "取消",
            okType: "danger",
            onOk: () => onDeleteMcpServer(server.id),
          });
        },
      });
    }
    return items;
  };

  return (
    <div className="flex flex-col h-full">
      <Button
        color="geekblue"
        variant="filled"
        icon={<PlusOutlined />}
        onClick={onCreateMcpServerClick}
        className="w-full"
      >
        新建 MCP 服务器
      </Button>
      <Divider />
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-1.5">
        {mcpServers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ApiOutlined className="text-4xl mb-2" />
            <p className="text-sm">暂无 MCP 服务器</p>
            <p className="text-xs mt-1">点击上方按钮添加</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {mcpServers.map((srv) => {
              const menuItems = getContextMenuItems(srv);
              const hasMenu = menuItems && menuItems.length > 0;
              return (
                <div
                  key={srv.id}
                  onClick={() => onEditMcpServer?.(srv)}
                  className="w-full px-3 py-3 rounded-lg bg-white cursor-pointer transition-all hover:bg-gray-100 hover:shadow-sm group relative"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center shrink-0 text-lg mt-0.5">
                      <ApiOutlined className="text-indigo-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-gray-900 truncate">
                          {srv.name}
                        </span>
                        {!srv.enabled && <Tag color="red">已禁用</Tag>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <Tag color="geekblue">{srv.transport}</Tag>
                        <Tag color="default">{srv.authType}</Tag>
                      </div>
                      {srv.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {srv.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 font-mono break-all line-clamp-1">
                        {srv.endpoint}
                      </div>
                    </div>
                    {hasMenu && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onContextMenu={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Dropdown
                          menu={{ items: menuItems }}
                          trigger={["contextMenu", "click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined />}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        </Dropdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default McpServerTabContent;
