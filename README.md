# README

This repo hosts tools to help tutor the COMP2521 course at UNSW.

- Sorting Visualisation (Week 3)
- Tree Visualisation (Week 5)

## Sorting Visualisation

App shows stable vs unstable sorts

## Tree Visualisation

This app allows tutors to create and manipulate Tree nodes visually

- A tutor can create a node by clicking in the workspace. Doing so will show an editable number, defaulting to a random number above 5.
- A tutor can quickly create a connected node by clicking close to an existing node, following structure rules of a Binary Search Tree:
  - Hovering the mouse near an existing node should show a dotted line and a dotted node, to preview the clicking action.
  - Clicking below and to the left creates a child node with a smaller value, defaulting to half the value of the parent node.
  - Clicking below and to the right creates a child node with a larger value, defaulting to twice the value of the parent node.
  - Clicking above and to the left creates a parent node with a smaller value, defaulting to half the value of the parent node.
  - Clicking above and to the right creates a parent node with a larger value, defaulting to twice the value of the parent node.
  - Right clicking a leaf node deletes that node (and corresponding links)
- A tutor can quickly reposition subtrees:
  - Dragging an existing node will drag the subtree along with it.
- A tutor can quickly perform rebalancing rotations on nodes
  - Hovering very near a node should reveal a rotation indicator.
  - Clicking on the rotation indicators performs left or right rotations with animated visualizations.

### BST Validation Constraints

- The system enforces Binary Search Tree structural constraints:
  - Preview nodes only appear for valid positions (e.g., no previews shown for already occupied child positions)
  - Left child nodes must have values less than their parent
  - Right child nodes must have values greater than their parent

### Animation Features

- Tree rotations include detailed animations to help visualize structural changes:
  - Sequential animation flow: nodes move to their positions first, followed by link animations
  - Color-coded links during rotation:
    - Green links indicate creation of new connections
    - Red links indicate deletion of existing connections
    - Blue links indicate reparenting of child nodes
  - Physics-based animations using D3's force simulation for smooth node movements
  - Link animation behaviors:
    - Created links grow from source to target
    - Deleted links retract from target back to source
    - Reparented links appear after node movement is complete

These features make the tool particularly effective for demonstrating binary search tree operations, helping students understand both the structural and algorithmic aspects of BST manipulations.

