import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function WateringRecord({ supabase }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plant, setPlant] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const recordsPerPage = 10

  // 获取植物详情和浇水记录
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 获取植物详情
        const { data: plantData, error: plantError } = await supabase
          .from('plants')
          .select('*')
          .eq('id', id)
          .single()

        if (plantError) throw plantError
        setPlant(plantData)

        // 获取总记录数
        const { count, error: countError } = await supabase
          .from('watering_records')
          .select('*', { count: 'exact', head: true })
          .eq('plant_id', id)

        if (countError) throw countError
        setTotalPages(Math.ceil(count / recordsPerPage))

        // 获取当前页的记录
        const { data: recordsData, error: recordsError } = await supabase
          .from('watering_records')
          .select('*')
          .eq('plant_id', id)
          .order('watered_at', { ascending: false })
          .range((page - 1) * recordsPerPage, page * recordsPerPage - 1)

        if (recordsError) throw recordsError
        setRecords(recordsData || [])
      } catch (err) {
        setError('获取数据失败: ' + err.message)
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, supabase, page])

  // 处理分页变化
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
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
    >
      <button
        onClick={() => navigate('/admin')}
        className="btn-gray mb-6 inline-flex items-center"
      >
        <i className="fas fa-arrow-left mr-2"></i> 返回列表
      </button>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6"
      >
        <div className="flex items-center mb-4">
          {plant.image_url ? (
            <img
              src={plant.image_url}
              alt={plant.name_zh}
              className="h-12 w-12 rounded-full mr-4 object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full mr-4 bg-green-50 flex items-center justify-center">
                <i className="fas fa-leaf text-xs text-green-400"></i>
              </div>
            )}
          <div>
            <h2 className="text-2xl font-serif-sc font-bold text-gray-900">{plant.name_zh}</h2>
            <p className="text-sm text-gray-500">{plant.name_en}</p>
          </div>
        </div>
        <div className="text-gray-700">
          <p className="mb-1"><span className="font-medium">总浇水次数:</span> {plant.watering_count || 0}</p>
          <p><span className="font-medium">上次浇水:</span> {plant.last_watered_at ? new Date(plant.last_watered_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '未浇水'}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
      >
        <h3 className="text-xl font-serif-sc font-bold text-gray-900 mb-6">浇水记录</h3>

        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无浇水记录</p>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(page - 1) * recordsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.watered_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md text-sm ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-3 py-1 rounded-md text-sm ${p === page ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md text-sm ${page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default WateringRecord