import React from 'react'
import { motion } from 'framer-motion'

function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 z-50"
    >
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <div className="mb-2 flex justify-center items-end space-x-2">
          <span className="font-serif-sc font-bold text-lg text-gray-900 pb-0.5">栖叶</span>
          <span className="text-xs text-gray-500">Folioasis</span>
        </div>
        <p>家庭养花管理系统 © {new Date().getFullYear()}</p>
      </div>
    </motion.footer>
  )
}

export default Footer