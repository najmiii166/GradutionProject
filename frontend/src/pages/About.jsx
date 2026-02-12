import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GetStartedModal from "../components/GetStartedModal";
import AboutSection from "../sections/AboutSection";

export default function About() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar onOpenJoin={() => setShowModal(true)} />
      <main className="pt-24">
        <AboutSection />
      </main>
      <Footer />
      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

