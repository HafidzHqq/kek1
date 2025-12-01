import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export const Contact = () => {
  const navigate = useNavigate();

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'inovatechstudio@gmail.com',
      link: 'mailto:inovatechstudio@gmail.com',
    },
    { icon: Phone, title: 'Phone', content: '+6285840409283', link: 'https://wa.me/6285840409283' },
    { icon: MapPin, title: 'Location', content: 'Bandar lampung, Lampung, Indonesia' },
  ];

  return (
    <section id="contact" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold text-center text-white"
        >
          Get In <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Touch</span>
        </motion.h2>

        <p className="text-gray-300 text-center mt-4 max-w-3xl mx-auto">
          Ready to start your project? Contact us today and let's create something amazing together
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {/* Kolom informasi */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {contactInfo.map((info, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <info.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{info.title}</h3>
                    {info.link ? (
                      <a href={info.link} className="text-gray-400 hover:text-purple-400">{info.content}</a>
                    ) : (
                      <p className="text-gray-400">{info.content}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-purple-500/50">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-2">Ready to Start?</h3>
                <p className="text-gray-300 text-sm mb-4">Let's discuss how we can help bring your vision to life.</p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">Schedule a Call</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Kolom tombol chat */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 flex items-center justify-center"
          >
            <Card className="bg-gray-900 border-gray-800 w-full max-w-2xl">
              <CardContent className="p-10 flex flex-col items-center">
                <h3 className="text-white font-bold text-2xl mb-3 text-center">Ingin chat langsung dengan admin?</h3>
                <p className="text-gray-400 mb-6 text-center max-w-xl">Klik tombol di bawah untuk membuka ruang chat dan mulai percakapan secara real-time.</p>
                <Button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full py-6 text-lg font-semibold flex items-center justify-center"
                >
                  Kirim Pesan ke Admin
                  <Send className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};