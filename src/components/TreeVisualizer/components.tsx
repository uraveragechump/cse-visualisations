// Component definitions for TreeVisualizer
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
    NodeProps,
    LinkProps,
    RotationControlsProps,
    TreeNode,
    AnimatedLinkData,
    LinkData,
    Position
} from './types';

// Utility functions for rendering (kept locally as requested)
export const RenderUtils = {
    // Create a tree node element
    createNodeElement: (
        node: TreeNode,
        options: {
            isPreview?: boolean,
            fill?: string,
            stroke?: string,
            opacity?: number,
            strokeDasharray?: string
        } = {}
    ) => {
        const {
            isPreview = false,
            fill = isPreview ? '#f0f0f0' : '#fff',
            stroke = isPreview ? '#999' : '#000',
            opacity = isPreview ? 0.6 : 1,
            strokeDasharray = isPreview ? '5,5' : undefined
        } = options;

        return (
            <g
                className={isPreview ? 'preview-node' : `node node-${node.id}`}
                transform={`translate(${node.x},${node.y})`}
            >
                <circle
                    r={20}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                    strokeDasharray={strokeDasharray}
                    opacity={opacity}
                />
                <text
                    textAnchor="middle"
                    dy="0.3em"
                    fontSize="12px"
                    fill={isPreview ? '#999' : '#000'}
                >
                    {node.value}
                </text>
            </g>
        );
    },

    // Create a link element
    createLinkElement: (
        source: Position,
        target: Position,
        options: {
            isPreview?: boolean,
            stroke?: string,
            strokeWidth?: number,
            opacity?: number,
            strokeDasharray?: string,
            id?: string,
            sourceId?: string,
            targetId?: string
        } = {}
    ) => {
        const {
            isPreview = false,
            stroke = '#999',
            strokeWidth = 2,
            opacity = isPreview ? 0.4 : 0.6,
            strokeDasharray = isPreview ? '5,5' : undefined,
            id,
            sourceId,
            targetId
        } = options;

        return (
            <line
                className={`link ${isPreview ? 'preview-link' : ''}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeDasharray={strokeDasharray}
                data-id={id}
                data-source-id={sourceId}
                data-target-id={targetId}
            />
        );
    }
};

// More declarative component for rendering tree nodes
export const Node: React.FC<NodeProps> = ({ node, onDragStart, onDrag, onDragEnd, onMouseEnter, onMouseLeave, onContextMenu, isHighlighted }) => {
    const nodeRef = useRef<SVGGElement>(null);

    useEffect(() => {
        if (!nodeRef.current) return;

        const dragBehavior = d3.drag()
            .on('start', (event) => onDragStart(event, node))
            .on('drag', (event) => onDrag(event, node))
            .on('end', (event) => onDragEnd(event, node));

        d3.select(nodeRef.current).call(dragBehavior as any);
    }, [node, onDragStart, onDrag, onDragEnd]);

    return (
        <g
            ref={nodeRef}
            className={`node node-${node.id} ${isHighlighted ? 'highlighted' : ''}`}
            transform={`translate(${node.x},${node.y})`}
            onMouseEnter={() => onMouseEnter(node.id)}
            onMouseLeave={onMouseLeave}
            onContextMenu={(e) => onContextMenu(e, node)}
        >
            <circle r={20} fill="#fff" stroke="#000" strokeWidth={2} />
            <text
                textAnchor="middle"
                dy="0.3em"
                fontSize="12px"
            >
                {node.value}
            </text>
        </g>
    );
};

// More declarative component for rendering links between nodes
export const Link: React.FC<LinkProps> = ({ link, nodeAnimationComplete = false }) => {
    // Check if it's an animated link
    if ('progress' in link) {
        // Handle animation based on type
        const animatedLink = link as AnimatedLinkData;

        // Don't render any animated links until node animation is complete
        if (!nodeAnimationComplete) {
            return null;
        }

        let x1, y1, x2, y2;

        // Set color based on animation type
        let color;
        switch (animatedLink.type) {
            case 'create':
                color = '#4CAF50'; // Green for creation
                break;
            case 'delete':
                color = '#F44336'; // Red for deletion
                break;
            case 'reparent':
                color = '#2196F3'; // Blue for reparenting
                break;
            default:
                color = '#999';
        }

        // Since nodeAnimationComplete is true, all links are active
        if (animatedLink.type === 'create') {
            // Start from source and extend towards target
            x1 = animatedLink.startSource.x;
            y1 = animatedLink.startSource.y;
            x2 = animatedLink.startSource.x + (animatedLink.endTarget.x - animatedLink.startSource.x) * animatedLink.progress;
            y2 = animatedLink.startSource.y + (animatedLink.endTarget.y - animatedLink.startSource.y) * animatedLink.progress;
        } else if (animatedLink.type === 'delete') {
            // Retract from target towards source
            x1 = animatedLink.startSource.x;
            y1 = animatedLink.startSource.y;
            x2 = animatedLink.startTarget.x + (animatedLink.startSource.x - animatedLink.startTarget.x) * animatedLink.progress;
            y2 = animatedLink.startTarget.y + (animatedLink.startSource.y - animatedLink.startTarget.y) * animatedLink.progress;
        } else { // reparent
            // Swing from old parent to new parent
            // Interpolate both source and target positions
            x1 = animatedLink.startSource.x + (animatedLink.endSource.x - animatedLink.startSource.x) * animatedLink.progress;
            y1 = animatedLink.startSource.y + (animatedLink.endSource.y - animatedLink.startSource.y) * animatedLink.progress;
            x2 = animatedLink.startTarget.x;
            y2 = animatedLink.startTarget.y;
        }

        return RenderUtils.createLinkElement(
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            {
                stroke: color,
                opacity: 0.8,
                strokeDasharray: animatedLink.type === 'delete' ? '5,5' : undefined,
                id: animatedLink.id
            }
        );
    }

    // Normal link rendering for non-animated links
    const normalLink = link as LinkData;
    return RenderUtils.createLinkElement(
        normalLink.source,
        normalLink.target,
        {
            isPreview: normalLink.type === 'preview',
            id: normalLink.id,
            sourceId: normalLink.source.id,
            targetId: normalLink.target.id
        }
    );
};

// Component for rotation controls
export const RotationControls: React.FC<RotationControlsProps> = ({ node, onRotateLeft, onRotateRight }) => {
    return (
        <g className="rotation-indicator">
            <circle
                cx={-30}
                cy={0}
                r={10}
                fill="#e0e0e0"
                stroke="#000"
                strokeWidth={1}
                onClick={() => onRotateLeft(node.id)}
            />
            <text
                x={-30}
                y={0}
                textAnchor="middle"
                dy="0.3em"
                fontSize="12px"
                pointerEvents="none"
            >
                ⟲
            </text>

            <circle
                cx={30}
                cy={0}
                r={10}
                fill="#e0e0e0"
                stroke="#000"
                strokeWidth={1}
                onClick={() => onRotateRight(node.id)}
            />
            <text
                x={30}
                y={0}
                textAnchor="middle"
                dy="0.3em"
                fontSize="12px"
                pointerEvents="none"
            >
                ⟳
            </text>
        </g>
    );
}; 