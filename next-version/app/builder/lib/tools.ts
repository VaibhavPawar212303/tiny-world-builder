export interface ToolVariant {
  id: string;
  label: string;
  hint?: string;
  [key: string]: any;
}

export interface Tool {
  id: string;
  label: string;
  color: string;
  shortcut?: string;
  group: string;
  hidden?: boolean;
  variants?: ToolVariant[];
  erase?: boolean;
  kind?: string;
  terrain?: string;
  select?: boolean;
  [key: string]: any;
}

export interface ToolGroup {
  id: string;
  label: string;
  toolIds: string[];
  iconTool: string;
}

export const TOOLS: Tool[] = [
  // Tools
  { id: 'select', label: 'Select', select: true, color: '#c8b06f', shortcut: 'v', group: 'tools' },

  // Terrain
  { id: 'grass', label: 'Grass', terrain: 'grass', color: '#9ec74b', shortcut: '1', group: 'terrain' },
  { id: 'path', label: 'Path', terrain: 'path', color: '#e8d5a8', shortcut: '2', group: 'terrain' },
  { id: 'dirt', label: 'Dirt', terrain: 'dirt', color: '#5a3b27', shortcut: '3', group: 'terrain' },
  { id: 'water', label: 'Water', terrain: 'water', color: '#4a90c2', shortcut: '4', group: 'terrain' },
  { id: 'stone', label: 'Stone', terrain: 'stone', color: '#8f8a82', group: 'terrain' },
  { id: 'sand', label: 'Sand', terrain: 'sand', color: '#e6cc7c', group: 'terrain' },

  // Plants
  { id: 'tree', label: 'Tree', kind: 'tree', color: '#6fb442', shortcut: '6', group: 'plants' },
  { id: 'flower', label: 'Flower', kind: 'flower', color: '#d24a4f', group: 'plants' },
  { id: 'bush', label: 'Bush', kind: 'bush', color: '#6fa030', group: 'plants' },
  { id: 'tuft', label: 'Tuft', kind: 'tuft', color: '#86b53e', shortcut: 't', group: 'plants' },

  // Build
  {
    id: 'house',
    label: 'House',
    kind: 'house',
    color: '#3a72c8',
    shortcut: '5',
    group: 'build',
    variants: [
      { id: 'cottage', label: 'Cottage', buildingType: 'cottage', hint: 'force cottage style' },
      { id: 'manor', label: 'Manor', buildingType: 'manor', hint: 'brick + portico' },
      { id: 'tower', label: 'Tower', buildingType: 'tower', hint: 'stone tower w/ conical roof' },
      { id: 'turret', label: 'Castle', buildingType: 'turret', hint: 'castle turret / keep' },
      { id: 'skyscraper', label: 'High-rise', buildingType: 'skyscraper', hint: 'glass tower' },
    ],
  },
  { id: 'fence', label: 'Fence', kind: 'fence', color: '#8a5a3b', shortcut: '7', group: 'build',
    variants: [
      { id: 'wood', label: 'Wood', fenceStyle: 'wood', hint: 'plain timber rails' },
      { id: 'garden', label: 'Garden', fenceStyle: 'garden', hint: 'dark orchard fence' },
    ],
  },
  { id: 'bridge', label: 'Bridge', kind: 'bridge', color: '#8b5a32', shortcut: '9', group: 'build' },

  // Infrastructure
  { id: 'lamp-post', label: 'Lamp', kind: 'lamp-post', color: '#f0b45a', group: 'infra' },
  { id: 'spotlight', label: 'Spotlight', kind: 'spotlight', color: '#ffd280', group: 'infra' },
  { id: 'mooring', label: 'Connect', mooring: true, color: '#171b20', shortcut: 'm', group: 'infra' },

  // Animals
  { id: 'cow', label: 'Cow', kind: 'cow', color: '#f2eee0', group: 'animals' },
  { id: 'sheep', label: 'Sheep', kind: 'sheep', color: '#e8e2d2', group: 'animals' },

  // Erase
  { id: 'erase', label: 'Erase', erase: true, color: 'transparent', eraser: true, shortcut: 'e', group: 'tools' },
];

export const TOOL_GROUPS: ToolGroup[] = [
  { id: 'terrain', label: 'Terrain', toolIds: ['grass', 'path', 'dirt', 'water', 'stone', 'sand'], iconTool: 'grass' },
  { id: 'plants', label: 'Plants', toolIds: ['tree', 'flower', 'bush', 'tuft'], iconTool: 'tree' },
  { id: 'build', label: 'Build', toolIds: ['house', 'fence', 'bridge'], iconTool: 'house' },
  { id: 'infra', label: 'Infra', toolIds: ['lamp-post', 'spotlight', 'mooring'], iconTool: 'lamp-post' },
  { id: 'animals', label: 'Animals', toolIds: ['cow', 'sheep'], iconTool: 'cow' },
];

export function getTool(id: string): Tool | undefined {
  return TOOLS.find(t => t.id === id);
}

export function getToolGroup(id: string): ToolGroup | undefined {
  return TOOL_GROUPS.find(g => g.id === id);
}

export function getGroupForTool(toolId: string): ToolGroup | undefined {
  return TOOL_GROUPS.find(g => g.toolIds.includes(toolId));
}
