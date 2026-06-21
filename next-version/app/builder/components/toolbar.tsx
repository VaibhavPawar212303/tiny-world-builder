'use client';

import { useState, useEffect } from 'react';
import { TOOLS, TOOL_GROUPS, getTool, type Tool, type ToolGroup } from '../lib/tools';

interface ToolbarProps {
  onSelectTool?: (tool: Tool) => void;
  selectedTool?: Tool | null;
}

// ToolButton component - renders individual tool button with icon
function ToolButton({ tool, isSelected, onClick, onMouseEnter, onMouseLeave }: {
  tool: Tool;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: isSelected ? tool.color : '#f5f5f5',
        border: `2px solid ${isSelected ? tool.color : '#ddd'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: isSelected ? 1 : 0.7,
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          background: tool.color === 'transparent' ? '#999' : tool.color,
          borderRadius: '4px',
          border: isSelected ? 'none' : '1px solid rgba(0, 0, 0, 0.2)',
        }}
      />
    </button>
  );
}

// ToolGroupButton component - renders group button
function ToolGroupButton({ group, isOpen, isSelected, onClick, onMouseEnter, onMouseLeave }: {
  group: ToolGroup;
  isOpen: boolean;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const iconTool = getTool(group.iconTool);
  if (!iconTool) return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={group.label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: (isOpen || isSelected) ? iconTool.color : '#f5f5f5',
        border: `2px solid ${(isOpen || isSelected) ? iconTool.color : '#ddd'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: (isOpen || isSelected) ? 1 : 0.7,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          background: iconTool.color,
          borderRadius: '4px',
          border: (isOpen || isSelected) ? 'none' : '1px solid rgba(0, 0, 0, 0.2)',
        }}
      />
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            background: '#fff',
            border: '2px solid #333',
            borderRadius: '50%',
          }}
        />
      )}
    </button>
  );
}

export function Toolbar({ onSelectTool, selectedTool: externalSelectedTool }: ToolbarProps) {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(getTool('select') || null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [draggedTool, setDraggedTool] = useState<Tool | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Number keys and letters for tools
      TOOLS.forEach((tool) => {
        if (tool.shortcut && tool.shortcut.toLowerCase() === key) {
          e.preventDefault();
          setSelectedTool(tool);
          onSelectTool?.(tool);
        }
      });

      // Escape to deselect
      if (key === 'escape') {
        setOpenGroup(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTool]);

  const currentSelected = externalSelectedTool || selectedTool;

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    onSelectTool?.(tool);
    if (tool.variants && tool.variants.length) {
      setOpenGroup(tool.id === openGroup ? null : tool.id);
    } else {
      setOpenGroup(null);
    }
  };

  const handleVariantClick = (tool: Tool, variantId: string) => {
    const variant = tool.variants?.find(v => v.id === variantId);
    if (variant) {
      const fullTool = { ...tool, selectedVariant: variantId, ...variant };
      setSelectedTool(fullTool);
      onSelectTool?.(fullTool);
      setOpenGroup(null);
    }
  };

  const handleToolDragStart = (tool: Tool, e: React.DragEvent) => {
    setDraggedTool(tool);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('tool-id', tool.id);
    if (tool.selectedVariant) {
      e.dataTransfer.setData('variant-id', tool.selectedVariant);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        zIndex: 100,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Select tool */}
      <div
        draggable
        onDragStart={(e) => handleToolDragStart(getTool('select')!, e as any)}
        onDragEnd={() => setDraggedTool(null)}
      >
        <ToolButton
          tool={getTool('select')!}
          isSelected={currentSelected?.id === 'select'}
          onClick={() => handleToolClick(getTool('select')!)}
          onMouseEnter={() => setHoveredTool('select')}
          onMouseLeave={() => setHoveredTool(null)}
        />
      </div>

      <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />

      {/* Tool groups */}
      {TOOL_GROUPS.map((group) => (
        <div key={group.id} style={{ position: 'relative' }}>
          <div
            draggable
            onDragStart={(e) => {
              const groupTools = group.toolIds.map(id => getTool(id)).filter(Boolean) as Tool[];
              const firstTool = groupTools[0];
              if (firstTool) {
                handleToolDragStart(firstTool, e as any);
              }
            }}
            onDragEnd={() => setDraggedTool(null)}
          >
            <ToolGroupButton
              group={group}
              isOpen={openGroup === group.id}
              isSelected={
                currentSelected &&
                group.toolIds.includes(currentSelected.id) &&
                !currentSelected.variants
              }
              onClick={() => {
                const groupTools = group.toolIds.map(id => getTool(id)).filter(Boolean) as Tool[];
                const firstTool = groupTools[0];
                if (firstTool) {
                  setOpenGroup(openGroup === group.id ? null : group.id);
                  setSelectedTool(firstTool);
                  onSelectTool?.(firstTool);
                }
              }}
              onMouseEnter={() => setHoveredTool(group.id)}
              onMouseLeave={() => setHoveredTool(null)}
            />
          </div>

          {/* Dropdown for tools in group */}
          {openGroup === group.id && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                marginBottom: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                background: 'white',
                padding: '8px',
                borderRadius: '8px',
                boxShadow: '0 5px 20px rgba(0, 0, 0, 0.15)',
                minWidth: '180px',
                zIndex: 1000,
              }}
            >
              {group.toolIds.map((toolId) => {
                const tool = getTool(toolId);
                if (!tool) return null;

                return (
                  <div key={tool.id}>
                    {/* Tool button */}
                    <div
                      draggable
                      onDragStart={(e) => handleToolDragStart(tool, e as any)}
                      onDragEnd={() => setDraggedTool(null)}
                    >
                      <button
                        onClick={() => handleToolClick(tool)}
                        onMouseEnter={() => setHoveredTool(toolId)}
                        onMouseLeave={() => setHoveredTool(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: currentSelected?.id === tool.id ? '#f0f0f0' : 'transparent',
                          border: '1px solid ' + (tool.color || '#ccc'),
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                        title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            background: tool.color || '#999',
                            borderRadius: '3px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                          }}
                        />
                        <span style={{ flex: 1 }}>{tool.label}</span>
                        {tool.shortcut && (
                          <kbd style={{ fontSize: '10px', color: '#999' }}>{tool.shortcut}</kbd>
                        )}
                      </button>
                    </div>

                    {/* Variants */}
                    {tool.variants && tool.variants.length > 0 && (
                      <div
                        style={{
                          paddingLeft: '28px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          marginTop: '2px',
                        }}
                      >
                        {tool.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => handleVariantClick(tool, variant.id)}
                            style={{
                              padding: '6px 8px',
                              background: '#f9f9f9',
                              border: '1px solid #e0e0e0',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              textAlign: 'left',
                              transition: 'all 0.2s',
                            }}
                            title={variant.hint}
                          >
                            {variant.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />

      {/* Erase tool */}
      <div
        draggable
        onDragStart={(e) => handleToolDragStart(getTool('erase')!, e as any)}
        onDragEnd={() => setDraggedTool(null)}
      >
        <ToolButton
          tool={getTool('erase')!}
          isSelected={currentSelected?.id === 'erase'}
          onClick={() => handleToolClick(getTool('erase')!)}
          onMouseEnter={() => setHoveredTool('erase')}
          onMouseLeave={() => setHoveredTool(null)}
        />
      </div>

      {/* Tooltip */}
      {hoveredTool && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 2000,
          }}
        >
          {getTool(hoveredTool)?.label}
        </div>
      )}
    </div>
  );
}
