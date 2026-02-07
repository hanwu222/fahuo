// ==========================================
// 配置文件 - 请在部署前填写您的 Supabase 信息
// ==========================================

const CONFIG = {
  // Supabase 配置（部署时需要填写）
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  
  // 管理员密码（建议修改为复杂密码）
  ADMIN_PASSWORD: 'admin123',
  
  // 商品信息
  PRODUCT: {
    name: '成品账号',
    price: 45,
    currency: 'CNY'
  }
};

// 检查是否使用本地存储模式（未配置Supabase时）
const USE_LOCAL_STORAGE = CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL';

if (USE_LOCAL_STORAGE) {
  console.log('📦 使用本地存储模式（演示用）');
}
