import React, { useState, useEffect } from 'react';
import './StableSortVisualizer.css';

interface Card {
    key: number;     // Primary sort key (e.g., value)
    id: number;      // Secondary attribute (unique identifier)
    color: string;   // For visual distinction
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
    const [isAnimating, setIsAnimating] = useState(false);
    const [showUnstable, setShowUnstable] = useState(false);

    // Generate initial dataset with one pair of duplicate keys
    useEffect(() => {
        const initialCards: Card[] = [
            { key: 5, id: 1, color: '#FF5733' },
            { key: 3, id: 2, color: '#33FF57' },
            { key: 4, id: 3, color: '#3357FF' }, // First card with key=4
            { key: 1, id: 4, color: '#F3FF33' },
            { key: 4, id: 5, color: '#FF33F6' }, // Second card with key=4
            { key: 2, id: 6, color: '#33FFF6' },
        ];
        setCards(initialCards);

        // Pre-calculate sort steps
        const stableSteps = generateInsertionSortSteps([...initialCards]);
        const unstableSteps = generateSelectionSortSteps([...initialCards]);

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

    const runSortingDemo = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        setStableCurrentStep(0);
        setUnstableCurrentStep(0);
        setShowUnstable(false);

        // Animate stable sort
        let stableStep = 0;
        const stableTimer = setInterval(() => {
            if (stableStep < stableSortSteps.length - 1) {
                stableStep++;
                setStableCurrentStep(stableStep);
            } else {
                clearInterval(stableTimer);

                // After stable sort finishes, start unstable sort with a delay
                setTimeout(() => {
                    setShowUnstable(true);

                    // Animate unstable sort
                    let unstableStep = 0;
                    const unstableTimer = setInterval(() => {
                        if (unstableStep < unstableSortSteps.length - 1) {
                            unstableStep++;
                            setUnstableCurrentStep(unstableStep);
                        } else {
                            clearInterval(unstableTimer);
                            setIsAnimating(false);
                        }
                    }, 1000);
                }, 2000);
            }
        }, 1000);
    };

    const resetDemo = () => {
        setIsAnimating(false);
        setStableCurrentStep(0);
        setUnstableCurrentStep(0);
        setShowUnstable(false);
    };

    const stepForward = () => {
        if (isAnimating) return;

        if (!showUnstable && stableCurrentStep < stableSortSteps.length - 1) {
            setStableCurrentStep(prevStep => prevStep + 1);
        } else if (showUnstable && unstableCurrentStep < unstableSortSteps.length - 1) {
            setUnstableCurrentStep(prevStep => prevStep + 1);
        }
    };

    const stepBackward = () => {
        if (isAnimating) return;

        if (!showUnstable && stableCurrentStep > 0) {
            setStableCurrentStep(prevStep => prevStep - 1);
        } else if (showUnstable && unstableCurrentStep > 0) {
            setUnstableCurrentStep(prevStep => prevStep - 1);
        }
    };

    const renderCards = (cardArr: Card[], highlightIndices?: [number, number]) => {
        return cardArr.map((card, index) => (
            <div
                key={card.id}
                className={`card ${highlightIndices?.includes(index) ? 'highlighted' : ''}`}
                style={{ backgroundColor: card.color }}
            >
                <div className="card-key">{card.key}</div>
                <div className="card-id">ID: {card.id}</div>
            </div>
        ));
    };

    return (
        <div className="stable-sort-visualizer">
            <div className="p-6 bg-gray-100 rounded-lg shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold mb-2">Sorting Algorithm Stability Visualizer</h1>
                    <p className="text-gray-600 mb-4">
                        {showUnstable
                            ? "Selection Sort (Unstable) - Notice how elements with the same key may change relative order"
                            : "Insertion Sort (Stable) - Notice how elements with the same key maintain relative order"}
                    </p>
                    <div className="space-x-4">
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            onClick={runSortingDemo}
                            disabled={isAnimating}
                        >
                            Run Demo
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                            onClick={resetDemo}
                            disabled={isAnimating}
                        >
                            Reset
                        </button>
                        <button
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            onClick={stepForward}
                            disabled={isAnimating ||
                                (!showUnstable && stableCurrentStep >= stableSortSteps.length - 1) ||
                                (showUnstable && unstableCurrentStep >= unstableSortSteps.length - 1)}
                        >
                            Step Forward
                        </button>
                        <button
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                            onClick={stepBackward}
                            disabled={isAnimating ||
                                (!showUnstable && stableCurrentStep <= 0) ||
                                (showUnstable && unstableCurrentStep <= 0)}
                        >
                            Step Back
                        </button>
                    </div>
                </div>

                <div className="visualization-container">
                    <div className="array-container">
                        <h3>Stable Sort (Insertion Sort)</h3>
                        <div className="step-description">
                            {stableSortSteps[stableCurrentStep]?.description || ""}
                        </div>
                        <div className="card-container">
                            {stableSortSteps[stableCurrentStep] &&
                                renderCards(
                                    stableSortSteps[stableCurrentStep].array,
                                    stableSortSteps[stableCurrentStep].swappedIndices
                                )
                            }
                        </div>
                    </div>

                    {showUnstable && (
                        <div className="array-container">
                            <h3>Unstable Sort (Selection Sort)</h3>
                            <div className="step-description">
                                {unstableSortSteps[unstableCurrentStep]?.description || ""}
                            </div>
                            <div className="card-container">
                                {unstableSortSteps[unstableCurrentStep] &&
                                    renderCards(
                                        unstableSortSteps[unstableCurrentStep].array,
                                        unstableSortSteps[unstableCurrentStep].swappedIndices
                                    )
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StableSortVisualizer;