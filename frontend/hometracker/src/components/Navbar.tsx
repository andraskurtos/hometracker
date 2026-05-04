export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center">
        {/* App Name with a subtle gradient */}
        <span className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent cursor-pointer">
          HomeTracker
        </span>
      </div>
    </nav>
  );
}