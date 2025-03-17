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
- A tutor can quickly reposition subtrees:
  - Dragging an existing node will drag the subtree along with it.
- A tutor can quickly perform rebalancing rotations on nodes
  - Hovering very near a node should reveal a rotation indicator.
  - Dragging on the rotation indicator should step by step perform the appropriate rotation, without repositioning subtrees.

