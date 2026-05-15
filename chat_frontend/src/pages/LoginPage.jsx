import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare,MessageCircleMore  } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 pt-10 overflow-hidden ">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center
                 group-hover:bg-primary/20
              transition-colors animate-bounce"
              >
                <MessageCircleMore  className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome ShweChat</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Mail className="h-5 w-5" />
        </span>
        <input
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="
            w-full pl-10 pr-4 py-2 
            rounded-xl border border-gray-300 
            bg-gray-50 
            text-gray-900 placeholder-gray-400 
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            shadow-sm transition-all duration-200
          "
        />
      </div>
    </div>

           <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Password
      </label>
      <div className="relative">
        {/* Left Icon */}
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Lock className="h-5 w-5" />
        </span>

        {/* Input */}
       <input
  type={showPassword ? "text" : "password"}
  placeholder="••••••••"
  value={formData.password}
  onChange={(e) =>
    setFormData({ ...formData, password: e.target.value })
  }
  className="
    w-full pl-10 pr-10 py-2
    rounded-xl border border-gray-300 
    bg-gray-50
    text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
    shadow-sm transition-all duration-200
  "
/>

        {/* Toggle Visibility */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      {/* <AuthImagePattern
        title={"Welcome back!"}
        subtitle={"Sign in to continue your conversations and catch up with your messages."}
      /> */}

  <div className="hidden lg:flex items-center justify-center relative w-full h-full">
  <img
    src="/login.png"
    alt="Login Background"
    className="max-w-full max-h-full object-contain"
  />
</div>

 


    </div>
  );
};
export default LoginPage;
