export type Product = {
  id: string;
  name: string;
  image: string;
  category: "Tower defense" | "Adventure";
  color: string;
  tagline: string;
  price: number;
  monthlyPrice: number | null;
  version: string;
  description: string;
};

// Public catalogue snapshot. No account, payment, or personal data is stored.
export const catalogueSource = { capturedAt: "2026-11-13" };

export const products: Product[] = [
  {
    id: "anime_adventures_perm",
    name: "Anime Adventures",
    image: "/images/adventures.png",
    category: "Tower defense",
    color: "pink",
    tagline: "Make room for your next adventure.",
    price: 9.99,
    monthlyPrice: 2.99,
    version: "0.14.60",
    description:
      "Explore the DevRealm automation tool for Anime Adventures. Check the current features, compatibility, and setup guide in the catalogue.",
  },
  {
    id: "vanguards",
    name: "Anime Vanguards",
    image: "/images/vanguards.png",
    category: "Tower defense",
    color: "blue",
    tagline: "Put the everyday grind on autopilot.",
    price: 14.99,
    monthlyPrice: 2.99,
    version: "0.44.112",
    description:
      "Explore the DevRealm automation tool for Anime Vanguards. Check the current features, compatibility, and setup guide in the catalogue.",
  },
  {
    id: "expeditions",
    name: "Anime Expeditions",
    image: "/images/expeditions.png",
    category: "Tower defense",
    color: "purple",
    tagline: "A little help for the long journey.",
    price: 16.99,
    monthlyPrice: 6.99,
    version: "0.1.85",
    description:
      "Explore the DevRealm automation tool for Anime Expeditions. Check the current features, compatibility, and setup guide in the catalogue.",
  },
  {
    id: "slayers",
    name: "Slayers 2",
    image: "/images/slayers.png",
    category: "Adventure",
    color: "red",
    tagline: "Less repetition. More exploration.",
    price: 4.99,
    monthlyPrice: null,
    version: "0.1.2",
    description:
      "Explore the DevRealm automation tool for Slayers 2. Check the current features, compatibility, and setup guide in the catalogue.",
  },
  {
    id: "origins",
    name: "Anime Origin",
    image: "/images/origins.png",
    category: "Tower defense",
    color: "orange",
    tagline: "Find a smarter way to keep moving.",
    price: 4.99,
    monthlyPrice: null,
    version: "0.1.10",
    description:
      "Explore the DevRealm automation tool for Anime Origin. Check the current features, compatibility, and setup guide in the catalogue.",
  },
  {
    id: "gpo",
    name: "GPO",
    image: "/images/gpo.png",
    category: "Adventure",
    color: "teal",
    tagline: "Set sail with a simpler routine.",
    price: 4.99,
    monthlyPrice: null,
    version: "0.2.5",
    description:
      "Explore the DevRealm automation tool for GPO. Check the current features, compatibility, and setup guide in the catalogue.",
  },
];

export const faqs = [
  {
    question: "How do I get started?",
    answer:
      "Find the tool for your game, then open its catalogue page. Follow the download and setup guide there to get your routine ready.",
  },
  {
    question: "Can I try a tool for free?",
    answer:
      "Yes. The free tools section links to DevRealm Task and the available free versions. Check the official download page for current availability and features.",
  },
  {
    question: "Will a tool work on my device?",
    answer:
      "Compatibility depends on the tool and version. Review the requirements and setup instructions on the help section before choosing a tool.",
  },
  {
    question: "What is the difference between payment options?",
    answer:
      "Some tools list both monthly and one-time prices. Switch between the two to explore the catalogue snapshot, then confirm the current offer and terms in the catalogue.",
  },
  {
    question: "Where can I find help with setup?",
    answer:
      "The official guides cover setup, and the DevRealm Discord community is the place to ask questions and find help. Both are linked at the bottom of this page.",
  },
  {
    question: "Where do purchases and downloads happen?",
    answer:
      "This catalogue previews available tools. Purchasing and downloads are not connected yet; check back for availability.",
  },
];
