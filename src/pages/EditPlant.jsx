import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function EditPlant({ supabase }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    light: '',
    water: '',
    soil: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 获取植物详情
  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setFormData({
          name_zh: data.name_zh,
          name_en: data.name_en || '',
          light: data.light,
          water: data.water,
          soil: data.soil
        })
        setCurrentImageUrl(data.image_url || '')
      } catch (err) {
        setError('获取植物详情失败: ' + err.message)
        console.error('Error fetching plant:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlant()
  }, [id, supabase])

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // 处理文件上传变化
  const handleFileChange = (e) => {
    setImageFile(e.target.files[0])
  }

  // 验证表单
  const validateForm = () => {
    if (!formData.name_zh || !formData.light || !formData.water || !formData.soil) {
      setError('请填写所有必填字段')
      return false
    }
    return true
  }

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    // 检查用户是否登录
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
      if (!user) {
        setError('请先登录')
        setLoading(false)
        return
      }
    } catch (error) {
      setError('获取用户信息失败: ' + error.message)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let imageUrl = currentImageUrl

      // 上传新图片（如果有）
      if (imageFile) {
        // 生成安全的文件名（只包含ASCII字符）
        const fileExtension = imageFile.name.split('.').pop() || ''
        const safeFileName = imageFile.name.replace(/[^\x00-\x7F]+/g, '')
        const fileName = `${Date.now()}-${safeFileName ? safeFileName : Math.random().toString(36).substring(2, 10)}.${fileExtension}`
        console.log('Uploading file:', fileName)
        const { error: uploadError } = await supabase
          .storage
          .from('plant-images')
          .upload(fileName, imageFile, { upsert: true, owner: user.id })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        // 获取图片URL
        const { data } = supabase
          .storage
          .from('plant-images')
          .getPublicUrl(fileName)

        imageUrl = data.publicUrl
      }

      // 更新植物到数据库（确保只能更新自己的植物）
      const { error: dbError } = await supabase
        .from('plants')
        .update({
          ...formData,
          image_url: imageUrl,
          updated_at: new Date() // 添加更新时间
        })
        .eq('id', id)
        .eq('user_id', user.id) // 确保用户只能更新自己的植物

      if (dbError) throw dbError

      setSuccess('植物更新成功!')

      // 延迟后跳转到管理页面
      setTimeout(() => {
        navigate('/admin')
      }, 1500)
    } catch (err) {
      setError('更新植物失败: ' + err.message)
      console.error('Error updating plant:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-serif-sc">加载中...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
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
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8"
      >
        <h2 className="text-3xl font-serif-sc font-bold text-gray-900 mb-6">编辑植物</h2>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 text-green-500 rounded-md text-sm"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name_zh" className="block text-sm font-medium text-gray-700 mb-1">植物名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name_zh"
              name="name_zh"
              value={formData.name_zh}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="例如：绿萝"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-1">英文名称</label>
            <input
              type="text"
              id="name_en"
              name="name_en"
              value={formData.name_en}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="例如：Epipremnum aureum"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">植物图片</label>
            {currentImageUrl && (
              <div className="mb-3 p-2 border border-gray-200 rounded-md inline-block">
                <img
                  src={currentImageUrl}
                  alt="Current plant image"
                  className="h-32 object-cover"
                />
              </div>
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
            {imageFile && (
              <div className="mt-2 text-sm text-gray-500">
                已选择新文件: {imageFile.name}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="light" className="block text-sm font-medium text-gray-700 mb-1">光照要求 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="light"
              name="light"
              value={formData.light}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="例如：明亮散射光"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="water" className="block text-sm font-medium text-gray-700 mb-1">浇水要求 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="water"
              name="water"
              value={formData.water}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="例如：每周一次，保持土壤湿润"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="soil" className="block text-sm font-medium text-gray-700 mb-1">土壤要求 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="soil"
              name="soil"
              value={formData.soil}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="例如：疏松肥沃的腐叶土"
              disabled={loading}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${loading ? 'bg-green-300' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>更新中...</span>
              </div>
            ) : (
              <span>更新植物</span>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default EditPlant