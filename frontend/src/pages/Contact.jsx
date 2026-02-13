import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GetStartedModal from "../components/GetStartedModal";
import ContactSection from "../sections/ContactSection";

export default function Contact() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar onOpenJoin={() => setShowModal(true)} />
      <main className="pt-24">
        <ContactSection />
      </main>
      <Footer />
      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
