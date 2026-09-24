export interface TopicTemplate {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  includeDomains: string[];
}

export const TOPIC_TEMPLATES: TopicTemplate[] = [
  {
    slug: "ia",
    title: "IA et LLM",
    description: "Sorties de modèles, nouveautés des API, outils et pratiques pour construire avec l'IA générative.",
    keywords: ["LLM", "Claude", "agents", "RAG", "évaluation"],
    includeDomains: ["anthropic.com", "huggingface.co", "simonwillison.net"],
  },
  {
    slug: "front-end",
    title: "Front-end",
    description: "Nouveautés React, Next.js, CSS et navigateurs : releases, RFC et changements qui impactent le code.",
    keywords: ["React", "Next.js", "CSS", "TypeScript", "Web platform"],
    includeDomains: ["react.dev", "nextjs.org", "web.dev", "developer.chrome.com"],
  },
  {
    slug: "securite",
    title: "Sécurité",
    description: "Failles critiques, CVE exploitées et incidents touchant l'écosystème open source et le cloud.",
    keywords: ["CVE", "supply chain", "zero-day", "npm", "patch"],
    includeDomains: ["github.blog", "cisa.gov", "bleepingcomputer.com"],
  },
  {
    slug: "devops",
    title: "DevOps",
    description: "Kubernetes, Docker, CI/CD et observabilité : versions, dépréciations et bonnes pratiques.",
    keywords: ["Kubernetes", "Docker", "GitHub Actions", "OpenTelemetry", "Terraform"],
    includeDomains: ["kubernetes.io", "docker.com", "github.blog"],
  },
];
