import client from '../config/elasticsearch.js';
import { testConnection } from '../config/elasticsearch.js';

const resetKibanaPassword = async () => {
  try {
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      console.error('❌ Không thể kết nối đến Elasticsearch');
      process.exit(1);
    }

    console.log('🔐 Đang reset password cho user kibana_system...');

    const response = await client.security.changePassword({
      username: 'kibana_system',
      body: {
        password: 'changeme'
      }
    });

    console.log('✅ Đã reset password thành công cho kibana_system');
    console.log('📝 Password mới: changeme');

    // Kiểm tra user
    const userInfo = await client.security.getUser({
      username: 'kibana_system'
    });

    console.log('\n📊 Thông tin user kibana_system:');
    console.log(JSON.stringify(userInfo.kibana_system, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi reset password:', error.message);
    if (error.meta?.body?.error) {
      console.error('Chi tiết:', JSON.stringify(error.meta.body.error, null, 2));
    }
    process.exit(1);
  }
};

resetKibanaPassword();

