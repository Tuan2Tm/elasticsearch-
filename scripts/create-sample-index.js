import client from '../config/elasticsearch.js';
import { testConnection } from '../config/elasticsearch.js';

// 创建示例索引配置，适用于订单数据（8M+ 记录）
const createOrdersIndex = async () => {
  try {
    // 测试连接
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      console.error('❌ 无法连接到 Elasticsearch');
      process.exit(1);
    }

    const indexName = 'orders';
    
    // 检查索引是否存在
    const exists = await client.indices.exists({ index: indexName });
    
    if (exists) {
      console.log(`⚠️  索引 "${indexName}" 已存在`);
      const response = await client.indices.delete({ index: indexName });
      console.log(`🗑️  已删除现有索引`);
    }

    console.log(`📝 正在创建索引 "${indexName}"...`);

    // 创建索引，针对 8M+ 记录优化
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          // 分片配置：对于 8M 记录，建议 2-4 个分片
          number_of_shards: 2,
          number_of_replicas: 1,
          
          // 刷新间隔：降低刷新频率以提高索引性能
          refresh_interval: '30s',
          
          // 分析器配置
          analysis: {
            analyzer: {
              keyword_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim']
              },
              // 中文分词器（如果安装了中文插件）
              chinese_analyzer: {
                type: 'standard',
                // 如果安装了 ik 插件，可以使用：
                // type: 'ik_max_word'
              }
            }
          },
          
          // 索引性能优化
          index: {
            max_result_window: 50000, // 增加最大结果窗口
            translog: {
              durability: 'async', // 异步写入以提高性能
              sync_interval: '5s'
            }
          }
        },
        mappings: {
          properties: {
            // 订单标识
            orderId: { 
              type: 'keyword',
              index: true
            },
            orderNameXPwId: { 
              type: 'keyword',
              index: true
            },
            
            // SKU
            sku: { 
              type: 'keyword',
              index: true
            },
            
            // 文本字段
            shippingName: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              }
            },
            
            // 日期字段
            createdAt: { 
              type: 'date',
              format: 'strict_date_optional_time||epoch_millis'
            },
            dateReceived: { 
              type: 'date',
              format: 'strict_date_optional_time||epoch_millis'
            },
            
            keywordSearch: {
              type: 'text',
              analyzer: 'keyword_analyzer',
              search_analyzer: 'standard'
            },
            
            location: {
              type: 'geo_point'
            }
          }
        }
      }
    });

    console.log(`✅ 索引 "${indexName}" 创建成功！`);
    
    const indexInfo = await client.indices.get({ index: indexName });
    console.log('\n📊 索引配置：');
    console.log(JSON.stringify(indexInfo[indexName], null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建索引失败:', error.message);
    if (error.meta?.body?.error) {
      console.error('详细信息:', JSON.stringify(error.meta.body.error, null, 2));
    }
    process.exit(1);
  }
};

createOrdersIndex();

