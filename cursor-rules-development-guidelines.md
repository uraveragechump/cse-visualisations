# Incremental Refactoring Guidelines

## Core Principles

1. **Small, focused changes**: Each refactoring step should focus on a single concern or aspect of the code.
2. **Preserve functionality**: Changes should not alter the behavior of the component.
3. **Test after each change**: Allow the user to verify that functionality remains intact between changes.
4. **Clear commit messages**: Describe what was changed and why for each refactoring step.

## Refactoring Process

### Step 1: Analysis Before Changes
- Before making any changes, identify specific issues or patterns that need refactoring
- Document the current behavior that needs to be preserved
- Create a list of planned refactorings, ordered by dependency (changes that don't depend on others first)

### Step 2: Incremental Changes
- Focus on one change at a time
- Prefer multiple small PRs over one large PR
- Changes should be atomic (i.e., they should be complete in themselves)
- Each change should leave the code in a working state

### Step 3: Testing Between Changes
- After each change, pause for user review and testing
- Verify that the component still renders correctly
- Verify that all interactions still work as expected
- Address any issues before proceeding to the next change

## Types of Refactorings (in recommended order)

1. **Type Definitions**
   - Extract and refine interfaces and types
   - Ensure consistent naming
   - Add documentation

2. **Utility Functions**
   - Extract pure functions that don't depend on component state
   - Group related functions into utility objects
   - Test in isolation when possible

3. **Component Structure**
   - Extract helper components
   - Improve props passing
   - Refactor render methods for clarity

4. **State Management**
   - Consolidate related state
   - Improve update patterns
   - Extract complex state logic into custom hooks

5. **Event Handlers**
   - Simplify event handlers
   - Ensure consistent patterns
   - Improve error handling

## TreeVisualizer Specific Guidelines

### Specific Areas to Refactor

1. **Interface Consolidation**
   - Create a unified `Position` interface for x/y coordinates
   - Add a `RotationDirection` type enum

2. **Rotation Logic**
   - Extract common logic from `rotateLeft` and `rotateRight`
   - Create helper functions for calculating positions and building animations

3. **Animation System**
   - Separate animation creation from state updates
   - Improve animation timing and coordination

4. **Rendering Logic**
   - Break down the render method into smaller functions
   - Extract common SVG elements into helper components

### Testing Checkpoints

After refactoring each of these areas, verify:

1. Tree creation and node addition works
2. Node dragging works
3. Node preview works
4. Rotations work correctly (both left and right)
5. Animation of links works correctly
6. Node deletion works

## Documentation Requirements

Each refactoring PR should include:

1. What was refactored
2. Why it was refactored
3. How it preserves the existing behavior
4. What testing was done to verify 