import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function PlantDetail({ supabase }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plant, setPlant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [records, setRecords] = useState([])

  // 获取植物详情
  useEffect(() => {
    const fetchPlant = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setPlant(data)

        // 获取浇水记录
        const { data: recordsData, error: recordsError } = await supabase
          .from('watering_records')
          .select('*')
          .eq('plant_id', id)
          .order('watered_at', { ascending: false })
          .limit(10)

        if (recordsError) throw recordsError
        setRecords(recordsData || [])
      } catch (err) {
        setError('获取植物详情失败: ' + err.message)
        console.error('Error fetching plant:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlant()
  }, [id, supabase])

  // 浇花打卡
  const waterPlant = async () => {
    try {
      // 记录浇花时间
      const now = new Date()

      // 检查用户是否登录
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        alert('请先登录后再浇花')
        return
      }

      // 插入浇水记录
      const { error: insertError } = await supabase
        .from('watering_records')
        .insert([{ 
          plant_id: id,
          watered_at: now
        }])

      if (insertError) {
        console.error('插入浇水记录失败:', insertError)
        throw insertError
      }

      // 获取当前浇水次数
      const { data: plantData, error: fetchError } = await supabase
        .from('plants')
        .select('watering_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('获取植物数据失败:', fetchError)
        throw fetchError
      }

      // 计算新的浇水次数
      const newWateringCount = (plantData.watering_count || 0) + 1

      // 更新植物的浇水次数和上次浇水时间
      const { error: updateError } = await supabase
        .from('plants')
        .update({
          watering_count: newWateringCount,
          updated_at: now,
          last_watered_at: now
        })
        .eq('id', id)
        .select() // 返回更新后的记录

      if (updateError) {
        console.error('更新植物数据失败:', updateError)
        throw updateError
      }

      console.log('更新后的植物数据:', updateError ? '失败' : updateError.data)

      // 刷新植物详情
      await fetchPlant()

      // 显示成功提示
      // 使用简单提示代替alert，确保只显示一次
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMessage.textContent = '浇花成功! 当前浇水次数: ' + newWateringCount;
      document.body.appendChild(successMessage);
      
      // 3秒后自动移除提示
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    } catch (err) {
      console.error('Error watering plant:', err)
      alert('浇花失败: ' + err.message + '\n请查看控制台获取详细信息')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-serif-sc">加载中...</div>
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

  if (!plant) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>植物不存在</p>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fade-in"
    >
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <i className="fas fa-arrow-left mr-2"></i> 返回列表
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative w-full overflow-hidden bg-linen-gray/50 rounded-lg shadow-wabi"
          style={{ paddingTop: '100%' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {plant.image_url ? (
              <img 
                src={plant.image_url} 
                alt={plant.name_zh} 
                className="img-plant absolute inset-0"
              /> 
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-green-50">
                <i className="fas fa-leaf text-6xl text-green-300"></i>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-baseline space-x-2 mb-4">
            <h2 className="text-4xl md:text-5xl font-serif-sc font-bold text-gray-900">{plant.name_zh}</h2>
            <span className="text-sm text-gray-500 font-sans-sc">{plant.name_en}</span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-serif-sc font-medium text-gray-800 mb-2">基本信息</h3>
              <div className="space-y-3 text-gray-700">
                <p><i className="fas fa-sun text-yellow-400 mr-2 w-5 text-center"></i> <span className="font-medium">光照:</span> {plant.light}</p>
                <p><i className="fas fa-tint text-blue-400 mr-2 w-5 text-center"></i> <span className="font-medium">浇水:</span> {plant.water}</p>
                <p><i className="fas fa-seedling text-green-600 mr-2 w-5 text-center"></i> <span className="font-medium">土壤:</span> {plant.soil}</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-serif-sc font-medium text-gray-800 mb-2">浇花记录</h3>
              <div className="space-y-3 text-gray-700">
                <p><i className="fas fa-spray-can text-blue-500 mr-2 w-5 text-center"></i> <span className="font-medium">浇水次数:</span> {plant.watering_count || 0}</p>
                <p><i className="fas fa-calendar-check text-green-500 mr-2 w-5 text-center"></i> <span className="font-medium">上次浇水:</span> {plant.last_watered_at ? new Date(plant.last_watered_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '未浇水'}</p>
              </div>
            </div>
          </div>


        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
      >
        <h3 className="text-xl font-serif-sc font-bold text-gray-900 mb-4">最近浇花记录</h3>
        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无浇花记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浇花时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record, index) => (
                  <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.watered_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default PlantDetail