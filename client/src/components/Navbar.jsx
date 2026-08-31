import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="text-xl font-bold text-primary">
        LectureLens
      </Link>
      <div className="flex gap-6 text-sm font-medium text-secondary">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/lectures">My Lectures</Link>
        <Link to="/lecture/new">New Lecture</Link>
        <Link to="/profile">Profile</Link>
      </div>
    </nav>
  );
};

export default Navbar;