import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function Admin({ supabase }) {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 获取植物列表
  const fetchPlants = async () => {
    try {
      setLoading(true)
      console.log('尝试连接Supabase...')
      
      // 先测试简单的连接
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const { data: testData, error: testError } = await supabase
        .from('plants')
        .select('*')
        .limit(1)
        .abortSignal(controller.signal)
        
      clearTimeout(timeoutId);

      if (testError) {
        console.error('Supabase连接测试失败:', testError)
        throw testError
      }
      
      console.log('连接测试成功，获取完整植物列表...')
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
      
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(controller2.signal)
        
      clearTimeout(timeoutId2);

      if (error) {
        console.error('获取植物列表失败:', error)
        throw error
      }
      
      console.log('成功获取植物列表，共', data.length, '条记录')
      setPlants(data || [])
    } catch (err) {
      setError('获取植物数据失败: ' + err.message + '\n详细信息: ' + JSON.stringify(err))
      console.error('Error fetching plants:', err)
      console.error('错误详情:', JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlants()

    // 设置实时订阅
    const subscription = supabase
      .channel('public:plants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plants' }, (payload) => {
        fetchPlants()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [supabase])

  // 删除植物
  const deletePlant = async (id) => {
    if (!window.confirm('确定要删除这个植物吗？')) return

    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 删除相关的浇水记录
      await supabase
        .from('watering_records')
        .delete()
        .eq('plant_id', id)

      // 刷新植物列表
      await fetchPlants()
      alert('删除成功!')
    } catch (err) {
      console.error('Error deleting plant:', err)
      alert('删除失败: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-serif-sc">加载植物数据中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-serif-sc font-bold text-gray-900">植物管理</h2>
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/admin/add-plant'}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md transition-colors shadow-md flex items-center"
          >
            <i className="fa fa-plus mr-2"></i> 添加新植物
          </motion.button>
      </div>

      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <i className="fas fa-leaf text-4xl mb-4 text-green-400"></i>
          <p className="font-serif-sc mb-2">暂无植物数据</p>
          <Link to="/admin/add-plant" className="text-green-500 hover:text-green-600 text-sm mt-2">添加新植物</Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">植物名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英文名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浇水次数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上次浇水</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plants.map((plant) => (
                <tr key={plant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {plant.image_url ? (
                        <img
                          src={plant.image_url}
                          alt={plant.name_zh}
                          className="h-8 w-8 rounded-full mr-3 object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full mr-3 bg-green-50 flex items-center justify-center">
                            <i className="fas fa-leaf text-xs text-green-400"></i>
                          </div>
                        )}
                      <div className="font-medium text-gray-900 font-serif-sc">{plant.name_zh}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.name_en}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.watering_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.last_watered_at ? new Date(plant.last_watered_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '未浇水'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link to={`/admin/records/${plant.id}`} className="text-blue-500 hover:text-blue-600 mr-3">
                      <i className="fas fa-history mr-1"></i> 记录
                    </Link>
                    <Link to={`/admin/edit-plant/${plant.id}`} className="text-green-500 hover:text-green-600 mr-3">
                      <i className="fas fa-edit mr-1"></i> 编辑
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deletePlant(plant.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <i className="fas fa-trash-alt mr-1"></i> 删除
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

export default Admin