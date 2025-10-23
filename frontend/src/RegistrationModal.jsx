import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';

const RegistrationModal = ({ isOpen, onClose, onRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roll: '1', // Default roll number as '1'
          email: formData.email,
          mobile: formData.mobile,
          name: formData.name
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Registration successful!' });
        // Reset form
        setFormData({ email: '', mobile: '', name: '' });
        // Call parent callback if provided
        if (onRegister) onRegister(data);
        // Close modal after 1.5 seconds
        setTimeout(() => {
          onClose();
          setMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-gradient-to-br from-gray-900 to-red-950 border-2 border-red-600 rounded-xl p-8 max-w-md w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
              Guest Registration
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Fill in your details to join the game
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-yellow-500 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-black/50 border-2 border-red-800 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Mobile Field */}
            <div>
              <label className="block text-sm font-bold text-yellow-500 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="1234567890"
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 bg-black/50 border-2 border-red-800 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">10 digits required</p>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-bold text-yellow-500 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-black/50 border-2 border-red-800 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Message Display */}
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm font-bold text-center ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500 text-green-400'
                    : 'bg-red-500/20 border border-red-500 text-red-400'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                isSubmitting
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-yellow-600 text-white hover:from-red-700 hover:to-yellow-700 transform hover:scale-105'
              }`}
            >
              {isSubmitting ? 'Registering...' : 'Register Now'}
            </button>
          </form>

          {/* Info Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Roll number will be assigned as guest player
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;
