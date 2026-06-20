import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useDarkMode } from "../theme/DarkModeProvider";

const LIGHT_BG = "#00614f";
const DARK_BG = "#0a1a16";

export default function HuffPostFooter() {
  const session = useAuth();
  const { mode } = useDarkMode();
  const bg = mode === "dark" ? DARK_BG : LIGHT_BG;

  return (
    <footer style={{ background: bg }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-sm">
          <div>
            <Link to="/" className="font-black italic text-xl">
              TimezofToday
            </Link>
          </div>
          <div className="space-y-2">
            <div className="font-bold">Browse</div>
            <Link to="/writing" className="block opacity-80 hover:opacity-100">
              Writing
            </Link>
            <Link to="/videos" className="block opacity-80 hover:opacity-100">
              Videos
            </Link>
          </div>
          <div className="space-y-2">
            <div className="font-bold">Account</div>
            {session ? (
              <Link to="/account" className="block opacity-80 hover:opacity-100">
                Account
              </Link>
            ) : (
              <>
                <Link to="/login" className="block opacity-80 hover:opacity-100">
                  Log in
                </Link>
                <Link to="/register" className="block opacity-80 hover:opacity-100">
                  Sign up
                </Link>
              </>
            )}
          </div>
          <div className="space-y-2">
            <div className="font-bold">About</div>
            <a href="#" className="block opacity-80 hover:opacity-100">
              About Us
            </a>
            <a href="#" className="block opacity-80 hover:opacity-100">
              Contact
            </a>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-6 flex items-center justify-between text-white/70 text-xs">
          <span>&copy; {new Date().getFullYear()} TimezofToday. All rights reserved.</span>
          <span>TimezofToday</span>
        </div>
      </div>
    </footer>
  );
}
