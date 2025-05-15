import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-purple-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">TextileShop</h3>
            <p className="text-gray-300 mb-4">Premium quality fabrics for all your textile needs.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-amber-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-amber-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-amber-400 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Products</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Cotton</Link></li>
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Silk</Link></li>
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Linen</Link></li>
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Wool</Link></li>
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Synthetic</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-gray-300 hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Account</Link></li>
              <li><Link to="/cart" className="text-gray-300 hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 text-amber-400 flex-shrink-0 mt-1" />
                <span className="text-gray-300">123 Fabric Street, Textile City, TX 12345</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-amber-400 flex-shrink-0" />
                <span className="text-gray-300">(123) 456-7890</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-amber-400 flex-shrink-0" />
                <span className="text-gray-300">info@textileshop.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} TextileShop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;