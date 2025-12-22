import React, { useState } from 'react';
import { Brain, Zap, BookOpen, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudentArchetype = 'optimizer' | 'crammer' | 'thorough' | 'budget';

interface ArchetypeQuizProps {
    onComplete: (archetype: StudentArchetype) => void;
    className?: string;
}

interface ArchetypeResult {
    type: StudentArchetype;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    triggers: string[];
    cta: string;
}

const archetypes: Record<StudentArchetype, ArchetypeResult> = {
    optimizer: {
        type: 'optimizer',
        title: 'The Grade Optimizer',
        description: 'You focus on maximizing scores efficiently',
        icon: Brain,
        triggers: ['Score 90+', 'Exam-focused notes', 'Professor-approved content'],
        cta: 'Get Better Grades',
    },
    crammer: {
        type: 'crammer',
        title: 'The Last-Minute Crammer',
        description: 'You need quick, comprehensive revision',
        icon: Zap,
        triggers: ['Quick revision', 'Exam-ready summaries', 'Save 10+ hours'],
        cta: 'Instant Download',
    },
    thorough: {
        type: 'thorough',
        title: 'The Thorough Learner',
        description: 'You value deep understanding and complete coverage',
        icon: BookOpen,
        triggers: ['Complete coverage', 'Detailed explanations', 'Concept clarity'],
        cta: 'Master the Subject',
    },
    budget: {
        type: 'budget',
        title: 'The Budget Student',
        description: 'You seek maximum value for money',
        icon: DollarSign,
        triggers: ['Best price', 'Affordable quality', 'Student discounts'],
        cta: 'Save Money',
    },
};

/**
 * StudentArchetypeQuiz Component
 * Segments users into 4 psychological archetypes
 * Psychology: Personalized messaging increases conversion 18-30%
 */
export const StudentArchetypeQuiz: React.FC<ArchetypeQuizProps> = ({
    onComplete,
    className,
}) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);

    const questions = [
        {
            question: 'When do you typically start studying for exams?',
            options: [
                { text: 'Weeks in advance, methodically', archetypeScore: { thorough: 3, optimizer: 2 } },
                { text: '1-2 weeks before, efficiently', archetypeScore: { optimizer: 3, thorough: 1 } },
                { text: 'Few days before, intensely', archetypeScore: { crammer: 3, optimizer: 1 } },
                { text: 'Last minute, maximum pressure', archetypeScore: { crammer: 3 } },
            ],
        },
        {
            question: 'What matters most to you in study notes?',
            options: [
                { text: 'High scores with minimal effort', archetypeScore: { optimizer: 3 } },
                { text: 'Quick understanding before exam', archetypeScore: { crammer: 3 } },
                { text: 'Deep conceptual clarity', archetypeScore: { thorough: 3 } },
                { text: 'Best value for money', archetypeScore: { budget: 3 } },
            ],
        },
        {
            question: 'How do you prefer to learn?',
            options: [
                { text: 'Strategic shortcuts to key topics', archetypeScore: { optimizer: 2, crammer: 1 } },
                { text: 'Fast summaries and bullet points', archetypeScore: { crammer: 3 } },
                { text: 'Comprehensive, detailed explanations', archetypeScore: { thorough: 3 } },
                { text: 'Affordable, quality resources', archetypeScore: { budget: 2, optimizer: 1 } },
            ],
        },
    ];

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers, optionIndex];
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Calculate archetype
            const scores: Record<StudentArchetype, number> = {
                optimizer: 0,
                crammer: 0,
                thorough: 0,
                budget: 0,
            };

            newAnswers.forEach((answerIndex, questionIndex) => {
                const option = questions[questionIndex].options[answerIndex];
                Object.entries(option.archetypeScore).forEach(([type, points]) => {
                    scores[type as StudentArchetype] += points;
                });
            });

            // Get highest score
            const archetype = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as StudentArchetype);

            // Save to localStorage for personalization
            localStorage.setItem('student_archetype', archetype);

            onComplete(archetype);
        }
    };

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className={cn('max-w-2xl mx-auto p-6', className)}>
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Question {currentQuestion + 1} of {questions.length}
                </p>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold text-foreground mb-6">{question.question}</h2>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                                {option.text}
                            </span>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * ArchetypeResult Component
 * Shows personalized result after quiz
 */
interface ArchetypeResultProps {
    archetype: StudentArchetype;
    onContinue: () => void;
    className?: string;
}

export const ArchetypeResult: React.FC<ArchetypeResultProps> = ({
    archetype,
    onContinue,
    className,
}) => {
    const result = archetypes[archetype];
    const Icon = result.icon;

    return (
        <div className={cn('max-w-2xl mx-auto p-6 text-center', className)}>
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6">
                <Icon className="h-12 w-12 text-primary" />
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-3">{result.title}</h2>
            <p className="text-lg text-muted-foreground mb-8">{result.description}</p>

            <div className="bg-card border border-border rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-foreground mb-4">What resonates with you:</h3>
                <div className="space-y-2">
                    {result.triggers.map((trigger, index) => (
                        <div key={index} className="flex items-center gap-2 text-left">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-foreground/80">{trigger}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={onContinue}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
                {result.cta}
            </button>
        </div>
    );
};

/**
 * Hook to get current user archetype
 */
export const useStudentArchetype = (): StudentArchetype | null => {
    const [archetype, setArchetype] = useState<StudentArchetype | null>(null);

    React.useEffect(() => {
        const saved = localStorage.getItem('student_archetype');
        if (saved && saved in archetypes) {
            setArchetype(saved as StudentArchetype);
        }
    }, []);

    return archetype;
};

/**
 * Get messaging for specific archetype
 */
export const getArchetypeMessaging = (archetype: StudentArchetype | null) => {
    if (!archetype) return null;
    return archetypes[archetype];
};
