import React from 'react'
import { Link } from 'react-router-dom'

function Header({ user, logout }) {
  return (
    <header className="sticky top-0 z-50 bg-washi/50 backdrop-blur-xl border-b border-linen-gray/30 shadow-wabi relative overflow-hidden">
      {/* 增强毛玻璃效果的伪元素 */}
      <div className="absolute inset-0 bg-washi/30 backdrop-blur-3xl -z-10"></div>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="flex items-end space-x-2"
        >
          <h1 className="text-2xl md:text-3xl font-lxgw-wenkai font-bold text-gray-900 pb-0.5">栖叶</h1>
          <span className="text-xs text-gray-500 hidden sm:inline-block font-ibm-plex-sans">Folioasis</span>
        </div>

        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-linen-gray text-gray-700 text-sm font-ibm-plex-sans transition-colors duration-300 hover:bg-linen-gray/70 cursor-pointer relative z-100 inline-block"
              >
                退出登录
              </button>
            </>
          ) : (
            <Link
              to="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-linen-gray text-gray-700 text-sm font-ibm-plex-sans transition-colors duration-300 hover:bg-linen-gray/70 cursor-pointer relative z-100 inline-block"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header