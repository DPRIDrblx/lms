export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  color: string;
  icon: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "reading" | "quiz" | "project" | "video";
  duration: string;
}

export const COURSES: Course[] = [
  {
    id: "math-101",
    title: "Mathematics",
    description: "Algebra, geometry, and problem-solving strategies for middle schoolers.",
    instructor: "Ms. Anindya",
    category: "STEM",
    color: "#6366F1",
    icon: "calculator",
    lessons: [
      { id: "m1", title: "Introduction to Variables", description: "Learn how letters represent numbers in algebra.", xpReward: 25, type: "reading", duration: "15 min" },
      { id: "m2", title: "Solving Linear Equations", description: "Master the art of finding x in equations.", xpReward: 30, type: "quiz", duration: "20 min" },
      { id: "m3", title: "Geometry Basics", description: "Angles, triangles, and the Pythagorean theorem.", xpReward: 35, type: "video", duration: "25 min" },
      { id: "m4", title: "Area & Perimeter", description: "Calculate areas of complex shapes.", xpReward: 30, type: "reading", duration: "20 min" },
      { id: "m5", title: "Math Olympiad Challenge", description: "Test your skills with competition-level problems.", xpReward: 50, type: "project", duration: "45 min" },
    ],
  },
  {
    id: "science-101",
    title: "Natural Sciences",
    description: "Explore physics, chemistry, and biology through experiments.",
    instructor: "Mr. Baskara",
    category: "STEM",
    color: "#10B981",
    icon: "flask-conical",
    lessons: [
      { id: "s1", title: "Forces & Motion", description: "Newton's laws and how objects move.", xpReward: 25, type: "video", duration: "20 min" },
      { id: "s2", title: "Chemical Reactions", description: "What happens when substances combine.", xpReward: 30, type: "reading", duration: "15 min" },
      { id: "s3", title: "The Cell: Unit of Life", description: "Explore cell structure and functions.", xpReward: 25, type: "reading", duration: "15 min" },
      { id: "s4", title: "Lab: Build a Volcano", description: "Create a chemical reaction experiment.", xpReward: 40, type: "project", duration: "30 min" },
      { id: "s5", title: "Science Quiz Bowl", description: "Test your knowledge across all topics.", xpReward: 35, type: "quiz", duration: "25 min" },
    ],
  },
  {
    id: "english-101",
    title: "English Literature",
    description: "Reading comprehension, creative writing, and literary analysis.",
    instructor: "Ms. Catherine",
    category: "Humanities",
    color: "#F59E0B",
    icon: "book-open",
    lessons: [
      { id: "e1", title: "Story Elements", description: "Characters, plot, setting, and theme.", xpReward: 20, type: "reading", duration: "15 min" },
      { id: "e2", title: "Poetry Analysis", description: "Understanding metaphor, simile, and imagery.", xpReward: 25, type: "reading", duration: "20 min" },
      { id: "e3", title: "Creative Writing Workshop", description: "Write your own short story.", xpReward: 40, type: "project", duration: "35 min" },
      { id: "e4", title: "Book Review", description: "Learn to write a compelling book review.", xpReward: 30, type: "project", duration: "25 min" },
      { id: "e5", title: "Vocabulary Challenge", description: "Expand your word bank with fun exercises.", xpReward: 20, type: "quiz", duration: "15 min" },
    ],
  },
  {
    id: "bahasa-101",
    title: "Bahasa Indonesia",
    description: "Tata bahasa, sastra, dan keterampilan menulis Bahasa Indonesia.",
    instructor: "Pak Darmawan",
    category: "Humanities",
    color: "#EF4444",
    icon: "languages",
    lessons: [
      { id: "b1", title: "Struktur Kalimat", description: "Memahami subjek, predikat, objek, dan keterangan.", xpReward: 20, type: "reading", duration: "15 min" },
      { id: "b2", title: "Menulis Cerpen", description: "Langkah-langkah menulis cerita pendek.", xpReward: 35, type: "project", duration: "30 min" },
      { id: "b3", title: "Puisi & Pantun", description: "Keindahan sastra Indonesia dalam bentuk puisi.", xpReward: 25, type: "reading", duration: "20 min" },
      { id: "b4", title: "Diskusi & Debat", description: "Teknik berbicara di depan umum.", xpReward: 30, type: "video", duration: "25 min" },
      { id: "b5", title: "Ujian Bahasa", description: "Tes pemahaman bahasa Indonesia.", xpReward: 25, type: "quiz", duration: "20 min" },
    ],
  },
  {
    id: "history-101",
    title: "History & Social Studies",
    description: "World civilizations, Indonesian history, and social systems.",
    instructor: "Ms. Elara",
    category: "Humanities",
    color: "#8B5CF6",
    icon: "landmark",
    lessons: [
      { id: "h1", title: "Ancient Civilizations", description: "Egypt, Mesopotamia, and the Indus Valley.", xpReward: 25, type: "video", duration: "20 min" },
      { id: "h2", title: "Majapahit Empire", description: "The golden age of Indonesian history.", xpReward: 30, type: "reading", duration: "20 min" },
      { id: "h3", title: "World War II", description: "Major events and their impact on Indonesia.", xpReward: 30, type: "reading", duration: "25 min" },
      { id: "h4", title: "Independence Day Project", description: "Create a timeline of Indonesia's independence.", xpReward: 45, type: "project", duration: "40 min" },
      { id: "h5", title: "History Quiz", description: "Test your knowledge of key historical events.", xpReward: 25, type: "quiz", duration: "20 min" },
    ],
  },
  {
    id: "cs-101",
    title: "Computer Science",
    description: "Programming fundamentals, web development, and computational thinking.",
    instructor: "Mr. Farhan",
    category: "STEM",
    color: "#06B6D4",
    icon: "code",
    lessons: [
      { id: "c1", title: "What is Programming?", description: "Introduction to code and algorithms.", xpReward: 20, type: "video", duration: "15 min" },
      { id: "c2", title: "Variables & Data Types", description: "Store and manipulate data in programs.", xpReward: 25, type: "reading", duration: "20 min" },
      { id: "c3", title: "Loops & Conditions", description: "Control flow in programming.", xpReward: 30, type: "quiz", duration: "20 min" },
      { id: "c4", title: "Build a Calculator", description: "Create your first JavaScript project.", xpReward: 45, type: "project", duration: "35 min" },
      { id: "c5", title: "Web Page Challenge", description: "Build a personal webpage with HTML & CSS.", xpReward: 50, type: "project", duration: "45 min" },
    ],
  },
];
