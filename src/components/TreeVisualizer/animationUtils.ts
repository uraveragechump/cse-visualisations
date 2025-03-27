// Animation utility functions for the TreeVisualizer component
import * as d3 from 'd3';
import {
    Position,
    TreeNode,
    SimulationNode,
    AnimatedLinkData,
    RotationDirection
} from './types';

const AnimationUtils = {
    // Convert tree nodes to simulation nodes with target positions
    createSimulationNodes: (
        treeNodes: TreeNode[],
        targetPositions: Map<string, Position>
    ): SimulationNode[] => {
        return treeNodes.map(node => {
            const target = targetPositions.get(node.id);
            return {
                id: node.id,
                x: node.x,
                y: node.y,
                targetX: target ? target.x : node.x,
                targetY: target ? target.y : node.y,
                value: node.value,
                left: node.left ? { id: node.left.id } : undefined,
                right: node.right ? { id: node.right.id } : undefined
            };
        });
    },

    // Check if simulation has converged (all nodes are close to their targets)
    // We might not need this anymore if we rely on alphaMin and the 'end' event
    // hasSimulationConverged: (simNodes: SimulationNode[]): boolean => { ... }

    // Create custom force factory for moving nodes toward target positions
    createTargetForce: () => {
        let nodes: SimulationNode[] = [];

        const force = (alpha: number) => {
            // Apply force toward target position with alpha as strength modifier
            for (const node of nodes) {
                if (node.targetX !== undefined && node.targetY !== undefined) {
                    node.vx = (node.targetX - node.x) * alpha * 0.3;
                    node.vy = (node.targetY - node.y) * alpha * 0.3;
                }
            }
        };

        force.initialize = (newNodes: SimulationNode[]) => {
            nodes = newNodes;
        };

        return force;
    },

    // Setup and run a simulation for rotation
    setupRotationSimulation: (
        simNodes: SimulationNode[],
        onTick: (simNodes: SimulationNode[]) => void,
        onComplete: () => void
    ): d3.Simulation<d3.SimulationNodeDatum, undefined> => {
        // Setup force simulation
        const simulation = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
            // *** START EDIT 1 ***
            // .alphaTarget(0) // Keep alpha decaying naturally
            .alphaDecay(0.03) // Keep existing decay
            .alphaMin(0.1) // Set a minimum alpha threshold for automatic stopping
            .velocityDecay(0.3) // Keep existing velocity decay
            // *** END EDIT 1 ***
            .force('target', AnimationUtils.createTargetForce());

        // Handle simulation ticks
        simulation.on('tick', () => {
            // Update visual representation during the simulation
            AnimationUtils.updateNodesFromSimulation(simNodes);

            // Call custom tick handler (if needed for other effects)
            onTick(simNodes);

            // *** START EDIT 2 ***
            // Remove the convergence check from here
            // if (AnimationUtils.hasSimulationConverged(simNodes)) {
            //     simulation.stop();
            //     // ... logic moved to 'end' event ...
            // }
            // *** END EDIT 2 ***
        });

        // *** START EDIT 3 ***
        // Handle simulation end event
        simulation.on('end', () => {
            console.log("Simulation ended."); // Debug log

            // Ensure nodes are exactly at their target positions upon completion
            simNodes.forEach(node => {
                if (node.targetX !== undefined && node.targetY !== undefined) {
                    // Use nullish coalescing for safety, though targets should be defined
                    node.x = node.targetX ?? node.x;
                    node.y = node.targetY ?? node.y;
                }
            });

            // Update visuals one last time with snapped positions
            AnimationUtils.updateNodesFromSimulation(simNodes);

            // Call the original completion callback
            onComplete();
        });
        // *** END EDIT 3 ***

        // Start the simulation
        simulation.alpha(0.8).restart(); // Start with high alpha

        return simulation;
    },

    // Calculate target positions for rotation animations
    calculateRotationTargetPositions: (
        node: TreeNode,
        childNode: TreeNode,
        direction: RotationDirection
    ): Map<string, Position> => {
        const targetPositions = new Map<string, Position>();

        if (direction === 'left') {
            // Node will move down and to the left
            targetPositions.set(node.id, { x: node.x - 50, y: node.y + 50 });
            // Right child will take node's position
            targetPositions.set(childNode.id, { x: node.x, y: node.y });
        } else { // 'right'
            // Node will move down and to the right
            targetPositions.set(node.id, { x: node.x + 50, y: node.y + 50 });
            // Left child will take node's position
            targetPositions.set(childNode.id, { x: node.x, y: node.y });
        }

        return targetPositions;
    },

    // Create animated links for rotations
    createRotationAnimatedLinks: (
        node: TreeNode,
        childNode: TreeNode,
        grandchildNode: TreeNode | undefined,
        direction: RotationDirection
    ): AnimatedLinkData[] => {
        const newAnimatedLinks: AnimatedLinkData[] = [];

        // Determine the new position for the node after rotation
        const nodeNewPosition: Position = direction === 'left'
            ? { x: node.x - 50, y: node.y + 50 }
            : { x: node.x + 50, y: node.y + 50 };

        // 1. Link to be deleted (parent -> child)
        newAnimatedLinks.push({
            id: `delete-${node.id}-${childNode.id}`,
            startSource: { x: node.x, y: node.y },
            startTarget: { x: childNode.x, y: childNode.y },
            endSource: { x: node.x, y: node.y },
            endTarget: { x: childNode.x, y: childNode.y },
            type: 'delete',
            progress: 0
        });

        // 2. Link to be created (child -> parent at new position)
        newAnimatedLinks.push({
            id: `create-${childNode.id}-${node.id}`,
            startSource: { x: childNode.x, y: childNode.y },
            startTarget: nodeNewPosition,
            endSource: { x: childNode.x, y: childNode.y },
            endTarget: nodeNewPosition,
            type: 'create',
            progress: 0
        });

        // 3. If the child has a grandchild that will be reparented
        if (grandchildNode) {
            newAnimatedLinks.push({
                id: `reparent-${grandchildNode.id}`,
                startSource: { x: childNode.x, y: childNode.y }, // Old parent
                startTarget: { x: grandchildNode.x, y: grandchildNode.y },
                endSource: nodeNewPosition, // New parent (node's new position)
                endTarget: { x: grandchildNode.x, y: grandchildNode.y },
                type: 'reparent',
                progress: 0
            });
        }

        return newAnimatedLinks;
    },

    // Update DOM from simulation state
    updateNodesFromSimulation: (simNodes: SimulationNode[]) => {
        // Update node positions visually
        simNodes.forEach(simNode => {
            const nodeElement = d3.select(`g.node-${simNode.id}`);
            if (!nodeElement.empty()) {
                nodeElement.attr('transform', `translate(${simNode.x},${simNode.y})`);
            }
        });

        // Update link positions
        const nodeMap = new Map<string, { x: number, y: number }>();
        simNodes.forEach(node => {
            nodeMap.set(node.id, { x: node.x || 0, y: node.y || 0 });
        });

        // Update links
        d3.selectAll('line.link').each(function () {
            const link = d3.select(this);
            const sourceId = link.attr('data-source-id');
            const targetId = link.attr('data-target-id');

            const source = nodeMap.get(sourceId);
            const target = nodeMap.get(targetId);

            if (source && target) {
                link
                    .attr('x1', source.x)
                    .attr('y1', source.y)
                    .attr('x2', target.x)
                    .attr('y2', target.y);
            }
        });
    },

    // Update animated links during rotation
    updateAnimatedLinks: (links: AnimatedLinkData[]): AnimatedLinkData[] => {
        if (links.length === 0) return links;

        return links.map(link => ({
            ...link,
            progress: Math.min(link.progress + 0.05, 1)  // All links animate once node animation is complete
        }));
    }
};

export default AnimationUtils; 