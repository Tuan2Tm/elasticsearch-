import client from '../config/elasticsearch.js';
import { testConnection } from '../config/elasticsearch.js';

/**
 * 批量索引示例
 * 演示如何高效地将大量数据索引到 Elasticsearch
 * 适用于从 MongoDB 同步 8M+ 记录的场景
 */
const bulkIndexExample = async () => {
  try {
    // 测试连接
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      console.error('❌ 无法连接到 Elasticsearch');
      process.exit(1);
    }

    const indexName = 'orders';
    const BATCH_SIZE = 1000; // 每批索引的文档数量
    const TOTAL_DOCS = 10000; // 示例：总共索引 10000 条记录

    console.log(`🚀 开始批量索引到 "${indexName}"...`);
    console.log(`📦 批次大小: ${BATCH_SIZE}`);
    console.log(`📊 总文档数: ${TOTAL_DOCS}`);

    const startTime = Date.now();
    let indexedCount = 0;
    let errorCount = 0;

    // 模拟生成示例数据
    const generateSampleDoc = (id) => ({
      orderId: `ORDER-${id}`,
      orderNameXPwId: `ORDER-${id}-XPW`,
      sku: `SKU-${Math.floor(Math.random() * 1000)}`,
      shippingName: `Customer ${id}`,
      createdAt: new Date().toISOString(),
      dateReceived: new Date().toISOString(),
      taxFee: parseFloat((Math.random() * 100).toFixed(2)),
      taxCost: parseFloat((Math.random() * 50).toFixed(2)),
      shippingFee: parseFloat((Math.random() * 50).toFixed(2)),
      shippingCost: parseFloat((Math.random() * 30).toFixed(2)),
      totalFee: parseFloat((Math.random() * 1000).toFixed(2)),
      totalCost: parseFloat((Math.random() * 800).toFixed(2)),
      keywordSearch: `ORDER-${id} SKU-${Math.floor(Math.random() * 1000)} Customer ${id}`
    });

    // 批量索引
    for (let i = 0; i < TOTAL_DOCS; i += BATCH_SIZE) {
      const batch = [];
      const endIndex = Math.min(i + BATCH_SIZE, TOTAL_DOCS);

      // 准备批量操作
      for (let j = i; j < endIndex; j++) {
        const doc = generateSampleDoc(j);
        batch.push(
          { index: { _index: indexName, _id: doc.orderId } },
          doc
        );
      }

      // 执行批量索引
      const response = await client.bulk({ body: batch });

      // 统计结果
      const errors = response.items.filter(item => item.index?.error);
      const success = response.items.filter(item => !item.index?.error);

      indexedCount += success.length;
      errorCount += errors.length;

      // 显示进度
      const percent = Math.floor((indexedCount / TOTAL_DOCS) * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const rate = (indexedCount / elapsed).toFixed(2);

      console.log(
        `⏳ 进度: ${percent}% (${indexedCount}/${TOTAL_DOCS}) | ` +
        `⏱ ${elapsed}s | ` +
        `⚡ ${rate} docs/s | ` +
        `❌ 错误: ${errorCount}`
      );

      // 每 10 批刷新一次索引（可选，用于测试）
      if ((i / BATCH_SIZE) % 10 === 0 && i > 0) {
        await client.indices.refresh({ index: indexName });
        console.log('🔄 已刷新索引');
      }
    }

    // 最终刷新
    await client.indices.refresh({ index: indexName });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const avgRate = (indexedCount / totalTime).toFixed(2);

    console.log('\n🎉 批量索引完成！');
    console.log(`   ✔ 成功: ${indexedCount}`);
    console.log(`   ❌ 失败: ${errorCount}`);
    console.log(`   ⏱ 总时间: ${totalTime}s`);
    console.log(`   ⚡ 平均速度: ${avgRate} docs/s`);

    // 验证索引的文档数量
    const countResponse = await client.count({ index: indexName });
    console.log(`\n📊 索引中的文档总数: ${countResponse.count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 批量索引失败:', error.message);
    if (error.meta?.body?.error) {
      console.error('详细信息:', JSON.stringify(error.meta.body.error, null, 2));
    }
    process.exit(1);
  }
};

bulkIndexExample();

