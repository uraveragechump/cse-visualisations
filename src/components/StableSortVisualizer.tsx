import React, { useState, useEffect } from 'react';
import './StableSortVisualizer.css';

interface Card {
    key: number;     // Primary sort key (e.g., value)
    id: number;      // Secondary attribute (unique identifier)
    color: string;   // For visual distinction
    instanceNum?: number; // Instance number for duplicate keys
}

// For animation purposes - captures each step of the sorting process
interface SortStep {
    array: Card[];
    description: string;
    swappedIndices?: [number, number]; // Highlight the indices being swapped
}

const StableSortVisualizer: React.FC = () => {
    const [cards, setCards] = useState<Card[]>([]);
    const [stableSortSteps, setStableSortSteps] = useState<SortStep[]>([]);
    const [unstableSortSteps, setUnstableSortSteps] = useState<SortStep[]>([]);
    const [stableCurrentStep, setStableCurrentStep] = useState(0);
    const [unstableCurrentStep, setUnstableCurrentStep] = useState(0);
    const [isStableAnimating, setIsStableAnimating] = useState(false);
    const [isUnstableAnimating, setIsUnstableAnimating] = useState(false);

    // Generate initial dataset with one pair of duplicate keys
    useEffect(() => {
        // Initial cards without instance numbers
        const initialCards: Card[] = [
            { key: 5, id: 1, color: '#D84315' },  // Darker orange
            { key: 3, id: 2, color: '#2E7D32' },  // Darker green
            { key: 4, id: 3, color: '#303F9F' },  // Darker blue
            { key: 1, id: 4, color: '#F9A825' },  // Muted gold instead of bright yellow
            { key: 4, id: 5, color: '#7B1FA2' },  // Purple
            { key: 2, id: 6, color: '#00796B' },  // Darker teal
        ];

        // Find duplicate keys and assign instance numbers
        const keyInstanceCount: Record<number, number> = {};
        const cardsWithInstances = initialCards.map(card => {
            // For each card, check if its key has been seen before
            // If it has, increment the instance count and assign it
            keyInstanceCount[card.key] = (keyInstanceCount[card.key] || 0) + 1;
            return {
                ...card,
                instanceNum: keyInstanceCount[card.key]
            };
        });

        setCards(cardsWithInstances);

        // Pre-calculate sort steps
        const stableSteps = generateInsertionSortSteps([...cardsWithInstances]);
        const unstableSteps = generateSelectionSortSteps([...cardsWithInstances]);

        setStableSortSteps(stableSteps);
        setUnstableSortSteps(unstableSteps);
    }, []);

    // Insertion Sort - Stable
    const generateInsertionSortSteps = (arr: Card[]): SortStep[] => {
        const steps: SortStep[] = [];
        const array = [...arr];

        // Initial state
        steps.push({
            array: [...array],
            description: "Starting array"
        });

        for (let i = 1; i < array.length; i++) {
            const current = array[i];

            steps.push({
                array: [...array],
                description: `Considering element with key ${current.key} (ID: ${current.id})`,
                swappedIndices: [i, i]
            });

            let j = i - 1;
            while (j >= 0 && array[j].key > current.key) {
                const temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;

                steps.push({
                    array: [...array],
                    description: `Moving element with key ${array[j].key} (ID: ${array[j].id}) to the right`,
                    swappedIndices: [j, j + 1]
                });

                j--;
            }

            array[j + 1] = current;

            if (j + 1 !== i) {
                steps.push({
                    array: [...array],
                    description: `Placing element with key ${current.key} (ID: ${current.id}) at position ${j + 1}`,
                    swappedIndices: [j + 1, j + 1]
                });
            }
        }

        steps.push({
            array: [...array],
            description: "Insertion sort complete! Notice how elements with key=4 maintained their original order."
        });

        return steps;
    };

    // Selection Sort - Unstable
    const generateSelectionSortSteps = (arr: Card[]): SortStep[] => {
        const steps: SortStep[] = [];
        const array = [...arr];

        // Initial state
        steps.push({
            array: [...array],
            description: "Starting array"
        });

        for (let i = 0; i < array.length - 1; i++) {
            let minIndex = i;

            steps.push({
                array: [...array],
                description: `Finding minimum element starting from position ${i}`,
                swappedIndices: [i, i]
            });

            for (let j = i + 1; j < array.length; j++) {
                if (array[j].key < array[minIndex].key) {
                    minIndex = j;

                    steps.push({
                        array: [...array],
                        description: `Found new minimum with key ${array[j].key} (ID: ${array[j].id}) at position ${j}`,
                        swappedIndices: [j, j]
                    });
                }
            }

            if (minIndex !== i) {
                // This swap is what makes selection sort unstable
                const temp = { ...array[i] };
                array[i] = { ...array[minIndex] };
                array[minIndex] = temp;

                steps.push({
                    array: [...array],
                    description: `Swapping elements: key ${array[i].key} (ID: ${array[i].id}) and key ${array[minIndex].key} (ID: ${array[minIndex].id})`,
                    swappedIndices: [i, minIndex]
                });
            }
        }

        steps.push({
            array: [...array],
            description: "Selection sort complete! Notice how elements with key=4 may have changed their original order."
        });

        return steps;
    };

    const runStableSort = () => {
        if (isStableAnimating) return;

        setIsStableAnimating(true);
        setStableCurrentStep(0);

        // Animate stable sort
        let stableStep = 0;
        const stableTimer = setInterval(() => {
            if (stableStep < stableSortSteps.length - 1) {
                stableStep++;
                setStableCurrentStep(stableStep);
            } else {
                clearInterval(stableTimer);
                setIsStableAnimating(false);
            }
        }, 1000);
    };

    const runUnstableSort = () => {
        if (isUnstableAnimating) return;

        setIsUnstableAnimating(true);
        setUnstableCurrentStep(0);

        // Animate unstable sort
        let unstableStep = 0;
        const unstableTimer = setInterval(() => {
            if (unstableStep < unstableSortSteps.length - 1) {
                unstableStep++;
                setUnstableCurrentStep(unstableStep);
            } else {
                clearInterval(unstableTimer);
                setIsUnstableAnimating(false);
            }
        }, 1000);
    };

    const resetDemo = () => {
        setIsStableAnimating(false);
        setIsUnstableAnimating(false);
        setStableCurrentStep(0);
        setUnstableCurrentStep(0);
    };

    const stepForwardStable = () => {
        if (isStableAnimating) return;

        if (stableCurrentStep < stableSortSteps.length - 1) {
            setStableCurrentStep(prevStep => prevStep + 1);
        }
    };

    const stepBackwardStable = () => {
        if (isStableAnimating) return;

        if (stableCurrentStep > 0) {
            setStableCurrentStep(prevStep => prevStep - 1);
        }
    };

    const stepForwardUnstable = () => {
        if (isUnstableAnimating) return;

        if (unstableCurrentStep < unstableSortSteps.length - 1) {
            setUnstableCurrentStep(prevStep => prevStep + 1);
        }
    };

    const stepBackwardUnstable = () => {
        if (isUnstableAnimating) return;

        if (unstableCurrentStep > 0) {
            setUnstableCurrentStep(prevStep => prevStep - 1);
        }
    };

    const renderCards = (cardArr: Card[], highlightIndices?: [number, number]) => {
        // Find duplicate keys in the array
        const keyFrequency: Record<number, number> = {};
        const duplicateKeys: Set<number> = new Set();

        cardArr.forEach(card => {
            keyFrequency[card.key] = (keyFrequency[card.key] || 0) + 1;
            if (keyFrequency[card.key] > 1) {
                duplicateKeys.add(card.key);
            }
        });

        // Show a label above the visualization if there are duplicate keys
        const hasDuplicates = Array.from(duplicateKeys).length > 0;

        return (
            <>
                {hasDuplicates && (
                    <div className="text-center text-gray-600 text-sm font-semibold mb-2">
                        Cards with same key value have arrows below them
                    </div>
                )}

                {/* Card container with built-in arrows */}
                <div className="card-container">
                    {cardArr.map((card, index) => {
                        // Check if this card has a duplicate key
                        let showArrow = false;

                        if (duplicateKeys.has(card.key)) {
                            showArrow = true;
                        }

                        const isHighlighted = highlightIndices?.includes(index);

                        return (
                            <div key={card.id} className="flex flex-col items-center" style={{ margin: '0 5px' }}>
                                {/* Card */}
                                <div
                                    className={`card ${isHighlighted ? 'highlighted' : ''}`}
                                    style={{ backgroundColor: card.color, marginBottom: '5px' }}
                                >
                                    <div className="card-key">
                                        {card.key}
                                    </div>
                                    <div className="card-id">ID: {card.id}</div>
                                </div>

                                {/* Arrow space - shows arrow for duplicate keys, empty for others */}
                                <div className="h-8 flex items-center justify-center">
                                    {showArrow && (
                                        <div className="text-center">
                                            <div
                                                className="text-xl"
                                                style={{
                                                    color: card.color,
                                                    fontWeight: 'bold',
                                                    textShadow: '0px 0px 3px rgba(0,0,0,0.7)',
                                                    lineHeight: 1
                                                }}
                                            >
                                                ↑
                                            </div>
                                            <div style={{
                                                color: card.color,
                                                fontWeight: 'bold',
                                                fontSize: '10px',
                                                textShadow: '0px 0px 1px rgba(0,0,0,0.7)'
                                            }}>
                                                #{card.instanceNum}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    return (
        <div className="stable-sort-visualizer">
            <div className="p-6 bg-gray-100 rounded-lg shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold mb-2">Sorting Algorithm Stability Visualizer</h1>
                    <p className="text-gray-600 mb-4">
                        Compare stable and unstable sorting algorithms
                    </p>
                    <div className="space-x-4 mb-4">
                        <button 
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                            onClick={resetDemo}
                            disabled={isStableAnimating || isUnstableAnimating}
                        >
                            Reset All
                        </button>
                    </div>
                </div>

                <div className="visualization-container">
                    <div className="array-container">
                        <h3 className="text-xl font-semibold mb-2">Stable Sort (Insertion Sort)</h3>
                        <div className="mb-4 flex justify-center space-x-3">
                            <button 
                                className="px-3 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 disabled:opacity-50"
                                onClick={runStableSort}
                                disabled={isStableAnimating}
                            >
                                Run Insertion Sort
                            </button>
                            <button 
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                onClick={stepForwardStable}
                                disabled={isStableAnimating || stableCurrentStep >= stableSortSteps.length - 1}
                            >
                                Step Forward
                            </button>
                            <button 
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                                onClick={stepBackwardStable}
                                disabled={isStableAnimating || stableCurrentStep <= 0}
                            >
                                Step Back
                            </button>
                        </div>
                        <div className="step-description bg-blue-50 p-2 rounded mb-3">
                            {stableSortSteps[stableCurrentStep]?.description || ""}
                        </div>
                        {stableSortSteps[stableCurrentStep] &&
                            renderCards(
                                stableSortSteps[stableCurrentStep].array,
                                stableSortSteps[stableCurrentStep].swappedIndices
                            )
                        }
                        <div className="text-sm text-gray-600 mt-2 text-center">
                            Step {stableCurrentStep + 1} of {stableSortSteps.length}
                        </div>
                    </div>
                </div>

                <div className="array-container mt-8">
                    <h3 className="text-xl font-semibold mb-2">Unstable Sort (Selection Sort)</h3>
                    <div className="mb-4 flex justify-center space-x-3">
                        <button
                            className="px-3 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 disabled:opacity-50"
                            onClick={runUnstableSort}
                            disabled={isUnstableAnimating}
                        >
                            Run Selection Sort
                        </button>
                        <button
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            onClick={stepForwardUnstable}
                            disabled={isUnstableAnimating || unstableCurrentStep >= unstableSortSteps.length - 1}
                        >
                            Step Forward
                        </button>
                        <button
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                            onClick={stepBackwardUnstable}
                            disabled={isUnstableAnimating || unstableCurrentStep <= 0}
                        >
                            Step Back
                        </button>
                    </div>
                    <div className="step-description bg-purple-50 p-2 rounded mb-3">
                        {unstableSortSteps[unstableCurrentStep]?.description || ""}
                    </div>
                    {unstableSortSteps[unstableCurrentStep] &&
                        renderCards(
                            unstableSortSteps[unstableCurrentStep].array,
                            unstableSortSteps[unstableCurrentStep].swappedIndices
                        )
                    }
                    <div className="text-sm text-gray-600 mt-2 text-center">
                        Step {unstableCurrentStep + 1} of {unstableSortSteps.length}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StableSortVisualizer;