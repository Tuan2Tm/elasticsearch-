import client from '../config/elasticsearch.js';
import { testConnection } from '../config/elasticsearch.js';

const checkKibanaConnection = async () => {
  try {
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      console.error('❌ Không thể kết nối đến Elasticsearch');
      process.exit(1);
    }

    console.log('🔍 Kiểm tra user kibana_system...');
    
    // Kiểm tra user kibana_system
    const kibanaUser = await client.security.getUser({
      username: 'kibana_system'
    });

    console.log('✅ User kibana_system:');
    console.log(`   - Username: ${kibanaUser.kibana_system.username}`);
    console.log(`   - Roles: ${kibanaUser.kibana_system.roles.join(', ')}`);
    console.log(`   - Enabled: ${kibanaUser.kibana_system.enabled}`);

    // Kiểm tra role kibana_system
    console.log('\n🔍 Kiểm tra role kibana_system...');
    try {
      const role = await client.security.getRole({
        name: 'kibana_system'
      });
      console.log('✅ Role kibana_system:');
      console.log(JSON.stringify(role.kibana_system, null, 2));
    } catch (error) {
      console.log('⚠️  Không thể lấy thông tin role:', error.message);
    }

    // Test authentication với kibana_system
    console.log('\n🔍 Test authentication với kibana_system...');
    try {
      const authTest = await client.security.authenticate({
        username: 'kibana_system',
        password: 'changeme'
      });
      console.log('✅ Authentication thành công');
    } catch (error) {
      console.log('❌ Authentication thất bại:', error.message);
    }

    // Kiểm tra user elastic
    console.log('\n🔍 Kiểm tra user elastic...');
    const elasticUser = await client.security.getUser({
      username: 'elastic'
    });
    console.log('✅ User elastic:');
    console.log(`   - Username: ${elasticUser.elastic.username}`);
    console.log(`   - Roles: ${elasticUser.elastic.roles.join(', ')}`);
    console.log(`   - Enabled: ${elasticUser.elastic.enabled}`);

    console.log('\n✅ Tất cả kiểm tra hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.meta?.body?.error) {
      console.error('Chi tiết:', JSON.stringify(error.meta.body.error, null, 2));
    }
    process.exit(1);
  }
};

checkKibanaConnection();

