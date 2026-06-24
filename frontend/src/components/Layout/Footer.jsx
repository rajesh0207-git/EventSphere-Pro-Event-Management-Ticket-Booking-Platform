const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">EventSphere Pro</h3>
            <p className="text-sm">Your complete event management and ticket booking platform. Create, discover, and attend amazing events.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/events" className="hover:text-white transition">Browse Events</a></li>
              <li><a href="/search" className="hover:text-white transition">Search Events</a></li>
              <li><a href="/register" className="hover:text-white transition">Create Account</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>support@eventsphere.com</li>
              <li>+1 (555) 123-4567</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} EventSphere Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
