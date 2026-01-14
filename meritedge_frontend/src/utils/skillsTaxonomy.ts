// Comprehensive Skills Taxonomy - Tech and Non-Tech Skills
// This includes common variations and aliases for better matching

export interface SkillSuggestion {
  label: string;
  value: string;
  category: 'tech' | 'non-tech';
}

// Technical Skills
const technicalSkills: string[] = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust', 'Swift', 'Kotlin',
  'PHP', 'Ruby', 'Scala', 'Perl', 'R', 'MATLAB', 'Dart', 'Lua', 'Haskell', 'Erlang', 'Elixir',
  
  // Web Technologies
  'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'Node.js',
  'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Laravel', 'Symfony',
  'Rails', 'Phoenix', 'Gin', 'Fiber',
  
  // Frontend Frameworks & Libraries
  'Redux', 'MobX', 'Zustand', 'Vuex', 'Pinia', 'jQuery', 'Bootstrap', 'Tailwind CSS',
  'Material-UI', 'Ant Design', 'Chakra UI', 'Styled Components', 'SASS', 'LESS', 'SCSS',
  
  // Backend & APIs
  'REST API', 'GraphQL', 'gRPC', 'WebSocket', 'REST', 'SOAP', 'Microservices', 'Serverless',
  'API Design', 'API Development',
  
  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB',
  'Oracle', 'SQL Server', 'SQLite', 'MariaDB', 'Neo4j', 'CouchDB', 'Firebase', 'Supabase',
  'SQL', 'NoSQL', 'Database Design', 'Database Administration',
  
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD',
  'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
  'Linux', 'Unix', 'Shell Scripting', 'Bash', 'PowerShell',
  
  // Mobile Development
  'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Native Android', 'Native iOS',
  'SwiftUI', 'Kotlin Multiplatform',
  
  // Data Science & ML/AI
  'Machine Learning', 'Deep Learning', 'Data Science', 'Data Analysis', 'TensorFlow',
  'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn',
  'Jupyter', 'Apache Spark', 'Hadoop', 'Data Engineering', 'Big Data',
  'Natural Language Processing', 'NLP', 'Computer Vision', 'Neural Networks',
  
  // Testing
  'Unit Testing', 'Integration Testing', 'E2E Testing', 'Jest', 'Mocha', 'Cypress',
  'Selenium', 'Playwright', 'Pytest', 'JUnit', 'TestNG', 'RSpec',
  
  // Version Control & Tools
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
  
  // Other Tech Skills
  'Blockchain', 'Smart Contracts', 'Solidity', 'Web3', 'Cryptocurrency',
  'Cybersecurity', 'Penetration Testing', 'Ethical Hacking', 'Network Security',
  'System Design', 'Architecture', 'Design Patterns', 'Algorithms', 'Data Structures',
  'Agile', 'Scrum', 'Kanban', 'DevOps', 'SRE', 'Site Reliability Engineering',
];

// Non-Technical Skills
const nonTechnicalSkills: string[] = [
  // Communication
  'Communication', 'Written Communication', 'Verbal Communication', 'Presentation Skills',
  'Public Speaking', 'Technical Writing', 'Documentation', 'Storytelling',
  
  // Leadership & Management
  'Leadership', 'Team Leadership', 'Project Management', 'People Management',
  'Stakeholder Management', 'Conflict Resolution', 'Decision Making', 'Strategic Thinking',
  'Change Management', 'Resource Management', 'Time Management',
  
  // Problem Solving & Analysis
  'Problem Solving', 'Critical Thinking', 'Analytical Skills', 'Logical Reasoning',
  'Data Analysis', 'Business Analysis', 'Root Cause Analysis', 'Troubleshooting',
  
  // Collaboration
  'Teamwork', 'Collaboration', 'Cross-functional Collaboration', 'Mentoring',
  'Coaching', 'Knowledge Sharing',
  
  // Soft Skills
  'Adaptability', 'Flexibility', 'Creativity', 'Innovation', 'Attention to Detail',
  'Quality Assurance', 'Customer Focus', 'Customer Service', 'Empathy',
  'Emotional Intelligence', 'EQ', 'Interpersonal Skills',
  
  // Business Skills
  'Business Acumen', 'Product Management', 'Requirements Gathering', 'User Research',
  'UX Research', 'Market Research', 'Sales', 'Marketing', 'Business Development',
  
  // Domain Knowledge
  'Domain Knowledge', 'Industry Knowledge', 'Financial Services', 'Healthcare',
  'E-commerce', 'Fintech', 'EdTech', 'SaaS',
];

// Create skill variations and aliases
const skillAliases: Record<string, string[]> = {
  'Python': ['py', 'python3', 'python2'],
  'PyTorch': ['pytorch', 'torch'],
  'JavaScript': ['js', 'javascript', 'ecmascript'],
  'TypeScript': ['ts', 'typescript'],
  'React': ['reactjs', 'react.js'],
  'Node.js': ['node', 'nodejs'],
  'Machine Learning': ['ml', 'machine-learning'],
  'Deep Learning': ['dl', 'deep-learning'],
  'Natural Language Processing': ['nlp'],
  'Computer Vision': ['cv'],
  'Data Science': ['ds'],
  'Artificial Intelligence': ['ai'],
  'User Experience': ['ux'],
  'User Interface': ['ui'],
  'Quality Assurance': ['qa'],
  'Quality Control': ['qc'],
  'Emotional Intelligence': ['eq'],
  'Intelligence Quotient': ['iq'],
};

// Build comprehensive skills list with categories
export const allSkills: SkillSuggestion[] = [
  ...technicalSkills.map(skill => ({ label: skill, value: skill, category: 'tech' as const })),
  ...nonTechnicalSkills.map(skill => ({ label: skill, value: skill, category: 'non-tech' as const })),
];

// Create a map for quick lookup
export const skillsMap = new Map<string, SkillSuggestion>();
allSkills.forEach(skill => {
  skillsMap.set(skill.value.toLowerCase(), skill);
  // Add aliases
  if (skillAliases[skill.value]) {
    skillAliases[skill.value].forEach(alias => {
      skillsMap.set(alias.toLowerCase(), skill);
    });
  }
});

// Function to search skills with fuzzy matching
export function searchSkills(query: string): SkillSuggestion[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  const results: SkillSuggestion[] = [];
  const exactMatches: SkillSuggestion[] = [];
  const startsWithMatches: SkillSuggestion[] = [];
  const containsMatches: SkillSuggestion[] = [];

  // Check exact matches and aliases first
  const exactMatch = skillsMap.get(lowerQuery);
  if (exactMatch && !exactMatches.find(s => s.value === exactMatch.value)) {
    exactMatches.push(exactMatch);
  }

  // Search through all skills
  allSkills.forEach(skill => {
    const lowerSkill = skill.value.toLowerCase();
    const lowerLabel = skill.label.toLowerCase();

    // Skip if already added
    if (results.find(s => s.value === skill.value)) {
      return;
    }

    // Exact match (already handled above, but check label too)
    if (lowerSkill === lowerQuery || lowerLabel === lowerQuery) {
      if (!exactMatches.find(s => s.value === skill.value)) {
        exactMatches.push(skill);
      }
      return;
    }

    // Starts with query
    if (lowerSkill.startsWith(lowerQuery) || lowerLabel.startsWith(lowerQuery)) {
      if (!startsWithMatches.find(s => s.value === skill.value)) {
        startsWithMatches.push(skill);
      }
      return;
    }

    // Contains query
    if (lowerSkill.includes(lowerQuery) || lowerLabel.includes(lowerQuery)) {
      if (!containsMatches.find(s => s.value === skill.value)) {
        containsMatches.push(skill);
      }
    }
  });

  // Combine results in priority order
  results.push(...exactMatches);
  results.push(...startsWithMatches);
  results.push(...containsMatches.slice(0, 10)); // Limit contains matches

  return results.slice(0, 10); // Return top 10 suggestions
}

// Function to validate if skill exists in taxonomy
export function isValidSkill(skill: string): boolean {
  if (!skill || skill.trim().length === 0) {
    return false;
  }
  return skillsMap.has(skill.toLowerCase().trim());
}

// Function to get skill suggestions for a partial input
export function getSkillSuggestions(input: string): SkillSuggestion[] {
  return searchSkills(input);
}

// Function to find best match for a skill
export function findBestMatch(input: string): SkillSuggestion | null {
  const suggestions = searchSkills(input);
  return suggestions.length > 0 ? suggestions[0] : null;
}

