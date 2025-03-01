"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Apple,
  PlayIcon as PlayStore,
  X,
  CheckCircle,
  CircleAlert,
  Pencil,
  Layers,
  Share2,
  Users,
  Download,
  Shapes,
} from "lucide-react";

function Logo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="w-40 h-40 bg-white rounded-3xl shadow-lg flex items-center justify-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        className="text-5xl font-bold text-[#5C63ED] italic"
        initial={{ y: 20, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Draw
      </motion.span>
    </motion.div>
  );
}

export default function DrawAppLanding() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setError] = useState<null | string>(null);

  const handleStoreClick = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email submitted:", email);

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data: { status?: string; message?: string } = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setError(null);
        setEmail("");
      } else {
        setIsSubmitted(true);
        console.log(data);
        setError(
          `Status ${data.status}, Error ${data.message || response.statusText}`,
        );
        setEmail("");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(`Something went wrong. Reach out to support. Error: ${error}`);
      setEmail("");
    }
  };

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-[#f8f9fe] text-[#1d1d1f] font-sans">
      <main>
        {/* Updated Hero Section */}
        <section
          ref={heroRef}
          className="min-h-screen bg-[#fbfbfd] flex items-center justify-center"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={
                heroInView ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }
              }
              transition={{ duration: 0.5 }}
              className="flex justify-center items-center mb-8"
            >
              <Logo />
            </motion.div>
            <motion.h2
              className="text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Visualize Your Ideas
            </motion.h2>
            <motion.p
              className="text-xl mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Draw is a beautiful, intuitive whiteboard app inspired by
              Excalidraw. Create sketches, diagrams, and collaborate in
              real-time with simplicity and elegance.
            </motion.p>
            <motion.div
              className="flex justify-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.button
                className="px-6 py-3 bg-[#5C63ED] text-white rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStoreClick}
              >
                <Apple className="mr-2" />
                Mac App
              </motion.button>
              <motion.button
                className="px-6 py-3 bg-[#5C63ED] text-white rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStoreClick}
              >
                <PlayStore className="mr-2" />
                Android App
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">
              Key Features
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Hand-drawn Style"
                description="Create beautiful sketches with a natural, hand-drawn feel that adds character to your diagrams."
                icon={<Pencil size={32} className="text-[#5C63ED]" />}
              />
              <FeatureCard
                title="Real-time Collaboration"
                description="Invite teammates to join your canvas and work together in real-time with intuitive multi-user editing."
                icon={<Users size={32} className="text-[#5C63ED]" />}
              />
              <FeatureCard
                title="Shape Libraries"
                description="Access a comprehensive library of shapes, arrows, and connectors to build clear and effective diagrams."
                icon={<Shapes size={32} className="text-[#5C63ED]" />}
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-[#fbfbfd]">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">
              How It Works
            </h3>
            <div className="max-w-4xl mx-auto">
              <Timeline />
            </div>
          </div>
        </section>

        {/* Tools Showcase */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">
              Creative Tools
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: "Pen Tool", icon: "✏️", desc: "Freehand drawing" },
                { name: "Shapes", icon: "🔷", desc: "Geometric elements" },
                { name: "Text", icon: "📝", desc: "Add annotations" },
                { name: "Connectors", icon: "↔️", desc: "Connect elements" },
                { name: "Export", icon: "📤", desc: "Save as PNG/SVG" },
              ].map((tool) => (
                <ToolCard key={tool.name} {...tool} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-[#fbfbfd]">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold mb-12 text-center">
              Choose Your Plan
            </h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <PricingCard
                title="Basic"
                price="Free"
                features={[
                  "Unlimited canvases",
                  "Basic shape library",
                  "PNG export",
                  "Locally stored drawings",
                  "Basic collaboration",
                ]}
              />
              <PricingCard
                title="Pro"
                price="$5.99/month"
                features={[
                  "Everything in Basic",
                  "Premium shape libraries",
                  "SVG/PDF exports",
                  "Cloud storage & sync",
                  "Advanced collaboration",
                  "Version history",
                ]}
                highlighted={true}
              />
            </div>
          </div>
        </section>

        {/* Call-to-Action */}
        <section className="bg-[#5C63ED] text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Bring Your Ideas to Life?
            </h3>
            <p className="text-xl mb-8">
              Download Draw now and start creating beautiful diagrams
            </p>
            <div className="flex justify-center space-x-4">
              <motion.button
                className="px-6 py-3 bg-white text-[#5C63ED] rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStoreClick}
              >
                <Apple className="mr-2" />
                Mac App
              </motion.button>
              <motion.button
                className="px-6 py-3 bg-white text-[#5C63ED] rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStoreClick}
              >
                <PlayStore className="mr-2" />
                Android App
              </motion.button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#f5f5f7] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; 2024 Draw. All rights reserved.</p>
          <p className="mt-2">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>{" "}
            |
            <a href="#" className="hover:underline ml-2">
              Terms of Service
            </a>
          </p>
        </div>
      </footer>

      {/* Dialog for email subscription */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold">Coming Soon!</h4>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p>
                    Be the first to know when we launch. Sign up for early
                    access!
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-[#5C63ED] text-white rounded-md hover:bg-[#4a50c9] transition-colors"
                  >
                    Notify Me
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  {isError ? (
                    <>
                      <CircleAlert
                        className="mx-auto mb-4 text-red-500"
                        size={48}
                      />
                      <p className="text-xl font-semibold mb-2">Error!</p>
                      <p>
                        Something went wrong. Got error:
                        <br />
                        {isError}
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        className="mx-auto mb-4 text-green-500"
                        size={48}
                      />
                      <p className="text-xl font-semibold mb-2">Thank You!</p>
                      <p>
                        We&apos;ll notify you as soon as the app is available.
                      </p>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="bg-white p-6 rounded-2xl shadow-md"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

function ToolCard({
  name,
  icon,
  desc,
}: {
  name: string;
  icon: string;
  desc: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="w-48 h-48 perspective-1000"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative transition-all duration-500 transform-style-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        <div className="w-full h-full absolute backface-hidden bg-gradient-to-br from-[#5C63ED] to-[#7c81f7] rounded-2xl shadow-md flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl mb-2 block">{icon}</span>
            <span className="text-xl font-medium text-white">{name}</span>
          </div>
        </div>
        <div className="w-full h-full absolute backface-hidden bg-white rounded-2xl shadow-md flex flex-col items-center justify-center transform rotate-y-180 p-4">
          <h4 className="text-xl font-semibold text-[#5C63ED] mb-2">{name}</h4>
          <p className="text-gray-600 text-center">{desc}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Timeline() {
  const steps = [
    {
      title: "Create Canvas",
      description: "Start with a blank canvas or choose from templates.",
      icon: <Layers size={20} className="text-white" />,
    },
    {
      title: "Draw & Design",
      description: "Use shapes, lines and text to bring your ideas to life.",
      icon: <Pencil size={20} className="text-white" />,
    },
    {
      title: "Collaborate",
      description: "Share your canvas and work with others in real-time.",
      icon: <Users size={20} className="text-white" />,
    },
    {
      title: "Share Your Work",
      description: "Generate a shareable link to present your creation.",
      icon: <Share2 size={20} className="text-white" />,
    },
    {
      title: "Export",
      description: "Download your diagram in multiple formats.",
      icon: <Download size={20} className="text-white" />,
    },
  ];

  return (
    <div className="relative">
      <svg
        className="absolute left-0 top-0 h-full w-24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C63ED" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#5C63ED" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M24 0 C 84 50, -36 100, 24 150 C 84 200, -36 250, 24 300 C 84 350, -36 400, 24 450"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
        />
      </svg>
      {steps.map((step, index) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ref = useRef(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const isInView = useInView(ref, { once: true });

        return (
          <motion.div
            key={index}
            ref={ref}
            className="mb-16 flex items-start"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="mr-8 relative">
              <motion.div
                className="w-12 h-12 bg-[#5C63ED] rounded-full flex items-center justify-center text-white font-bold z-10 relative shadow-lg"
                whileHover={{ scale: 1.2 }}
              >
                {step.icon}
              </motion.div>
              <svg
                className="absolute left-6 top-12 w-12 h-16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 0 Q 12 8, 6 16"
                  fill="none"
                  stroke="#5C63ED"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function PricingCard({
  title,
  price,
  features,
  highlighted = false,
}: {
  title: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={`bg-white p-6 rounded-2xl shadow-md ${highlighted ? "border-2 border-[#5C63ED]" : ""}`}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-3xl font-bold mb-4">{price}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckCircle className="mr-2 text-green-500" size={16} />
            {feature}
          </li>
        ))}
      </ul>
      <button
        className={`mt-6 w-full py-2 rounded-full ${highlighted ? "bg-[#5C63ED] text-white" : "bg-gray-100 text-[#5C63ED]"}`}
      >
        Choose Plan
      </button>
    </motion.div>
  );
}
