import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
// 使用font-awesome图标替代react-icons/hi
import { GiSprout } from 'react-icons/gi'

// 添加全局样式以确保页面可以滚动
const globalStyles = `
  html, body {
    height: 100%;
    overflow-y: auto;
    margin: 0;
    padding: 0;
  }
  .scrollable-container {
    min-height: 100vh;
    padding-bottom: 2rem;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  /* 确保内容足够长时可以滚动 */
  .content-wrapper {
    min-height: 100%;
  }
`;

function Home({ supabase }) {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wateringInProgress, setWateringInProgress] = useState({}) // 跟踪每个植物的浇水状态

  // 获取植物列表
  const fetchPlants = async () => {
    try {
      setLoading(true)
      console.log('开始获取植物数据...')
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取植物数据失败:', error)
        throw error
      }
      console.log('获取植物数据成功，共', data.length, '条记录')
      setPlants(data || [])
    } catch (err) {
      setError('获取植物数据失败: ' + err.message)
      console.error('Error fetching plants:', err)
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

  // 检查今天是否已经浇花
  const hasWateredToday = (plant) => {
    if (!plant.last_watered_at) return false;
    const lastWatered = new Date(plant.last_watered_at);
    const today = new Date();
    // 规范化日期，移除时间部分
    lastWatered.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return lastWatered.getTime() === today.getTime();
  };

  // 浇花打卡
  const waterPlant = async (plantId) => {
    // 防止重复点击
    if (wateringInProgress[plantId]) {
      return;
    }

    try {
      setWateringInProgress(prev => ({ ...prev, [plantId]: true }))

      // 先检查今天是否已经浇过花（从watering_records表查询，更可靠）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: existingRecords, error: recordError } = await supabase
        .from('watering_records')
        .select('id')
        .eq('plant_id', plantId)
        .gte('watered_at', today.toISOString())
        .lt('watered_at', tomorrow.toISOString())

      if (recordError) throw recordError

      if (existingRecords && existingRecords.length > 0) {
        alert('今天浇水了，明天再来吧~');
        return;
      }

      // 记录浇花时间
      const { data: insertedRecord, error: insertError } = await supabase
        .from('watering_records')
        .insert([{
          plant_id: plantId,
          watered_at: new Date()
        }])
        .select()

      if (insertError) {
        console.error('插入浇花记录失败:', insertError);
        alert('插入浇花记录失败: ' + insertError.message);
        throw insertError;
      }
      console.log('浇花记录插入成功:', insertedRecord);
      alert('浇花记录插入成功!');

      // 获取当前浇水次数
      const { data: plantWithCount, error: countError } = await supabase
        .from('plants')
        .select('watering_count')
        .eq('id', plantId)
        .single()

      if (countError) throw countError

      // 更新植物的浇水次数和上次浇水时间
      const now = new Date();
      const { error: updateError } = await supabase
        .from('plants')
        .update({
          watering_count: (plantWithCount.watering_count || 0) + 1,
          last_watered_at: now
        })
        .eq('id', plantId)

      if (updateError) {
        console.error('更新植物数据失败:', updateError);
        alert('更新植物数据失败: ' + updateError.message);
        throw updateError;
      }
      console.log('植物数据更新成功');
      alert('植物数据更新成功!');

      alert('开始重新获取植物数据...');
      fetchPlants();
      console.log('植物数据重新获取成功');
      alert('植物数据重新获取成功!');

      // 局部更新植物数据（双重保险）
      setPlants(plants.map(plant => {
        if (plant.id === plantId) {
          return {
            ...plant,
            watering_count: (plantWithCount.watering_count || 0) + 1,
            last_watered_at: now
          }
        }
        return plant;
      }))

      console.log(`植物 ${plantId} 浇水成功，已更新状态`);

      // 显示成功提示
      alert('浇花成功!')
    } catch (err) {
      console.error('Error watering plant:', err)
      alert('浇花失败: ' + err.message)
    } finally {
      // 无论成功失败，都清除加载状态
      setWateringInProgress(prev => ({ ...prev, [plantId]: false }))
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

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <i className="fas fa-leaf text-4xl mb-4 text-green-400"></i>
        <p className="font-serif-sc mb-2">暂无植物数据</p>
        <p className="text-sm">请先在管理后台添加植物</p>
      </div>
    )
  }

  return (
    <>
      {/* 添加全局样式 */}
      <style jsx="true" global="true">{globalStyles}</style>
      <div className="scrollable-container bg-linen-gray/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="content-wrapper">
      <motion.h2 
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.5, damping: 15 }}
        className="text-3xl md:text-4xl font-lxgw-wenkai font-bold text-gray-900 mb-12 text-center"
      >
        我的植物
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {plants.map((plant) => (
          <motion.div
            key={plant.id}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.5, delay: Math.random() * 0.2, damping: 15 }}
            whileHover={{ y: -5, boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
            className="card bg-white rounded-lg overflow-hidden shadow-wabi"
          >
            <Link to={`/plant/${plant.id}`} className="block">
              <div className="relative w-full overflow-hidden bg-linen-gray/50" style={{ paddingTop: '100%' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {plant.image_url ? (
                    <img 
                      src={plant.image_url} 
                      alt={plant.name_zh} 
                      className="img-plant absolute inset-0"
                    /> 
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-50">
                      <i className="fas fa-leaf text-4xl text-green-300"></i>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-lxgw-wenkai font-bold text-gray-900">{plant.name_zh}</h3>
                  <span className="text-xs text-gray-500 font-ibm-plex-sans">{plant.name_en}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4 font-ibm-plex-sans">
                  <p><i className="fas fa-sun inline-block text-yellow-500 mr-2" style={{fontSize: '16px'}} /> 光照 ({plant.light_en || 'Light'}): {plant.light}</p>
                  <p><i className="fas fa-tint-slash inline-block text-blue-500 mr-2" style={{fontSize: '16px'}} /> 浇水 ({plant.water_en || 'Water'}): {plant.water}</p>
                  <p><GiSprout className="inline-block text-green-600 mr-2" size={16} /> 土壤 ({plant.soil_en || 'Soil'}): {plant.soil}</p>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-5 font-ibm-plex-sans">
                  <span>浇水次数: <span className="font-medium text-gray-800">{plant.watering_count || 0}</span></span>
                  <span>上次浇水: {plant.last_watered_at ? new Date(plant.last_watered_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '未浇水'}</span>
                </div>
              </div>
            </Link>
            <motion.button
              whileHover={!hasWateredToday(plant) && !wateringInProgress[plant.id] ? { scale: 1.05 } : {}}
              whileTap={!hasWateredToday(plant) && !wateringInProgress[plant.id] ? { scale: 0.95 } : {}}
              onClick={() => {
                if (hasWateredToday(plant) || wateringInProgress[plant.id]) {
                  if (hasWateredToday(plant)) {
                    // 显示toast提示
                    alert('今天浇水了，明天再来吧~');
                  }
                  return;
                }
                waterPlant(plant.id);
              }}
              className={`w-full py-3 px-4 rounded-md transition-all duration-300 ${hasWateredToday(plant) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : wateringInProgress[plant.id] ? 'bg-yellow-300 text-yellow-800' : 'bg-green-500 text-white hover:bg-green-600'}`}
              disabled={hasWateredToday(plant) || wateringInProgress[plant.id]}
            >
              {wateringInProgress[plant.id] ? (
                <><i className="fas fa-spinner fa-spin inline-block mr-2" style={{fontSize: '16px'}} /> 浇水处理中...</>
              ) : (
                <><i className={hasWateredToday(plant) ? "fas fa-check-circle inline-block mr-2" : "fas fa-tint inline-block mr-2"} style={{fontSize: '16px'}} /> {hasWateredToday(plant) ? "今日已浇水" : "浇花打卡"}</>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
      </div>
    </>
  )
}

export default Home