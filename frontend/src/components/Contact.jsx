import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
          {/* Tombol Kirim Pesan ke Admin */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 flex items-center justify-center"
          >
            <Card className="bg-gray-900 border-gray-800 w-full max-w-lg mx-auto">
              <CardContent className="p-8 flex flex-col items-center">
                <h3 className="text-white font-bold text-xl mb-4 text-center">Ingin chat langsung dengan admin?</h3>
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full py-6 text-lg font-semibold flex items-center justify-center"
                  onClick={() => navigate('/chat')}
                >
                  Kirim Pesan ke Admin
                  <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          >
            {contactInfo.map((info, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500/50 transition-all duration-300"
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{info.title}</h3>
                    {info.link ? (
                      <a
                        href={info.link}
                        className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-gray-400">{info.content}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-purple-500/50">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-2">Ready to Start?</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Let's discuss how we can help bring your vision to life.
                </p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full">
                  Schedule a Call
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8">
                <form onSubmit={e => e.preventDefault()} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Your Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Project Inquiry"
                      required
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project..."
                      rows={6}
                      required
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full py-6 text-lg font-semibold group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Message'}
                    <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    type="button"
              </CardContent>
            </Card>
          </motion.div>
                    onClick={() => navigate('/chat')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full py-6 text-lg font-semibold group"
                    >
                    Send Message
      </div>
    </section>
  );
};