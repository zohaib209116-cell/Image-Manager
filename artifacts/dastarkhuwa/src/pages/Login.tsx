import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { Loader2, Check } from "lucide-react";

type ButtonState = "idle" | "loading" | "success";

const easeOutCubic = [0.33, 1, 0.68, 1] as const;

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOutCubic } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOutCubic } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const BrandPanel = () => (
  <motion.div
    layoutId="brand-panel"
    className="flex flex-col items-center justify-center gap-6 rounded-2xl p-10 text-white h-full min-h-[480px]"
    style={{ background: "linear-gradient(160deg, #0E6B63 0%, #0a4f49 100%)" }}
    transition={{ type: "spring", stiffness: 200, damping: 30 }}
  >
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.5, ease: easeOutCubic }}
      className="w-36 h-36 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm p-3 shadow-xl"
    >
      <img
        src="/dastarkhuwa-logo.jpeg"
        alt="Dastarkhuwa Logo"
        className="w-full h-full object-contain"
      />
    </motion.div>
    <div className="text-center space-y-2">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45, ease: easeOutCubic }}
        className="text-3xl font-bold tracking-tight"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Dastarkhuwa
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 0.45, duration: 0.45 }}
        className="text-sm font-medium tracking-wide"
      >
        Communal Dining, Modern Convenience.
      </motion.p>
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="flex flex-wrap justify-center gap-2 mt-2"
    >
      {["Discover", "Reserve", "Community", "Zibi AI"].map((tag) => (
        <span
          key={tag}
          className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm"
        >
          {tag}
        </span>
      ))}
    </motion.div>
  </motion.div>
);

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [btnState, setBtnState] = useState<ButtonState>("idle");

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: "#FFF4E6" }}>
        <div
          className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#0E6B63", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (user) return <Redirect to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (btnState !== "idle") return;
    setBtnState("loading");

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone } },
        });
        if (error) throw error;
        setBtnState("success");
        toast({
          title: "Account Created!",
          description: "Check your email to verify your account, then log in.",
        });
        setTimeout(() => {
          setBtnState("idle");
          setIsLoginMode(true);
        }, 2000);
        return;
      }
      setBtnState("success");
    } catch (error: any) {
      setBtnState("idle");
      const code = error?.code as string | undefined;
      const msg =
        code === "invalid_credentials" || code === "auth/wrong-password"
          ? "Incorrect email or password."
          : code === "auth/user-not-found"
          ? "No account found with this email."
          : code === "auth/too-many-requests"
          ? "Too many attempts. Please wait and try again."
          : error?.message || "Sign in failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const toggleMode = () => {
    setIsLoginMode((v) => !v);
    setBtnState("idle");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #FFF4E6 0%, #e8f5f4 100%)" }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-4xl"
      >
        <div className="overflow-hidden rounded-2xl shadow-2xl bg-white" style={{ borderRadius: 20 }}>
          <div className="flex flex-col md:flex-row min-h-[540px]">

            {/* ── Brand Panel (slides side to side) ── */}
            <AnimatePresence initial={false} mode="wait">
              {isLoginMode ? (
                <div key="brand-right" className="md:w-[45%] order-first md:order-last">
                  <BrandPanel />
                </div>
              ) : (
                <div key="brand-left" className="md:w-[45%] order-first md:order-first">
                  <BrandPanel />
                </div>
              )}
            </AnimatePresence>

            {/* ── Form Panel ── */}
            <div className="flex-1 flex flex-col justify-center p-8 md:p-12">
              <motion.div
                key={isLoginMode ? "login-form" : "signup-form"}
                variants={stagger}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {/* Header */}
                <motion.div variants={fieldVariants} className="space-y-1">
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: "#0E6B63", fontFamily: "'Poppins', sans-serif" }}
                  >
                    {isLoginMode ? "Welcome back 👋" : "Create account 🚀"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isLoginMode
                      ? "Sign in to your restaurant dashboard"
                      : "Set up your Dastarkhuwa profile"}
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence>
                    {!isLoginMode && (
                      <>
                        <motion.div
                          key="name-field"
                          variants={fieldVariants}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                          className="space-y-1.5"
                        >
                          <Label htmlFor="name" style={{ color: "#0E6B63" }}>Full Name</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-11 rounded-xl border-2 focus-visible:ring-0"
                            style={{ borderColor: "#0E6B6322", fontFamily: "'Poppins', sans-serif" }}
                          />
                        </motion.div>
                        <motion.div
                          key="phone-field"
                          variants={fieldVariants}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                          className="space-y-1.5"
                        >
                          <Label htmlFor="phone" style={{ color: "#0E6B63" }}>Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+92 3XX XXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11 rounded-xl border-2 focus-visible:ring-0"
                            style={{ borderColor: "#0E6B6322", fontFamily: "'Poppins', sans-serif" }}
                          />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <motion.div variants={fieldVariants} className="space-y-1.5">
                    <Label htmlFor="email" style={{ color: "#0E6B63" }}>Email</Label>
                    <Input
                      id="email"
                      data-testid="input-email"
                      type="email"
                      placeholder="owner@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 rounded-xl border-2 focus-visible:ring-0"
                      style={{ borderColor: "#0E6B6322", fontFamily: "'Poppins', sans-serif" }}
                      autoComplete="username"
                    />
                  </motion.div>

                  <motion.div variants={fieldVariants} className="space-y-1.5">
                    <Label htmlFor="password" style={{ color: "#0E6B63" }}>Password</Label>
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl border-2 focus-visible:ring-0"
                      style={{ borderColor: "#0E6B6322", fontFamily: "'Poppins', sans-serif" }}
                      autoComplete={isLoginMode ? "current-password" : "new-password"}
                    />
                  </motion.div>

                  <AnimatePresence>
                    {!isLoginMode && (
                      <motion.div
                        key="whatsapp-opt"
                        variants={fieldVariants}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: "#0E6B6310" }}
                      >
                        <input
                          type="checkbox"
                          id="whatsapp"
                          checked={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.checked)}
                          className="h-4 w-4 rounded accent-teal-700"
                          style={{ accentColor: "#0E6B63" }}
                        />
                        <label htmlFor="whatsapp" className="text-sm font-medium cursor-pointer" style={{ color: "#0E6B63" }}>
                          📲 Opt in for WhatsApp updates & booking alerts
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Gradient Submit Button ── */}
                  <motion.div variants={fieldVariants}>
                    <motion.button
                      type="submit"
                      data-testid="button-signin"
                      disabled={btnState !== "idle"}
                      whileHover={btnState === "idle" ? { scale: 1.02 } : {}}
                      whileTap={btnState === "idle" ? { scale: 0.98 } : {}}
                      className="w-full h-12 rounded-xl text-white font-semibold text-sm overflow-hidden relative flex items-center justify-center"
                      style={{
                        background: btnState === "success"
                          ? "#16a34a"
                          : "linear-gradient(135deg, #0E6B63 0%, #FF8A3D 100%)",
                        transition: "background 0.4s ease",
                        fontFamily: "'Poppins', sans-serif",
                        boxShadow: "0 4px 20px rgba(14,107,99,0.35)",
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {btnState === "loading" && (
                          <motion.div
                            key="spinner"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </motion.div>
                        )}
                        {btnState === "success" && (
                          <motion.div
                            key="check"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <Check className="h-5 w-5" />
                          </motion.div>
                        )}
                        {btnState === "idle" && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {isLoginMode ? "Sign In" : "Create Account"}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                </form>

                {/* ── Mode Toggle ── */}
                <motion.div variants={fieldVariants} className="text-center">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm font-medium transition-colors"
                    style={{ color: "#FF8A3D" }}
                  >
                    {isLoginMode
                      ? "Don't have an account? Sign up →"
                      : "Already have an account? Sign in →"}
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          Dastarkhuwa · Communal Dining, Modern Convenience.
        </p>
      </motion.div>
    </div>
  );
}
