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
    },

    // Find a node by ID and return both the node and its index
    findNodeById: (nodes: TreeNode[], nodeId: string): { node: TreeNode, index: number } | null => {
        const index = nodes.findIndex(n => n.id === nodeId);
        if (index === -1) return null;
        return { node: nodes[index], index };
    },

    // Find a node by ID, copy it, and update the array with the copy
    // Returns the copied node and its index, or null if not found
    findAndCopyNode: (nodes: TreeNode[], nodeId: string): { node: TreeNode, index: number } | null => {
        const result = TreeUtils.findNodeById(nodes, nodeId);
        if (!result) return null;

        // Create a copy of the node
        const nodeCopy = { ...result.node };
        // Update the array with the copy
        nodes[result.index] = nodeCopy;

        return { node: nodeCopy, index: result.index };
    },

    // Find a node's child by property name ('left' or 'right')
    // Returns the child node and its index, or null if not found
    findChildNode: (
        nodes: TreeNode[],
        parentNode: TreeNode,
        childProperty: 'left' | 'right'
    ): { node: TreeNode, index: number } | null => {
        if (!parentNode[childProperty]) return null;

        const childId = parentNode[childProperty]?.id;
        if (!childId) return null;

        return TreeUtils.findNodeById(nodes, childId);
    },

    // Find and copy a node's child
    findAndCopyChildNode: (
        nodes: TreeNode[],
        parentNode: TreeNode,
        childProperty: 'left' | 'right'
    ): { node: TreeNode, index: number } | null => {
        const result = TreeUtils.findChildNode(nodes, parentNode, childProperty);
        if (!result) return null;

        // Create a copy of the child node
        const childCopy = { ...result.node };
        // Update the array with the copy
        nodes[result.index] = childCopy;

        return { node: childCopy, index: result.index };
    },

    // Safely get a node by its ID, with detailed error logging
    safeGetNodeById: (
        nodes: TreeNode[],
        nodeId: string,
        context: string = 'operation'
    ): TreeNode | null => {
        const result = TreeUtils.findNodeById(nodes, nodeId);
        if (!result) {
            console.error(`Node with ID ${nodeId} not found during ${context}`);
            return null;
        }
        return result.node;
    }
};

export default TreeUtils; 