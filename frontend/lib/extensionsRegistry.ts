import { 
  Sparkles, 
  FileSearch, 
  Newspaper, 
  FileText, 
  ShieldAlert,
  type LucideIcon 
} from 'lucide-react';

export interface ExtensionConfig {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  icon: LucideIcon;
  pricingHref: string;
  docsHref: string;
  status: 'active' | 'in_labs' | 'coming_soon';
  themeColor: 'purple' | 'cyan' | 'emerald' | 'amber' | 'blue';
  defaultFreeQuota: string;
  defaultFreeQuotaLabel: string;
  queuePosition?: number;
}

export const EXTENSIONS_REGISTRY: ExtensionConfig[] = [
  {
    id: 'notesgpt',
    name: 'NotesGPT Studio',
    tagline: 'Multimodal Video Lecture & Mind Map Engine',
    desc: 'Real-time lecture & transcript mind-mapping with instant bilateral SVG exports.',
    icon: Sparkles,
    pricingHref: '/pricing/notesgpt',
    docsHref: '/docs/notesgpt',
    status: 'active',
    themeColor: 'purple',
    defaultFreeQuota: '20 min / day',
    defaultFreeQuotaLabel: 'Daily Active Playback',
  },
  {
    id: 'portalsnap',
    name: 'PortalSnap Pro',
    tagline: 'PSU & Govt Exam PDF Eligibility Scanner',
    desc: 'Instant 60-page notification parser matching age, criteria, and relaxation rules.',
    icon: FileSearch,
    pricingHref: '/pricing/portalsnap',
    docsHref: '/docs/portalsnap',
    status: 'active',
    themeColor: 'cyan',
    defaultFreeQuota: '7 / 10 remaining',
    defaultFreeQuotaLabel: 'Monthly Forms Scanned',
  },
  {
    id: 'editoriallens',
    name: 'EditorialLens',
    tagline: 'UPSC Argument Extractor & Fact Checker',
    desc: 'Side-by-side fact checking, syllabus mapping, and GS-1/4 editorial argument trees.',
    icon: Newspaper,
    pricingHref: '/pricing/editoriallens',
    docsHref: '/docs/editoriallens',
    status: 'in_labs',
    themeColor: 'emerald',
    defaultFreeQuota: 'Early Labs Preview',
    defaultFreeQuotaLabel: 'Queue Access',
    queuePosition: 14,
  },
  {
    id: 'docusynth',
    name: 'DocuSynth AI',
    tagline: 'Universal PDF & Research Paper Synthesizer',
    desc: 'Extract equations, cross-reference ArXiv citations, and generate audio summaries.',
    icon: FileText,
    pricingHref: '/pricing',
    docsHref: '/docs',
    status: 'coming_soon',
    themeColor: 'blue',
    defaultFreeQuota: 'Private Beta',
    defaultFreeQuotaLabel: 'Release Stage',
    queuePosition: 42,
  },
  {
    id: 'codeaudit',
    name: 'CodeAudit Shield',
    tagline: 'Git Security & Dependency Vulnerability Scanner',
    desc: 'Automated CVE scanning, credential leak detection, and inline pull request fixes.',
    icon: ShieldAlert,
    pricingHref: '/pricing',
    docsHref: '/docs',
    status: 'coming_soon',
    themeColor: 'amber',
    defaultFreeQuota: 'Private Beta',
    defaultFreeQuotaLabel: 'Release Stage',
    queuePosition: 58,
  },
];
