import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { EducationalOrgSchema } from '@/components/seo/EducationalOrgSchema';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Star, Users, CheckCircle2, TrendingUp, Award, Zap } from 'lucide-react';

const btechFAQs = [
    {
        question: "What BTech notes are available on NoteVault?",
        answer: "We offer comprehensive BTech notes for all major branches including Computer Science, Mechanical, Electrical, Civil, Electronics, and more. Our collection covers all 8 semesters with subjects like Data Structures, Algorithms, DBMS, Operating Systems, Thermodynamics, Fluid Mechanics, Circuit Theory, and many others."
    },
    {
        question: "Are BTech notes verified by professors?",
        answer: "Yes, all BTech notes on NoteVault are quality-checked and verified by subject matter experts and professors. We ensure accuracy, completeness, and alignment with university syllabi before listing any notes."
    },
    {
        question: "Can I get semester-wise BTech notes?",
        answer: "Absolutely! Our BTech notes are organized semester-wise from 1st to 8th semester. You can filter by semester, branch, subject, and university to find exactly what you need for your exams."
    },
    {
        question: "How do BTech notes help in exam preparation?",
        answer: "Our BTech notes are created by top-scoring students and include key concepts, formulas, diagrams, previous year questions, and exam-focused content. They save study time and provide structured learning material for better exam performance."
    }
];

const breadcrumbItems = [
    { name: 'Home', url: 'https://frontend-blue-sigma-18.vercel.app/' },
    { name: 'BTech Notes', url: 'https://frontend-blue-sigma-18.vercel.app/hub/btech' }
];

const subjects = [
    { name: 'Data Structures', semester: '3rd', difficulty: 'Medium', popularity: 'High' },
    { name: 'Algorithms', semester: '4th', difficulty: 'Hard', popularity: 'High' },
    { name: 'Database Management Systems', semester: '5th', difficulty: 'Medium', popularity: 'Very High' },
    { name: 'Operating Systems', semester: '5th', difficulty: 'Medium', popularity: 'High' },
    { name: 'Computer Networks', semester: '6th', difficulty: 'Medium', popularity: 'High' },
    { name: 'Software Engineering', semester: '6th', difficulty: 'Easy', popularity: 'Medium' },
    { name: 'Theory of Computation', semester: '5th', difficulty: 'Hard', popularity: 'Medium' },
    { name: 'Compiler Design', semester: '7th', difficulty: 'Hard', popularity: 'Medium' },
];

const branches = [
    { name: 'Computer Science & Engineering', code: 'CSE', students: '50,000+' },
    { name: 'Mechanical Engineering', code: 'ME', students: '35,000+' },
    { name: 'Electrical Engineering', code: 'EE', students: '30,000+' },
    { name: 'Electronics & Communication', code: 'ECE', students: '40,000+' },
    { name: 'Civil Engineering', code: 'CE', students: '25,000+' },
    { name: 'Information Technology', code: 'IT', students: '45,000+' },
];

export default function BTechHub() {
    return (
        <Layout>
            <SEOHead
                title="BTech Notes - Complete Study Material for Engineering Students | All Semesters & Branches | NoteVault"
                description="Download verified BTech notes for all branches and semesters. 5000+ quality study materials for CSE, ME, EE, ECE, CE. Data Structures, DBMS, OS, Algorithms, and more. Created by top students."
                keywords="btech notes, engineering notes, computer science notes, mechanical engineering notes, electrical engineering notes, semester notes, study material, exam preparation, cse notes, data structures notes, dbms notes"
                canonical="https://frontend-blue-sigma-18.vercel.app/hub/btech"
            />
            <EducationalOrgSchema />
            <BreadcrumbSchema items={breadcrumbItems} />
            <FAQSchema faqs={btechFAQs} />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12 md:py-20">
                <div className="container">
                    <div className="max-w-4xl mx-auto text-center">
                        <Badge className="mb-4" variant="secondary">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            5000+ BTech Notes Available
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Complete BTech Notes Hub
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                            Your one-stop destination for verified BTech study material. Access quality notes from top students across all branches and semesters. Ace your exams with comprehensive, exam-focused content.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link to="/browse?degree=BTech">
                                <Button size="lg" className="gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Browse All BTech Notes
                                </Button>
                            </Link>
                            <Link to="/how-it-works">
                                <Button size="lg" variant="outline" className="gap-2">
                                    <Zap className="w-5 h-5" />
                                    How It Works
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 border-b">
                <div className="container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <div className="text-3xl font-bold">5000+</div>
                                <div className="text-sm text-muted-foreground">Notes Available</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <div className="text-3xl font-bold">50K+</div>
                                <div className="text-sm text-muted-foreground">Students Helped</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <div className="text-3xl font-bold">4.8/5</div>
                                <div className="text-sm text-muted-foreground">Average Rating</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <Download className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <div className="text-3xl font-bold">100K+</div>
                                <div className="text-sm text-muted-foreground">Downloads</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12">
                <div className="container">
                    <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
                        <h2>Why BTech Notes Matter for Your Success</h2>
                        <p>
                            Engineering education in India is highly competitive, with over 1.5 million students pursuing BTech degrees across various branches. Success in BTech requires not just attending lectures but also having access to quality study material that simplifies complex concepts and provides exam-focused preparation.
                        </p>
                        <p>
                            Quality BTech notes serve as your personal study companion, offering structured learning material created by students who have excelled in the same subjects. These notes distill months of classroom learning into concise, understandable formats that save time and improve retention.
                        </p>

                        <h2>What Makes NoteVault's BTech Notes Different?</h2>
                        <p>
                            Unlike generic study material available online, our BTech notes are created by top-scoring students from premier engineering colleges across India. Each note undergoes rigorous quality checks to ensure accuracy, completeness, and alignment with university syllabi.
                        </p>

                        <div className="not-prose my-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-primary" />
                                        Quality Assurance Process
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                            <span>Created by students who scored 85%+ in the subject</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                            <span>Verified by subject matter experts and professors</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                            <span>Aligned with latest university syllabi</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                            <span>Include previous year questions and solutions</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                            <span>Regular updates based on syllabus changes</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <h2>BTech Branches Covered</h2>
                        <p>
                            We offer comprehensive notes for all major BTech branches. Whether you're studying Computer Science, Mechanical, Electrical, or any other engineering discipline, you'll find quality study material tailored to your needs.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-6xl mx-auto">
                        {branches.map((branch) => (
                            <Card key={branch.code} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                                    <CardDescription>{branch.code}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{branch.students} students</span>
                                        <Link to={`/browse?degree=BTech&branch=${branch.code}`}>
                                            <Button size="sm" variant="outline">Browse Notes</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert mt-12">
                        <h2>Popular BTech Subjects</h2>
                        <p>
                            Our most downloaded BTech notes cover core subjects that are common across branches as well as specialized subjects for specific engineering disciplines. Here are the subjects that students find most valuable:
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mt-8 max-w-6xl mx-auto">
                        {subjects.map((subject) => (
                            <Card key={subject.name} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">{subject.name}</CardTitle>
                                            <CardDescription>Typically taught in {subject.semester} Semester</CardDescription>
                                        </div>
                                        <Badge variant={subject.difficulty === 'Hard' ? 'destructive' : subject.difficulty === 'Medium' ? 'secondary' : 'default'}>
                                            {subject.difficulty}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            {subject.popularity} Demand
                                        </span>
                                        <Link to={`/browse?degree=BTech&subject=${encodeURIComponent(subject.name)}`}>
                                            <Button size="sm">View Notes</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert mt-12">
                        <h2>How to Choose the Right BTech Notes</h2>
                        <p>
                            Selecting the right study material is crucial for effective exam preparation. Here's what to look for when choosing BTech notes:
                        </p>
                        <ol>
                            <li><strong>Syllabus Coverage:</strong> Ensure the notes cover your complete university syllabus</li>
                            <li><strong>Clarity:</strong> Look for notes with clear explanations and well-organized content</li>
                            <li><strong>Visual Aids:</strong> Diagrams, flowcharts, and tables enhance understanding</li>
                            <li><strong>Practice Questions:</strong> Notes with solved examples and practice problems are invaluable</li>
                            <li><strong>Ratings & Reviews:</strong> Check what other students say about the notes</li>
                        </ol>

                        <h2>Semester-wise Study Strategy</h2>
                        <p>
                            Different semesters require different study approaches. Here's how to make the most of your BTech notes:
                        </p>

                        <h3>First & Second Semester</h3>
                        <p>
                            Focus on building strong fundamentals in Mathematics, Physics, Chemistry, and Engineering Drawing. These foundation subjects are crucial for understanding advanced concepts in later semesters.
                        </p>

                        <h3>Third & Fourth Semester</h3>
                        <p>
                            Core subjects like Data Structures, Digital Electronics, and Thermodynamics begin. This is when branch-specific learning intensifies. Quality notes become essential for understanding complex algorithms and circuits.
                        </p>

                        <h3>Fifth & Sixth Semester</h3>
                        <p>
                            Advanced subjects like DBMS, Operating Systems, and specialized branch subjects require deep understanding. Notes with real-world examples and case studies are particularly helpful.
                        </p>

                        <h3>Seventh & Eighth Semester</h3>
                        <p>
                            Focus shifts to electives, projects, and placements. Notes for specialized subjects and interview preparation become important.
                        </p>

                        <h2>Benefits of Using Quality BTech Notes</h2>
                        <ul>
                            <li><strong>Time Savings:</strong> Condensed content saves hours of textbook reading</li>
                            <li><strong>Better Retention:</strong> Structured format improves memory and recall</li>
                            <li><strong>Exam Focus:</strong> Emphasis on important topics and previous year questions</li>
                            <li><strong>Clarification:</strong> Complex concepts explained in simpler terms</li>
                            <li><strong>Revision Aid:</strong> Perfect for quick revision before exams</li>
                            <li><strong>Accessibility:</strong> Study anytime, anywhere with digital notes</li>
                        </ul>

                        <h2>Success Stories</h2>
                        <p>
                            Thousands of BTech students have improved their grades using NoteVault notes. Our users consistently report better understanding of subjects, improved exam scores, and reduced study stress.
                        </p>

                        <h2>Get Started Today</h2>
                        <p>
                            Browse our extensive collection of BTech notes, filter by your branch and semester, and start your journey to academic excellence. With instant downloads and 24-hour money-back guarantee, there's no risk in trying our notes.
                        </p>
                    </div>

                    <div className="mt-12 text-center">
                        <Link to="/browse?degree=BTech">
                            <Button size="lg" className="gap-2">
                                <BookOpen className="w-5 h-5" />
                                Explore All BTech Notes
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
