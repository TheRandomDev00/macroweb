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
];

export const faqs = [
  {
    question: "How do I get started?",
    answer:
      "Choose the free or premium version of our Anime Adventures tool, then visit our community for access details and setup guidance.",
  },
  {
    question: "Can I try a tool for free?",
    answer:
      "Yes. Use the free version button in Pricing to find downloads on GitHub. Our community can help you get started.",
  },
  {
    question: "Will a tool work on my device?",
    answer:
      "Compatibility depends on the tool and version. Review the requirements and setup instructions on the help section before choosing a tool.",
  },
  {
    question: "Which version should I choose?",
    answer:
      "Start with the free version to get to know the tool, or explore premium access. Our community can help you compare current features and confirm premium pricing.",
  },
  {
    question: "Where can I find help with setup?",
    answer:
      "The official guides cover setup, and the DevRealm Discord community is the place to ask questions and find help. Both are linked at the bottom of this page.",
  },
  {
    question: "Where do purchases and downloads happen?",
    answer:
      "Download the free version from GitHub using the button in Pricing. Visit our community for premium access details. Purchases are not handled directly on this page.",
  },
];
