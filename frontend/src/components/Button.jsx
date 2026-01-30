// frontend/src/components/Button.jsx
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const Button = ({ 
  children, 
  type = "button", 
  variant = "primary", 
  loading = false, 
  className = "", 
  disabled = false,
  ...props 
}) => {
  // Define base styles that match your Landing Page soul
  const baseStyles = "relative flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 font-bold text-sm tracking-tight transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  // Define variants
  const variants = {
    // High contrast button: Black in light mode, White in dark mode
    primary: "bg-foreground text-background shadow-lg hover:opacity-90 dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
    // Outlined/Ghost version for secondary actions
    outline: "border border-border bg-transparent text-foreground hover:bg-foreground/5",
    // Brand version (Cyan/Violet)
    brand: "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40"
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      type={type}
      disabled={loading || disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;