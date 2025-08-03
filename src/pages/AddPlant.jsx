import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function AddPlant({ supabase, user }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    light: '',
    water: '',
    soil: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

    setLoading(true)
    try {
      let imageUrl = null

      // 直接从Supabase会话中获取用户ID，确保使用最新的认证状态
      const { data: { session } } = await supabase.auth.getSession();
      console.log('会话信息:', session);
      const userId = session?.user?.id;
      console.log('userId:', userId);
      if (!userId) {
        throw new Error('未找到用户ID，请确保您已登录');
      }

      // 上传图片（如果有）
      if (imageFile) {
        try {
          // 生成安全的文件名（只包含ASCII字符）并避免双扩展名
          const nameParts = imageFile.name.split('.')
          const fileExtension = nameParts.length > 1 ? nameParts.pop() : ''
          const originalFileName = nameParts.join('.')
          const safeFileName = originalFileName.replace(/[^\x00-\x7F]+/g, '')
          const fileName = `${Date.now()}-${safeFileName ? safeFileName : Math.random().toString(36).substring(2, 10)}${fileExtension ? '.' + fileExtension : ''}`
          console.log('Uploading file:', fileName)
          // 使用owner_id参数而不是owner，以匹配Supabase存储的RLS策略要求
          console.log('准备上传图片，owner_id:', userId);
          const { error: uploadError } = await supabase
            .storage
            .from('plant-images')
            .upload(fileName, imageFile, { upsert: true, owner_id: userId })
          console.log('上传结果:', uploadError ? '失败: ' + uploadError.message : '成功');

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
        } catch (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            setError('存储桶不存在，请联系管理员创建名为"plant-images"的存储桶');
            console.error('Storage bucket not found. Please create a bucket named "plant-images" in Supabase dashboard.');
            setLoading(false);
            return;
          } else {
            throw uploadError;
          }
        }
      }

      // 添加植物到数据库
      console.log('准备插入植物数据:', { ...formData, image_url: imageUrl, watering_count: 0, created_at: new Date(), user_id: userId });
      const { data, error: dbError } = await supabase
        .from('plants')
        .insert([{
          ...formData,
            image_url: imageUrl,
            watering_count: 0,
            created_at: new Date(),
            user_id: userId  // 根据RLS策略，必须使用user_id字段
        }])
        .select()

      if (dbError) {
        console.error('数据库错误详情:', dbError);
        // 添加更多错误信息
        console.error('用户ID:', userId);
        console.error('RLS策略错误可能原因: 表plants的RLS策略要求user_id字段与当前用户匹配');
        throw new Error('添加植物到数据库失败: ' + dbError.message + '。可能原因: 行级安全策略限制，请检查Supabase中的RLS设置和用户认证状态');
      }

      setSuccess('植物添加成功!')
      // 重置表单
      setFormData({
        name_zh: '',
        name_en: '',
        light: '',
        water: '',
        soil: ''
      })
      setImageFile(null)

      // 延迟后跳转到管理页面
      setTimeout(() => {
        navigate('/admin')
      }, 1500)
    } catch (err) {
      setError('添加植物失败: ' + err.message)
      console.error('Error adding plant:', err)
    } finally {
      setLoading(false)
    }
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
        <h2 className="text-3xl font-serif-sc font-bold text-gray-900 mb-6">添加植物</h2>

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
                已选择文件: {imageFile.name}
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
                <span>添加中...</span>
              </div>
            ) : (
              <span>添加植物</span>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AddPlant