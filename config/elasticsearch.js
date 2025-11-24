import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

// 测试连接
export const testConnection = async () => {
  try {
    const response = await client.ping();
    console.log('✅ Elasticsearch 连接成功');
    return { success: true, message: 'Elasticsearch 连接成功' };
  } catch (error) {
    console.error('❌ Elasticsearch 连接失败:', error.message);
    return { success: false, error: error.message };
  }
};

export default client;

