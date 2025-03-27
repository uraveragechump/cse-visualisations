// Common interfaces and types for the TreeVisualizer component
import { SimulationNodeDatum } from 'd3';

// Common position interface
export interface Position {
    x: number;
    y: number;
}

// Type for rotation direction
export type RotationDirection = 'left' | 'right';

// Node data structure
export interface TreeNode extends Position {
    id: string;
    value: number;
    left?: TreeNode;
    right?: TreeNode;
}

// Link data structure - references the nodes directly
export interface LinkData {
    id: string;
    source: TreeNode;
    target: TreeNode;
    type: 'parent-child' | 'preview';
}

// Preview node data structure
export interface PreviewNode extends Position {
    value: number;
    parentId: string;
    isLeft: boolean;
    isChild: boolean;
}

// Interface for simulation node with target position
export interface SimulationNode extends SimulationNodeDatum {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    value: number;
    left?: { id: string };
    right?: { id: string };
}

// Link animation states
export interface AnimatedLinkData {
    id: string;
    startSource: Position;
    startTarget: Position;
    endSource: Position;
    endTarget: Position;
    type: 'create' | 'delete' | 'reparent';
    progress: number; // 0 to 1
}

// Props for Node component
export interface NodeProps {
    node: TreeNode;
    onDragStart: (event: any, node: TreeNode) => void;
    onDrag: (event: any, node: TreeNode) => void;
    onDragEnd: (event: any, node: TreeNode) => void;
    onMouseEnter: (id: string) => void;
    onMouseLeave: () => void;
    onContextMenu: (event: React.MouseEvent, node: TreeNode) => void;
    isHighlighted: boolean;
}

// Props for Link component
export interface LinkProps {
    link: LinkData | AnimatedLinkData;
    nodeAnimationComplete?: boolean;
}

// Props for RotationControls component
export interface RotationControlsProps {
    node: TreeNode;
    onRotateLeft: (id: string) => void;
    onRotateRight: (id: string) => void;
} 