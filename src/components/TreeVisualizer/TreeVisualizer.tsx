import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import './TreeVisualizer.css';
import AnimationUtils from './animationUtils';
import TreeUtils from './treeUtils';
import { TreeNode, LinkData, AnimatedLinkData, Position, PreviewNode, RotationDirection } from './types';
import { RenderUtils, Node, Link, RotationControls } from './components';

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

const TreeVisualizer: React.FC = () => {
    // Main state
    const [nodes, setNodes] = useState<TreeNode[]>([]);
    const [links, setLinks] = useState<LinkData[]>([]);
    const [animatedLinks, setAnimatedLinks] = useState<AnimatedLinkData[]>([]);
    const [previewNode, setPreviewNode] = useState<PreviewNode | null>(null);
    const [previewLink, setPreviewLink] = useState<LinkData | null>(null);
    const [showRotationFor, setShowRotationFor] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [nodeAnimationComplete, setNodeAnimationComplete] = useState<boolean>(false);
    const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
    const animationTimerRef = useRef<number | null>(null);

    // Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const svgWidth = 800;
    const svgHeight = 600;

    // Update links whenever node structure changes
    useEffect(() => {
        updateLinks();
    }, [nodes]);

    // Function to update links based on current node tree structure
    const updateLinks = useCallback(() => {
        const computedLinks: LinkData[] = [];
        const nodeMap = TreeUtils.buildNodeMap(nodes);

        // Flatten the tree to get all nodes and their relationships
        nodes.forEach(node => {
            if (node.left) {
                const leftNode = nodeMap.get(node.left.id);
                if (leftNode) {
                    computedLinks.push({
                        id: `${node.id}-${leftNode.id}`,
                        source: node,
                        target: leftNode,
                        type: 'parent-child'
                    });
                }
            }

            if (node.right) {
                const rightNode = nodeMap.get(node.right.id);
                if (rightNode) {
                    computedLinks.push({
                        id: `${node.id}-${rightNode.id}`,
                        source: node,
                        target: rightNode,
                        type: 'parent-child'
                    });
                }
            }
        });

        setLinks(computedLinks);
    }, [nodes]);

    // Finding a close node for preview/interaction with minimum and maximum distance constraints
    const findCloseNode = useCallback((x: number, y: number, minDistance: number, maxDistance: number): TreeNode | null => {
        let closestNode = null;
        let closestDistance = maxDistance;

        nodes.forEach(node => {
            const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
            // Only consider nodes within the min-max distance range
            if (distance >= minDistance && distance < closestDistance) {
                closestNode = node;
                closestDistance = distance;
            }
        });

        return closestNode;
    }, [nodes]);

    // Function to calculate a suitable value for a new child node based on BST constraints
    const getDefaultChildNodeValue = useCallback((
        parentNode: TreeNode,
        isLeft: boolean,
        allNodes: TreeNode[]
    ): number => {
        // Get all node values
        const nodeValues = allNodes.map(node => node.value);
        // Get all existing values for uniqueness check
        const existingValues = new Set(nodeValues);

        if (isLeft) {
            // For left child, find the max value in the tree that's smaller than parent
            const smallerValues = nodeValues.filter(value => value < parentNode.value);

            if (smallerValues.length > 0) {
                // Find the maximum of smaller values
                const maxSmallerValue = Math.max(...smallerValues);
                // Use the midpoint between parent and the max smaller value
                const midValue = Math.floor((parentNode.value + maxSmallerValue) / 2);

                // Return -1 if the value already exists
                return existingValues.has(midValue) ? -1 : midValue;
            } else {
                // No smaller values, default to half the parent value
                const halfValue = Math.floor(parentNode.value * 0.5);

                // Return -1 if the value already exists or is invalid
                return existingValues.has(halfValue) || halfValue <= 0 ? -1 : halfValue;
            }
        } else {
            // For right child, find the min value in the tree that's larger than parent
            const largerValues = nodeValues.filter(value => value > parentNode.value);

            if (largerValues.length > 0) {
                // Find the minimum of larger values
                const minLargerValue = Math.min(...largerValues);
                // Use the midpoint between parent and the min larger value
                const midValue = Math.floor((parentNode.value + minLargerValue) / 2);

                // Return -1 if the value already exists
                return existingValues.has(midValue) ? -1 : midValue;
            } else {
                // No larger values, default to 1.5x the parent value
                const onePointFiveValue = Math.floor(parentNode.value * 1.5);

                // Return -1 if the value already exists
                return existingValues.has(onePointFiveValue) ? -1 : onePointFiveValue;
            }
        }
    }, []);

    // Create preview node and link when moving mouse near existing node
    const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const x = event.clientX - svgRect.left;
        const y = event.clientY - svgRect.top;

        // First check if we're very close to a node (for rotation controls)
        // Using a small minimum distance (0) and relatively small maximum distance (40)
        const nodeForRotation = findCloseNode(x, y, 0, 40);

        // If we found a node for rotation, show rotation controls and clear any preview
        if (nodeForRotation) {
            setShowRotationFor(nodeForRotation.id);
            setPreviewNode(null);
            setPreviewLink(null);
            return;
        }

        // If we're not close enough for rotation, check for preview node
        // Using a minimum distance of 40 (to avoid overlap with rotation) and max of 100
        const nodeForPreview = findCloseNode(x, y, 40, 100);

        // Clear rotation controls since we're not close enough to a node
        setShowRotationFor(null);

        if (nodeForPreview) {
            // Calculate position relative to close node
            const dx = x - nodeForPreview.x;
            const dy = y - nodeForPreview.y;
            const isLeft = dx < 0;
            const isChild = dy > 0;

            // Only show preview for adding children if the position is not already occupied
            if (isChild) {
                // Check if the corresponding child position is already occupied
                if ((isLeft && nodeForPreview.left) || (!isLeft && nodeForPreview.right)) {
                    // Position is already occupied, don't show preview
                    setPreviewNode(null);
                    setPreviewLink(null);
                    return;
                }
            } else {
                // For parent connections, check if this node already has a parent
                const hasParent = nodes.some(n =>
                    (n.left && n.left.id === nodeForPreview.id) ||
                    (n.right && n.right.id === nodeForPreview.id)
                );

                // If it already has a parent, don't allow creating a parent
                if (hasParent) {
                    setPreviewNode(null);
                    setPreviewLink(null);
                    return;
                }
            }

            // Calculate default value using the getDefaultChildNodeValue function
            // This will return -1 if no valid value is available
            const finalValue = getDefaultChildNodeValue(nodeForPreview, isLeft, nodes);

            // Don't show preview if no valid value is available
            if (finalValue === -1) {
                setPreviewNode(null);
                setPreviewLink(null);
                return;
            }

            // Position with spacing
            const previewX = nodeForPreview.x + (isLeft ? -80 : 80);
            const previewY = nodeForPreview.y + (isChild ? 80 : -80);

            // Create a temporary preview node
            const tempPreviewNode = {
                id: 'preview-node',
                value: finalValue,
                x: previewX,
                y: previewY
            };

            // Update preview
            setPreviewNode({
                x: previewX,
                y: previewY,
                value: finalValue,
                parentId: nodeForPreview.id,
                isLeft,
                isChild
            });

            // Set preview link with direct reference to nodes
            setPreviewLink({
                id: 'preview-link',
                source: nodeForPreview,
                target: tempPreviewNode as TreeNode,
                type: 'preview'
            });
        } else {
            // Clear preview if not near a node
            setPreviewNode(null);
            setPreviewLink(null);
        }
    }, [findCloseNode, nodes, getDefaultChildNodeValue]);

    // Create a node when clicking
    const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const x = event.clientX - svgRect.left;
        const y = event.clientY - svgRect.top;

        if (previewNode) {
            // Add preview node to tree
            const newNode: TreeNode = {
                id: TreeUtils.generateId(),
                value: previewNode.value,
                x: previewNode.x,
                y: previewNode.y
            };

            // Find parent node
            const parentNode = nodes.find(n => n.id === previewNode.parentId);

            if (parentNode) {
                // Create a deep copy of the nodes array with updated references
                const updatedNodes = [...nodes];
                const parentIndex = updatedNodes.findIndex(n => n.id === parentNode.id);

                if (parentIndex !== -1) {
                    // Create a copy of the parent to avoid modifying the original
                    const updatedParent = { ...updatedNodes[parentIndex] };
                    updatedNodes[parentIndex] = updatedParent;

                    // Update parent-child relationships
                    if (previewNode.isChild) {
                        // Adding as a child
                        if (previewNode.isLeft) {
                            updatedParent.left = newNode;
                        } else {
                            updatedParent.right = newNode;
                        }
                    } else {
                        // Adding as a parent
                        // Find if the node has a parent already
                        let grandparentIndex = -1;
                        let isLeftChild = false;

                        for (let i = 0; i < updatedNodes.length; i++) {
                            if (updatedNodes[i]?.left && updatedNodes[i]?.left?.id === updatedParent.id) {
                                grandparentIndex = i;
                                isLeftChild = true;
                                break;
                            }
                            if (updatedNodes[i]?.right && updatedNodes[i]?.right?.id === updatedParent.id) {
                                grandparentIndex = i;
                                isLeftChild = false;
                                break;
                            }
                        }

                        // Update grandparent's reference if exists
                        if (grandparentIndex !== -1) {
                            const updatedGrandparent = { ...updatedNodes[grandparentIndex] };
                            updatedNodes[grandparentIndex] = updatedGrandparent;

                            if (isLeftChild) {
                                updatedGrandparent.left = newNode;
                            } else {
                                updatedGrandparent.right = newNode;
                            }
                        }

                        // Set new node's child to the existing node
                        if (previewNode.isLeft) {
                            newNode.right = updatedParent;
                        } else {
                            newNode.left = updatedParent;
                        }
                    }

                    // Add the new node to the array
                    setNodes([...updatedNodes, newNode]);
                } else {
                    // If we couldn't find the parent in the updated nodes, just add the new node
                    setNodes(prevNodes => [...prevNodes, newNode]);
                }
            } else {
                // If no parent, this becomes a new node
                setNodes(prevNodes => [...prevNodes, newNode]);
            }
        } else if (nodes.length === 0) {
            // Get random value for root node
            let rootValue = Math.floor(Math.random() * 50) + 5;

            // Create the first root node
            const rootNode: TreeNode = {
                id: TreeUtils.generateId(),
                value: rootValue,
                x,
                y
            };

            setNodes([rootNode]);
        }

        // Clear preview
        setPreviewNode(null);
        setPreviewLink(null);
    }, [nodes, previewNode]);

    // Handlers for dragging nodes
    const handleDragStart = useCallback((_event: any, _node: TreeNode) => {
        // Just need to track initial position
    }, []);

    const handleDrag = useCallback((event: any, draggedNode: TreeNode) => {
        setNodes(prevNodes => {
            // Create a map for O(1) lookup
            const nodeMap = TreeUtils.buildNodeIndexMap(prevNodes);

            // Deep copy all nodes to avoid mutation
            const updatedNodes = TreeUtils.deepCopyNodes(prevNodes);

            // Get the dragged node from our copy
            const draggedNodeIndex = nodeMap.get(draggedNode.id);
            if (draggedNodeIndex === undefined) return prevNodes;

            // The node we're dragging in our copied array
            const nodeToDrag = updatedNodes[draggedNodeIndex];

            // Calculate movement
            const dx = event.dx;
            const dy = event.dy;

            // Update the dragged node position
            nodeToDrag.x += dx;
            nodeToDrag.y += dy;

            // Helper function to recursively update child positions
            const updateChildPositions = (nodeId: string, deltaX: number, deltaY: number) => {
                const nodeIndex = nodeMap.get(nodeId);
                if (nodeIndex === undefined) return;

                const node = updatedNodes[nodeIndex];

                // Process left child if exists
                if (node.left) {
                    const leftChildIndex = nodeMap.get(node.left.id);
                    if (leftChildIndex !== undefined) {
                        const leftChild = updatedNodes[leftChildIndex];
                        leftChild.x += deltaX;
                        leftChild.y += deltaY;

                        // Recursively update the left child's children
                        updateChildPositions(leftChild.id, deltaX, deltaY);
                    }
                }

                // Process right child if exists
                if (node.right) {
                    const rightChildIndex = nodeMap.get(node.right.id);
                    if (rightChildIndex !== undefined) {
                        const rightChild = updatedNodes[rightChildIndex];
                        rightChild.x += deltaX;
                        rightChild.y += deltaY;

                        // Recursively update the right child's children
                        updateChildPositions(rightChild.id, deltaX, deltaY);
                    }
                }
            };

            // Update all children recursively
            updateChildPositions(nodeToDrag.id, dx, dy);

            // After updating node positions, we need to update the references
            // This ensures that node.left and node.right point to the updated objects
            updatedNodes.forEach(node => {
                if (node.left) {
                    const leftIndex = nodeMap.get(node.left.id);
                    if (leftIndex !== undefined) {
                        node.left = updatedNodes[leftIndex];
                    }
                }

                if (node.right) {
                    const rightIndex = nodeMap.get(node.right.id);
                    if (rightIndex !== undefined) {
                        node.right = updatedNodes[rightIndex];
                    }
                }
            });

            return updatedNodes;
        });
    }, []);

    const handleDragEnd = useCallback((_event: any, _node: TreeNode) => {
        // No special handling needed
    }, []);

    // Function to stop any running simulation
    const stopSimulation = useCallback(() => {
        if (simulationRef.current) {
            simulationRef.current.stop();
            simulationRef.current = null;
        }
    }, []);

    // Update animated links during rotation
    const updateAnimatedLinks = useCallback(() => {
        if (animatedLinks.length > 0) {
            setAnimatedLinks(prevLinks => AnimationUtils.updateAnimatedLinks(prevLinks));
        }
    }, [animatedLinks]);

    // Handle animation tick to update animated links
    useEffect(() => {
        if (isAnimating && nodeAnimationComplete && animatedLinks.length > 0) {
            // Check if all animations are complete
            const allComplete = animatedLinks.every(link => link.progress >= 1);

            if (allComplete) {
                // Animation is complete, clear the animated links
                setAnimatedLinks([]);
                setIsAnimating(false);
                setNodeAnimationComplete(false);

                // Clear any existing animation timer
                if (animationTimerRef.current !== null) {
                    window.clearTimeout(animationTimerRef.current);
                    animationTimerRef.current = null;
                }
            } else {
                // Continue the animation
                const timerId = window.setTimeout(updateAnimatedLinks, 16); // ~60fps
                animationTimerRef.current = timerId;

                // Clean up on unmount
                return () => {
                    if (animationTimerRef.current !== null) {
                        window.clearTimeout(animationTimerRef.current);
                    }
                };
            }
        }
    }, [isAnimating, nodeAnimationComplete, animatedLinks, updateAnimatedLinks]);

    // Common function to perform rotation (either left or right)
    const performRotation = useCallback((nodeId: string, direction: RotationDirection) => {
        // Prevent rotation during animation
        if (isAnimating) return;

        setIsAnimating(true);
        setNodeAnimationComplete(false); // Ensure node animation starts first
        stopSimulation();

        // Create a working copy of nodes
        const workingNodes = [...nodes];

        // Find the node to rotate
        const nodeIndex = workingNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) {
            setIsAnimating(false);
            return;
        }

        const node = { ...workingNodes[nodeIndex] };
        workingNodes[nodeIndex] = node;

        // Determine which child to use based on rotation direction
        const childProperty = direction === 'left' ? 'right' : 'left';

        // Can't rotate without the required child
        if (!node[childProperty]) {
            setIsAnimating(false);
            return;
        }

        // Find the child node
        const childId = node[childProperty]?.id;
        if (!childId) {
            setIsAnimating(false);
            return;
        }

        const childIndex = workingNodes.findIndex(n => n.id === childId);
        if (childIndex === -1) {
            setIsAnimating(false);
            return;
        }

        const childNode = { ...workingNodes[childIndex] };
        workingNodes[childIndex] = childNode;

        // Find the grandchild if it exists (the child's opposite property)
        const grandchildProperty = direction === 'left' ? 'left' : 'right';
        let grandchild: TreeNode | undefined;

        if (childNode[grandchildProperty]) {
            const grandchildIndex = workingNodes.findIndex(n => n.id === childNode[grandchildProperty]?.id);
            if (grandchildIndex !== -1) {
                grandchild = workingNodes[grandchildIndex];
            }
        }

        // Prepare animated links
        const newAnimatedLinks = AnimationUtils.createRotationAnimatedLinks(
            node,
            childNode,
            grandchild,
            direction
        );

        // Set the animated links
        setAnimatedLinks(newAnimatedLinks);

        // Find if the node has a parent
        const parentInfo = TreeUtils.findParentNode(workingNodes, node.id);

        // Calculate target positions for all nodes
        const targetPositions = AnimationUtils.calculateRotationTargetPositions(node, childNode, direction);

        // Convert tree nodes to simulation nodes
        const simNodes = AnimationUtils.createSimulationNodes(workingNodes, targetPositions);

        // Setup rotation simulation
        const simulation = AnimationUtils.setupRotationSimulation(
            simNodes,
            () => {
                // This is called on each tick (already handled by updateNodesFromSimulation)
            },
            () => {
                // This is called when the simulation completes
                simulationRef.current = null;

                // Mark node animation as complete - this will trigger link animations
                setNodeAnimationComplete(true);

                // Update the actual tree structure
                setNodes(prevNodes => {
                    const newNodes = [...prevNodes];

                    // Find the node to rotate again (state might have changed)
                    const finalNodeIndex = newNodes.findIndex(n => n.id === nodeId);
                    if (finalNodeIndex === -1) {
                        setIsAnimating(false);
                        return prevNodes;
                    }

                    const finalNode = { ...newNodes[finalNodeIndex] };
                    newNodes[finalNodeIndex] = finalNode;

                    // Find the child again
                    const finalChildId = finalNode[childProperty]?.id;
                    if (!finalChildId) {
                        setIsAnimating(false);
                        return prevNodes;
                    }

                    const finalChildIndex = newNodes.findIndex(n => n.id === finalChildId);
                    if (finalChildIndex === -1) {
                        setIsAnimating(false);
                        return prevNodes;
                    }

                    const finalChildNode = { ...newNodes[finalChildIndex] };
                    newNodes[finalChildIndex] = finalChildNode;

                    // Find parent again
                    const finalParentInfo = TreeUtils.findParentNode(newNodes, finalNode.id);

                    // Update relationships based on rotation direction
                    if (direction === 'left') {
                        // Left rotation: right child becomes parent
                        if (finalChildNode.left) {
                            const childLeftIndex = newNodes.findIndex(n => n.id === finalChildNode.left?.id);
                            if (childLeftIndex !== -1) {
                                finalNode.right = { ...finalChildNode.left };
                            }
                        } else {
                            finalNode.right = undefined;
                        }
                        finalChildNode.left = finalNode;
                    } else {
                        // Right rotation: left child becomes parent
                        if (finalChildNode.right) {
                            const childRightIndex = newNodes.findIndex(n => n.id === finalChildNode.right?.id);
                            if (childRightIndex !== -1) {
                                finalNode.left = { ...finalChildNode.right };
                            }
                        } else {
                            finalNode.left = undefined;
                        }
                        finalChildNode.right = finalNode;
                    }

                    // Update parent's reference if exists
                    if (finalParentInfo) {
                        const { parent, isLeftChild } = finalParentInfo;
                        if (isLeftChild) {
                            parent.left = finalChildNode;
                        } else {
                            parent.right = finalChildNode;
                        }
                    }

                    // Update positions to match simulation end state
                    simNodes.forEach(simNode => {
                        const nodeIndex = newNodes.findIndex(n => n.id === simNode.id);
                        if (nodeIndex !== -1) {
                            newNodes[nodeIndex].x = simNode.x || 0;
                            newNodes[nodeIndex].y = simNode.y || 0;
                        }
                    });

                    // Don't set isAnimating to false here since link animations may still be in progress
                    // The isAnimating flag will be set to false when all link animations complete
                    return newNodes;
                });
            }
        );

        simulationRef.current = simulation;
    }, [nodes, isAnimating, stopSimulation, nodeAnimationComplete]);

    // Rotation helper for node with force simulation - now using common performRotation function
    const rotateLeft = useCallback((nodeId: string) => {
        performRotation(nodeId, 'left');
    }, [performRotation]);

    const rotateRight = useCallback((nodeId: string) => {
        performRotation(nodeId, 'right');
    }, [performRotation]);

    // Handle right click to delete leaf nodes
    const handleContextMenu = useCallback((event: React.MouseEvent, nodeToDelete: TreeNode) => {
        // Prevent the default context menu
        event.preventDefault();

        // Only allow deletion of leaf nodes (nodes with no children)
        if (nodeToDelete.left || nodeToDelete.right) {
            return; // Not a leaf node, do nothing
        }

        setNodes(prevNodes => {
            // Create a deep copy of the nodes array
            const updatedNodes = TreeUtils.deepCopyNodes(prevNodes);

            // Find the parent of the node to delete
            const parentInfo = TreeUtils.findParentNode(updatedNodes, nodeToDelete.id);

            // If we found a parent, update its reference
            if (parentInfo) {
                const { parent, isLeftChild } = parentInfo;
                if (isLeftChild) {
                    parent.left = undefined;
                } else {
                    parent.right = undefined;
                }
            }

            // Remove the node from the array
            return updatedNodes.filter(node => node.id !== nodeToDelete.id);
        });
    }, []);

    // Handle component cleanup on unmount
    useEffect(() => {
        return () => {
            // Stop simulation and clear animation timers on unmount
            if (simulationRef.current) {
                simulationRef.current.stop();
                simulationRef.current = null;
            }

            if (animationTimerRef.current !== null) {
                window.clearTimeout(animationTimerRef.current);
                animationTimerRef.current = null;
            }
        };
    }, []);

    // Render links including normal, animated, and preview links
    const renderLinks = useCallback(() => {
        return (
            <g className="links">
                {/* Render normal links */}
                {links.map(link => (
                    <Link key={link.id} link={link} nodeAnimationComplete={nodeAnimationComplete} />
                ))}

                {/* Render animated links */}
                {animatedLinks.map(link => (
                    <Link key={link.id} link={link} nodeAnimationComplete={nodeAnimationComplete} />
                ))}

                {/* Render preview link if exists */}
                {previewLink && <Link key={previewLink.id} link={previewLink} nodeAnimationComplete={nodeAnimationComplete} />}
            </g>
        );
    }, [links, animatedLinks, previewLink, nodeAnimationComplete]);

    // Render nodes including rotation controls
    const renderNodes = useCallback(() => {
        return (
            <g className="nodes">
                {/* Render tree nodes */}
                {nodes.map(node => (
                    <g key={node.id}>
                        <Node
                            node={node}
                            onDragStart={handleDragStart}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                            onMouseEnter={() => { }} // Remove direct hover behavior
                            onMouseLeave={() => { }} // Remove direct hover behavior
                            onContextMenu={handleContextMenu}
                            isHighlighted={showRotationFor === node.id}
                        />
                        {showRotationFor === node.id && (
                            <g transform={`translate(${node.x},${node.y})`}>
                                <RotationControls
                                    node={node}
                                    onRotateLeft={rotateLeft}
                                    onRotateRight={rotateRight}
                                />
                            </g>
                        )}
                    </g>
                ))}
            </g>
        );
    }, [nodes, showRotationFor, handleDragStart, handleDrag, handleDragEnd, handleContextMenu, rotateLeft, rotateRight]);

    // Render preview node
    const renderPreviewNode = useCallback(() => {
        if (!previewNode) return null;

        // Create a temporary node object that matches the TreeNode interface
        const tempNode: TreeNode = {
            id: 'preview-node',
            value: previewNode.value,
            x: previewNode.x,
            y: previewNode.y
        };

        return RenderUtils.createNodeElement(tempNode, { isPreview: true });
    }, [previewNode]);

    return (
        <div className="tree-visualizer">
            <h1 className="text-2xl font-bold mb-4">Binary Search Tree Visualizer</h1>
            <p className="mb-4">
                Click anywhere to create a root node. Click near an existing node to create connected nodes.
                Drag nodes to reposition. Hover near a node to see rotation options.
                Right-click on a leaf node (node without children) to delete it.
            </p>
            <svg
                ref={svgRef}
                width={svgWidth}
                height={svgHeight}
                className="border border-gray-300 rounded bg-gray-50"
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onContextMenu={(e) => e.preventDefault()} // Prevent context menu on svg background
            >
                {renderLinks()}
                {renderNodes()}
                {renderPreviewNode()}
            </svg>
        </div>
    );
};

export default TreeVisualizer; 