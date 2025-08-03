import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin_fixed.jsx'
import PlantDetail from './pages/PlantDetail.jsx'
import AddPlant from './pages/AddPlant.jsx'
import EditPlant from './pages/EditPlant.jsx'
import WateringRecord from './pages/WateringRecord.jsx'


import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

// 初始化Supabase客户端
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 检查用户登录状态
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()

    // 设置认证状态变化监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 登录函数
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 登出函数
  const logout = async () => {
    try {
      // 添加作用域参数，确保全局登出
      await supabase.auth.signOut({ scope: 'global' })
      setUser(null)
      // 登出成功后重定向到首页
      window.location.href = '/'
      return { success: true }
    } catch (error) {
      console.error('登出错误:', error)
      // 提供更具体的错误信息
      let errorMessage = '登出失败，请重试'
      if (error.message.includes('Network error')) {
        errorMessage = '网络错误，请检查您的网络连接后重试'
      } else if (error.message.includes('401')) {
        errorMessage = '认证失败，请重新登录'
      }
      alert(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 font-serif-sc">加载中...</div>
      </div>
    )
  }

  return (
      <div className="flex flex-col min-h-screen">
        <Header user={user} logout={logout} />
        <main className="flex-grow container mx-auto px-4 py-8 pb-20">
          <Routes>
            <Route path="/" element={<Home supabase={supabase} />} />
            <Route path="/plant/:id" element={<PlantDetail supabase={supabase} />} />
            <Route path="/login" element={user ? <Navigate to="/admin" /> : <Login login={login} />} />
            <Route path="/admin" element={user ? <Admin supabase={supabase} /> : <Navigate to="/login" />} />
            <Route path="/admin/add-plant" element={user ? <AddPlant supabase={supabase} user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin/edit-plant/:id" element={user ? <EditPlant supabase={supabase} /> : <Navigate to="/login" />} />
            <Route path="/admin/records/:id" element={user ? <WateringRecord supabase={supabase} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
  )
}

export default App