// Tree utility functions for manipulating and working with tree nodes
import { TreeNode } from './types';

const TreeUtils = {
    // Deep copy a node and its children
    deepCopyNode: (node: TreeNode): TreeNode => {
        const copy: TreeNode = { ...node };
        if (node.left) copy.left = TreeUtils.deepCopyNode(node.left);
        if (node.right) copy.right = TreeUtils.deepCopyNode(node.right);
        return copy;
    },

    // Deep copy an array of nodes
    deepCopyNodes: (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => TreeUtils.deepCopyNode(node));
    },

    // Find parent node for a given node id
    findParentNode: (nodes: TreeNode[], nodeId: string): { parent: TreeNode, isLeftChild: boolean } | null => {
        for (const node of nodes) {
            if (node.left && node.left.id === nodeId) {
                return { parent: node, isLeftChild: true };
            }
            if (node.right && node.right.id === nodeId) {
                return { parent: node, isLeftChild: false };
            }
        }
        return null;
    },

    // Build a map of node IDs to node objects
    buildNodeMap: (nodes: TreeNode[]): Map<string, TreeNode> => {
        const nodeMap = new Map<string, TreeNode>();
        nodes.forEach(node => {
            nodeMap.set(node.id, node);
        });
        return nodeMap;
    },

    // Build a map of node IDs to array indices
    buildNodeIndexMap: (nodes: TreeNode[]): Map<string, number> => {
        const nodeMap = new Map<string, number>();
        nodes.forEach((node, index) => {
            nodeMap.set(node.id, index);
        });
        return nodeMap;
    },

    // Generate a unique ID for a node
    generateId: (): string => {
        return `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
};

export default TreeUtils; 