// 导入Supabase客户端
import { createClient } from '@supabase/supabase-js'

// 从环境变量中获取Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 确保配置存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase配置缺失，请检查.env文件')
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase